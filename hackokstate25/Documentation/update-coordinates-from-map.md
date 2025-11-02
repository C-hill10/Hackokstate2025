# How to Get Accurate Coordinates from OSU Campus Map

## Method 1: Using OSU Interactive Map

1. Go to https://map.okstate.edu
2. Search for each building (e.g., "Student Union", "North Dining")
3. Right-click on the building marker
4. Look for coordinates in the URL or info panel
5. Copy the lat/lng values

## Method 2: Using Google Maps Geocoding

1. Get building addresses:

   - Student Union: 408 Student Union, Stillwater, OK 74078
   - North Dining: 324 N Hester St, Stillwater, OK 74075
   - Central Market Place: 1515 W Hall of Fame Ave, Stillwater, OK 74075
   - etc.

2. Use Google Maps to find exact coordinates:
   - Search address in Google Maps
   - Right-click on the pin
   - Select coordinates to copy lat/lng

## Method 3: Extract from OSU Map Links

The map links in your data like `https://map.okstate.edu/?id=1842#!m/552753` contain location IDs.
You can try to extract coordinates by:

1. Opening the link
2. Inspecting the page/network requests
3. Finding coordinate data in the response

## Quick Update

Edit `src/utils/accurateOSUCoordinates.js` and update the coordinates:

```javascript
const BUILDING_COORDINATES = {
  "Student Union": { lat: YOUR_LAT, lng: YOUR_LNG },
  // etc.
};
```
