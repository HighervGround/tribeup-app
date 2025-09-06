import React from 'react';
import { AppRouter } from './components/AppRouter';
import { AuthProvider } from './providers/AuthProvider';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
    </AuthProvider>
  );
}