
import ThemeToggle from '../components/ThemeToggle';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserInfo {
  name?: string;
  email?: string;
  picture?: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light'
  );

  useEffect(() => {
    // Theme effect
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);

    // Load user info
    const userData = localStorage.getItem('user');
    if (userData) {
      setUserInfo(JSON.parse(userData));
    }
  }, [theme]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login'; // This will force a complete page reload
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div>
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2563eb', marginBottom: '2rem' }}>Settings</h2>
      
      {/* Account Section */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Account</h3>
        {userInfo && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <img 
              src={userInfo.picture || 'https://via.placeholder.com/40'} 
              alt="Profile" 
              style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '1rem' }}
            />
            <div>
              <div style={{ fontWeight: 500 }}>{userInfo.name}</div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>{userInfo.email}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          style={{
            background: '#ff4757',
            color: 'white',
            border: 'none',
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'background 0.2s',
            fontSize: '0.95rem',
            fontWeight: 500,
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#ff3748'}
          onMouseOut={(e) => e.currentTarget.style.background = '#ff4757'}
        >
          <span>🚪</span>
          Logout from Account
        </button>
      </div>

      {/* Theme Section */}
      <div style={{ padding: '1.5rem', background: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Appearance</h3>
        <p style={{ color: '#666', marginBottom: '1rem' }}>Toggle between light and dark mode for the dashboard.</p>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
    </div>
    </div>
  );
};

export default Settings;
