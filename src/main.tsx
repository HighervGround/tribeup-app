import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Performance optimization: Preload critical resources
if ((import.meta as any).env.PROD) {
  // Preload critical fonts and assets
  const preloadLink = document.createElement('link');
  preloadLink.rel = 'preload';
  preloadLink.as = 'style';
  preloadLink.href = '/src/index.css';
  document.head.appendChild(preloadLink);
}

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
  window.addEventListener('load', () => {
    // Log performance metrics
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    console.log('🚀 App loaded in:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
  });
}

createRoot(document.getElementById("root")!).render(<App />);
  