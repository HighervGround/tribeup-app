import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'
import './index.css'
import './fix-colors.css'
import { CacheCorruptionDetector } from '@/shared/utils/cacheCorruptionDetector'
import { useThemeStore } from '@/store/themeStore'
import { analyticsService } from '@/core/analytics/analyticsService'
import { initializeErrorMonitoring } from '@/core/notifications/errorMonitoring'
import { PostHogProvider, PostHogErrorBoundary } from '@posthog/react'

// Performance optimization: In production, CSS is bundled into main assets automatically
// No manual preloading needed as Vite handles this optimization

// Register service worker properly - only in production
if ('serviceWorker' in navigator && (import.meta as any).env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      })
      
      console.log('✅ Service Worker registered:', registration)
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, prompt user to refresh
              if (confirm('New version available! Refresh to update?')) {
                window.location.reload()
              }
            }
          })
        }
      })
      
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error)
    }
  })
}

// Performance monitoring in production
if ((import.meta as any).env.PROD && 'performance' in window) {
  const startTime = performance.now()
  window.addEventListener('load', () => {
    const loadTime = performance.now() - startTime;
    console.log(`🚀 App loaded in: ${loadTime.toFixed(2)} ms`);
    console.log(`🔄 DEPLOYMENT VERSION: v2.1 - ${new Date().toISOString()}`);
  });
}

// Initialize app directly - disable cache corruption detector temporarily
async function initializeApp() {
  console.log('🚀 [App] Starting TribeUp initialization...')
  
  try {
    console.log('✅ [App] Skipping cache corruption check, starting React app directly...')

    // Initialize error monitoring first (before React)
    initializeErrorMonitoring()

    // Initialize analytics (PostHog)
    // Check for user consent - default to true for now, can be enhanced with consent management
    const hasConsent = localStorage.getItem('analytics_consent') !== 'false'
    analyticsService.setConsent(hasConsent)
    analyticsService.initialize()

    // Apply stored theme before React mounts (avoid flash)
    try {
      const stored = localStorage.getItem('theme')
      if (stored === 'dark') {
        document.documentElement.classList.add('dark')
      }
    } catch {}
    
    // Start React app immediately
    const posthogOptions = {
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      defaults: '2025-05-24',
      capture_exceptions: true, // Enable automatic exception capture
      debug: import.meta.env.MODE === 'development',
    };

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <PostHogProvider
          apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
          options={posthogOptions}
        >
          <PostHogErrorBoundary
            fallback={({ error, componentStack }) => (
              <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center space-y-4">
                  <h2 className="text-2xl font-bold">Something went wrong</h2>
                  <p className="text-muted-foreground">
                    An error occurred. This has been reported and we'll look into it.
                  </p>
                  {import.meta.env.DEV && (
                    <details className="text-left text-xs bg-muted p-4 rounded">
                      <summary className="cursor-pointer mb-2">Error Details</summary>
                      <pre className="whitespace-pre-wrap break-words">
                        {error?.toString()}
                        {componentStack}
                      </pre>
                    </details>
                  )}
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            )}
          >
            <App />
          </PostHogErrorBoundary>
        </PostHogProvider>
      </React.StrictMode>,
    )
    
  } catch (error) {
    console.error('❌ [App] Initialization failed:', error)
    
    // Simple fallback without cache cleaning
    console.log('🚨 [App] Retrying app initialization...')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }
}

// Start the initialization
initializeApp()