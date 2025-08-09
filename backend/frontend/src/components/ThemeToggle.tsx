import React from 'react';

const ThemeToggle = ({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) => {
  return (
    <button
      className="w-full mt-4 py-2 px-4 rounded-lg font-semibold transition bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100"
      onClick={toggleTheme}
    >
      {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
    </button>
  );
};

export default ThemeToggle;
