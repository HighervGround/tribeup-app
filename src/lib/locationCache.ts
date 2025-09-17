import { Game } from '../store/appStore';
import { LocationCoordinates, calculateDistance } from '../hooks/useLocation';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface GeospatialIndex {
  games: Map<string, Game>;
  spatialGrid: Map<string, Set<string>>; // grid cell -> game IDs
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  gridSize: number; // degrees per grid cell
}

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  totalRequests: number;
  averageResponseTime: number;
  memoryUsage: number;
}

interface LocationQuery {
  latitude: number;
  longitude: number;
  radius: number;
  sport?: string;
  dateRange?: { start: Date; end: Date };
  maxResults?: number;
}

class LocationCacheManager {
  private static instance: LocationCacheManager;
  
  // Multi-layer cache structure
  private l1Cache: Map<string, CacheEntry<any>> = new Map(); // Memory cache
  private l2Cache: Map<string, CacheEntry<any>> = new Map(); // Persistent cache
  private geospatialIndex: GeospatialIndex;
  private queryCache: Map<string, CacheEntry<Game[]>> = new Map();
  
  // Cache configuration
  private readonly config = {
    l1MaxSize: 1000,
    l2MaxSize: 10000,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    geospatialTTL: 15 * 60 * 1000, // 15 minutes
    queryTTL: 2 * 60 * 1000, // 2 minutes
    gridSize: 0.01, // ~1km grid cells
    maxRadius: 100, // km
    compressionThreshold: 1000 // bytes
  };
  
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    memoryUsage: 0
  };

  static getInstance(): LocationCacheManager {
    if (!LocationCacheManager.instance) {
      LocationCacheManager.instance = new LocationCacheManager();
    }
    return LocationCacheManager.instance;
  }

  private constructor() {
    this.geospatialIndex = {
      games: new Map(),
      spatialGrid: new Map(),
      bounds: {
        minLat: 90,
        maxLat: -90,
        minLng: 180,
        maxLng: -180
      },
      gridSize: this.config.gridSize
    };
    
    this.initializeCache();
    this.startCleanupTimer();
  }

  private initializeCache() {
    // Load persistent cache from localStorage/IndexedDB
    try {
      const persistentData = localStorage.getItem('location_cache_l2');
      if (persistentData) {
        const parsed = JSON.parse(persistentData);
        this.l2Cache = new Map(parsed.entries);
        this.geospatialIndex = parsed.geospatialIndex || this.geospatialIndex;
      }
    } catch (error) {
      console.warn('Failed to load persistent cache:', error);
    }
  }

  private startCleanupTimer() {
    setInterval(() => {
      this.cleanup();
      this.updateMetrics();
      this.persistCache();
    }, 60000); // Every minute
  }

  private cleanup() {
    const now = Date.now();
    
    // Cleanup L1 cache
    for (const [key, entry] of this.l1Cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.l1Cache.delete(key);
        this.metrics.evictions++;
      }
    }
    
    // Cleanup L2 cache
    for (const [key, entry] of this.l2Cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.l2Cache.delete(key);
        this.metrics.evictions++;
      }
    }
    
    // Cleanup query cache
    for (const [key, entry] of this.queryCache) {
      if (now - entry.timestamp > entry.ttl) {
        this.queryCache.delete(key);
      }
    }
    
    // Cleanup geospatial index
    this.cleanupGeospatialIndex();
    
    // Enforce size limits
    this.enforceSizeLimits();
  }

  private cleanupGeospatialIndex() {
    const now = Date.now();
    const expiredGames: string[] = [];
    
    for (const [gameId, game] of this.geospatialIndex.games) {
      // Remove games that are in the past or expired
      const gameDate = new Date(`${game.date}T${game.time}`);
      if (gameDate.getTime() < now - 24 * 60 * 60 * 1000) { // 24 hours past
        expiredGames.push(gameId);
      }
    }
    
    // Remove expired games from index
    expiredGames.forEach(gameId => {
      const game = this.geospatialIndex.games.get(gameId);
      if (game) {
        this.removeFromSpatialGrid(game);
        this.geospatialIndex.games.delete(gameId);
      }
    });
  }

  private enforceSizeLimits() {
    // L1 cache size limit (LRU eviction)
    if (this.l1Cache.size > this.config.l1MaxSize) {
      const entries = Array.from(this.l1Cache.entries())
        .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed);
      
      const toRemove = entries.slice(0, this.l1Cache.size - this.config.l1MaxSize);
      toRemove.forEach(([key]) => {
        this.l1Cache.delete(key);
        this.metrics.evictions++;
      });
    }
    
    // L2 cache size limit (LFU eviction)
    if (this.l2Cache.size > this.config.l2MaxSize) {
      const entries = Array.from(this.l2Cache.entries())
        .sort(([,a], [,b]) => a.accessCount - b.accessCount);
      
      const toRemove = entries.slice(0, this.l2Cache.size - this.config.l2MaxSize);
      toRemove.forEach(([key]) => {
        this.l2Cache.delete(key);
        this.metrics.evictions++;
      });
    }
  }

  private persistCache() {
    try {
      const cacheData = {
        entries: Array.from(this.l2Cache.entries()),
        geospatialIndex: {
          games: Array.from(this.geospatialIndex.games.entries()),
          spatialGrid: Array.from(this.geospatialIndex.spatialGrid.entries())
            .map(([key, set]) => [key, Array.from(set)]),
          bounds: this.geospatialIndex.bounds,
          gridSize: this.geospatialIndex.gridSize
        },
        timestamp: Date.now()
      };
      
      localStorage.setItem('location_cache_l2', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to persist cache:', error);
    }
  }

  private generateCacheKey(query: LocationQuery): string {
    const normalized = {
      lat: Math.round(query.latitude * 1000) / 1000,
      lng: Math.round(query.longitude * 1000) / 1000,
      radius: query.radius,
      sport: query.sport || 'all',
      dateStart: query.dateRange?.start?.toISOString().split('T')[0] || 'any',
      dateEnd: query.dateRange?.end?.toISOString().split('T')[0] || 'any',
      maxResults: query.maxResults || 50
    };
    
    return `loc_${normalized.lat}_${normalized.lng}_${normalized.radius}_${normalized.sport}_${normalized.dateStart}_${normalized.dateEnd}_${normalized.maxResults}`;
  }

  private getGridCell(lat: number, lng: number): string {
    const gridLat = Math.floor(lat / this.config.gridSize);
    const gridLng = Math.floor(lng / this.config.gridSize);
    return `${gridLat}_${gridLng}`;
  }

  private getNearbyCells(lat: number, lng: number, radius: number): string[] {
    const cells: string[] = [];
    const gridRadius = Math.ceil(radius / (this.config.gridSize * 111)); // ~111km per degree
    
    const centerGridLat = Math.floor(lat / this.config.gridSize);
    const centerGridLng = Math.floor(lng / this.config.gridSize);
    
    for (let dLat = -gridRadius; dLat <= gridRadius; dLat++) {
      for (let dLng = -gridRadius; dLng <= gridRadius; dLng++) {
        cells.push(`${centerGridLat + dLat}_${centerGridLng + dLng}`);
      }
    }
    
    return cells;
  }

  private addToSpatialGrid(game: Game) {
    if (!game.latitude || !game.longitude) return;
    
    const cell = this.getGridCell(game.latitude, game.longitude);
    if (!this.geospatialIndex.spatialGrid.has(cell)) {
      this.geospatialIndex.spatialGrid.set(cell, new Set());
    }
    this.geospatialIndex.spatialGrid.get(cell)!.add(game.id);
    
    // Update bounds
    this.geospatialIndex.bounds.minLat = Math.min(this.geospatialIndex.bounds.minLat, game.latitude);
    this.geospatialIndex.bounds.maxLat = Math.max(this.geospatialIndex.bounds.maxLat, game.latitude);
    this.geospatialIndex.bounds.minLng = Math.min(this.geospatialIndex.bounds.minLng, game.longitude);
    this.geospatialIndex.bounds.maxLng = Math.max(this.geospatialIndex.bounds.maxLng, game.longitude);
  }

  private removeFromSpatialGrid(game: Game) {
    if (!game.latitude || !game.longitude) return;
    
    const cell = this.getGridCell(game.latitude, game.longitude);
    const cellGames = this.geospatialIndex.spatialGrid.get(cell);
    if (cellGames) {
      cellGames.delete(game.id);
      if (cellGames.size === 0) {
        this.geospatialIndex.spatialGrid.delete(cell);
      }
    }
  }

  private getCachedValue<T>(key: string): T | null {
    const startTime = performance.now();
    this.metrics.totalRequests++;
    
    // Check L1 cache first
    const l1Entry = this.l1Cache.get(key);
    if (l1Entry && Date.now() - l1Entry.timestamp < l1Entry.ttl) {
      l1Entry.lastAccessed = Date.now();
      l1Entry.accessCount++;
      this.metrics.hits++;
      this.updateResponseTime(performance.now() - startTime);
      return l1Entry.data;
    }
    
    // Check L2 cache
    const l2Entry = this.l2Cache.get(key);
    if (l2Entry && Date.now() - l2Entry.timestamp < l2Entry.ttl) {
      l2Entry.lastAccessed = Date.now();
      l2Entry.accessCount++;
      
      // Promote to L1 cache
      this.l1Cache.set(key, {
        ...l2Entry,
        ttl: this.config.defaultTTL
      });
      
      this.metrics.hits++;
      this.updateResponseTime(performance.now() - startTime);
      return l2Entry.data;
    }
    
    this.metrics.misses++;
    this.updateResponseTime(performance.now() - startTime);
    return null;
  }

  private setCachedValue<T>(key: string, value: T, ttl: number = this.config.defaultTTL) {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now()
    };
    
    // Store in both L1 and L2 caches
    this.l1Cache.set(key, entry);
    this.l2Cache.set(key, { ...entry, ttl: ttl * 2 }); // L2 has longer TTL
  }

  private updateResponseTime(responseTime: number) {
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime + responseTime) / 2;
  }

  private updateMetrics() {
    // Calculate memory usage approximation
    let memoryUsage = 0;
    
    for (const [key, entry] of this.l1Cache) {
      memoryUsage += key.length * 2; // UTF-16 characters
      memoryUsage += JSON.stringify(entry.data).length * 2;
    }
    
    for (const [key, entry] of this.l2Cache) {
      memoryUsage += key.length * 2;
      memoryUsage += JSON.stringify(entry.data).length * 2;
    }
    
    this.metrics.memoryUsage = memoryUsage;
  }

  // Public API methods
  async getNearbyGames(query: LocationQuery): Promise<Game[]> {
    const cacheKey = this.generateCacheKey(query);
    
    // Check query cache first
    const cached = this.getCachedValue<Game[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Use geospatial index for efficient lookup
    const results = this.queryGeospatialIndex(query);
    
    // Cache the results
    this.setCachedValue(cacheKey, results, this.config.queryTTL);
    
    return results;
  }

  private queryGeospatialIndex(query: LocationQuery): Game[] {
    const { latitude, longitude, radius, sport, dateRange, maxResults = 50 } = query;
    const results: Array<{ game: Game; distance: number }> = [];
    
    // Get nearby grid cells
    const nearbyCells = this.getNearbyCells(latitude, longitude, radius);
    const candidateGameIds = new Set<string>();
    
    // Collect candidate games from nearby cells
    nearbyCells.forEach(cell => {
      const cellGames = this.geospatialIndex.spatialGrid.get(cell);
      if (cellGames) {
        cellGames.forEach(gameId => candidateGameIds.add(gameId));
      }
    });
    
    // Filter and rank candidates
    for (const gameId of candidateGameIds) {
      const game = this.geospatialIndex.games.get(gameId);
      if (!game || !game.latitude || !game.longitude) continue;
      
      // Calculate actual distance
      const distance = calculateDistance(latitude, longitude, game.latitude, game.longitude);
      if (distance > radius) continue;
      
      // Apply sport filter
      if (sport && game.sport.toLowerCase() !== sport.toLowerCase()) continue;
      
      // Apply date range filter
      if (dateRange) {
        const gameDate = new Date(`${game.date}T${game.time}`);
        if (gameDate < dateRange.start || gameDate > dateRange.end) continue;
      }
      
      results.push({ game, distance });
    }
    
    // Sort by distance and limit results
    return results
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults)
      .map(result => result.game);
  }

  updateGameIndex(games: Game[]) {
    // Clear existing index
    this.geospatialIndex.games.clear();
    this.geospatialIndex.spatialGrid.clear();
    
    // Rebuild index
    games.forEach(game => {
      if (game.latitude && game.longitude) {
        this.geospatialIndex.games.set(game.id, game);
        this.addToSpatialGrid(game);
      }
    });
    
    // Invalidate related query cache entries
    this.invalidateQueryCache();
  }

  private invalidateQueryCache() {
    this.queryCache.clear();
    
    // Also clear location-related entries from L1/L2 caches
    const keysToRemove: string[] = [];
    
    for (const key of this.l1Cache.keys()) {
      if (key.startsWith('loc_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      this.l1Cache.delete(key);
      this.l2Cache.delete(key);
    });
  }

  // Cache warming - preload popular queries
  async warmCache(popularLocations: LocationCoordinates[]) {
    const warmingPromises = popularLocations.map(async location => {
      const queries: LocationQuery[] = [
        { ...location, radius: 5 }, // 5km
        { ...location, radius: 10 }, // 10km
        { ...location, radius: 25 }, // 25km
      ];
      
      for (const query of queries) {
        try {
          await this.getNearbyGames(query);
        } catch (error) {
          console.warn('Cache warming failed for query:', query, error);
        }
      }
    });
    
    await Promise.all(warmingPromises);
    console.log('Cache warming completed for', popularLocations.length, 'locations');
  }

  // Performance monitoring
  getMetrics(): CacheMetrics & { hitRate: number; cacheSize: { l1: number; l2: number; spatial: number } } {
    const hitRate = this.metrics.totalRequests > 0 
      ? this.metrics.hits / this.metrics.totalRequests 
      : 0;
    
    return {
      ...this.metrics,
      hitRate,
      cacheSize: {
        l1: this.l1Cache.size,
        l2: this.l2Cache.size,
        spatial: this.geospatialIndex.games.size
      }
    };
  }

  // Cache management
  clearCache() {
    this.l1Cache.clear();
    this.l2Cache.clear();
    this.queryCache.clear();
    this.geospatialIndex.games.clear();
    this.geospatialIndex.spatialGrid.clear();
    
    // Reset metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      memoryUsage: 0
    };
    
    localStorage.removeItem('location_cache_l2');
  }

  // Precompute popular game clusters
  async precomputeClusters(games: Game[]): Promise<Map<string, Game[]>> {
    const clusters = new Map<string, Game[]>();
    const gridClusters = new Map<string, Game[]>();
    
    // Group games by grid cells
    games.forEach(game => {
      if (game.latitude && game.longitude) {
        const cell = this.getGridCell(game.latitude, game.longitude);
        if (!gridClusters.has(cell)) {
          gridClusters.set(cell, []);
        }
        gridClusters.get(cell)!.push(game);
      }
    });
    
    // Create clusters for cells with multiple games
    for (const [cell, cellGames] of gridClusters) {
      if (cellGames.length > 1) {
        clusters.set(`cluster_${cell}`, cellGames);
        
        // Cache the cluster
        this.setCachedValue(
          `cluster_${cell}`,
          cellGames,
          this.config.geospatialTTL
        );
      }
    }
    
    return clusters;
  }
}

// Export singleton instance
export const locationCache = LocationCacheManager.getInstance();

// Utility functions
export async function getCachedNearbyGames(
  location: LocationCoordinates,
  radius: number = 25,
  sport?: string
): Promise<Game[]> {
  return locationCache.getNearbyGames({
    latitude: location.latitude,
    longitude: location.longitude,
    radius,
    sport
  });
}

export function warmLocationCache(locations: LocationCoordinates[]) {
  return locationCache.warmCache(locations);
}

export function getCacheMetrics() {
  return locationCache.getMetrics();
}
