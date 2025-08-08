
import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';

import Todo from './pages/todo';
import Members from './pages/Members';
import Home from './pages/home';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5fd' }}>
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/todo" element={<Todo />} />
            <Route path="/members" element={<Members />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<h1>404 Not Found</h1>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
