import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';

interface DeepLink {
  path: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
  state?: any;
}

interface ShareableLink {
  title: string;
  description: string;
  url: string;
  image?: string;
}

export function useDeepLinks() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { user } = useAppStore();

  // Generate app URLs for sharing
  const generateGameUrl = useCallback((gameId: string, options?: { 
    utm_source?: string; 
    utm_medium?: string; 
    utm_campaign?: string;
  }) => {
    const baseUrl = window.location.origin;
    const url = new URL(`${baseUrl}/public/game/${gameId}`);
    
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });
    }
    
    return url.toString();
  }, []);

  const generateChatUrl = useCallback((type: 'game' | 'direct', id: string, options?: {
    message?: string;
    utm_source?: string;
  }) => {
    const baseUrl = window.location.origin;
    const url = new URL(`${baseUrl}/chat/${type}/${id}`);
    
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });
    }
    
    return url.toString();
  }, []);

  const generateUserUrl = useCallback((userId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/user/${userId}`;
  }, []);

  // Share game with native sharing or clipboard
  const shareGame = useCallback(async (gameData: {
    id: string;
    title: string;
    sport: string;
    location: string;
    date: string;
    time: string;
  }) => {
    const gameUrl = generateGameUrl(gameData.id, {
      utm_source: 'app_share',
      utm_medium: 'native_share',
      utm_campaign: 'game_invitation'
    });

    const shareData: ShareableLink = {
      title: `Join me for ${gameData.title}!`,
      description: `${gameData.sport} game at ${gameData.location} on ${gameData.date} at ${gameData.time}. Tap to join!`,
      url: gameUrl
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Activity shared successfully!');
        return true;
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(gameUrl);
        toast.success('Activity link copied to clipboard!', {
          description: 'Share with your friends',
          action: {
            label: 'Share again',
            onClick: () => shareGame(gameData)
          }
        });
        return true;
      }
    } catch (error) {
      console.error('Error sharing activity:', error);
      toast.error('Failed to share activity');
      return false;
    }
  }, [generateGameUrl]);

  // Share user profile
  const shareProfile = useCallback(async (userData: {
    id: string;
    name: string;
    rating?: number;
  }) => {
    const profileUrl = generateUserUrl(userData.id);
    const shareData: ShareableLink = {
      title: `Check out ${userData.name}'s TribeUp profile`,
      description: `${userData.name}${userData.rating ? ` (${userData.rating}⭐)` : ''} is on TribeUp! Connect and play sports together.`,
      url: profileUrl
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Profile shared successfully!');
        return true;
      } else {
        await navigator.clipboard.writeText(profileUrl);
        toast.success('Profile link copied to clipboard!');
        return true;
      }
    } catch (error) {
      console.error('Error sharing profile:', error);
      toast.error('Failed to share profile');
      return false;
    }
  }, [generateUserUrl]);

  // Navigate with deep link support
  const navigateToGame = useCallback((gameId: string, state?: any) => {
    navigate(`/game/${gameId}`, { state });
  }, [navigate]);

  const navigateToChat = useCallback((type: 'game' | 'direct', id: string, state?: any) => {
    navigate(`/chat/${type}/${id}`, { state });
  }, [navigate]);

  const navigateToUser = useCallback((userId: string, state?: any) => {
    // Route normalization: if user taps their own card, redirect to own profile route
    // Use current user ID from store (synchronous check)
    const currentUserId = user?.id;
    
    if (userId && userId === currentUserId) {
      navigate('/app/profile/me', { state });
    } else {
      navigate(`/app/user/${userId}`, { state });
    }
  }, [navigate, user?.id]);

  // Handle incoming deep links (when app is opened via URL)
  const handleIncomingDeepLink = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');

    // Track analytics for deep link usage
    if (utmSource || utmMedium || utmCampaign) {
      console.log('Deep link opened with UTM parameters:', {
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
        path: location.pathname
      });

      // In a real app, you'd send this to your analytics service
      // analytics.track('deep_link_opened', { utmSource, utmMedium, utmCampaign, path: location.pathname });
    }

    // Handle specific deep link actions
    if (location.pathname.startsWith('/game/')) {
      const gameId = params.gameId;
      if (gameId && utmCampaign === 'game_invitation') {
        toast.success('Welcome to the activity!', {
          description: 'You were invited to join this activity'
        });
      }
    }

    if (location.pathname.startsWith('/chat/')) {
      const message = searchParams.get('message');
      if (message) {
        // Pre-fill message input if provided
        setTimeout(() => {
          const messageInput = document.querySelector('input[placeholder*="message" i]') as HTMLInputElement;
          if (messageInput) {
            messageInput.value = decodeURIComponent(message);
            messageInput.focus();
          }
        }, 500);
      }
    }
  }, [location, params]);

  // Generate meta tags for social sharing (for SSR or when sharing externally)
  const generateMetaTags = useCallback((data: ShareableLink) => {
    return {
      'og:title': data.title,
      'og:description': data.description,
      'og:url': data.url,
      'og:image': data.image || `${window.location.origin}/og-image.png`,
      'og:type': 'website',
      'twitter:card': 'summary_large_image',
      'twitter:title': data.title,
      'twitter:description': data.description,
      'twitter:image': data.image || `${window.location.origin}/og-image.png`
    };
  }, []);

  // Copy current URL to clipboard
  const copyCurrentUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
      return true;
    } catch (error) {
      console.error('Error copying URL:', error);
      toast.error('Failed to copy link');
      return false;
    }
  }, []);

  // Get current route context for analytics
  const getCurrentContext = useCallback(() => {
    const path = location.pathname;
    
    if (path === '/') return 'home';
    if (path === '/search') return 'search';
    if (path === '/create') return 'create';
    if (path === '/profile') return 'profile';
    if (path.startsWith('/game/')) return 'game';
    if (path.startsWith('/chat/')) return 'chat';
    if (path.startsWith('/user/')) return 'user_profile';
    if (path.startsWith('/settings')) return 'settings';
    
    return 'unknown';
  }, [location.pathname]);

  // Handle deep link on app load/route change
  useEffect(() => {
    handleIncomingDeepLink();
  }, [handleIncomingDeepLink]);

  // Return all utilities
  return {
    // URL generators
    generateGameUrl,
    generateChatUrl,
    generateUserUrl,
    
    // Sharing functions
    shareGame,
    shareProfile,
    copyCurrentUrl,
    
    // Navigation functions
    navigateToGame,
    navigateToChat,
    navigateToUser,
    
    // Utilities
    generateMetaTags,
    getCurrentContext,
    
    // Current route info
    currentPath: location.pathname,
    currentSearch: location.search,
    currentParams: params,
    currentState: location.state
  };
}

// Hook for handling URL state and query parameters
export function useUrlState<T = any>(key: string, defaultValue?: T) {
  const location = useLocation();
  const navigate = useNavigate();

  const getValue = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    const value = searchParams.get(key);
    
    if (value === null) return defaultValue;
    
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }, [location.search, key, defaultValue]);

  const setValue = useCallback((value: T) => {
    const searchParams = new URLSearchParams(location.search);
    
    if (value === undefined || value === null) {
      searchParams.delete(key);
    } else {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      searchParams.set(key, stringValue);
    }
    
    const newSearch = searchParams.toString();
    const newUrl = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
    
    navigate(newUrl, { replace: true, state: location.state });
  }, [location, navigate, key]);

  return [getValue(), setValue] as const;
}