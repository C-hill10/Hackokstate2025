import React, { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { getAccurateCoordinates } from '../utils/accurateOSUCoordinates'
import './AIRecommendation.css'

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

// AI-powered recommendation engine
function generateRecommendations(locations, userLocation, preferences = {}) {
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday

    // Determine meal context
    let mealContext = 'lunch'
    if (hour >= 6 && hour < 11) {
        mealContext = 'breakfast'
    } else if (hour >= 11 && hour < 15) {
        mealContext = 'lunch'
    } else if (hour >= 15 && hour < 18) {
        mealContext = 'afternoon'
    } else if (hour >= 18 && hour < 22) {
        mealContext = 'dinner'
    } else {
        mealContext = 'late-night'
    }

    // Score each location based on multiple factors
    const scoredLocations = locations
        .filter(loc => loc.status === 'open')
        .map(location => {
            let score = 0
            const reasons = []

            // Distance scoring (closer = higher score, max 30 points)
            let distance = Infinity
            if (userLocation) {
                const accurateCoords = getAccurateCoordinates(location)
                if (accurateCoords && accurateCoords.lat && accurateCoords.lng) {
                    distance = calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        accurateCoords.lat,
                        accurateCoords.lng
                    )
                    // Closer locations get more points (inverse relationship)
                    score += Math.max(0, 30 - (distance * 5))
                    if (distance < 0.3) {
                        reasons.push('Very close to you')
                    }
                }
            }

            // Crowd level scoring (lower = higher score, max 25 points)
            const crowdLevel = location.crowdLevel || 50
            score += Math.max(0, 25 - (crowdLevel * 0.5))
            if (crowdLevel < 30) {
                reasons.push('Low crowd, fast service')
            } else if (crowdLevel > 70) {
                reasons.push('Busy - expect longer wait')
            }

            // Meal context scoring (max 20 points)
            const menuItems = [
                ...(location.officialMenu || []),
                ...(location.liveMenu?.map(m => m.item) || []),
            ].filter(Boolean).map(item => item.toLowerCase())

            // Extract all menu items from detailed menu
            const extractMenuItems = (menuObj) => {
                const items = []
                if (!menuObj || typeof menuObj !== 'object') return items

                for (const key in menuObj) {
                    const value = menuObj[key]
                    if (Array.isArray(value)) {
                        value.forEach(item => {
                            if (typeof item === 'string') {
                                items.push(item.toLowerCase())
                            }
                        })
                    } else if (typeof value === 'object') {
                        items.push(...extractMenuItems(value))
                    }
                }
                return items
            }

            const allMenuItems = [
                ...menuItems,
                ...extractMenuItems(location.detailedMenu)
            ]

            // Time-based meal recommendations
            if (mealContext === 'breakfast') {
                const breakfastKeywords = ['breakfast', 'eggs', 'pancake', 'waffle', 'coffee', 'bagel', 'muffin', 'cereal', 'oatmeal', 'bacon', 'sausage']
                const hasBreakfast = allMenuItems.some(item =>
                    breakfastKeywords.some(keyword => item.includes(keyword))
                )
                if (hasBreakfast) {
                    score += 20
                    reasons.push('Great breakfast options')
                }
            } else if (mealContext === 'lunch') {
                const lunchKeywords = ['sandwich', 'salad', 'pizza', 'burger', 'wrap', 'soup', 'panini', 'taco', 'burrito']
                const hasLunch = allMenuItems.some(item =>
                    lunchKeywords.some(keyword => item.includes(keyword))
                )
                if (hasLunch) {
                    score += 20
                    reasons.push('Perfect lunch choices')
                }
            } else if (mealContext === 'dinner') {
                const dinnerKeywords = ['dinner', 'entree', 'pasta', 'grill', 'steak', 'chicken', 'fish', 'bowl']
                const hasDinner = allMenuItems.some(item =>
                    dinnerKeywords.some(keyword => item.includes(keyword))
                )
                if (hasDinner) {
                    score += 20
                    reasons.push('Excellent dinner options')
                }
            } else if (mealContext === 'late-night') {
                const lateNightKeywords = ['grab-and-go', 'snack', 'coffee', 'ice cream', 'milkshake', 'pizza']
                const hasLateNight = allMenuItems.some(item =>
                    lateNightKeywords.some(keyword => item.includes(keyword))
                )
                if (hasLateNight) {
                    score += 20
                    reasons.push('Late-night friendly')
                }
            } else if (mealContext === 'afternoon') {
                const afternoonKeywords = ['coffee', 'snack', 'dessert', 'tea', 'smoothie']
                const hasAfternoon = allMenuItems.some(item =>
                    afternoonKeywords.some(keyword => item.includes(keyword))
                )
                if (hasAfternoon) {
                    score += 20
                    reasons.push('Great afternoon pick-me-up')
                }
            }

            // Preference matching (max 15 points)
            if (preferences.foodType) {
                const preferenceLower = preferences.foodType.toLowerCase()
                const matchesPreference = allMenuItems.some(item =>
                    item.includes(preferenceLower)
                )
                if (matchesPreference) {
                    score += 15
                    reasons.push(`Has ${preferences.foodType}`)
                }
            }

            // Variety scoring (locations with more items get slight bonus, max 10 points)
            const uniqueItems = new Set(allMenuItems)
            if (uniqueItems.size > 10) {
                score += 10
                reasons.push('Wide variety of options')
            } else if (uniqueItems.size > 5) {
                score += 5
            }

            // Extract specific recommended items
            let recommendedItems = []
            if (mealContext === 'breakfast') {
                recommendedItems = allMenuItems.filter(item =>
                    ['egg', 'pancake', 'waffle', 'bagel', 'muffin', 'coffee', 'oatmeal'].some(k => item.includes(k))
                ).slice(0, 3)
            } else if (mealContext === 'lunch') {
                recommendedItems = allMenuItems.filter(item =>
                    ['sandwich', 'salad', 'pizza', 'burger', 'wrap'].some(k => item.includes(k))
                ).slice(0, 3)
            } else if (mealContext === 'dinner') {
                recommendedItems = allMenuItems.filter(item =>
                    ['pasta', 'grill', 'chicken', 'bowl', 'entree'].some(k => item.includes(k))
                ).slice(0, 3)
            }

            return {
                ...location,
                score,
                distance: distance === Infinity ? null : distance,
                reasons,
                recommendedItems: recommendedItems.slice(0, 3),
                mealContext
            }
        })
        .filter(loc => loc.score > 0)
        .sort((a, b) => b.score - a.score)

    // Generate personalized message
    const topLocation = scoredLocations[0]
    let personalizedMessage = ''

    if (topLocation) {
        const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
        personalizedMessage = `${timeGreeting}! Based on the current time (${mealContext} hours), location, and crowd levels, here's what I recommend:`
    }

    return {
        recommendations: scoredLocations.slice(0, 5), // Top 5 recommendations
        personalizedMessage,
        mealContext
    }
}

function AIRecommendation({ onLocationSelect }) {
    const [locations, setLocations] = useState([])
    const [userLocation, setUserLocation] = useState(null)
    const [recommendations, setRecommendations] = useState(null)
    const [loading, setLoading] = useState(false)
    const [preferences, setPreferences] = useState({
        foodType: '',
        dietary: ''
    })
    const [showPreferences, setShowPreferences] = useState(false)

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
                    setUserLocation({
                        lat: 36.1285,
                        lng: -97.0673,
                    })
                }
            )
        } else {
            setUserLocation({
                lat: 36.1285,
                lng: -97.0673,
            })
        }
    }, [])

    const handleGetRecommendations = () => {
        setLoading(true)
        // Simulate AI processing delay for better UX
        setTimeout(() => {
            const result = generateRecommendations(locations, userLocation, preferences)
            setRecommendations(result)
            setLoading(false)
        }, 800)
    }

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

    const formatMealContext = (context) => {
        return context.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
    }

    return (
        <div className="ai-recommendation">
            <div className="ai-header">
                <div className="ai-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" />
                    </svg>
                </div>
                <div className="ai-title">
                    <h2>AI Food Recommender</h2>
                    <p>Get personalized food recommendations</p>
                </div>
            </div>

            <div className="ai-preferences">
                <button
                    className="preferences-toggle"
                    onClick={() => setShowPreferences(!showPreferences)}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" fill="currentColor" />
                    </svg>
                    {showPreferences ? 'Hide Preferences' : 'Set Preferences'}
                </button>

                {showPreferences && (
                    <div className="preferences-form">
                        <div className="preference-field">
                            <label>Food Type (e.g., Pizza, Coffee, Salad)</label>
                            <input
                                type="text"
                                placeholder="What type of food are you in the mood for?"
                                value={preferences.foodType}
                                onChange={(e) => setPreferences({ ...preferences, foodType: e.target.value })}
                            />
                        </div>
                        <div className="preference-field">
                            <label>Dietary Restrictions (optional)</label>
                            <input
                                type="text"
                                placeholder="e.g., Vegetarian, Vegan, Gluten-free"
                                value={preferences.dietary}
                                onChange={(e) => setPreferences({ ...preferences, dietary: e.target.value })}
                            />
                        </div>
                    </div>
                )}
            </div>

            <button
                className="recommend-btn"
                onClick={handleGetRecommendations}
                disabled={loading || locations.length === 0}
            >
                {loading ? (
                    <>
                        <span className="spinner"></span>
                        <span>Analyzing options...</span>
                    </>
                ) : (
                    <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" />
                        </svg>
                        <span>Get AI Recommendations</span>
                    </>
                )}
            </button>

            {recommendations && (
                <div className="recommendations-results">
                    <div className="recommendations-header-controls">
                        <button
                            className="close-recommendations-btn"
                            onClick={() => setRecommendations(null)}
                            aria-label="Close recommendations"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor" />
                            </svg>
                            Close
                        </button>
                    </div>
                    <div className="ai-message">
                        <div className="message-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" fill="currentColor" />
                            </svg>
                        </div>
                        <p>{recommendations.personalizedMessage}</p>
                        <div className="meal-context-badge">
                            {formatMealContext(recommendations.mealContext)} Time
                        </div>
                    </div>

                    <div className="recommendations-list">
                        {recommendations.recommendations.map((rec, index) => (
                            <div
                                key={rec.id || index}
                                className={`recommendation-card ${index === 0 ? 'top-recommendation' : ''}`}
                                onClick={() => {
                                    if (onLocationSelect) {
                                        onLocationSelect(rec.id || rec.name)
                                    }
                                }}
                            >
                                {index === 0 && (
                                    <div className="top-badge">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />
                                        </svg>
                                        Best Match
                                    </div>
                                )}
                                <div className="recommendation-header">
                                    <h3>{rec.name}</h3>
                                    <div className="recommendation-meta">
                                        <span
                                            className="crowd-badge"
                                            style={{ backgroundColor: getCrowdColor(rec.crowdLevel || 0) }}
                                        >
                                            {rec.crowdLevel || 0}% ({getCrowdLabel(rec.crowdLevel || 0)})
                                        </span>
                                        {rec.distance !== null && (
                                            <span className="distance-badge">
                                                📍 {rec.distance.toFixed(2)} mi
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="recommendation-reasons">
                                    <p className="why-recommended">Why recommended:</p>
                                    <ul>
                                        {rec.reasons.map((reason, idx) => (
                                            <li key={idx}>{reason}</li>
                                        ))}
                                    </ul>
                                </div>
                                {rec.recommendedItems.length > 0 && (
                                    <div className="recommended-items">
                                        <p className="items-title">Try these:</p>
                                        <div className="items-tags">
                                            {rec.recommendedItems.map((item, idx) => (
                                                <span key={idx} className="item-tag">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {rec.building && (
                                    <div className="recommendation-building">
                                        🏢 {rec.building}
                                    </div>
                                )}
                                <div className="recommendation-hint">Click to view details →</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {recommendations && recommendations.recommendations.length === 0 && (
                <div className="no-recommendations">
                    <p>No recommendations available at this time. Check back later!</p>
                </div>
            )}
        </div>
    )
}

export default AIRecommendation

