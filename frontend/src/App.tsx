
import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

import Todo from './pages/todo';
import Members from './pages/Members';
import Home from './pages/home';
import Settings from './pages/Settings';
import Music from './pages/Music';
import AiChat from './pages/AiChat';
import LoginPage from './pages/LoginPage';

function App() {
  const isAuthenticated = localStorage.getItem('authToken') !== null;

  return (
    <BrowserRouter>
      <div style={{ 
        minHeight: '100vh', 
        background: '#f1f5fd',
        display: 'flex',
        overflow: 'hidden' // Prevent any scrolling during transitions
      }}>
        {/* Only show Sidebar for authenticated routes */}
        {isAuthenticated && <Sidebar />}
        
        {/* Main content with conditional styling */}
        <main style={{
          flex: 1,
          padding: isAuthenticated ? '20px' : '0',
          width: isAuthenticated ? 'auto' : '100vw',
          transition: 'all 0.3s ease'
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
    </BrowserRouter>
  );
}

export default App;
