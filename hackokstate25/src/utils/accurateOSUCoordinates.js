/**
 * Accurate GPS coordinates for OSU dining locations
 * Based on building locations and campus map data
 */

// Accurate building base coordinates for OSU Stillwater campus
// Verified coordinates from user
const BUILDING_COORDINATES = {
    'Adams Market': { lat: 36.127836, lng: -97.073238 },
    'Bennett Hall': { lat: 36.127324, lng: -97.063886 },
    'Central Market Place': { lat: 36.123981, lng: -97.073758 },
    'North Dining': { lat: 36.127403, lng: -97.076217 },
    'Student Union': { lat: 36.121255, lng: -97.070235 },
    'Edmon Low Library': { lat: 36.122709, lng: -97.070000 },
};

// Location-specific coordinates with precise GPS positions
// Verified coordinates from user
const LOCATION_COORDINATES = {
    'Express It!': { lat: 36.1278359, lng: -97.0732384 },
    'Fast Break': { lat: 36.1273244, lng: -97.0638861 },
    'Slam Dunk': { lat: 36.1273244, lng: -97.0638861 },
    '1890 Market': { lat: 36.1239815, lng: -97.0737581 },
    'BYTE': { lat: 36.1239815, lng: -97.0737581 },
    'The 405 Deli': { lat: 36.1239815, lng: -97.0737581 },
    'B & B, Co.': { lat: 36.1273416, lng: -97.074234 },
    'Carvery': { lat: 36.127413, lng: -97.0765477 },
    'Dash': { lat: 36.127413, lng: -97.0765477 },
    'The Natural': { lat: 36.127413, lng: -97.0765477 },
    'Noodle U': { lat: 36.127413, lng: -97.0765477 },
    'Road Trip Pizza & Mac': { lat: 36.127413, lng: -97.0765477 },
    'Zest': { lat: 36.127413, lng: -97.0765477 },
    'Bread & Beyond Deli': { lat: 36.1211546, lng: -97.0712636 },
    'Chick-fil-A': { lat: 36.1217245, lng: -97.0742166 },
    'Mambo Italiano': { lat: 36.1212789, lng: -97.0713056 },
    'Passport': { lat: 36.1208852, lng: -97.0687809 },
    'Plaza Corner Cafe': { lat: 36.1212789, lng: -97.0713056 },
    'Red Earth Kitchen': { lat: 36.1211183, lng: -97.0686576 },
    'Shake Smart': { lat: 36.1211183, lng: -97.0686576 },
    'Union Chophouse Taqueria': { lat: 36.121037, lng: -97.0693125 },
    'Union Express': { lat: 36.1212321, lng: -97.0689217 },
    'Café Libro': { lat: 36.1227094, lng: -97.0699997 },
};

/**
 * Get accurate coordinates for a dining location
 * @param {Object} location - Location object with name, building, and optional coordinates
 * @returns {Object} Accurate coordinates { lat, lng }
 */
export function getAccurateCoordinates(location) {
    const name = location.name || '';
    const building = location.building || '';

    // Special handling for locations that exist in multiple buildings
    // Use building to determine which one
    if (name === 'Caribou Coffee') {
        if (building.includes('Central Market') || building.includes('Market Place')) {
            return { lat: 36.1239815, lng: -97.0737581 }; // Central Market Place
        } else {
            return { lat: 36.1217246, lng: -97.069926 }; // Student Union
        }
    }

    // First, try exact location name match
    const locationEntry = LOCATION_COORDINATES[name];
    if (locationEntry) {
        return {
            lat: locationEntry.lat,
            lng: locationEntry.lng
        };
    }

    // Try building-based matching with smart fallback
    let buildingKey = null;

    // Direct building name match
    if (BUILDING_COORDINATES[building]) {
        buildingKey = building;
    } else {
        // Fuzzy matching for building names
        for (const key of Object.keys(BUILDING_COORDINATES)) {
            if (building.includes(key) || key.includes(building) ||
                building.toLowerCase().includes(key.toLowerCase()) ||
                key.toLowerCase().includes(building.toLowerCase())) {
                buildingKey = key;
                break;
            }
        }
    }

    // Special cases for common variations
    if (!buildingKey) {
        if (building.includes('Union') || name.includes('Union')) {
            buildingKey = 'Student Union';
        } else if (building.includes('Market') && building.includes('Central')) {
            buildingKey = 'Central Market Place';
        } else if (building.includes('North') || building.includes('Adams')) {
            buildingKey = building.includes('Adams') ? 'Adams Market' : 'North Dining';
        } else if (building.includes('Bennett')) {
            buildingKey = 'Bennett Hall';
        } else if (building.includes('Library') || building.includes('Libro')) {
            buildingKey = 'Edmon Low Library';
        } else if (building.includes('Agricultural') || building.includes('Dairy')) {
            buildingKey = 'Agricultural Hall';
        } else if (building.includes('McElroy') || building.includes('VetMed') || building.includes('Barkin')) {
            buildingKey = 'McElroy VetMed Building';
        }
    }

    // Get building base coordinates
    if (buildingKey && BUILDING_COORDINATES[buildingKey]) {
        const baseCoords = BUILDING_COORDINATES[buildingKey];

        // Add small unique offset based on location name hash
        // This ensures different locations in same building don't overlap
        const nameHash = name.split('').reduce((hash, char) => {
            return ((hash << 5) - hash) + char.charCodeAt(0);
        }, 0);

        const offsetLat = (nameHash % 100) / 100000; // ~0.00001 to 0.0001 degree offset
        const offsetLng = ((nameHash >> 8) % 100) / 100000;

        return {
            lat: baseCoords.lat + offsetLat,
            lng: baseCoords.lng + offsetLng
        };
    }

    // Ultimate fallback - return original if valid, otherwise campus center
    if (location.coordinates?.lat && location.coordinates?.lng) {
        return location.coordinates;
    }

    // Default to OSU campus center if nothing matches
    return { lat: 36.1285, lng: -97.0673 };
}

/**
 * Get all building coordinates for reference
 */
export function getAllBuildingCoordinates() {
    return BUILDING_COORDINATES;
}

/**
 * Get all location coordinates for reference
 */
export function getAllLocationCoordinates() {
    return LOCATION_COORDINATES;
}

