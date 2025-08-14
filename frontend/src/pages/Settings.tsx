import React, { useState, useEffect, useContext } from 'react';
import { ColorModeContext } from '../theme';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  LogOut, 
  Moon, 
  Sun, 
  Settings as SettingsIcon,
  Bell,
  Shield,
  Palette,
  Globe,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

interface UserInfo {
  name?: string;
  email?: string;
  picture?: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const colorMode = useContext(ColorModeContext);
  const muiTheme = useTheme();
  const [theme, setTheme] = useState(
    (localStorage.getItem('theme') || 'light')
  );
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  // Sync theme state with Material-UI theme
  useEffect(() => {
    setTheme(muiTheme.palette.mode);
  }, [muiTheme.palette.mode]);

  useEffect(() => {
    // Load user info
    const userData = localStorage.getItem('user');
    if (userData) {
      setUserInfo(JSON.parse(userData));
    }

    // Load other settings
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }

    const savedAutoSave = localStorage.getItem('autoSave');
    if (savedAutoSave) {
      setAutoSave(JSON.parse(savedAutoSave));
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };



  const toggleNotifications = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('notifications', JSON.stringify(newValue));
  };

  const toggleAutoSave = () => {
    const newValue = !autoSave;
    setAutoSave(newValue);
    localStorage.setItem('autoSave', JSON.stringify(newValue));
  };

  const SettingCard: React.FC<{ 
    title: string; 
    children: React.ReactNode; 
    icon?: React.ReactNode;
    className?: string;
  }> = ({ title, children, icon, className = '' }) => (
    <div className={`bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm dark:backdrop-blur-none rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 transition-all duration-300 hover:shadow-2xl ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        {icon && <div className="text-gray-600 dark:text-gray-400">{icon}</div>}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );

  const ToggleSwitch: React.FC<{ 
    enabled: boolean; 
    onToggle: () => void; 
    label: string;
    description?: string;
  }> = ({ enabled, onToggle, label, description }) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="font-medium text-gray-900 dark:text-white">{label}</div>
        {description && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</div>
        )}
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
          enabled 
            ? 'bg-gray-700 dark:bg-gray-600' 
            : 'bg-gray-200 dark:bg-gray-600'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#c6ffdd] via-[#fbd786] to-[#f7797d] dark:from-gray-900 dark:to-gray-800 p-6 pl-24 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="text-gray-600 dark:text-gray-400" size={28} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account preferences and application settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Section */}
          <div className="lg:col-span-2">
            <SettingCard title="Account & Profile" icon={<User size={20} />}>
              {userInfo ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl">
                    <div className="relative">
                      <img 
                        src={userInfo.picture || 'https://via.placeholder.com/64'} 
                        alt="Profile" 
                        className="w-16 h-16 rounded-full ring-4 ring-white dark:ring-gray-600 shadow-lg"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-gray-600 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User size={16} className="text-gray-500 dark:text-gray-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {userInfo.name || 'Unknown User'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {userInfo.email || 'No email provided'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 group"
                  >
                    <LogOut size={18} className="group-hover:rotate-6 transition-transform duration-200" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No user information available</p>
                </div>
              )}
            </SettingCard>

            {/* App Preferences */}
            <SettingCard title="Application Settings" icon={<SettingsIcon size={20} />} className="mt-6">
              <div className="space-y-6">
                <ToggleSwitch
                  enabled={notifications}
                  onToggle={toggleNotifications}
                  label="Desktop Notifications"
                  description="Get notified about important task deadlines and updates"
                />
                
                <hr className="border-gray-200 dark:border-gray-700" />
                
                <ToggleSwitch
                  enabled={autoSave}
                  onToggle={toggleAutoSave}
                  label="Auto-save Changes"
                  description="Automatically save your work as you make changes"
                />
              </div>
            </SettingCard>
          </div>

          {/* Appearance & Quick Settings */}
          <div className="space-y-6">
            {/* Theme Settings */}
            <SettingCard title="Appearance" icon={<Palette size={20} />}>
              <div className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Choose your preferred theme for the application
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { 
                      if (theme !== 'light') {
                        colorMode.toggleColorMode();
                      }
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 group ${
                      theme === 'light'
                        ? 'border-gray-700 bg-gray-100 dark:bg-gray-800'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Sun size={24} className={`mx-auto mb-2 ${
                      theme === 'light' 
                        ? 'text-gray-700 dark:text-gray-300' 
                        : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`} />
                    <div className={`text-sm font-medium ${
                      theme === 'light' 
                        ? 'text-gray-900 dark:text-gray-100' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      Light
                    </div>
                  </button>
                  
                  <button
                    onClick={() => { 
                      if (theme !== 'dark') {
                        colorMode.toggleColorMode();
                      }
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 group ${
                      theme === 'dark'
                        ? 'border-gray-700 bg-gray-100 dark:bg-gray-800'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Moon size={24} className={`mx-auto mb-2 ${
                      theme === 'dark' 
                        ? 'text-gray-700 dark:text-gray-300' 
                        : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`} />
                    <div className={`text-sm font-medium ${
                      theme === 'dark' 
                        ? 'text-gray-900 dark:text-gray-100' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      Dark
                    </div>
                  </button>
                </div>
              </div>
            </SettingCard>
            {/* App Info */}
            <SettingCard title="App Information" icon={<HelpCircle size={20} />}>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Version</span>
                  <span className="font-medium text-gray-900 dark:text-white">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Build</span>
                  <span className="font-medium text-gray-900 dark:text-white">2025.08</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                  <span className="font-medium text-gray-900 dark:text-white">Today</span>
                </div>
              </div>
            </SettingCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;