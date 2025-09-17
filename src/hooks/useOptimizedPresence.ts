import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { debounce } from 'lodash-es';

interface UserPresence {
  userId: string;
  lastSeen: Date;
  isOnline: boolean;
  gameId?: string;
  location?: { lat: number; lng: number };
}

interface PresenceConfig {
  batchSize: number;
  throttleMs: number;
  heartbeatInterval: number;
  maxRetries: number;
  connectionPoolSize: number;
}

interface PresenceMetrics {
  totalConnections: number;
  activeChannels: number;
  messagesPerSecond: number;
  averageLatency: number;
  errorRate: number;
}

class PresenceManager {
  private static instance: PresenceManager;
  private channels: Map<string, any> = new Map();
  private connectionPool: any[] = [];
  private presenceCache: Map<string, UserPresence> = new Map();
  private batchQueue: Array<{ type: string; data: any }> = [];
  private metrics: PresenceMetrics = {
    totalConnections: 0,
    activeChannels: 0,
    messagesPerSecond: 0,
    averageLatency: 0,
    errorRate: 0
  };
  
  private config: PresenceConfig = {
    batchSize: 50,
    throttleMs: 1000,
    heartbeatInterval: 30000,
    maxRetries: 3,
    connectionPoolSize: 10
  };

  private batchTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private metricsTimer: NodeJS.Timeout | null = null;

  static getInstance(): PresenceManager {
    if (!PresenceManager.instance) {
      PresenceManager.instance = new PresenceManager();
    }
    return PresenceManager.instance;
  }

  private constructor() {
    this.initializeConnectionPool();
    this.startBatchProcessor();
    this.startHeartbeat();
    this.startMetricsCollection();
  }

  private initializeConnectionPool() {
    for (let i = 0; i < this.config.connectionPoolSize; i++) {
      const channel = supabase.channel(`presence-pool-${i}`, {
        config: {
          presence: { key: `pool-${i}` },
          broadcast: { self: false },
          postgres_changes: []
        }
      });
      this.connectionPool.push(channel);
    }
  }

  private getOptimalChannel(gameId?: string): any {
    // Use consistent hashing to distribute users across channels
    const hash = gameId ? this.hashString(gameId) : Math.random();
    const channelIndex = Math.floor(hash * this.config.connectionPoolSize);
    return this.connectionPool[channelIndex];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  private startBatchProcessor() {
    const processBatch = () => {
      if (this.batchQueue.length === 0) return;

      const batch = this.batchQueue.splice(0, this.config.batchSize);
      this.processBatchedUpdates(batch);
    };

    this.batchTimer = setInterval(processBatch, this.config.throttleMs);
  }

  private async processBatchedUpdates(batch: Array<{ type: string; data: any }>) {
    const startTime = Date.now();
    
    try {
      // Group updates by type for efficient processing
      const groupedUpdates = batch.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = [];
        acc[item.type].push(item.data);
        return acc;
      }, {} as Record<string, any[]>);

      // Process presence updates
      if (groupedUpdates.presence) {
        await this.batchUpdatePresence(groupedUpdates.presence);
      }

      // Process location updates
      if (groupedUpdates.location) {
        await this.batchUpdateLocations(groupedUpdates.location);
      }

      // Update metrics
      const latency = Date.now() - startTime;
      this.updateMetrics({ latency, success: true, batchSize: batch.length });

    } catch (error) {
      console.error('Batch processing error:', error);
      this.updateMetrics({ latency: Date.now() - startTime, success: false, batchSize: batch.length });
    }
  }

  private async batchUpdatePresence(updates: any[]) {
    // Deduplicate updates by userId (keep latest)
    const deduped = updates.reduce((acc, update) => {
      acc[update.userId] = update;
      return acc;
    }, {} as Record<string, any>);

    // Update local cache
    Object.values(deduped).forEach(update => {
      this.presenceCache.set(update.userId, {
        userId: update.userId,
        lastSeen: new Date(),
        isOnline: update.isOnline,
        gameId: update.gameId,
        location: update.location
      });
    });

    // Broadcast to relevant channels
    const channelUpdates = new Map<any, any[]>();
    Object.values(deduped).forEach(update => {
      const channel = this.getOptimalChannel(update.gameId);
      if (!channelUpdates.has(channel)) {
        channelUpdates.set(channel, []);
      }
      channelUpdates.get(channel)!.push(update);
    });

    // Send batched updates to each channel
    for (const [channel, channelData] of channelUpdates) {
      try {
        await channel.send({
          type: 'broadcast',
          event: 'presence_batch',
          payload: { updates: channelData }
        });
      } catch (error) {
        console.error('Channel broadcast error:', error);
      }
    }
  }

  private async batchUpdateLocations(updates: any[]) {
    // Similar batching logic for location updates
    const locationUpdates = updates.reduce((acc, update) => {
      acc[update.userId] = update;
      return acc;
    }, {} as Record<string, any>);

    // Update presence cache with location data
    Object.values(locationUpdates).forEach(update => {
      const existing = this.presenceCache.get(update.userId);
      if (existing) {
        existing.location = update.location;
        existing.lastSeen = new Date();
      }
    });
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.cleanupStaleConnections();
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  private cleanupStaleConnections() {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [userId, presence] of this.presenceCache) {
      if (now - presence.lastSeen.getTime() > staleThreshold) {
        this.presenceCache.delete(userId);
        this.queueUpdate('presence', {
          userId,
          isOnline: false,
          lastSeen: presence.lastSeen
        });
      }
    }
  }

  private sendHeartbeat() {
    this.connectionPool.forEach((channel, index) => {
      channel.send({
        type: 'broadcast',
        event: 'heartbeat',
        payload: { 
          timestamp: Date.now(),
          poolIndex: index,
          activeUsers: this.presenceCache.size
        }
      });
    });
  }

  private startMetricsCollection() {
    this.metricsTimer = setInterval(() => {
      this.metrics.totalConnections = this.presenceCache.size;
      this.metrics.activeChannels = this.connectionPool.length;
      
      // Reset counters for next interval
      this.metrics.messagesPerSecond = 0;
    }, 10000); // Update every 10 seconds
  }

  private updateMetrics(data: { latency: number; success: boolean; batchSize: number }) {
    this.metrics.averageLatency = (this.metrics.averageLatency + data.latency) / 2;
    this.metrics.messagesPerSecond += data.batchSize;
    
    if (!data.success) {
      this.metrics.errorRate = Math.min(this.metrics.errorRate + 0.01, 1);
    } else {
      this.metrics.errorRate = Math.max(this.metrics.errorRate - 0.001, 0);
    }
  }

  public queueUpdate(type: string, data: any) {
    this.batchQueue.push({ type, data });
    
    // If queue is getting too large, process immediately
    if (this.batchQueue.length >= this.config.batchSize * 2) {
      this.processBatchedUpdates(this.batchQueue.splice(0, this.config.batchSize));
    }
  }

  public subscribeToPresence(gameId: string, callback: (users: UserPresence[]) => void) {
    const channel = this.getOptimalChannel(gameId);
    const channelKey = `${gameId}-${channel.topic}`;
    
    if (this.channels.has(channelKey)) {
      return this.channels.get(channelKey);
    }

    const subscription = channel
      .on('broadcast', { event: 'presence_batch' }, ({ payload }: any) => {
        payload.updates.forEach((update: any) => {
          this.presenceCache.set(update.userId, {
            userId: update.userId,
            lastSeen: new Date(update.lastSeen),
            isOnline: update.isOnline,
            gameId: update.gameId,
            location: update.location
          });
        });
        
        // Filter users for this specific game
        const gameUsers = Array.from(this.presenceCache.values())
          .filter(user => user.gameId === gameId && user.isOnline);
        
        callback(gameUsers);
      })
      .subscribe();

    this.channels.set(channelKey, subscription);
    return subscription;
  }

  public updateUserPresence(userId: string, data: Partial<UserPresence>) {
    this.queueUpdate('presence', {
      userId,
      isOnline: true,
      lastSeen: new Date(),
      ...data
    });
  }

  public updateUserLocation(userId: string, location: { lat: number; lng: number }) {
    this.queueUpdate('location', {
      userId,
      location,
      timestamp: Date.now()
    });
  }

  public getMetrics(): PresenceMetrics {
    return { ...this.metrics };
  }

  public getOnlineUsers(gameId?: string): UserPresence[] {
    const users = Array.from(this.presenceCache.values())
      .filter(user => user.isOnline);
    
    if (gameId) {
      return users.filter(user => user.gameId === gameId);
    }
    
    return users;
  }

  public cleanup() {
    if (this.batchTimer) clearInterval(this.batchTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.metricsTimer) clearInterval(this.metricsTimer);
    
    this.channels.forEach(channel => channel.unsubscribe());
    this.connectionPool.forEach(channel => channel.unsubscribe());
    
    this.channels.clear();
    this.presenceCache.clear();
    this.batchQueue.length = 0;
  }
}

export function useOptimizedPresence(gameId?: string) {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<PresenceMetrics | null>(null);
  
  const presenceManager = useRef(PresenceManager.getInstance());
  const currentUserRef = useRef<string | null>(null);

  // Throttled location update function
  const throttledLocationUpdate = useCallback(
    debounce((location: { lat: number; lng: number }) => {
      if (currentUserRef.current) {
        presenceManager.current.updateUserLocation(currentUserRef.current, location);
      }
    }, 5000), // Update location max once per 5 seconds
    []
  );

  useEffect(() => {
    let subscription: any;

    const initializePresence = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        currentUserRef.current = user.id;

        // Subscribe to presence updates
        if (gameId) {
          subscription = presenceManager.current.subscribeToPresence(gameId, (users) => {
            setOnlineUsers(users);
            setIsLoading(false);
          });

          // Update user's presence for this game
          presenceManager.current.updateUserPresence(user.id, {
            gameId,
            isOnline: true
          });
        } else {
          // Get all online users
          const users = presenceManager.current.getOnlineUsers();
          setOnlineUsers(users);
          setIsLoading(false);
        }

        // Update metrics periodically
        const metricsInterval = setInterval(() => {
          setMetrics(presenceManager.current.getMetrics());
        }, 5000);

        return () => {
          clearInterval(metricsInterval);
        };

      } catch (error) {
        console.error('Presence initialization error:', error);
        setIsLoading(false);
      }
    };

    initializePresence();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [gameId]);

  const updateLocation = useCallback((location: { lat: number; lng: number }) => {
    throttledLocationUpdate(location);
  }, [throttledLocationUpdate]);

  const setUserOnline = useCallback((isOnline: boolean) => {
    if (currentUserRef.current) {
      presenceManager.current.updateUserPresence(currentUserRef.current, {
        isOnline,
        gameId
      });
    }
  }, [gameId]);

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
    isLoading,
    metrics,
    updateLocation,
    setUserOnline
  };
}
