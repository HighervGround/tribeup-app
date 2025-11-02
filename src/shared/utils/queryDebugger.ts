import { QueryClient } from '@tanstack/react-query';

export class QueryDebugger {
  private static instance: QueryDebugger;
  private queryClient: QueryClient | null = null;
  private debugInterval: NodeJS.Timeout | null = null;

  static getInstance(): QueryDebugger {
    if (!QueryDebugger.instance) {
      QueryDebugger.instance = new QueryDebugger();
    }
    return QueryDebugger.instance;
  }

  setQueryClient(client: QueryClient) {
    this.queryClient = client;
  }

  startDebugging() {
    if (this.debugInterval || !this.queryClient) return;

    console.log('🔍 [QueryDebugger] Starting query state monitoring...');
    
    this.debugInterval = setInterval(() => {
      this.logQueryStates();
    }, 10000); // Log every 10 seconds
  }

  stopDebugging() {
    if (this.debugInterval) {
      clearInterval(this.debugInterval);
      this.debugInterval = null;
      console.log('🛑 [QueryDebugger] Stopped query state monitoring');
    }
  }

  logQueryStates() {
    if (!this.queryClient) return;

    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const gameQueries = queries.filter(q => 
      q.queryKey.includes('games') || 
      q.queryKey.some(key => typeof key === 'string' && key.includes('game'))
    );

    if (gameQueries.length === 0) {
      console.log('📊 [QueryDebugger] No game queries found');
      return;
    }

    console.group('📊 [QueryDebugger] Query States');
    
    gameQueries.forEach(query => {
      const state = query.state;
      const isStale = query.isStale();
      const isActive = query.getObserversCount() > 0;
      
      console.log(`🔍 Query: ${JSON.stringify(query.queryKey)}`, {
        status: state.status,
        fetchStatus: state.fetchStatus,
        isStale,
        isActive,
        observers: query.getObserversCount(),
        dataUpdatedAt: new Date(state.dataUpdatedAt).toLocaleTimeString(),
        errorUpdatedAt: state.errorUpdatedAt ? new Date(state.errorUpdatedAt).toLocaleTimeString() : 'never',
        error: state.error?.message,
        data: state.data ? `${Array.isArray(state.data) ? state.data.length : 'object'} items` : 'no data'
      });
    });
    
    console.groupEnd();
  }

  forceRefreshStuckQueries() {
    if (!this.queryClient) return;

    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stuckQueries = queries.filter(query => {
      const state = query.state;
      const timeSinceLastUpdate = Date.now() - state.dataUpdatedAt;
      
      // Consider a query "stuck" if it's been loading for more than 30 seconds
      return (
        state.fetchStatus === 'fetching' && 
        timeSinceLastUpdate > 30000
      );
    });

    if (stuckQueries.length > 0) {
      console.warn(`🚨 [QueryDebugger] Found ${stuckQueries.length} stuck queries, forcing refresh...`);
      
      stuckQueries.forEach(query => {
        console.log(`🔄 [QueryDebugger] Cancelling stuck query:`, query.queryKey);
        query.cancel();
        this.queryClient!.invalidateQueries({ queryKey: query.queryKey });
      });
    }
  }

  clearAllGameQueries() {
    if (!this.queryClient) return;

    console.log('🧹 [QueryDebugger] Clearing all game-related queries...');
    
    this.queryClient.removeQueries({
      predicate: (query) => 
        query.queryKey.includes('games') || 
        query.queryKey.some(key => typeof key === 'string' && key.includes('game'))
    });
    
    console.log('✅ [QueryDebugger] Game queries cleared');
  }

  getQueryStats() {
    if (!this.queryClient) return null;

    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stats = {
      total: queries.length,
      loading: queries.filter(q => q.state.fetchStatus === 'fetching').length,
      error: queries.filter(q => q.state.status === 'error').length,
      success: queries.filter(q => q.state.status === 'success').length,
      stale: queries.filter(q => q.isStale()).length,
      active: queries.filter(q => q.getObserversCount() > 0).length
    };

    return stats;
  }
}

// Global instance
export const queryDebugger = QueryDebugger.getInstance();

// Development helper functions
if (typeof window !== 'undefined') {
  (window as any).queryDebugger = queryDebugger;
  (window as any).debugQueries = () => queryDebugger.logQueryStates();
  (window as any).clearGameQueries = () => queryDebugger.clearAllGameQueries();
  (window as any).forceRefreshStuck = () => queryDebugger.forceRefreshStuckQueries();
}
