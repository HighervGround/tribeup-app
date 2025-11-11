import { AppRouter } from '@/core/routing/AppRouter';
import { SimpleAuthProvider } from '@/core/auth/SimpleAuthProvider';
import { QueryProvider } from '@/core/auth/QueryProvider';
import { ErrorBoundary } from '@/shared/components/common/ErrorBoundary';
import { Toaster } from 'sonner';
import { layoutConstants } from '@/shared/config/theme';

export default function App() {
  console.log('🚀 App component rendering...');
  
  return (
    <ErrorBoundary>
      <QueryProvider>
        <SimpleAuthProvider>
          <AppRouter />
        </SimpleAuthProvider>
      </QueryProvider>
      <Toaster 
        theme="system"
        position="top-center"
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          className: `mb-${layoutConstants.toast.offset.mobile / 4} md:mb-0`,
        }}
        offset={`${layoutConstants.toast.offset.desktop}px`}
      />
    </ErrorBoundary>
  );
}