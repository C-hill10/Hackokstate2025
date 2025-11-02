import React, { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getAccurateCoordinates } from '../utils/accurateOSUCoordinates'
import AIRecommendation from './AIRecommendation'
import './FoodFinder.css'

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c * 0.621371 // Convert to miles
}

function FoodFinder({ onFilter, onLocationSelect }) {
  const [locations, setLocations] = useState([])
  const [activeFilter, setActiveFilter] = useState(null)
  const [craving, setCraving] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [searchResults, setSearchResults] = useState([])

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

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.log('Geolocation error:', error)
          // Default to OSU center if geolocation fails
          setUserLocation({
            lat: 36.1285,
            lng: -97.0673,
          })
        }
      )
    } else {
      // Default to OSU center if geolocation not supported
      setUserLocation({
        lat: 36.1285,
        lng: -97.0673,
      })
    }
  }, [])

  const handleFilter = (filterType) => {
    let filtered = []

    switch (filterType) {
      case 'hurry':
        // In a hurry? Find places with low crowd levels - prioritize distance since time matters
        filtered = locations
          .filter((loc) => loc.status === 'open' && (loc.crowdLevel || 0) < 50)

        // Calculate distances and sort by distance first (for speed), then crowd level
        if (userLocation && filtered.length > 0) {
          filtered = filtered.map(loc => {
            const accurateCoords = getAccurateCoordinates(loc)
            const distance = accurateCoords && accurateCoords.lat && accurateCoords.lng
              ? calculateDistance(userLocation.lat, userLocation.lng, accurateCoords.lat, accurateCoords.lng)
              : Infinity
            return {
              ...loc,
              distance,
            }
          })

          // Sort by distance first (ascending), then by crowd level (ascending)
          filtered.sort((a, b) => {
            const distA = a.distance || Infinity
            const distB = b.distance || Infinity
            if (Math.abs(distA - distB) > 0.1) { // If distance difference is significant (>0.1 miles)
              return distA - distB
            }
            // If distances are similar, prioritize lower crowd level
            return (a.crowdLevel || 100) - (b.crowdLevel || 100)
          })

          // Store results for display
          setSearchResults(filtered)
        } else {
          // Fallback: sort only by crowd level if no user location
          filtered.sort((a, b) => (a.crowdLevel || 100) - (b.crowdLevel || 100))
          setSearchResults(filtered.map(loc => ({ ...loc, distance: null })))
        }

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
          // Only search open locations
          if (loc.status !== 'open') return false

          // Search in official menu items
          const inOfficialMenu =
            loc.officialMenu?.some((item) => {
              if (!item) return false
              const itemLower = item.toLowerCase().replace(/&nbsp;/g, '').trim()
              return itemLower.includes(cravingLower)
            }) || false

          // Search in live menu items
          const inLiveMenu =
            loc.liveMenu?.some((entry) => {
              if (!entry?.item) return false
              return entry.item.toLowerCase().includes(cravingLower)
            }) || false

          // Search in detailed menu (search through all categories and items)
          let inDetailedMenu = false
          if (loc.detailedMenu && typeof loc.detailedMenu === 'object') {
            const searchInDetailedMenu = (menuObj) => {
              for (const key in menuObj) {
                const value = menuObj[key]
                const keyLower = key.toLowerCase()

                // Check if category name matches
                if (keyLower.includes(cravingLower)) {
                  return true
                }

                // Check if it's an array of items
                if (Array.isArray(value)) {
                  const hasMatch = value.some(item => {
                    if (typeof item === 'string') {
                      return item.toLowerCase().includes(cravingLower)
                    }
                    return false
                  })
                  if (hasMatch) return true
                }
                // Check if it's an object (nested menu structure)
                else if (typeof value === 'object' && value !== null) {
                  if (searchInDetailedMenu(value)) return true
                }
                // Check if it's a string
                else if (typeof value === 'string') {
                  if (value.toLowerCase().includes(cravingLower)) {
                    return true
                  }
                }
              }
              return false
            }
            inDetailedMenu = searchInDetailedMenu(loc.detailedMenu)
          }

          // Only return true if found in menu fields (not in name/description)
          return inOfficialMenu || inLiveMenu || inDetailedMenu
        })

        // Calculate distances and sort by crowd level and distance
        if (userLocation && filtered.length > 0) {
          filtered = filtered.map(loc => {
            const accurateCoords = getAccurateCoordinates(loc)
            const distance = accurateCoords && accurateCoords.lat && accurateCoords.lng
              ? calculateDistance(userLocation.lat, userLocation.lng, accurateCoords.lat, accurateCoords.lng)
              : Infinity
            return {
              ...loc,
              distance,
            }
          })

          // Sort by crowd level first (ascending), then by distance (ascending)
          filtered.sort((a, b) => {
            const crowdA = a.crowdLevel || 100
            const crowdB = b.crowdLevel || 100
            if (crowdA !== crowdB) {
              return crowdA - crowdB
            }
            return (a.distance || Infinity) - (b.distance || Infinity)
          })

          // Store results for display
          setSearchResults(filtered)
        } else {
          // Fallback: sort only by crowd level if no user location
          filtered.sort((a, b) => (a.crowdLevel || 100) - (b.crowdLevel || 100))
          setSearchResults(filtered.map(loc => ({ ...loc, distance: null })))
        }

        setActiveFilter('craving')
        break

      case 'least-crowded':
        // Find least crowded open places - prioritize crowd level, then distance
        filtered = locations
          .filter((loc) => loc.status === 'open')

        // Calculate distances and sort by crowd level first, then distance
        if (userLocation && filtered.length > 0) {
          filtered = filtered.map(loc => {
            const accurateCoords = getAccurateCoordinates(loc)
            const distance = accurateCoords && accurateCoords.lat && accurateCoords.lng
              ? calculateDistance(userLocation.lat, userLocation.lng, accurateCoords.lat, accurateCoords.lng)
              : Infinity
            return {
              ...loc,
              distance,
            }
          })

          // Sort by crowd level first (ascending), then by distance (ascending)
          filtered.sort((a, b) => {
            const crowdA = a.crowdLevel || 100
            const crowdB = b.crowdLevel || 100
            if (crowdA !== crowdB) {
              return crowdA - crowdB
            }
            return (a.distance || Infinity) - (b.distance || Infinity)
          })

          // Store results for display
          setSearchResults(filtered)
        } else {
          // Fallback: sort only by crowd level if no user location
          filtered.sort((a, b) => (a.crowdLevel || 100) - (b.crowdLevel || 100))
          setSearchResults(filtered.map(loc => ({ ...loc, distance: null })))
        }

        setActiveFilter('least-crowded')
        break

      case 'clear':
        filtered = null
        setSearchResults([])
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
      <AIRecommendation onLocationSelect={onLocationSelect} />

      <div className="finder-header">
        <div className="finder-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.87 1.41-1.41L13.41 13l1.47-1.47z" fill="currentColor" />
          </svg>
        </div>
        <div className="finder-title">
          <h2>Find Me Food</h2>
          <p>Discover dining locations on campus</p>
        </div>
      </div>

      <div className="search-box-container">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor" />
          </svg>
          <input
            type="text"
            placeholder="Search for food (e.g., Pizza, Coffee, Burgers)"
            value={craving}
            onChange={(e) => setCraving(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleFilter('craving')
              }
            }}
            className="search-input"
          />
          {craving && (
            <button
              className="clear-search-btn"
              onClick={() => {
                setCraving('')
                handleFilter('clear')
              }}
              aria-label="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor" />
              </svg>
            </button>
          )}
        </div>
        <button
          className={`search-btn ${activeFilter === 'craving' ? 'active' : ''}`}
          onClick={() => handleFilter('craving')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor" />
          </svg>
          Search
        </button>
      </div>

      <div className="quick-filters">
        <button
          className={`quick-filter-btn ${activeFilter === 'hurry' ? 'active' : ''}`}
          onClick={() => handleFilter('hurry')}
        >
          <span className="filter-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor" />
            </svg>
          </span>
          <span>In a Hurry</span>
        </button>
        <button
          className={`quick-filter-btn ${activeFilter === 'least-crowded' ? 'active' : ''}`}
          onClick={() => handleFilter('least-crowded')}
        >
          <span className="filter-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5 0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
            </svg>
          </span>
          <span>Least Crowded</span>
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

      {/* Helper function to render result items */}
      {(() => {
        const getCrowdColor = (level) => {
          if (level < 30) return '#4caf50'
          if (level < 70) return '#ffc107'
          return '#f44336'
        }
        const getCrowdLabel = (level) => {
          if (level < 30) return 'Low'
          if (level < 70) return 'Medium'
          return 'High'
        }

        const renderResultItem = (location, index, showWalkTime = false) => {
          const crowdLevel = location.crowdLevel || 0
          return (
            <div
              key={location.id || index}
              className="result-item"
              onClick={() => {
                if (onLocationSelect) {
                  onLocationSelect(location.id || location.name)
                }
              }}
            >
              <div className="result-header">
                <span className="result-name">{location.name}</span>
                <span
                  className="result-crowd"
                  style={{ backgroundColor: getCrowdColor(crowdLevel) }}
                >
                  {crowdLevel}% ({getCrowdLabel(crowdLevel)})
                </span>
              </div>
              <div className="result-details">
                {location.building && (
                  <span className="result-building">🏢 {location.building}</span>
                )}
                {location.distance !== null && location.distance !== Infinity && (
                  <span className="result-distance">
                    📍 {location.distance.toFixed(2)} mi away
                    {showWalkTime && (
                      <span className="walk-time">
                        • ~{Math.round(location.distance * 20)} min walk
                      </span>
                    )}
                  </span>
                )}
              </div>
              <div className="result-hint">Click to view details →</div>
            </div>
          )
        }

        return (
          <>
            {/* Food Search Results */}
            {activeFilter === 'craving' && searchResults.length > 0 && (
              <div className="search-results">
                <h3 className="results-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5 0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
                  </svg>
                  Places Found ({searchResults.length})
                </h3>
                <div className="results-list">
                  {searchResults.map((loc, idx) => renderResultItem(loc, idx, false))}
                </div>
              </div>
            )}

            {activeFilter === 'craving' && searchResults.length === 0 && (
              <div className="no-results">
                <p>No locations found matching "{craving}"</p>
              </div>
            )}

            {/* In a Hurry Results */}
            {activeFilter === 'hurry' && searchResults.length > 0 && (
              <div className="search-results hurry-results">
                <div className="results-header-special">
                  <h3 className="results-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }}>
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor" />
                    </svg>
                    Quick Options ({searchResults.length})
                  </h3>
                  <span className="urgency-badge">FASTEST</span>
                </div>
                <p className="results-subtitle">Sorted by proximity and crowd level for fastest service</p>
                <div className="results-list">
                  {searchResults.map((location, index) => {
                    const crowdLevel = location.crowdLevel || 0
                    const isTopPick = index === 0
                    return (
                      <div
                        key={location.id || index}
                        className={`result-item ${isTopPick ? 'top-pick' : ''}`}
                        onClick={() => {
                          if (onLocationSelect) {
                            onLocationSelect(location.id || location.name)
                          }
                        }}
                      >
                        {isTopPick && <div className="top-pick-badge">⭐ Best Pick</div>}
                        <div className="result-header">
                          <span className="result-name">{location.name}</span>
                          <span
                            className="result-crowd"
                            style={{ backgroundColor: getCrowdColor(crowdLevel) }}
                          >
                            {crowdLevel}% ({getCrowdLabel(crowdLevel)})
                          </span>
                        </div>
                        <div className="result-details">
                          {location.building && (
                            <span className="result-building">🏢 {location.building}</span>
                          )}
                          {location.distance !== null && location.distance !== Infinity && (
                            <span className="result-distance">
                              📍 {location.distance.toFixed(2)} mi away
                              <span className="walk-time">
                                • ~{Math.round(location.distance * 20)} min walk
                              </span>
                            </span>
                          )}
                        </div>
                        <div className="result-hint">Click to view details →</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeFilter === 'hurry' && searchResults.length === 0 && (
              <div className="no-results">
                <p>No locations with low crowd levels found. Try "Least Crowded" instead!</p>
              </div>
            )}

            {/* Least Crowded Results */}
            {activeFilter === 'least-crowded' && searchResults.length > 0 && (
              <div className="search-results">
                <h3 className="results-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5 0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
                  </svg>
                  All Locations ({searchResults.length})
                </h3>
                <p className="results-subtitle">Sorted by crowd level (least crowded first)</p>
                <div className="results-list">
                  {searchResults.map((loc, idx) => renderResultItem(loc, idx, false))}
                </div>
              </div>
            )}

            {activeFilter === 'least-crowded' && searchResults.length === 0 && (
              <div className="no-results">
                <p>No open locations found.</p>
              </div>
            )}
          </>
        )
      })()}
    </div>
  )
}

export default FoodFinder
