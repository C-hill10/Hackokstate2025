# Firestore Database Setup Guide

This guide will help you set up the Firestore database for Pete's Plate & Pace.

## Step 1: Create Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on "Firestore Database" in the left sidebar
4. Click "Create database"
5. Select "Start in test mode" (for development)
   - **Note:** For production, you'll want to set up proper security rules
6. Choose a location (pick the closest to your region)
7. Click "Enable"

## Step 2: Create the Collection

1. In Firestore Database, click "Start collection"
2. Collection ID: `diningLocations`
3. Click "Next"

## Step 3: Add Your First Document

### Document 1: Kerr-Drummond

Click "Add document" and add these fields:

| Field Name | Type | Value |
|------------|------|-------|
| `name` | string | `Kerr-Drummond` |
| `coordinates` | map | Create a map with: |
| | `lat` (number) | `36.1285` |
| | `lng` (number) | `-97.0673` |
| `status` | string | `open` |
| `crowdLevel` | number | `50` |
| `officialMenu` | array | Click "Add field" → Type: `array` → Add items: `Pizza`, `Salad Bar`, `Burgers` |
| `liveMenu` | array | Leave empty or add example entries (see below) |

### Document 2: Union Market

Add another document:

| Field Name | Type | Value |
|------------|------|-------|
| `name` | string | `Union Market` |
| `coordinates` | map | |
| | `lat` (number) | `36.1250` |
| | `lng` (number) | `-97.0650` |
| `status` | string | `open` |
| `crowdLevel` | number | `30` |
| `officialMenu` | array | `Sandwiches`, `Sushi`, `Starbucks`, `Salads` |
| `liveMenu` | array | (empty or add examples) |

### Document 3: 38th Street Market

Add another document:

| Field Name | Type | Value |
|------------|------|-------|
| `name` | string | `38th Street Market` |
| `coordinates` | map | |
| | `lat` (number) | `36.1300` |
| | `lng` (number) | `-97.0700` |
| `status` | string | `open` |
| `crowdLevel` | number | `75` |
| `officialMenu` | array | `Grill`, `Pizza`, `Deli`, `Bakery` |
| `liveMenu` | array | (empty or add examples) |

## Step 4: Adding Live Menu Entries (Optional)

If you want to add example `liveMenu` entries, the array should contain maps/objects:

1. Click on the `liveMenu` field
2. Click "Add item"
3. Create a map with:
   - `item` (string): e.g., `"Amazing Tacos!"`
   - `user` (string): e.g., `"PistolPete"`
   - `time` (timestamp): Use "Set timestamp" button and pick a recent date

## Data Structure Reference

Here's the complete structure as JSON:

```json
{
  "name": "Kerr-Drummond",
  "coordinates": {
    "lat": 36.1285,
    "lng": -97.0673
  },
  "status": "open",
  "crowdLevel": 50,
  "officialMenu": ["Pizza", "Salad Bar", "Burgers"],
  "liveMenu": [
    {
      "item": "Amazing Tacos!",
      "user": "PistolPete",
      "time": "2025-01-15T15:30:00Z"
    }
  ]
}
```

## Field Types Cheat Sheet

- **string**: Text field
- **number**: Numeric field (for `crowdLevel`, `lat`, `lng`)
- **map**: Object/nested structure (for `coordinates`)
- **array**: List of items (for `officialMenu`, `liveMenu`)
- **timestamp**: Date/time (for `liveMenu[].time`)

## Testing Your Setup

After setting up the data:

1. Run `npm run dev`
2. Navigate to http://localhost:5173
3. You should see markers on the map for each location
4. Click on markers to see the popup with location info
5. Navigate to `/admin` and try moving the sliders

## Troubleshooting

**No markers appear on the map:**
- Check browser console for errors
- Verify Firebase config in `src/firebase/config.js`
- Make sure collection name is exactly `diningLocations` (case-sensitive)
- Check that documents have `coordinates.lat` and `coordinates.lng` fields

**Admin panel shows "No dining locations found":**
- Verify collection name is `diningLocations`
- Check Firebase config is correct
- Look for errors in browser console

**Changes don't update in real-time:**
- Make sure you're using `onSnapshot` (already implemented)
- Check Firestore security rules allow read/write (test mode should work)

## Security Rules (For Production)

When ready to deploy, update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /diningLocations/{document=**} {
      allow read: if true;  // Anyone can read
      allow write: if request.auth != null;  // Only authenticated users can write
    }
  }
}
```

For the hackathon demo, test mode is fine!
