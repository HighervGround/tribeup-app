import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryDebugger } from '../utils/queryDebugger';

// Create a client with enhanced error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes (reduced for better refresh)
      gcTime: 5 * 60 * 1000, // 5 minutes (reduced to prevent stale cache issues)
      retry: (failureCount, error: any) => {
        console.log(`🔄 [QueryClient] Retry attempt ${failureCount} for error:`, error?.message);
        
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          console.warn('🚫 [QueryClient] 4xx error, no retry');
          return false;
        }
        
        // Don't retry timeout errors more than once
        if (error?.message?.includes('timeout') && failureCount >= 1) {
          console.warn('🚫 [QueryClient] Timeout retry limit reached');
          return false;
        }
        
        return failureCount < 2; // Reduced from 3 to 2
      },
      retryDelay: (attemptIndex) => {
        const delay = Math.min(1000 * 2 ** attemptIndex, 15000); // Reduced max delay
        console.log(`⏱️ [QueryClient] Retry delay: ${delay}ms`);
        return delay;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

// Set up query debugger
queryDebugger.setQueryClient(queryClient);

// Add global error handler
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'added') {
    console.log('📝 [QueryClient] Query added:', event.query.queryKey);
  } else if (event.type === 'removed') {
    console.log('🗑️ [QueryClient] Query removed:', event.query.queryKey);
  }
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  useEffect(() => {
    // Start debugging in development
    if (import.meta.env?.DEV || process.env.NODE_ENV === 'development') {
      console.log('🔍 [QueryProvider] Starting query debugging...');
      queryDebugger.startDebugging();
      
      // Set up periodic stuck query detection
      const stuckQueryInterval = setInterval(() => {
        queryDebugger.forceRefreshStuckQueries();
      }, 30000); // Check every 30 seconds
      
      return () => {
        queryDebugger.stopDebugging();
        clearInterval(stuckQueryInterval);
      };
    }
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools - only in development */}
      {(import.meta.env?.DEV || process.env.NODE_ENV === 'development') && (
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
}

export { queryClient };
