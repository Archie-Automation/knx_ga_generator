import { useState, useEffect } from 'react';

const getDarkModeFromStorage = (): boolean => {
  try {
    const stored = localStorage.getItem('knx-dark-mode');
    if (stored === null) {
      // Check system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return stored === 'true';
  } catch {
    return false;
  }
};

const saveDarkModeToStorage = (isDark: boolean): void => {
  try {
    localStorage.setItem('knx-dark-mode', String(isDark));
  } catch {
    // Ignore storage errors
  }
};

export const useDarkMode = () => {
  const [isDark, setIsDarkState] = useState<boolean>(getDarkModeFromStorage());
  
  useEffect(() => {
    // Sync with localStorage and system preference on mount
    setIsDarkState(getDarkModeFromStorage());
    
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem('knx-dark-mode');
      if (stored === null) {
        setIsDarkState(e.matches);
        applyDarkMode(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  useEffect(() => {
    applyDarkMode(isDark);
  }, [isDark]);
  
  const setIsDark = (newIsDark: boolean) => {
    saveDarkModeToStorage(newIsDark);
    setIsDarkState(newIsDark);
    applyDarkMode(newIsDark);
  };
  
  return { isDark, setIsDark };
};

const applyDarkMode = (isDark: boolean) => {
  if (isDark) {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }
};

export const DarkModeToggle = () => {
  const { isDark, setIsDark } = useDarkMode();

  return (
    <button
      className="button ghost dark-mode-toggle"
      onClick={() => setIsDark(!isDark)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dark-mode-icon"
        >
          <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="9" cy="9" r="4" fill="currentColor" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="dark-mode-icon"
        >
          <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      )}
    </button>
  );
};


































