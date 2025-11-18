import { useState, useEffect } from 'react';
import { AppRouter } from '@/core/routing/AppRouter';
import { SimpleAuthProvider } from '@/core/auth/SimpleAuthProvider';
import { QueryProvider } from '@/core/auth/QueryProvider';
import { ErrorBoundary } from '@/shared/components/common/ErrorBoundary';
import { Toaster } from 'sonner';
import { layoutConstants } from '@/shared/config/theme';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  console.log('🚀 App component rendering...');

  // Disable browser scroll restoration to prevent unwanted scrolling
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Show splash screen for 2.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50 overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(250,70,22,0.1),transparent_50%)]" />
        
        {/* Content */}
        <div className="relative z-10 text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
          {/* Logo/Brand */}
          <div className="space-y-4">
            <div className="relative mx-auto">
              {/* Outer glow ring */}
              <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-primary/20 blur-2xl animate-pulse" />
              
              {/* Main logo circle */}
              <div className="relative w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl border-4 border-primary/30">
                <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center">
                  <span className="text-4xl font-black text-primary">UF</span>
                </div>
              </div>
            </div>

            {/* App name with animation */}
            <div className="space-y-3">
              <h1 className="text-5xl md:text-6xl font-black text-foreground tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                TribeUp
              </h1>
              <p className="text-lg text-muted-foreground font-medium animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
                Find your next activity
              </p>
            </div>
          </div>

          {/* Loading indicator - modern spinner */}
          <div className="flex justify-center pt-4 animate-in fade-in duration-1000 delay-700">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
            </div>
          </div>
        </div>

        {/* Subtle particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary/30 rounded-full animate-float"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + (i % 2)}s`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
            50% { transform: translateY(-20px) scale(1.2); opacity: 0.6; }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

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