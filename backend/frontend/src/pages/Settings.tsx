
import ThemeToggle from '../components/ThemeToggle';
import { useState, useEffect } from 'react';

const Settings = () => {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light'
  );

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb', marginBottom: '1.5rem' }}>Settings</h2>
      <p className="text-gray-700 mb-4">Toggle between light and dark mode for the dashboard below.</p>
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
    </div>
  );
};

export default Settings;
