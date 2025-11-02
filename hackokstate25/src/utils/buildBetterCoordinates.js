/**
 * Better coordinate mapping for OSU dining locations
 * Based on building locations with more precise offsets
 */

// More accurate building coordinates with offsets for locations within same building
const BUILDING_COORDINATES = {
    // Adams Market / North Dining area
    'Adams Market': { base: { lat: 36.1285, lng: -97.0673 }, offsets: {} },
    'North Dining': { base: { lat: 36.1285, lng: -97.0673 }, offsets: {} },

    // Bennett Hall
    'Bennett Hall': { base: { lat: 36.1260, lng: -97.0680 }, offsets: {} },

    // Central Market Place
    'Central Market Place': { base: { lat: 36.1300, lng: -97.0650 }, offsets: {} },

    // Student Union - multiple locations, need different offsets
    'Student Union': {
        base: { lat: 36.1250, lng: -97.0650 },
        // Locations within Student Union with specific offsets
        offsets: {
            'Chick-fil-A': { lat: 0.0002, lng: -0.0001 },
            'Mambo Italiano': { lat: 0.0002, lng: 0.0001 },
            'Passport': { lat: 0.0003, lng: 0 },
            'Plaza Corner Cafe': { lat: -0.0002, lng: -0.0001 },
            'Red Earth Kitchen': { lat: -0.0002, lng: 0.0001 },
            'Shake Smart': { lat: 0.0001, lng: -0.0002 },
            'Union Chophouse Taqueria': { lat: 0, lng: 0.0002 },
            'Union Express': { lat: -0.0001, lng: 0.0002 },
            'Bread & Beyond Deli': { lat: 0.0001, lng: 0 },
            'Caribou Coffee': { lat: 0, lng: -0.0002 },
        }
    },

    // Library
    'Edmon Low Library': { base: { lat: 36.1250, lng: -97.0650 }, offsets: {} },
    'Other Campus Dining': { base: { lat: 36.1250, lng: -97.0650 }, offsets: {} },

    // Agricultural Hall
    'Agricultural Hall': { base: { lat: 36.1250, lng: -97.0680 }, offsets: {} },

    // McElroy/VetMed
    'McElroy VetMed Building': { base: { lat: 36.1300, lng: -97.0700 }, offsets: {} },
};

/**
 * Get better coordinates for a location based on building and location name
 */
export function getBetterCoordinates(location) {
    const building = location.building || '';
    const name = location.name || '';

    // Try to find building in our mapping
    let buildingKey = Object.keys(BUILDING_COORDINATES).find(
        key => building.includes(key) || key.includes(building)
    );

    // Fallback matching
    if (!buildingKey) {
        if (building.includes('Union') || building === 'Student Union') {
            buildingKey = 'Student Union';
        } else if (building.includes('Market') || building.includes('Central')) {
            buildingKey = 'Central Market Place';
        } else if (building.includes('Bennett')) {
            buildingKey = 'Bennett Hall';
        } else if (building.includes('North') || building.includes('Adams')) {
            buildingKey = 'North Dining';
        } else if (building.includes('Library') || building.includes('Libro')) {
            buildingKey = 'Edmon Low Library';
        } else if (building.includes('Agricultural') || building.includes('Dairy')) {
            buildingKey = 'Agricultural Hall';
        } else if (building.includes('McElroy') || building.includes('VetMed') || building.includes('Barkin')) {
            buildingKey = 'McElroy VetMed Building';
        }
    }

    if (buildingKey && BUILDING_COORDINATES[buildingKey]) {
        const buildingData = BUILDING_COORDINATES[buildingKey];
        let coords = { ...buildingData.base };

        // Check for location-specific offset within building
        if (buildingKey === 'Student Union' && buildingData.offsets[name]) {
            const offset = buildingData.offsets[name];
            coords.lat += offset.lat;
            coords.lng += offset.lng;
        }

        return coords;
    }

    // Fallback to original coordinates if we have them
    return location.coordinates || { lat: 36.1285, lng: -97.0673 };
}

