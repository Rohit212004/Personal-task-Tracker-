import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/home', icon: '🏠' },
    { name: 'Todo', path: '/todo', icon: '📝' },
    { name: 'Members', path: '/members', icon: '👥' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-title">Task Tracker</div>
      <nav>
        <ul>
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
