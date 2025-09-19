import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Disable service worker in development to fix loading issues
if ('serviceWorker' in navigator && (import.meta as any).env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration);
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
} else if ('serviceWorker' in navigator && (import.meta as any).env.DEV) {
  // In development, unregister all service workers to prevent caching issues
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('🧹 Unregistered service worker:', registration.scope);
      }
      
      // Clear all caches
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('🧹 Deleted cache:', cacheName);
      }
    } catch (error) {
      console.error('Error cleaning up service workers:', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
  