import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_KEY = 'theme';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: ((): Theme => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    }
    return 'light';
  })(),
  setTheme: (theme) => {
    set({ theme });
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
    applyTheme(theme);
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));

// Initialize theme on first import (for SSR / early load in SPA) if window available
if (typeof window !== 'undefined') {
  const current = localStorage.getItem(THEME_KEY) as Theme | null;
  if (current) applyTheme(current);
}
