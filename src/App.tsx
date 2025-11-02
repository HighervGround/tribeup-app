import React from 'react';
import { AppRouter } from '@/core/routing/AppRouter';
import { SimpleAuthProvider } from '@/core/auth/SimpleAuthProvider';
import { QueryProvider } from '@/core/auth/QueryProvider';
import { ErrorBoundary } from '@/shared/components/common/ErrorBoundary';
import { Toaster } from 'sonner';
// import './light-mode-fix.css';

export default function App() {
  console.log('🚀 App component rendering...');
  
  return (
    <ErrorBoundary>
      <QueryProvider>
        <SimpleAuthProvider>
          <AppRouter />
        </SimpleAuthProvider>
      </QueryProvider>
      <Toaster />
    </ErrorBoundary>
  );
}