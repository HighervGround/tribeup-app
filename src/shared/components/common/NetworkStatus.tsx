import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [supabaseReachable, setSupabaseReachable] = useState<boolean | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Test Supabase connectivity
    const testSupabase = async () => {
      try {
        const response = await fetch('https://alegufnopsminqcokelr.supabase.co/rest/v1/', {
          method: 'HEAD',
          signal: AbortSignal.timeout(3000)
        });
        setSupabaseReachable(response.ok);
      } catch (error) {
        console.warn('Supabase connectivity test failed:', error);
        setSupabaseReachable(false);
      }
    };

    if (isOnline) {
      testSupabase();
      // Test every 30 seconds
      const interval = setInterval(testSupabase, 30000);
      return () => clearInterval(interval);
    } else {
      setSupabaseReachable(false);
    }
  }, [isOnline]);

  if (!isOnline) {
    return (
      <Badge variant="destructive" className="fixed top-4 right-4 z-50">
        <WifiOff className="w-3 h-3 mr-1" />
        Offline
      </Badge>
    );
  }

  if (supabaseReachable === false) {
    return (
      <Badge variant="destructive" className="fixed top-4 right-4 z-50">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Connection Issue
      </Badge>
    );
  }

  if (supabaseReachable === true) {
    return (
      <Badge variant="secondary" className="fixed top-4 right-4 z-50 opacity-50">
        <Wifi className="w-3 h-3 mr-1" />
        Connected
      </Badge>
    );
  }

  return null; // Still testing
}
