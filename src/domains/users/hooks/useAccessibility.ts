import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';

interface AccessibilityPreferences {
  theme: 'light' | 'dark' | 'auto';
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  colorBlindFriendly: boolean;
}

export function useAccessibility() {
  const user = useAppStore((state) => state.user);
  const updateUserPreferences = useAppStore((state) => state.updateUserPreferences);

  // Function to announce messages to screen readers
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create or find the live region
    let liveRegion = document.getElementById('live-region');
    
    if (!liveRegion) {
      // Create a live region if it doesn't exist
      liveRegion = document.createElement('div');
      liveRegion.id = 'live-region';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    } else {
      // Update the aria-live attribute if needed
      liveRegion.setAttribute('aria-live', priority);
    }

    // Clear any existing message and add the new one
    liveRegion.textContent = '';
    
    // Use a small delay to ensure screen readers pick up the change
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = message;
      }
    }, 100);

    // Clear the message after a reasonable time
    setTimeout(() => {
      if (liveRegion && liveRegion.textContent === message) {
        liveRegion.textContent = '';
      }
    }, 5000);
  }, []);

  // Apply accessibility preferences to the document
  const applyPreferences = useCallback((prefs: AccessibilityPreferences) => {
    const root = document.documentElement;

    // Theme application
    root.classList.remove('light', 'dark');
    if (prefs.theme === 'dark') {
      root.classList.add('dark');
    } else if (prefs.theme === 'light') {
      root.classList.add('light');
    } else {
      // Auto - follow system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      root.classList.toggle('light', !prefersDark);
    }

    // High contrast
    root.classList.toggle('high-contrast', prefs.highContrast);
    
    // Large text
    root.classList.toggle('large-text', prefs.largeText);
    
    // Colorblind friendly
    root.classList.toggle('colorblind-friendly', prefs.colorBlindFriendly);
    
    // Reduced motion
    if (prefs.reducedMotion) {
      root.style.setProperty('--duration-fast', '0ms');
      root.style.setProperty('--duration-normal', '0ms');
      root.style.setProperty('--duration-slow', '0ms');
    } else {
      root.style.removeProperty('--duration-fast');
      root.style.removeProperty('--duration-normal');
      root.style.removeProperty('--duration-slow');
    }
  }, []);

  // Load and apply saved preferences
  useEffect(() => {
    if (user?.preferences) {
      applyPreferences({
        theme: user.preferences.theme,
        highContrast: user.preferences.highContrast,
        largeText: user.preferences.largeText,
        reducedMotion: user.preferences.reducedMotion,
        colorBlindFriendly: user.preferences.colorBlindFriendly,
      });
    } else {
      // Apply system preferences as defaults
      const root = document.documentElement;
      
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      }
      
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        root.classList.add('high-contrast');
      }
      
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        root.style.setProperty('--duration-fast', '0ms');
        root.style.setProperty('--duration-normal', '0ms');
        root.style.setProperty('--duration-slow', '0ms');
      }
    }
  }, [user?.preferences, applyPreferences]);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<AccessibilityPreferences>) => {
    if (user) {
      const newPrefs = { ...user.preferences, ...updates };
      updateUserPreferences(newPrefs);
      applyPreferences({
        theme: newPrefs.theme,
        highContrast: newPrefs.highContrast,
        largeText: newPrefs.largeText,
        reducedMotion: newPrefs.reducedMotion,
        colorBlindFriendly: newPrefs.colorBlindFriendly,
      });
    }
  }, [user, updateUserPreferences, applyPreferences]);

  // Focus management utilities
  const focusElement = useCallback((element: HTMLElement | null) => {
    if (element) {
      element.focus();
      announceToScreenReader(`Focused on ${element.getAttribute('aria-label') || element.textContent || 'element'}`);
    }
  }, [announceToScreenReader]);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return {
    preferences: user?.preferences,
    updatePreferences,
    applyPreferences,
    announceToScreenReader,
    focusElement,
    trapFocus,
  };
}