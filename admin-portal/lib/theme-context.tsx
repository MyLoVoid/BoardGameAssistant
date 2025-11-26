'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme from localStorage and apply immediately
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('bgai-admin-theme') as Theme | null;
    const initialTheme = stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
    setThemeState(initialTheme);

    // Apply theme immediately
    const root = document.documentElement;
    if (initialTheme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setEffectiveTheme(isDark ? 'dark' : 'light');
      root.classList.toggle('dark', isDark);
    } else {
      const isDark = initialTheme === 'dark';
      setEffectiveTheme(isDark ? 'dark' : 'light');
      root.classList.toggle('dark', isDark);
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if currently in system mode
      setThemeState(currentTheme => {
        if (currentTheme === 'system') {
          const isDark = e.matches;
          setEffectiveTheme(isDark ? 'dark' : 'light');
          document.documentElement.classList.toggle('dark', isDark);
        }
        return currentTheme;
      });
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setEffectiveTheme(isDark ? 'dark' : 'light');
      root.classList.toggle('dark', isDark);
    } else {
      const isDark = theme === 'dark';
      setEffectiveTheme(isDark ? 'dark' : 'light');
      root.classList.toggle('dark', isDark);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('bgai-admin-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
