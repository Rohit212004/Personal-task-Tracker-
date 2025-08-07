
import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/header';
import Todo from './pages/todo';
import Members from './pages/Members';
import Home from './pages/home';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/todo" element={<Todo />} />
          <Route path="/members" element={<Members />} />
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      
      </div>
    </BrowserRouter>
  );
}

export default App;
