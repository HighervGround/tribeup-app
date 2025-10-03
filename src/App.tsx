import React from 'react';
import { AppRouter } from './components/AppRouter';
import { SimpleAuthProvider } from './providers/SimpleAuthProvider';
import { QueryProvider } from './providers/QueryProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'sonner';
import './light-mode-fix.css';

export default function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <SimpleAuthProvider>
          <AppRouter />
        </SimpleAuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}