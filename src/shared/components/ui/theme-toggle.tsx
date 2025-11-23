import { useThemeStore } from '@/store/themeStore';
import { Button } from '@/shared/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import React from 'react';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className={className}
    >
      {theme === 'dark' ? (
        <Sun className="size-5" />
      ) : (
        <Moon className="size-5" />
      )}
    </Button>
  );
}
