import React, { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import './FoodFinder.css'

function FoodFinder({ onFilter }) {
  const [locations, setLocations] = useState([])
  const [activeFilter, setActiveFilter] = useState(null)
  const [craving, setCraving] = useState('')

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'dininglocations'),
      (snapshot) => {
        const locationData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setLocations(locationData)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleFilter = (filterType) => {
    let filtered = []

    switch (filterType) {
      case 'hurry':
        // In a hurry? Find places with low crowd levels
        filtered = locations
          .filter((loc) => loc.status === 'open' && (loc.crowdLevel || 0) < 50)
          .sort((a, b) => (a.crowdLevel || 0) - (b.crowdLevel || 0))
        setActiveFilter('hurry')
        break

      case 'craving':
        // Find places with specific food
        if (!craving.trim()) {
          alert('Please enter what you\'re craving!')
          return
        }
        const cravingLower = craving.toLowerCase()
        filtered = locations.filter((loc) => {
          const statusOpen = loc.status === 'open'
          const inOfficialMenu =
            loc.officialMenu?.some((item) =>
              item.toLowerCase().includes(cravingLower)
            ) || false
          const inLiveMenu =
            loc.liveMenu?.some((entry) =>
              entry.item?.toLowerCase().includes(cravingLower)
            ) || false
          return statusOpen && (inOfficialMenu || inLiveMenu)
        })
        setActiveFilter('craving')
        break

      case 'least-crowded':
        // Find least crowded open places
        filtered = locations
          .filter((loc) => loc.status === 'open')
          .sort((a, b) => (a.crowdLevel || 0) - (b.crowdLevel || 0))
        setActiveFilter('least-crowded')
        break

      case 'clear':
        filtered = []
        setActiveFilter(null)
        break

      default:
        return
    }

    if (onFilter) {
      onFilter(filtered)
    }
  }

  return (
    <div className="food-finder">
      <h2>🤖 Find Me Food!</h2>
      <div className="filter-buttons">
        <button
          className={`filter-btn ${activeFilter === 'hurry' ? 'active' : ''}`}
          onClick={() => handleFilter('hurry')}
        >
          ⏱️ In a Hurry?
        </button>
        <button
          className={`filter-btn ${activeFilter === 'least-crowded' ? 'active' : ''}`}
          onClick={() => handleFilter('least-crowded')}
        >
          📍 Least Crowded
        </button>
      </div>

      <div className="craving-section">
        <input
          type="text"
          placeholder="What are you craving? (e.g., Pizza, Tacos)"
          value={craving}
          onChange={(e) => setCraving(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleFilter('craving')
            }
          }}
          className="craving-input"
        />
        <button
          className={`filter-btn ${activeFilter === 'craving' ? 'active' : ''}`}
          onClick={() => handleFilter('craving')}
        >
          🔍 Find It
        </button>
      </div>

      {activeFilter && (
        <button
          className="clear-filter-btn"
          onClick={() => handleFilter('clear')}
        >
          Clear Filter
        </button>
      )}
    </div>
  )
}

export default FoodFinder
