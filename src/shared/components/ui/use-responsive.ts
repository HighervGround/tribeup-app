import { useState, useEffect } from 'react';

export type ScreenSize = 'mobile' | 'tablet' | 'desktop' | 'desktop-large';

interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  desktopLarge: number;
}

const breakpoints: ResponsiveBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  desktopLarge: 1920,
};

export function useResponsive() {
  const [screenSize, setScreenSize] = useState<ScreenSize>('mobile');
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      setDimensions({
        width,
        height: window.innerHeight,
      });

      if (width >= breakpoints.desktopLarge) {
        setScreenSize('desktop-large');
      } else if (width >= breakpoints.desktop) {
        setScreenSize('desktop');
      } else if (width >= breakpoints.tablet) {
        setScreenSize('tablet');
      } else if (width >= breakpoints.mobile) {
        setScreenSize('tablet');
      } else {
        setScreenSize('mobile');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return {
    screenSize,
    dimensions,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop' || screenSize === 'desktop-large',
    isDesktopLarge: screenSize === 'desktop-large',
    breakpoints,
  };
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    
    if (media.addEventListener) {
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query]);

  return matches;
}

// Accessibility hooks
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export function useHighContrast(): boolean {
  return useMediaQuery('(prefers-contrast: high)');
}

export function useDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

export function useColorBlindFriendly(): boolean {
  // This would ideally be a user preference setting
  // For now, we'll return false but this could be expanded
  return false;
}