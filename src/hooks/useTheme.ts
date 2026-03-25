import { useLocalStorage } from './useLocalStorage';
import { useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('ribercred_theme', 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return { theme, toggleTheme };
}
