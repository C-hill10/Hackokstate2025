import React, { useState } from 'react'
import { Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import CrowdsourceForm from './CrowdsourceForm'
import { getOffsetCoordinates } from '../utils/coordinateOffset'
import { getAccurateCoordinates } from '../utils/accurateOSUCoordinates'
import './LocationMarker.css'

// Create custom icons for different crowd levels
const createIcon = (color) => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="16" r="4" fill="white"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

function LocationMarker({ location }) {
  const { 
    id, 
    name, 
    building,
    coordinates, 
    crowdLevel = 50, 
    status, 
    officialMenu = [], 
    liveMenu = [],
    description,
    mapLink,
    hasGrubhub,
    hours = [],
    detailedMenu
  } = location
  const [showForm, setShowForm] = useState(false)
  const [showFullMenu, setShowFullMenu] = useState(false)

  // Determine color based on crowd level
  const getColor = (level) => {
    if (level < 30) return '#4caf50' // Green
    if (level < 70) return '#ffc107' // Yellow
    return '#f44336' // Red
  }

  const color = getColor(crowdLevel)
  const icon = createIcon(color)

  // Get accurate coordinates based on building/location name
  // This overrides scraped coordinates which are often inaccurate
  const accurateCoords = getAccurateCoordinates(location)
  const finalCoords = accurateCoords

  if (!finalCoords || !finalCoords.lat || !finalCoords.lng) {
    return null
  }

  // Add small offset if multiple markers share the same coordinates
  const offsetCoords = getOffsetCoordinates(
    finalCoords.lat, 
    finalCoords.lng, 
    id || name
  )

  return (
    <Marker
      position={[offsetCoords.lat, offsetCoords.lng]}
      icon={icon}
    >
      <Popup maxWidth={400} className="location-popup-container">
        <div className="location-popup">
          <h3>{name}</h3>
          {building && (
            <div className="building-info">📍 {building}</div>
          )}
          
          <div className="popup-status">
            <span className={`status-badge ${status || 'open'}`}>
              {status === 'closed' ? 'Closed' : 'Open'}
            </span>
            <span className="crowd-level">
              Crowd Level: <strong>{crowdLevel}%</strong>
            </span>
            {hasGrubhub && (
              <span className="grubhub-badge">🍔 Grubhub Available</span>
            )}
          </div>

          {description && description.trim() && (
            <div className="description-section">
              <p>{description}</p>
            </div>
          )}

          {hours && hours.length > 0 && (
            <div className="hours-section">
              <h4>Hours</h4>
              <ul className="hours-list">
                {hours.map((hourEntry, index) => (
                  <li key={index}>
                    <strong>{hourEntry.day}:</strong> {hourEntry.hours}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {officialMenu && officialMenu.length > 0 && (
            <div className="menu-section">
              <h4>Menu Categories</h4>
              <ul className="menu-list">
                {officialMenu.slice(0, showFullMenu ? officialMenu.length : 5).map((item, index) => (
                  <li key={index}>{item.replace(/&nbsp;/g, '').trim() || 'Various options'}</li>
                ))}
              </ul>
              {officialMenu.length > 5 && (
                <button 
                  className="toggle-menu-btn"
                  onClick={() => setShowFullMenu(!showFullMenu)}
                >
                  {showFullMenu ? 'Show Less' : `Show All (${officialMenu.length} categories)`}
                </button>
              )}
            </div>
          )}

          {detailedMenu && Object.keys(detailedMenu).length > 0 && (
            <div className="detailed-menu-section">
              <h4>Detailed Menu</h4>
              <div className="detailed-menu">
                {Object.entries(detailedMenu).slice(0, 3).map(([category, items]) => (
                  <div key={category} className="menu-category">
                    <strong>{category}:</strong>
                    <ul>
                      {Array.isArray(items) 
                        ? items.slice(0, 3).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))
                        : Object.entries(items).slice(0, 2).map(([subCat, subItems]) => (
                            <li key={subCat}>
                              <em>{subCat}:</em> {Array.isArray(subItems) ? subItems.slice(0, 2).join(', ') : subItems}
                            </li>
                          ))
                      }
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {liveMenu && liveMenu.length > 0 && (
            <div className="menu-section">
              <h4>Live Updates</h4>
              <ul className="live-menu-list">
                {liveMenu.map((entry, index) => (
                  <li key={index}>
                    <strong>{entry.item}</strong>
                    {entry.user && <span className="user-tag">@{entry.user}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mapLink && (
            <div className="links-section">
              <a 
                href={mapLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="map-link-btn"
              >
                🗺️ View on Campus Map
              </a>
            </div>
          )}

          {id && (
            <div className="menu-section">
              <button 
                className="share-button"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? 'Cancel' : '📝 Share What\'s Available'}
              </button>
              {showForm && (
                <CrowdsourceForm 
                  locationId={id}
                  locationName={name}
                  onClose={() => setShowForm(false)}
                />
              )}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  )
}

export default LocationMarker
