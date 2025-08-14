import React, { useContext } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ColorModeContext } from '../theme';
import { useTheme } from '@mui/material/styles';

const ThemeToggle = () => {
  const colorMode = useContext(ColorModeContext);
  const muiTheme = useTheme();
  const theme = muiTheme.palette.mode;
  return (
    <button
      onClick={colorMode.toggleColorMode}
      className="p-2 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-200"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggle;
