import { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
  disabled?: boolean;
  global?: boolean; // Whether this shortcut works globally or only in specific contexts
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  showToast?: boolean;
  context?: string; // Current screen context for context-specific shortcuts
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, showToast = false, context } = options;
  const navigate = useNavigate();
  const location = useLocation();
  const shortcutsRef = useRef<KeyboardShortcut[]>([]);
  const isHelpVisibleRef = useRef(false);

  // Global navigation shortcuts
  const globalShortcuts: KeyboardShortcut[] = [
    {
      key: '1',
      description: 'Go to Home',
      action: () => navigate('/'),
      global: true
    },
    {
      key: '2',
      description: 'Go to Search',
      action: () => navigate('/search'),
      global: true
    },
    {
      key: '3',
      description: 'Create Game',
      action: () => navigate('/create'),
      global: true
    },
    {
      key: '4',
      description: 'Go to Profile',
      action: () => navigate('/profile'),
      global: true
    },
    {
      key: 'c',
      description: 'Create new game',
      action: () => {
        navigate('/create');
        if (showToast) {
          toast.success('Opening game creation');
        }
      },
      global: true
    },
    {
      key: 'k',
      ctrlKey: true,
      description: 'Quick search',
      action: () => {
        navigate('/search');
        // Focus search input after navigation
        setTimeout(() => {
          const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
        if (showToast) {
          toast.success('Quick search opened');
        }
      },
      global: true
    },
    {
      key: 'k',
      metaKey: true, // For Mac users
      description: 'Quick search (Mac)',
      action: () => {
        navigate('/search');
        setTimeout(() => {
          const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
        if (showToast) {
          toast.success('Quick search opened');
        }
      },
      global: true
    },
    {
      key: 's',
      description: 'Go to Settings',
      action: () => navigate('/settings'),
      global: true
    },
    {
      key: 'h',
      description: 'Go to Home',
      action: () => navigate('/'),
      global: true
    },
    {
      key: 'Escape',
      description: 'Go back',
      action: () => {
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/');
        }
      },
      global: true
    },
    {
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts',
      action: () => {
        showKeyboardShortcuts();
      },
      global: true
    },
    {
      key: 'r',
      ctrlKey: true,
      description: 'Refresh page',
      action: () => {
        window.location.reload();
      },
      global: true
    },
    {
      key: 'r',
      metaKey: true, // For Mac users
      description: 'Refresh page (Mac)',
      action: () => {
        window.location.reload();
      },
      global: true
    }
  ];

  // Context-specific shortcuts
  const contextShortcuts: Record<string, KeyboardShortcut[]> = {
    // Home screen shortcuts
    home: [
      {
        key: 'f',
        description: 'Filter games',
        action: () => {
          const filterButton = document.querySelector('[aria-label*="filter" i], [data-testid="filter-button"]') as HTMLElement;
          if (filterButton) {
            filterButton.click();
          }
        }
      },
      {
        key: 'r',
        description: 'Refresh games list',
        action: () => {
          // Trigger pull to refresh or reload games
          const refreshButton = document.querySelector('[aria-label*="refresh" i], [data-testid="refresh-button"]') as HTMLElement;
          if (refreshButton) {
            refreshButton.click();
          }
          if (showToast) {
            toast.success('Refreshing games...');
          }
        }
      }
    ],
    
    // Game details shortcuts
    game: [
      {
        key: 'j',
        description: 'Join/Leave game',
        action: () => {
          const joinButton = document.querySelector('button:has-text("Join"), button:has-text("Leave"), [data-action="join-game"]') as HTMLElement;
          if (joinButton) {
            joinButton.click();
          }
        }
      },
      {
        key: 'm',
        description: 'Open group chat',
        action: () => {
          const chatButton = document.querySelector('button:has-text("Group Chat"), [data-action="group-chat"]') as HTMLElement;
          if (chatButton) {
            chatButton.click();
          }
        }
      },
      {
        key: 'l',
        description: 'Get directions',
        action: () => {
          const directionsButton = document.querySelector('button:has-text("Get Directions"), [data-action="directions"]') as HTMLElement;
          if (directionsButton) {
            directionsButton.click();
          }
        }
      },
      {
        key: 'u',
        description: 'Share game',
        action: () => {
          const shareButton = document.querySelector('[aria-label*="share" i], [data-action="share"]') as HTMLElement;
          if (shareButton) {
            shareButton.click();
          }
        }
      }
    ],
    
    // Chat shortcuts
    chat: [
      {
        key: 'Enter',
        description: 'Send message',
        action: () => {
          const sendButton = document.querySelector('button[type="submit"], [data-action="send-message"]') as HTMLElement;
          if (sendButton) {
            sendButton.click();
          }
        }
      },
      {
        key: 'Enter',
        ctrlKey: true,
        description: 'Add line break',
        action: () => {
          const messageInput = document.querySelector('input[placeholder*="message" i], textarea[placeholder*="message" i]') as HTMLInputElement | HTMLTextAreaElement;
          if (messageInput) {
            const currentValue = messageInput.value;
            const cursorPosition = messageInput.selectionStart || 0;
            const newValue = currentValue.slice(0, cursorPosition) + '\n' + currentValue.slice(cursorPosition);
            messageInput.value = newValue;
            messageInput.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
          }
        }
      },
      {
        key: 'i',
        description: 'View user info',
        action: () => {
          const userButton = document.querySelector('[data-action="view-profile"]') as HTMLElement;
          if (userButton) {
            userButton.click();
          }
        }
      }
    ],
    
    // Search shortcuts
    search: [
      {
        key: 'Enter',
        description: 'Search',
        action: () => {
          const searchForm = document.querySelector('form') as HTMLFormElement;
          if (searchForm) {
            searchForm.submit();
          }
        }
      },
      {
        key: 'ArrowDown',
        description: 'Focus first result',
        action: () => {
          const firstResult = document.querySelector('[data-search-result]:first-child') as HTMLElement;
          if (firstResult) {
            firstResult.focus();
          }
        }
      }
    ],
    
    // Create game shortcuts
    create: [
      {
        key: 'Enter',
        ctrlKey: true,
        description: 'Create game',
        action: () => {
          const createButton = document.querySelector('button[type="submit"], [data-action="create-game"]') as HTMLElement;
          if (createButton && !createButton.hasAttribute('disabled')) {
            createButton.click();
          }
        }
      },
      {
        key: 'Tab',
        description: 'Next field',
        action: () => {
          // Let browser handle default tab behavior
        }
      }
    ]
  };

  // Combine shortcuts based on context
  const getAllShortcuts = useCallback(() => {
    const currentContextShortcuts = context ? contextShortcuts[context] || [] : [];
    return [...globalShortcuts, ...currentContextShortcuts];
  }, [context]);

  // Show keyboard shortcuts help
  const showKeyboardShortcuts = () => {
    if (isHelpVisibleRef.current) return;
    
    isHelpVisibleRef.current = true;
    const shortcuts = getAllShortcuts();
    
    // Create help modal content
    const helpContent = shortcuts
      .filter(shortcut => shortcut.description && !shortcut.disabled)
      .map(shortcut => {
        const keys = [];
        if (shortcut.ctrlKey) keys.push('Ctrl');
        if (shortcut.metaKey) keys.push('Cmd');
        if (shortcut.shiftKey) keys.push('Shift');
        if (shortcut.altKey) keys.push('Alt');
        keys.push(shortcut.key === ' ' ? 'Space' : shortcut.key);
        
        return `${keys.join(' + ')}: ${shortcut.description}`;
      })
      .join('\n');

    // Use a toast for quick display (in a real app, you might want a proper modal)
    toast.info('Keyboard Shortcuts', {
      description: `Available shortcuts:\n${helpContent}`,
      duration: 10000,
      action: {
        label: 'Close',
        onClick: () => {
          isHelpVisibleRef.current = false;
        }
      }
    });

    // Reset help visibility after toast duration
    setTimeout(() => {
      isHelpVisibleRef.current = false;
    }, 10000);
  };

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't handle shortcuts when user is typing in input fields
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.contentEditable === 'true' ||
                        target.closest('[contenteditable="true"]');

    // Allow some shortcuts even in input fields
    const allowInInputs = ['Escape', 'Enter'];
    const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
    
    if (isInputField && !allowInInputs.includes(event.key) && !hasModifier) {
      return;
    }

    const shortcuts = getAllShortcuts();
    
    for (const shortcut of shortcuts) {
      if (shortcut.disabled) continue;
      
      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
      const metaMatches = !!shortcut.metaKey === event.metaKey;
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
      const altMatches = !!shortcut.altKey === event.altKey;
      
      if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
        event.preventDefault();
        event.stopPropagation();
        
        try {
          shortcut.action();
        } catch (error) {
          console.error('Error executing keyboard shortcut:', error);
          if (showToast) {
            toast.error('Shortcut failed to execute');
          }
        }
        break;
      }
    }
  }, [enabled, getAllShortcuts, showToast]);

  // Register keyboard event listeners
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  // Update shortcuts reference
  useEffect(() => {
    shortcutsRef.current = getAllShortcuts();
  }, [getAllShortcuts]);

  // Return utility functions
  return {
    shortcuts: shortcutsRef.current,
    showHelp: showKeyboardShortcuts,
    isEnabled: enabled
  };
}

// Hook for components to add custom shortcuts
export function useCustomShortcuts(customShortcuts: KeyboardShortcut[], enabled = true) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.contentEditable === 'true';

    // Skip if in input field (unless it's a special key)
    if (isInputField && !['Escape', 'Enter'].includes(event.key)) {
      return;
    }

    for (const shortcut of customShortcuts) {
      if (shortcut.disabled) continue;
      
      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
      const metaMatches = !!shortcut.metaKey === event.metaKey;
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
      const altMatches = !!shortcut.altKey === event.altKey;
      
      if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
        event.preventDefault();
        event.stopPropagation();
        
        try {
          shortcut.action();
        } catch (error) {
          console.error('Error executing custom shortcut:', error);
        }
        break;
      }
    }
  }, [customShortcuts, enabled]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}