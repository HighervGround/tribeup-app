import React from 'react';
import { AppRouter } from './components/AppRouter';
import { AuthProvider } from './providers/AuthProvider';
import { QueryProvider } from './providers/QueryProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <AppRouter />
          <Toaster 
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}