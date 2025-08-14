
import React from 'react';
import { useTheme } from '@mui/material/styles';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

import Todo from './pages/todo';
import Members from './pages/Members';
import Home from './pages/home';
import Settings from './pages/Settings';
import Music from './pages/Music';
import AiChat from './pages/AiChat';
import LoginPage from './pages/LoginPage';

function AppContent() {
  const theme = useTheme();
  const isAuthenticated = localStorage.getItem('authToken') !== null;
  const location = useLocation();
  const hideSidebar = location.pathname === '/login';

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: theme.palette.background.default,
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* Hide Sidebar on login page regardless of auth */}
      {isAuthenticated && !hideSidebar && <Sidebar />}
      
      {/* Main content with conditional styling */}
      <main className="app-main" style={{
        flex: 1,
        padding: isAuthenticated && !hideSidebar ? '0px' : '0',
        width: isAuthenticated && !hideSidebar ? 'auto' : '100vw',
        transition: 'all 0.3s ease',
        marginLeft: isAuthenticated && !hideSidebar ? 256 : 0
      }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Root path always redirects to login if not authenticated */}
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
          } />

          {/* Protected Routes */}
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          
          <Route path="/todo" element={
            <ProtectedRoute>
              <Todo />
            </ProtectedRoute>
          } />
          <Route path="/members" element={
            <ProtectedRoute>
              <Members />
            </ProtectedRoute>
          } />
          <Route path="/Music" element={
            <ProtectedRoute>
              <Music />
            </ProtectedRoute>
          } />
          <Route path="/AiChat" element={
            <ProtectedRoute>
              <AiChat />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
