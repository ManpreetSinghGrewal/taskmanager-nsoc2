import React from 'react';

export default function Header({ isLight, onToggleTheme }) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-monogram" aria-hidden="true">&#10003;</div>
        <div className="brand-text">
          <h1>Task Manager</h1>
          <p className="app-subtitle">Productivity Dashboard</p>
        </div>
      </div>
      <button
        id="theme-toggle"
        className="theme-btn"
        type="button"
        onClick={onToggleTheme}
        aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
        aria-pressed={isLight}
      >
        {isLight ? 'Dark mode' : 'Light mode'}
      </button>
    </header>
  );
}
