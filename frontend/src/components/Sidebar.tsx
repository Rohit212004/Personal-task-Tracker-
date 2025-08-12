import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

interface UserInfo {
  name?: string;
  email?: string;
  picture?: string;
}

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo>({});

  const handleLogout = () => {
    // Clear all auth-related data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Redirect to login page
    navigate('/login');
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUserInfo(JSON.parse(userData));
    }
  }, []);

  const navItems = [
    { name: 'Home', path: '/home', icon: '🏠' },
    { name: 'Todo', path: '/todo', icon: '📝' },
    { name: 'Members', path: '/members', icon: '👥' },
    { name: 'Music', path: '/Music', icon: '🎵' },
    { name: 'AiChat', path: '/AiChat', icon: '🤖' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  return (
    <aside className="sidebar">
      <div className="user-profile" style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div className="profile-image" style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          overflow: 'hidden',
          marginBottom: '10px',
          border: '2px solid #4f8cff'
        }}>
          <img 
            src={userInfo.picture || 'https://via.placeholder.com/80'} 
            alt="Profile"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
        <div className="user-info" style={{
          textAlign: 'center',
          color: '#000000ff'
        }}>
          <h3 style={{
            margin: '0 0 5px 0',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>{userInfo.name || 'User'}</h3>
          <p style={{
            margin: '0',
            fontSize: '0.8rem',
            opacity: '0.7'
          }}>{userInfo.email || 'user@example.com'}</p>
        </div>
      </div>
      <nav>
        <ul style={{ marginTop: '20px' }}>
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={
                  location.pathname === item.path
                    ? 'active'
                    : ''
                }
              >
                <span className="icon">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
