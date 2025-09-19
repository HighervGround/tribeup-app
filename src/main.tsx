import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker with cache busting
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // In development, always clear old service workers and caches
      if ((import.meta as any).env.DEV) {
        console.log('🧹 Development mode: Clearing old service workers and caches');
        
        // Unregister all existing service workers
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        
        // Clear all caches
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }
      
      // Register service worker with cache busting parameter
      const swUrl = `/sw.js?v=${Date.now()}`;
      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
        updateViaCache: 'none' // Don't cache the service worker file itself
      });
      
      console.log('✅ Service Worker registered:', registration);
      
      // Force update check in development
      if ((import.meta as any).env.DEV) {
        registration.update();
      }
      
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
  