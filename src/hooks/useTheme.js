import { useState, useEffect } from 'react';
import { Chart as ChartJS } from 'chart.js';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  const isLight = theme === 'light';

  useEffect(() => {
    document.body.classList.toggle('light-mode', isLight);
    localStorage.setItem('theme', theme);

    if (ChartJS && ChartJS.defaults) {
      ChartJS.defaults.color = isLight ? '#1d1d1f' : '#f5f5f7';
      ChartJS.defaults.borderColor = isLight
        ? 'rgba(0, 0, 0, 0.08)'
        : 'rgba(255, 255, 255, 0.12)';
    }
  }, [theme, isLight]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, isLight, toggleTheme };
}
