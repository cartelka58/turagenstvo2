import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      <span className="theme-icon">
        {isDark ? '☀️' : '🌙'}
      </span>
      <span className="theme-text">
        {isDark ? 'Светлая' : 'Тёмная'}
      </span>
    </button>
  );
};

export default ThemeToggle;