declare global {
  interface Window {
    dataLayer: Record<string, any>[];
    gtag?: (...args: any[]) => void;
  }
}

const env = (import.meta as any).env;
const measurementId: string | undefined = env.VITE_GA_MEASUREMENT_ID;
const analyticsDebug: boolean = env.VITE_GA_DEBUG === 'true';

let isInitialized = false;

const log = (...args: any[]) => {
  if (analyticsDebug && typeof console !== 'undefined') {
    console.info('[Analytics]', ...args);
  }
};

const ensureDataLayer = () => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  if (!window.gtag) {
    window.gtag = function gtag(...gtagArgs: any[]) {
      window.dataLayer.push(gtagArgs);
    };
  }
};

export const initializeGoogleAnalytics = () => {
  if (isInitialized || typeof window === 'undefined') {
    return;
  }
  if (!measurementId) {
    log('Skipping initialization because VITE_GA_MEASUREMENT_ID is not set.');
    return;
  }

  ensureDataLayer();

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"]`
  );

  if (!existingScript) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
    log('Injected gtag script.');
  }

  window.gtag?.('js', new Date());
  window.gtag?.('config', measurementId, {
    send_page_view: false,
    anonymize_ip: true
  });

  isInitialized = true;
  log('Google Analytics initialized with ID', measurementId);
};

export const trackPageView = (path: string, title?: string) => {
  if (!isInitialized || !measurementId || typeof window === 'undefined') {
    return;
  }

  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href
  });
  log('Tracked page view', path);
};

export const trackEvent = (
  action: string,
  params: Record<string, string | number | boolean | undefined> = {}
) => {
  if (!isInitialized || !measurementId || typeof window === 'undefined') {
    return;
  }

  window.gtag?.('event', action, params);
  log('Tracked event', action, params);
};

export const identifyUser = (userId?: string) => {
  if (!isInitialized || !measurementId || typeof window === 'undefined' || !userId) {
    return;
  }

  window.gtag?.('config', measurementId, {
    user_id: userId
  });
  log('Associated user with analytics', userId);
};

export const analyticsReady = () => isInitialized;
