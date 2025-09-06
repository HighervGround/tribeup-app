import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useKeyboardNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Screen reader announcement
  const announceToScreenReader = useCallback((message: string) => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;
    document.body.appendChild(liveRegion);
    
    setTimeout(() => {
      if (document.body.contains(liveRegion)) {
        document.body.removeChild(liveRegion);
      }
    }, 1000);
  }, []);

  // Focus management
  const manageFocus = useCallback((elementId?: string) => {
    const element = elementId 
      ? document.getElementById(elementId)
      : document.getElementById('main-content');
    
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Navigation with announcements
  const navigateWithAnnouncement = useCallback((path: string, announcement?: string) => {
    navigate(path);
    
    const message = announcement || `Navigating to ${path.replace('/', '')} page`;
    announceToScreenReader(message);
    
    // Focus management after navigation
    setTimeout(() => manageFocus(), 150);
  }, [navigate, announceToScreenReader, manageFocus]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Global keyboard shortcuts
      if (event.altKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            navigateWithAnnouncement('/', 'Navigating to home');
            break;
          case '2':
            event.preventDefault();
            navigateWithAnnouncement('/search', 'Navigating to search');
            break;
          case '3':
            event.preventDefault();
            navigateWithAnnouncement('/create', 'Navigating to create game');
            break;
          case '4':
            event.preventDefault();
            navigateWithAnnouncement('/profile', 'Navigating to profile');
            break;
          case 'h':
            event.preventDefault();
            navigateWithAnnouncement('/', 'Navigating to home');
            break;
          case 's':
            event.preventDefault();
            navigateWithAnnouncement('/search', 'Navigating to search');
            break;
          case 'c':
            event.preventDefault();
            navigateWithAnnouncement('/create', 'Navigating to create game');
            break;
          case 'p':
            event.preventDefault();
            navigateWithAnnouncement('/profile', 'Navigating to profile');
            break;
        }
      }
      
      // Escape key to go back
      if (event.key === 'Escape') {
        event.preventDefault();
        
        // Determine back navigation based on current path
        const path = location.pathname;
        if (path === '/') return; // Already at home
        
        if (path.startsWith('/game/')) {
          navigateWithAnnouncement('/', 'Returning to home');
        } else if (path.startsWith('/chat/')) {
          // Go back to game details if coming from game chat
          const pathParts = path.split('/');
          if (pathParts[2] === 'game') {
            navigateWithAnnouncement(`/game/${pathParts[3]}`, 'Returning to game details');
          } else {
            navigateWithAnnouncement('/', 'Returning to home');
          }
        } else if (path === '/settings/accessibility') {
          navigateWithAnnouncement('/settings', 'Returning to settings');
        } else if (path.startsWith('/settings')) {
          navigateWithAnnouncement('/profile', 'Returning to profile');
        } else {
          navigateWithAnnouncement('/', 'Returning to home');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname, navigateWithAnnouncement]);

  return {
    announceToScreenReader,
    manageFocus,
    navigateWithAnnouncement,
  };
}