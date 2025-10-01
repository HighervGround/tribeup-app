import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { CacheCorruptionDetector } from './utils/cacheCorruptionDetector'

// Performance optimization: In production, CSS is bundled into main assets automatically
// No manual preloading needed as Vite handles this optimization

// Register service worker properly - only in production
if ('serviceWorker' in navigator && (import.meta as any).env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });
      
      console.log('✅ Service Worker registered:', registration);
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, prompt user to refresh
              if (confirm('New version available! Refresh to update?')) {
                window.location.reload();
              }
            }
          });
        }
      });
      
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
}

// Performance monitoring in production
if ((import.meta as any).env.PROD && 'performance' in window) {
  const startTime = performance.now();
  window.addEventListener('load', () => {
    const loadTime = performance.now() - startTime;
    console.log(`🚀 App loaded in: ${loadTime.toFixed(2)} ms`);
    console.log(`🔄 DEPLOYMENT VERSION: v2.1 - ${new Date().toISOString()}`);
  });
}

// Initialize app directly - disable cache corruption detector temporarily
async function initializeApp() {
  console.log('🚀 [App] Starting TribeUp initialization...');
  
  try {
    console.log('✅ [App] Skipping cache corruption check, starting React app directly...');
    
    // Start React app immediately
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    
  } catch (error) {
    console.error('❌ [App] Initialization failed:', error);
    
    // Simple fallback without cache cleaning
    console.log('🚨 [App] Retrying app initialization...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

// Start the initialization
initializeApp();