/**
 * Geocoding utility for OSU dining locations
 * Uses building addresses to get accurate coordinates
 * 
 * Note: For production, use Google Maps Geocoding API or similar service
 */

// Known OSU building addresses (Stillwater, OK)
const BUILDING_ADDRESSES = {
    'Student Union': '408 Student Union, Stillwater, OK 74078',
    'North Dining': '324 N Hester St, Stillwater, OK 74075',
    'Central Market Place': '1515 W Hall of Fame Ave, Stillwater, OK 74075',
    'Bennett Hall': '1105 W University Ave, Stillwater, OK 74074',
    'Adams Market': '324 N Hester St, Stillwater, OK 74075', // Same as North Dining area
    'Edmon Low Library': '408 Library Ln, Stillwater, OK 74078',
    'Agricultural Hall': '300 Agricultural Hall, Stillwater, OK 74078',
    'McElroy VetMed Building': '1930 W Farm Rd, Stillwater, OK 74074',
};

/**
 * Get coordinates from Google Maps URL or use manual lookup
 * This is a fallback - in production, use proper geocoding API
 */
export async function geocodeBuilding(buildingName) {
    // For now, return manual coordinates
    // In production: Call Google Maps Geocoding API with BUILDING_ADDRESSES[buildingName]

    // Manual coordinates based on research (more accurate)
    const manualCoords = {
        'Student Union': { lat: 36.1249, lng: -97.0649 },
        'North Dining': { lat: 36.1287, lng: -97.0669 },
        'Central Market Place': { lat: 36.1303, lng: -97.0647 },
        'Bennett Hall': { lat: 36.1256, lng: -97.0677 },
        'Adams Market': { lat: 36.1287, lng: -97.0669 },
        'Edmon Low Library': { lat: 36.1248, lng: -97.0648 },
        'Agricultural Hall': { lat: 36.1254, lng: -97.0678 },
        'McElroy VetMed Building': { lat: 36.1300, lng: -97.0701 },
    };

    return manualCoords[buildingName] || null;
}

