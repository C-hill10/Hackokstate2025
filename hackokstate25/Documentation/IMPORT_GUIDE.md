# Quick Import Guide

## Option 1: Using the Import Script (Recommended)

### Prerequisites

1. Install Firebase Admin SDK:

   ```bash
   npm install firebase-admin
   ```

2. Get Service Account Key:

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `hackokstate25`
   - Click ⚙️ Settings > Project Settings
   - Go to "Service Accounts" tab
   - Click "Generate New Private Key"
   - Save as `service-account-key.json` in project root

3. Run the import script:
   ```bash
   node import-to-firestore.js
   ```

The script will:

- Import all locations from `dining-locations.json`
- Use collection name: `dininglocations` (lowercase)
- Include all scraped data: building, hours, detailedMenu, mapLink, etc.
- Create document IDs from location names

## Option 2: Manual Import via Firebase Console

1. Go to Firebase Console > Firestore Database
2. Click on `dininglocations` collection (or create it)
3. For each location in `dining-locations.json`:
   - Click "Add document"
   - Document ID: Use location name (lowercase, hyphens) or auto-generate
   - Add fields:

### Required Fields:

- `name` (string): Location name
- `coordinates` (map):
  - `lat` (number): Latitude
  - `lng` (number): Longitude
- `status` (string): "open" or "closed"
- `crowdLevel` (number): 0-100

### Optional Fields (from scraper):

- `building` (string): Building name
- `description` (string): Location description
- `officialMenu` (array): Menu categories
- `liveMenu` (array): User-submitted items
- `mapLink` (string): Campus map URL
- `hasGrubhub` (boolean): Grubhub availability
- `hours` (array): Operating hours
- `detailedMenu` (map): Full menu structure
- `url` (string): OSU dining URL
- `cuisine` (array): Cuisine types

## What the Enhanced App Shows

After importing, the map popups will display:

- ✅ Building location
- ✅ Operating hours
- ✅ Full descriptions
- ✅ Menu categories (expandable)
- ✅ Detailed menu items
- ✅ Grubhub availability badge
- ✅ Link to campus map
- ✅ Crowd level and status

## Verify Import

1. Open your app: `http://localhost:5173`
2. You should see all 30+ dining locations on the map
3. Click any marker to see the enhanced popup with all details
4. Check Admin Panel: `/admin` should show all locations

## Troubleshooting

**"No locations found":**

- Verify collection name is `dininglocations` (lowercase)
- Check Firestore console - documents should be there
- Check browser console for errors

**Map shows no markers:**

- Verify coordinates are numbers (not strings) in Firestore
- Check that `coordinates.lat` and `coordinates.lng` exist

**Import script fails:**

- Check `service-account-key.json` exists
- Verify file is in project root
- Make sure `dining-locations.json` exists
