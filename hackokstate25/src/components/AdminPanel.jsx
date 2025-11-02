import React, { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import './AdminPanel.css'

function AdminPanel() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Real-time listener for dining locations
    const unsubscribe = onSnapshot(
      collection(db, 'dininglocations'),
      (snapshot) => {
        console.log('Admin Panel - Firestore snapshot:', snapshot.size, 'documents')
        const locationData = snapshot.docs.map((doc) => {
          const data = doc.data()
          console.log('Admin - Location:', doc.id, data)
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
        setError(error.message || 'Failed to load locations. Check Firestore permissions.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleCrowdLevelChange = async (locationId, newLevel) => {
    try {
      const locationRef = doc(db, 'dininglocations', locationId)
      await updateDoc(locationRef, {
        crowdLevel: parseInt(newLevel),
      })
    } catch (error) {
      console.error('Error updating crowd level:', error)
      alert('Failed to update crowd level. Please check console for details.')
    }
  }

  const handleStatusChange = async (locationId, newStatus) => {
    try {
      const locationRef = doc(db, 'dininglocations', locationId)
      await updateDoc(locationRef, {
        status: newStatus,
      })
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status. Please check console for details.')
    }
  }

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="admin-container">
          <div className="loading">Loading locations...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-panel">
        <div className="admin-container">
          <div className="error-message">
            <h2>⚠️ Error Loading Data</h2>
            <p>{error}</p>
            <div className="error-details">
              <p><strong>Common fixes:</strong></p>
              <ul>
                <li>Check Firestore security rules - should allow reads</li>
                <li>Collection name must be exactly "diningLocations"</li>
                <li>Check browser console (F12) for detailed error messages</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <h1>Admin Panel - Crowd Level Control</h1>
        <p className="admin-description">
          Adjust crowd levels in real-time. Changes will instantly update on the map!
        </p>

        {locations.length === 0 ? (
          <div className="no-locations">
            <h3>No dining locations found</h3>
            <p>No documents found in the "diningLocations" collection.</p>
            <div className="error-details">
              <p><strong>Required fields for each document:</strong></p>
              <ul>
                <li><code>name</code> (string) - e.g., "Kerr-Drummond"</li>
                <li><code>coordinates</code> (map) with <code>lat</code> and <code>lng</code> (numbers)</li>
                <li><code>crowdLevel</code> (number) - 0 to 100</li>
                <li><code>status</code> (string) - "open" or "closed"</li>
              </ul>
              <p><strong>Check browser console (F12)</strong> to see if data is being fetched.</p>
            </div>
          </div>
        ) : (
          <div className="locations-list">
            {locations.map((location) => (
              <div key={location.id} className="location-card">
                <h2>{location.name}</h2>
                
                <div className="control-group">
                  <label htmlFor={`crowd-${location.id}`}>
                    Crowd Level: <strong>{location.crowdLevel || 0}%</strong>
                  </label>
                  <input
                    type="range"
                    id={`crowd-${location.id}`}
                    min="0"
                    max="100"
                    value={location.crowdLevel || 50}
                    onChange={(e) =>
                      handleCrowdLevelChange(location.id, e.target.value)
                    }
                    className="crowd-slider"
                  />
                  <div className="slider-labels">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="control-group">
                  <label htmlFor={`status-${location.id}`}>Status:</label>
                  <select
                    id={`status-${location.id}`}
                    value={location.status || 'open'}
                    onChange={(e) =>
                      handleStatusChange(location.id, e.target.value)
                    }
                    className="status-select"
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="location-info">
                  {location.building && (
                    <p>
                      <strong>Building:</strong> {location.building}
                    </p>
                  )}
                  <p>
                    <strong>Coordinates:</strong> {location.coordinates?.lat}, {location.coordinates?.lng}
                  </p>
                  {location.officialMenu && location.officialMenu.length > 0 && (
                    <p>
                      <strong>Menu Categories:</strong> {location.officialMenu.length}
                    </p>
                  )}
                  {location.hours && location.hours.length > 0 && (
                    <p>
                      <strong>Hours:</strong> {location.hours[0]?.day} - {location.hours[0]?.hours}
                    </p>
                  )}
                  {location.hasGrubhub && (
                    <p>
                      <strong>🍔 Grubhub Available</strong>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="admin-footer">
          <p>
            💡 <strong>Pro Tip:</strong> Open this panel and the main map side-by-side
            to see real-time updates!
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel
