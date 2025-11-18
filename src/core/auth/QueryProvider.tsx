import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Check if we're in development mode
const isDev = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || import.meta.env.DEV);

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes (increased for better performance)
      gcTime: 10 * 60 * 1000, // 10 minutes (increased to reduce refetches)
      retry: (failureCount, error: any) => {
        // Only log in development
        if (isDev) {
          console.log(`🔄 [QueryClient] Retry attempt ${failureCount} for error:`, error?.message);
        }
        
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        
        // Don't retry timeout errors more than once
        if (error?.message?.includes('timeout') && failureCount >= 1) {
          return false;
        }
        
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => {
        return Math.min(1000 * 2 ** attemptIndex, 15000);
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  useEffect(() => {
    // Only expose queryClient in development for debugging
    if (isDev && typeof window !== 'undefined') {
      (window as any).queryClient = queryClient;
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
