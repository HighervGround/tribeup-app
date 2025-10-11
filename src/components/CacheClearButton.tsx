import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { RefreshCw, Trash2, AlertTriangle, Bug, Zap, Wifi } from 'lucide-react';
import { gameKeys } from '../hooks/useGames';
import { queryDebugger } from '../utils/queryDebugger';
import { SupabaseDiagnostics } from '../utils/supabaseDiagnostics';
import { SupabaseSpeedTest } from '../utils/supabaseSpeedTest';
import { ConnectionDiagnostic } from '../utils/connectionDiagnostic';

export function CacheClearButton() {
  const queryClient = useQueryClient();
  const [clearing, setClearing] = useState(false);
  const [lastCleared, setLastCleared] = useState<Date | null>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [runningSpeedTest, setRunningSpeedTest] = useState(false);
  const [runningConnectionTest, setRunningConnectionTest] = useState(false);

  const clearGameCache = async () => {
    setClearing(true);
    console.log('🧹 [CacheClearButton] Clearing game cache...');
    
    try {
      // Remove all game-related queries
      queryClient.removeQueries({
        predicate: (query) => 
          query.queryKey.includes('games') || 
          query.queryKey.some(key => typeof key === 'string' && key.includes('game'))
      });
      
      // Invalidate any remaining game queries
      await queryClient.invalidateQueries({ queryKey: gameKeys.all });
      
      // Clear query debugger cache
      queryDebugger.clearAllGameQueries();
      
      // Clear potential auth issues
      try {
        const authToken = localStorage.getItem('supabase.auth.token');
        if (authToken) {
          console.log('🔐 Found auth token, checking validity...');
          // Parse and check if token is expired
          const tokenData = JSON.parse(authToken);
          if (tokenData.expires_at && new Date(tokenData.expires_at * 1000) < new Date()) {
            console.log('🚨 Auth token expired, clearing...');
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('tribeup-auth');
          }
        }
      } catch (authError) {
        console.warn('⚠️ Could not check auth token:', authError);
      }
      
      setLastCleared(new Date());
      console.log('✅ [CacheClearButton] Game cache cleared successfully');
      
      // Force a fresh fetch
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: gameKeys.lists() });
      }, 100);
      
    } catch (error) {
      console.error('❌ [CacheClearButton] Error clearing cache:', error);
    } finally {
      setClearing(false);
    }
  };

  const clearAllCache = async () => {
    setClearing(true);
    console.log('🧹 [CacheClearButton] Clearing ALL cache...');
    
    try {
      // Clear React Query cache
      queryClient.clear();
      
      // Clear browser storage
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      setLastCleared(new Date());
      console.log('✅ [CacheClearButton] All cache cleared');
      
      // Reload the page after clearing everything
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('❌ [CacheClearButton] Error clearing all cache:', error);
    } finally {
      setClearing(false);
    }
  };

  const runDiagnostics = async () => {
    setRunningDiagnostics(true);
    console.log('🔍 [CacheClearButton] Running Supabase diagnostics...');
    
    try {
      await SupabaseDiagnostics.runDiagnostics();
      console.log('✅ [CacheClearButton] Diagnostics completed - check console for results');
    } catch (error) {
      console.error('❌ [CacheClearButton] Diagnostics failed:', error);
    } finally {
      setRunningDiagnostics(false);
    }
  };

  const runSpeedTest = async () => {
    setRunningSpeedTest(true);
    console.log('🏃‍♂️ [CacheClearButton] Running Supabase speed test...');
    
    try {
      await SupabaseSpeedTest.runFullSpeedTest();
      console.log('✅ [CacheClearButton] Speed test completed - check console for results');
    } catch (error) {
      console.error('❌ [CacheClearButton] Speed test failed:', error);
    } finally {
      setRunningSpeedTest(false);
    }
  };

  const runConnectionTest = async () => {
    setRunningConnectionTest(true);
    console.log('🔍 [CacheClearButton] Running connection diagnostic...');
    
    try {
      await ConnectionDiagnostic.runConnectionTest();
      console.log('✅ [CacheClearButton] Connection test completed - check console for results');
    } catch (error) {
      console.error('❌ [CacheClearButton] Connection test failed:', error);
    } finally {
      setRunningConnectionTest(false);
    }
  };

  const getQueryStats = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const gameQueries = queries.filter(q => 
      q.queryKey.includes('games') || 
      q.queryKey.some(key => typeof key === 'string' && key.includes('game'))
    );
    
    const staleQueries = gameQueries.filter(q => q.isStale());
    
    return {
      total: queries.length,
      gameQueries: gameQueries.length,
      staleGameQueries: staleQueries.length
    };
  };

  const stats = getQueryStats();

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border rounded-lg p-4 shadow-lg max-w-sm">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-medium">Cache Debug</span>
      </div>
      
      <div className="text-xs text-muted-foreground mb-3 space-y-1">
        <div>Total Queries: {stats.total}</div>
        <div>Game Queries: {stats.gameQueries}</div>
        <div className={stats.staleGameQueries > 0 ? 'text-yellow-600' : ''}>
          Stale Game Queries: {stats.staleGameQueries}
        </div>
        {lastCleared && (
          <div>Last Cleared: {lastCleared.toLocaleTimeString()}</div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={clearGameCache}
            disabled={clearing}
            className="flex-1"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${clearing ? 'animate-spin' : ''}`} />
            Clear Games
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            onClick={clearAllCache}
            disabled={clearing}
            className="flex-1"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        </div>
        
        <Button
          size="sm"
          variant="secondary"
          onClick={runDiagnostics}
          disabled={runningDiagnostics}
          className="w-full"
        >
          <Bug className={`w-3 h-3 mr-1 ${runningDiagnostics ? 'animate-pulse' : ''}`} />
          {runningDiagnostics ? 'Running Diagnostics...' : 'Diagnose DB Issues'}
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={runSpeedTest}
          disabled={runningSpeedTest}
          className="w-full"
        >
          <Zap className={`w-3 h-3 mr-1 ${runningSpeedTest ? 'animate-bounce' : ''}`} />
          {runningSpeedTest ? 'Testing Speed...' : 'Test Supabase Speed'}
        </Button>
        
        <Button
          size="sm"
          variant="destructive"
          onClick={runConnectionTest}
          disabled={runningConnectionTest}
          className="w-full"
        >
          <Wifi className={`w-3 h-3 mr-1 ${runningConnectionTest ? 'animate-pulse' : ''}`} />
          {runningConnectionTest ? 'Testing Connection...' : 'Fix Connection Issues'}
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground mt-2">
        "Fix Connection" will diagnose network/DNS/CORS issues
      </div>
    </div>
  );
}
