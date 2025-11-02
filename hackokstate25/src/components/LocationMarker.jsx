import React, { useState, useEffect, useRef } from 'react'
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

function LocationMarker({ location, selected }) {
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
  const [activeTab, setActiveTab] = useState('overview')
  const markerRef = useRef(null)

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

  // Open popup when location is selected from search results
  useEffect(() => {
    if (selected && markerRef.current) {
      markerRef.current.openPopup()
      // Pan to the marker location
      const map = markerRef.current._map
      if (map) {
        map.setView([offsetCoords.lat, offsetCoords.lng], 18, {
          animate: true,
          duration: 0.5
        })
      }
    }
  }, [selected, offsetCoords.lat, offsetCoords.lng])

  // Determine available tabs
  const hasMenu = (officialMenu && officialMenu.length > 0) || (detailedMenu && Object.keys(detailedMenu).length > 0)
  const hasLiveUpdates = liveMenu && liveMenu.length > 0
  const hasActions = mapLink || id

  // Tab content renderers
  const renderOverview = () => (
    <div className="tab-content">
      <div className="info-grid">
        <div className="info-item">
          <span className="info-label">Status</span>
          <span className={`status-badge ${status || 'open'}`}>
            {status === 'closed' ? 'Closed' : 'Open'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Crowd Level</span>
          <span className="crowd-value">{crowdLevel}%</span>
        </div>
      </div>

      {building && (
        <div className="info-block">
          <span className="info-label">📍 Building</span>
          <span className="info-value">{building}</span>
        </div>
      )}

      {description && description.trim() && (
        <div className="info-block">
          <span className="info-label">About</span>
          <p className="info-value">{description}</p>
        </div>
      )}

      {hours && hours.length > 0 && (
        <div className="info-block">
          <span className="info-label">Hours</span>
          <div className="hours-list">
            {hours.map((hourEntry, index) => (
              <div key={index} className="hours-item">
                <span className="hours-day">{hourEntry.day}</span>
                <span className="hours-time">{hourEntry.hours}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasGrubhub && (
        <div className="feature-badge">
          🍔 Grubhub Available
        </div>
      )}
    </div>
  )

  const renderMenu = () => (
    <div className="tab-content">
      {officialMenu && officialMenu.length > 0 && (
        <div className="menu-block">
          <h4 className="section-title">Categories</h4>
          <div className="menu-grid">
            {officialMenu.map((item, index) => (
              <div key={index} className="menu-item">
                {item.replace(/&nbsp;/g, '').trim() || 'Various options'}
              </div>
            ))}
          </div>
        </div>
      )}

      {detailedMenu && Object.keys(detailedMenu).length > 0 && (
        <div className="menu-block">
          <h4 className="section-title">Menu Details</h4>
          <div className="detailed-menu-list">
            {Object.entries(detailedMenu).map(([category, items]) => (
              <div key={category} className="menu-category-block">
                <div className="category-name">{category}</div>
                <div className="category-items">
                  {Array.isArray(items)
                    ? items.map((item, idx) => (
                      <div key={idx} className="category-item">{item}</div>
                    ))
                    : Object.entries(items).map(([subCat, subItems]) => (
                      <div key={subCat} className="subcategory">
                        <span className="subcategory-name">{subCat}</span>
                        <span className="subcategory-items">
                          {Array.isArray(subItems) ? subItems.join(', ') : subItems}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasMenu && (
        <div className="empty-state">
          <p>No menu information available</p>
        </div>
      )}
    </div>
  )

  const renderUpdates = () => (
    <div className="tab-content">
      {liveMenu && liveMenu.length > 0 ? (
        <div className="updates-list">
          {liveMenu.map((entry, index) => (
            <div key={index} className="update-item">
              <div className="update-content">
                <span className="update-item-name">{entry.item}</span>
                {entry.user && (
                  <span className="update-user">by @{entry.user}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No live updates yet</p>
        </div>
      )}
    </div>
  )

  const renderActions = () => (
    <div className="tab-content">
      <div className="actions-list">
        {mapLink && (
          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="action-button primary"
          >
            <span className="action-icon">🗺️</span>
            <span>View on Campus Map</span>
          </a>
        )}

        {id && (
          <button
            className={`action-button ${showForm ? 'secondary' : 'primary'}`}
            onClick={() => setShowForm(!showForm)}
          >
            <span className="action-icon">{showForm ? '✕' : '📝'}</span>
            <span>{showForm ? 'Cancel' : 'Share What\'s Available'}</span>
          </button>
        )}

        {showForm && (
          <div className="form-container">
            <CrowdsourceForm
              locationId={id}
              locationName={name}
              onClose={() => setShowForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Marker
      ref={markerRef}
      position={[offsetCoords.lat, offsetCoords.lng]}
      icon={icon}
    >
      <Popup maxWidth={420} className="location-popup-container">
        <div className="location-popup">
          <div className="popup-header">
            <h3>{name}</h3>
          </div>

          <div className="tabs-container">
            <div className="tabs-nav">
              <button
                className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              {hasMenu && (
                <button
                  className={`tab-button ${activeTab === 'menu' ? 'active' : ''}`}
                  onClick={() => setActiveTab('menu')}
                >
                  Menu
                </button>
              )}
              {hasLiveUpdates && (
                <button
                  className={`tab-button ${activeTab === 'updates' ? 'active' : ''}`}
                  onClick={() => setActiveTab('updates')}
                >
                  Updates {liveMenu && liveMenu.length > 0 && <span className="badge-count">{liveMenu.length}</span>}
                </button>
              )}
              {hasActions && (
                <button
                  className={`tab-button ${activeTab === 'actions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('actions')}
                >
                  Actions
                </button>
              )}
            </div>

            <div className="tabs-content">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'menu' && renderMenu()}
              {activeTab === 'updates' && renderUpdates()}
              {activeTab === 'actions' && renderActions()}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

export default LocationMarker
