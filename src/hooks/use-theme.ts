import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

// Use 'jb_theme_v2' key so old auto-detected dark value is ignored
const THEME_KEY = 'jb_theme_v2';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme;
    if (saved === 'light' || saved === 'dark') return saved;
    // Always default to light — dark mode not fully supported yet
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return { theme, toggleTheme };
}
