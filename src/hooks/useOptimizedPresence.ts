import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
// Simple debounce implementation to avoid lodash-es dependency
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): T => {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
};

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
    connectionPoolSize: 5
  };

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

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.connectionPool.push(channel);
        }
      });
    }
  }

  private getOptimalChannel(gameId: string): any {
    // Simple round-robin selection
    const index = Math.abs(gameId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % this.connectionPool.length;
    return this.connectionPool[index] || this.connectionPool[0];
  }

  private queueUpdate(type: string, data: any) {
    this.batchQueue.push({ type, data });
    
    if (this.batchQueue.length >= this.config.batchSize) {
      this.processBatch();
    }
  }

  private processBatch = debounce(() => {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    // Group updates by type
    const groupedUpdates = batch.reduce((acc, update) => {
      if (!acc[update.type]) {
        acc[update.type] = [];
      }
      acc[update.type].push(update.data);
      return acc;
    }, {} as Record<string, any[]>);

    // Process presence updates
    if (groupedUpdates.presence) {
      this.batchUpdatePresence(groupedUpdates.presence);
    }

    // Process location updates
    if (groupedUpdates.location) {
      this.batchUpdateLocation(groupedUpdates.location);
    }

    // Update metrics
    this.metrics.messagesPerSecond = batch.length / (this.config.throttleMs / 1000);
  }, this.config.throttleMs);

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

    // Broadcast to appropriate channels
    const channelGroups = Object.values(deduped).reduce((acc, update) => {
      const channel = this.getOptimalChannel(update.gameId || 'global');
      const channelKey = channel.topic;
      
      if (!acc[channelKey]) {
        acc[channelKey] = { channel, data: [] };
      }
      acc[channelKey].data.push(update);
      return acc;
    }, {} as Record<string, { channel: any; data: any[] }>);

    // Send batched updates to each channel
    for (const { channel, data: channelData } of Object.values(channelGroups)) {
      try {
        await channel.send({
          type: 'broadcast',
          event: 'presence_batch',
          payload: { updates: channelData }
        });
      } catch (error) {
        console.error('Failed to broadcast presence batch:', error);
        this.metrics.errorRate++;
      }
    }
  }

  private async batchUpdateLocation(updates: any[]) {
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
        this.presenceCache.set(update.userId, existing);
      }
    });
  }

  private cleanupStalePresence() {
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

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.cleanupStalePresence();
      
      // Send heartbeat to all channels
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
    }, this.config.heartbeatInterval);
  }

  private startMetricsCollection() {
    this.metricsTimer = setInterval(() => {
      this.metrics.totalConnections = this.presenceCache.size;
      this.metrics.activeChannels = this.connectionPool.length;
      
      // Reset counters for next interval
      this.metrics.messagesPerSecond = 0;
      this.metrics.errorRate = 0;
    }, 60000); // Update metrics every minute
  }

  private startBatchProcessor() {
    // Process batches every throttle interval
    setInterval(() => {
      if (this.batchQueue.length > 0) {
        this.processBatch();
      }
    }, this.config.throttleMs);
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
      });

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
      timestamp: new Date()
    });
  }

  public getMetrics(): PresenceMetrics {
    return { ...this.metrics };
  }

  public cleanup() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    
    this.channels.forEach(channel => {
      try {
        channel.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from channel:', error);
      }
    });
    
    this.connectionPool.forEach(channel => {
      try {
        channel.unsubscribe();
      } catch (error) {
        console.error('Error cleaning up connection pool:', error);
      }
    });
    
    this.channels.clear();
    this.connectionPool = [];
    this.presenceCache.clear();
  }
}

export function useOptimizedPresence(gameId?: string) {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<PresenceMetrics | null>(null);
  const managerRef = useRef<PresenceManager | null>(null);

  useEffect(() => {
    managerRef.current = PresenceManager.getInstance();
    
    if (gameId) {
      const subscription = managerRef.current.subscribeToPresence(gameId, (users) => {
        setOnlineUsers(users);
        setIsLoading(false);
      });

      // Update metrics periodically
      const metricsInterval = setInterval(() => {
        if (managerRef.current) {
          setMetrics(managerRef.current.getMetrics());
        }
      }, 5000);

      return () => {
        clearInterval(metricsInterval);
        if (subscription) {
          try {
            subscription.unsubscribe();
          } catch (error) {
            console.error('Error unsubscribing:', error);
          }
        }
      };
    }
  }, [gameId]);

  const updatePresence = useCallback((data: Partial<UserPresence>) => {
    if (managerRef.current && gameId) {
      managerRef.current.updateUserPresence(gameId, { gameId, ...data });
    }
  }, [gameId]);

  const updateLocation = useCallback((location: { lat: number; lng: number }) => {
    if (managerRef.current && gameId) {
      managerRef.current.updateUserLocation(gameId, location);
    }
  }, [gameId]);

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
    isLoading,
    metrics,
    updatePresence,
    updateLocation
  };
}
