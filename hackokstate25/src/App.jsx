import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import MapView from './components/MapView'
import AdminPanel from './components/AdminPanel'
import About from './components/About'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              🍽️ Pete's Plate & Pace
            </Link>
            <div className="nav-links">
              <Link to="/">Map</Link>
              <Link to="/about">About</Link>
              <Link to="/admin" className="admin-link">Admin</Link>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<MapView />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
