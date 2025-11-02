import React, { useState } from 'react'
import { collection, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import './CrowdsourceForm.css'

function CrowdsourceForm({ locationId, locationName, onClose }) {
  const [menuItem, setMenuItem] = useState('')
  const [userName, setUserName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!menuItem.trim()) {
      alert('Please enter a menu item')
      return
    }

    setSubmitting(true)

    try {
      const locationRef = doc(db, 'dininglocations', locationId)

      await updateDoc(locationRef, {
        liveMenu: arrayUnion({
          item: menuItem.trim(),
          user: userName.trim() || 'Anonymous',
          time: serverTimestamp(),
        }),
      })

      setSuccess(true)
      setMenuItem('')
      setUserName('')

      setTimeout(() => {
        setSuccess(false)
        if (onClose) onClose()
      }, 2000)
    } catch (error) {
      console.error('Error adding menu item:', error)
      alert('Failed to add menu item. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="crowdsource-form-container">
      <h3>Share What's Available</h3>
      <p className="form-subtitle">Help other students find great food at {locationName}</p>

      <form onSubmit={handleSubmit} className="crowdsource-form">
        <div className="form-group">
          <label htmlFor="menuItem">Menu Item:</label>
          <input
            id="menuItem"
            type="text"
            value={menuItem}
            onChange={(e) => setMenuItem(e.target.value)}
            placeholder="e.g., Amazing Tacos!"
            disabled={submitting || success}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="userName">Your Name (optional):</label>
          <input
            id="userName"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="e.g., PistolPete"
            disabled={submitting || success}
          />
        </div>

        {success ? (
          <div className="success-message">
            ✓ Thanks! Your update has been shared.
          </div>
        ) : (
          <button
            type="submit"
            className="submit-button"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </form>
    </div>
  )
}

export default CrowdsourceForm
