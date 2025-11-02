import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet'
import { Icon, DivIcon } from 'leaflet'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import LocationMarker from './LocationMarker'
import FoodFinder from './FoodFinder'
import { resetCoordinateMap } from '../utils/coordinateOffset'
import { checkLocationStatus } from '../utils/checkLocationStatus'
import 'leaflet/dist/leaflet.css'
import './MapView.css'

// OSU Campus center coordinates
const OSU_CENTER = [36.1285, -97.0673]
const DEFAULT_ZOOM = 16

// Create user location icon (blue pin with dot)
const createUserLocationIcon = () => {
  const svgString = '<svg width="32" height="44" viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C10.477 0 6 4.477 6 10c0 7 10 18 10 18s10-11 10-18c0-5.523-4.477-10-10-10z" fill="#4285F4" stroke="white" stroke-width="2"/><circle cx="16" cy="10" r="6" fill="white"/><circle cx="16" cy="10" r="3" fill="#4285F4"/></svg>'
  // Try URL encoding instead of base64 for better compatibility
  const encodedSvg = encodeURIComponent(svgString)

  try {
    return new Icon({
      iconUrl: `data:image/svg+xml;charset=utf-8,${encodedSvg}`,
      iconSize: [32, 44],
      iconAnchor: [16, 44],
      popupAnchor: [0, -44],
    })
  } catch (error) {
    console.error('Error creating user location icon:', error)
    // Fallback to a simple DivIcon
    return new DivIcon({
      className: 'user-location-marker',
      html: '<div style="width: 24px; height: 24px; background: #4285F4; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })
  }
}

// Component to handle map zoom/pan when filter is active
function MapController({ filteredLocations }) {
  const map = useMap()

  useEffect(() => {
    if (filteredLocations && filteredLocations.length > 0) {
      // Zoom to show all filtered locations
      const bounds = filteredLocations
        .filter(loc => loc.coordinates?.lat && loc.coordinates?.lng)
        .map(loc => [loc.coordinates.lat, loc.coordinates.lng])

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [filteredLocations, map])

  return null
}

function MapView() {
  const [locations, setLocations] = useState([])
  const [filteredLocations, setFilteredLocations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLocationId, setSelectedLocationId] = useState(null)
  const [userLocation, setUserLocation] = useState(null)

  // Debug: Log when userLocation changes
  useEffect(() => {
    if (userLocation) {
      console.log('User location state updated:', userLocation)
    }
  }, [userLocation])

  useEffect(() => {
    // Reset coordinate map when locations change
    resetCoordinateMap()

    // Real-time listener for dining locations
    const unsubscribe = onSnapshot(
      collection(db, 'dininglocations'),
      (snapshot) => {
        console.log('Firestore snapshot received:', snapshot.size, 'documents')
        const locationData = snapshot.docs.map((doc) => {
          const data = doc.data()
          console.log('Location data:', doc.id, data)
          return {
            id: doc.id,
            ...data,
          }
        })
        setLocations(locationData)
        setLoading(false)
        setError(null)
      },
      (error) => {
        console.error('Error fetching locations:', error)
        setError(error.message || 'Failed to load locations. Check Firestore permissions and data structure.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      console.log('Requesting user location...')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('User location obtained:', position.coords.latitude, position.coords.longitude)
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          console.error('Error code:', error.code, 'Error message:', error.message)
          // Don't set default location - just don't show user marker if geolocation fails
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // Cache for 1 minute
        }
      )
    } else {
      console.warn('Geolocation is not supported by this browser')
    }
  }, [])

  if (loading) {
    return (
      <div className="map-container loading">
        <div className="loading-spinner">Loading dining locations...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="map-container loading">
        <div className="error-message">
          <h3>⚠️ Error Loading Map</h3>
          <p>{error}</p>
          <div className="error-details">
            <p><strong>Common issues:</strong></p>
            <ul>
              <li>Check Firestore security rules allow reads</li>
              <li>Verify collection name is exactly "dininglocations"</li>
              <li>Check browser console for more details</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // Determine what to display
  const displayLocations = filteredLocations !== null && filteredLocations.length > 0 ? filteredLocations : locations
  const hasNoData = locations.length === 0
  const hasActiveFilter = filteredLocations !== null && filteredLocations.length > 0
  const hasNoFilterMatches = filteredLocations !== null && Array.isArray(filteredLocations) && filteredLocations.length === 0

  const handleLocationSelect = async (locationId) => {
    setSelectedLocationId(locationId)

    // Find the location and update its status based on hours
    const location = locations.find(loc => (loc.id || loc.name) === locationId)
    if (location && location.hours) {
      try {
        const statusCheck = checkLocationStatus(location.hours)
        const newStatus = statusCheck.isOpen ? 'open' : 'closed'

        // Only update if status changed
        if (location.status !== newStatus && statusCheck.isOpen !== null) {
          const locationRef = doc(db, 'dininglocations', location.id)
          await updateDoc(locationRef, {
            status: newStatus,
          })
          console.log(`Updated ${location.name} status to ${newStatus} based on hours`)
        }
      } catch (error) {
        console.error('Error updating location status:', error)
      }
    }

    // Reset after a short delay to allow the popup to open
    setTimeout(() => setSelectedLocationId(null), 100)
  }

  return (
    <div className="map-container">
      <FoodFinder onFilter={setFilteredLocations} onLocationSelect={handleLocationSelect} />
      {hasNoData ? (
        <div className="map-container loading">
          <div className="error-message">
            <h3>No Locations Found</h3>
            <p>No dining locations found in Firestore.</p>
            <div className="error-details">
              <p><strong>Check:</strong></p>
              <ul>
                <li>Collection name is "dininglocations"</li>
                <li>Documents have: name, coordinates (lat/lng), crowdLevel</li>
                <li>Open browser console (F12) to see data logs</li>
              </ul>
            </div>
          </div>
        </div>
      ) : hasNoFilterMatches ? (
        <div className="map-container">
          <MapContainer
            center={OSU_CENTER}
            zoom={DEFAULT_ZOOM}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((location) => (
              <LocationMarker
                key={location.id}
                location={location}
                selected={selectedLocationId === (location.id || location.name)}
              />
            ))}
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={createUserLocationIcon()}
              >
                <Popup>
                  <div style={{ textAlign: 'center', padding: '4px' }}>
                    <strong>📍 Your Location</strong>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
          <div className="no-filter-matches">
            <div className="no-matches-message">
              <h3>🔍 No Matches Found</h3>
              <p>No locations found matching your search criteria.</p>
              <p>Try a different search term or clear the filter to see all locations.</p>
            </div>
          </div>
        </div>
      ) : (
        <MapContainer
          center={OSU_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
        >
          <MapController filteredLocations={filteredLocations} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {displayLocations.map((location) => (
            <LocationMarker
              key={location.id}
              location={location}
              selected={selectedLocationId === (location.id || location.name)}
            />
          ))}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createUserLocationIcon()}
            >
              <Popup>
                <div style={{ textAlign: 'center', padding: '4px' }}>
                  <strong>📍 Your Location</strong>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      )}
      <div className="map-legend">
        <h3>Live Crowd Levels</h3>
        <div className="legend-item">
          <span className="legend-color green"></span>
          <span>Low (&lt; 30)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color yellow"></span>
          <span>Medium (30-70)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color red"></span>
          <span>High (&gt;= 70)</span>
        </div>
        {userLocation && (
          <div className="legend-item">
            <svg width="20" height="28" viewBox="0 0 32 44" style={{ marginRight: '8px' }}>
              <path d="M16 0C10.477 0 6 4.477 6 10c0 7 10 18 10 18s10-11 10-18c0-5.523-4.477-10-10-10z" fill="#4285F4" stroke="white" strokeWidth="2" />
              <circle cx="16" cy="10" r="6" fill="white" />
              <circle cx="16" cy="10" r="3" fill="#4285F4" />
            </svg>
            <span>Your Location</span>
          </div>
        )}
        {filteredLocations && (
          <div className="filter-indicator">
            Showing {filteredLocations.length} filtered location(s)
          </div>
        )}
      </div>
    </div>
  )
}

export default MapView
