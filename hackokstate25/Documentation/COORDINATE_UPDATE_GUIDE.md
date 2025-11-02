# Coordinate Accuracy Update Guide

## Problem

The scraped coordinates were approximate building-level coordinates, causing:

- Many locations sharing the same coordinates
- Only 4 markers visible (overlapping)
- Inaccurate positioning on the map

## Solution

Created an accurate coordinate system (`src/utils/accurateOSUCoordinates.js`) that:

1. **Uses precise location coordinates** - Each dining location has its own GPS coordinates
2. **Building-based fallback** - If a location isn't in the database, uses building coordinates with unique offsets
3. **Automatic offset system** - Prevents overlapping markers even in the same building

## How It Works

### Priority System:

1. **Exact location match** - Checks if location name has specific coordinates
2. **Building match** - Uses building base coordinates with unique offset
3. **Fallback** - Uses original coordinates or campus center

### Current Coverage:

✅ All 27 dining locations have accurate coordinates
✅ Buildings properly mapped:

- Adams Market
- Bennett Hall
- Central Market Place
- North Dining
- Student Union (with 10 location offsets)
- Edmon Low Library
- Agricultural Hall
- McElroy VetMed Building

## Adding/Updating Coordinates

To update coordinates for a location, edit `src/utils/accurateOSUCoordinates.js`:

```javascript
const LOCATION_COORDINATES = {
  'Location Name': { lat: 36.XXXX, lng: -97.XXXX },
  // Add or update entries here
};
```

Or update building base coordinates:

```javascript
const BUILDING_COORDINATES = {
  'Building Name': { lat: 36.XXXX, lng: -97.XXXX },
};
```

## Verifying Coordinates

1. Open the app map
2. Click on markers to verify they're in the correct location
3. Compare with OSU campus map: https://map.okstate.edu
4. Adjust coordinates in `accurateOSUCoordinates.js` if needed

## Coordinate Format

- **Latitude**: ~36.1250 to 36.1310 (OSU campus range)
- **Longitude**: ~-97.0650 to -97.0710 (OSU campus range)
- Use 4-6 decimal places for precision (~1-10 meter accuracy)

## Testing

After updating coordinates:

1. Refresh the browser
2. Check all 27 markers are visible
3. Verify markers are positioned correctly on the map
4. Test that markers don't overlap unnecessarily
