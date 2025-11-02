import React from 'react'
import './About.css'

function About() {
  return (
    <div className="about-container">
      <div className="about-content">
        <h1>🍽️ Pete's Plate & Pace</h1>
        <p className="tagline">Real-time OSU Dining Intelligence</p>

        <section className="about-section">
          <h2>The Problem</h2>
          <p>
            We're students. We're busy. We waste time walking to a dining hall just to 
            find a giant line, and we don't even know if the food is good.
          </p>
        </section>

        <section className="about-section">
          <h2>The Solution</h2>
          <p>
            We built <strong>Pete's Plate & Pace</strong> - a live dashboard for campus 
            dining that shows:
          </p>
          <ul className="feature-list">
            <li>🔴 <strong>Real-time crowd levels</strong> - See how busy each dining hall is right now</li>
            <li>📋 <strong>Live menus</strong> - Official menus from OSU Dining plus crowdsourced updates</li>
            <li>🤖 <strong>AI recommendations</strong> - Get personalized suggestions based on your preferences</li>
            <li>📍 <strong>Interactive map</strong> - Visual overview of all dining locations on campus</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>How It Works</h2>
          <div className="how-it-works">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Sensors Track Crowd Levels</h3>
                <p>Real-time data is collected and displayed instantly on the map</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Menus Are Scraped & Crowdsourced</h3>
                <p>Official menus are automatically updated, plus students can share what's actually available</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>AI Helps You Decide</h3>
                <p>Our intelligent system recommends the best option based on your needs</p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>The Impact</h2>
          <p>
            This saves students time, reduces crowding, and makes campus life better 
            for everyone. This is a true <strong>Local Impact</strong> solution.
          </p>
        </section>

        <section className="about-section">
          <h2>Built For HackOkState 2025</h2>
          <p>
            Created with React, Firebase Firestore, and lots of ☕ for the 
            OSU community.
          </p>
        </section>
      </div>
    </div>
  )
}

export default About
