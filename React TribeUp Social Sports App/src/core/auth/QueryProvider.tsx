import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryDebugger } from '@/shared/utils/queryDebugger';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Expose queryClient to window for debugging
    if (typeof window !== 'undefined') {
      (window as any).queryClient = queryClient;
      console.log('🔍 [QueryProvider] QueryClient exposed to window.queryClient');
    }
    
    // Start debugging in development
    const isDev = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || process.env.NODE_ENV === 'development');
    
    if (isDev) {
      console.log('🔍 [QueryProvider] Query debugging disabled temporarily to prevent interference');
      // queryDebugger.startDebugging();
      
      // Disable stuck query detection that was cancelling queries
      // const stuckQueryInterval = setInterval(() => {
      //   queryDebugger.forceRefreshStuckQueries();
      // }, 30000); // Check every 30 seconds
      
      // return () => {
      //   queryDebugger.stopDebugging();
      //   clearInterval(stuckQueryInterval);
      // };
    }
  }, []);
  
  // Check if we're in development
  const isDev = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || process.env.NODE_ENV === 'development');

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools - only in development and after mount */}
      {isDev && isMounted && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}

export { queryClient };
