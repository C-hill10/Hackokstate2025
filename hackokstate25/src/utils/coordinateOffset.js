/**
 * Utility to add small offsets to markers with duplicate coordinates
 * This ensures all markers are visible even when they share the same building
 */

// Track coordinates we've seen and add small offsets
const coordinateMap = new Map();

/**
 * Add a small offset to coordinates to prevent marker overlap
 * @param {number} lat - Original latitude
 * @param {number} lng - Original longitude
 * @param {string} locationId - Unique identifier for the location
 * @returns {Object} Offset coordinates { lat, lng }
 */
export function getOffsetCoordinates(lat, lng, locationId) {
    // Create a key for this coordinate pair
    const coordKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;

    // Check if we've seen this coordinate before
    if (coordinateMap.has(coordKey)) {
        const existing = coordinateMap.get(coordKey);
        existing.count += 1;

        // Calculate offset: spread markers in a small circle
        // Each marker gets positioned at a different angle around the center
        const angle = (existing.count - 1) * (2 * Math.PI / Math.max(existing.count, 4));
        const radius = 0.0005; // ~50 meters offset

        const offsetLat = lat + (radius * Math.cos(angle));
        const offsetLng = lng + (radius * Math.sin(angle));

        return { lat: offsetLat, lng: offsetLng };
    } else {
        // First marker at this location - no offset needed
        coordinateMap.set(coordKey, { count: 1, locations: [locationId] });
        return { lat, lng };
    }
}

/**
 * Reset the coordinate map (useful for testing or re-rendering)
 */
export function resetCoordinateMap() {
    coordinateMap.clear();
}
