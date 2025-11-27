'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark'; // Still part of the context interface
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize theme from localStorage
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem('bgai-admin-theme') as Theme | null;
    return stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
  });

  // Calculate effectiveTheme based on theme and system preference
  const effectiveTheme = React.useMemo<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'; // Default for SSR
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme === 'dark' ? 'dark' : 'light';
  }, [theme]); // Recalculate if theme changes


  // Apply theme to document.documentElement whenever effectiveTheme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark'); // Clear existing classes
    root.classList.add(effectiveTheme);
    // Also save to local storage here as effectiveTheme might be initialised
    // from local storage as part of initial setup, and we need this to
    // be persistent
    localStorage.setItem('bgai-admin-theme', theme);
  }, [effectiveTheme, theme]); // Also depend on theme for localStorage.setItem


  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // If current theme is system, force a re-evaluation of effectiveTheme
      // by setting the theme state, even if it's to the same value.
      // This will trigger the useMemo and the subsequent useEffect.
      if (theme === 'system') {
        setThemeState('system'); // Trigger re-render to update effectiveTheme
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]); // Depend on theme to ensure handleChange always has the latest theme value

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
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
