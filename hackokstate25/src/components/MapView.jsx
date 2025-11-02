import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import LocationMarker from './LocationMarker'
import FoodFinder from './FoodFinder'
import { resetCoordinateMap } from '../utils/coordinateOffset'
import 'leaflet/dist/leaflet.css'
import './MapView.css'

// OSU Campus center coordinates
const OSU_CENTER = [36.1285, -97.0673]
const DEFAULT_ZOOM = 16

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

  if (loading) {
    return (
      <div className="map-container loading">
        <div className="loading-spinner">Loading map...</div>
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
              <li>Verify collection name is exactly "diningLocations"</li>
              <li>Check browser console for more details</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  const displayLocations = filteredLocations || locations

  return (
    <div className="map-container">
      <FoodFinder onFilter={setFilteredLocations} />
      {displayLocations.length === 0 ? (
        <div className="map-container loading">
          <div className="error-message">
            <h3>No Locations Found</h3>
            <p>No dining locations found in Firestore.</p>
            <div className="error-details">
              <p><strong>Check:</strong></p>
              <ul>
                <li>Collection name is "diningLocations"</li>
                <li>Documents have: name, coordinates (lat/lng), crowdLevel</li>
                <li>Open browser console (F12) to see data logs</li>
              </ul>
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
            <LocationMarker key={location.id} location={location} />
          ))}
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
