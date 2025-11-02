# OSU Dining Locations Scraper

This script scrapes the OSU dining locations website and extracts all dining locations and their concepts for import into Firestore.

## Usage

Run the scraper script:

```bash
node scraper.js
```

The script will:

1. **Fetch main locations page** - Gets all dining locations from https://dining.okstate.edu/locations/
2. **Fetch hours page** - Gets operating hours from https://dining.okstate.edu/hours/fall-hours.html
3. **Scrape individual location pages** - For each location, fetches detailed information including:
   - Full menu structure with categories and items
   - Cuisine types
   - Grubhub availability
   - Map links
   - Enhanced descriptions
4. **Merge and format data** - Combines all information into Firestore-ready format
5. **Generate JSON files** - Creates `dining-locations.json` with complete data

## Output Files

- **`dining-locations.json`** - Complete data ready for Firestore import
- **`dining-locations-summary.json`** - Summary of scraped locations

## Data Structure

Each location entry follows the Firestore structure:

```json
{
  "name": "Bread & Beyond Deli",
  "building": "Student Union",
  "coordinates": {
    "lat": 36.125,
    "lng": -97.065
  },
  "status": "open",
  "crowdLevel": 50,
  "officialMenu": ["Sandwiches", "Salads", "Gourmet"],
  "liveMenu": [],
  "description": "Located in the Student Union, Bread & Beyond Deli offers gourmet sandwiches and salads.",
  "url": "bread-beyond-deli.html",
  "cuisine": ["Sandwiches", "Salads"],
  "hasGrubhub": true,
  "mapLink": "https://map.okstate.edu/?id=1842#!m/552753",
  "hours": [
    {
      "day": "Monday - Friday",
      "hours": "11 a.m. to 3 p.m."
    },
    {
      "day": "Saturday - Sunday",
      "hours": "Closed"
    }
  ],
  "detailedMenu": {
    "Sandwich Your Way": {
      "Choose Your Bread": [
        "Breads: ciabatta, white hoagie, wheat hoagie, 9-grain, basil focaccia, gluten-free bread",
        "Wraps: spinach, wheat"
      ],
      "Meats and Proteins": [
        "Meats: ham, turkey, roast beef, grilled chicken, chicken salad, tuna salad",
        "Vegetarian: egg salad, hummus"
      ]
    },
    "Salad Your Way": {
      "Choose Your Base": [
        "Spinach",
        "Spring Mix",
        "Shredded Cabbage",
        "Vegetable Quinoa Blend"
      ],
      "Choose Your Protein": [
        "Meats: ham, turkey, roast beef, grilled chicken, chicken salad, tuna salad",
        "Vegetarian: egg salad, hummus"
      ]
    }
  }
}
```

## Importing to Firestore

### Option 1: Manual Import via Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Firestore Database
3. Ensure collection `diningLocations` exists (or `dininglocations` - check your app code)
4. For each location in `dining-locations.json`:
   - Click "Add document"
   - Use the location name as the document ID (or let Firestore auto-generate)
   - Add fields from the JSON (be careful with types: coordinates is a map, officialMenu is an array)

### Option 2: Script Import (Node.js)

Create a simple import script:

```javascript
const admin = require("firebase-admin");
const locations = require("./dining-locations.json");

// Initialize Firebase Admin (requires service account)
admin.initializeApp({
  credential: admin.credential.cert("./service-account-key.json"),
});

const db = admin.firestore();

async function importLocations() {
  const batch = db.batch();

  locations.forEach((location) => {
    const ref = db.collection("diningLocations").doc();
    batch.set(ref, location);
  });

  await batch.commit();
  console.log(`Imported ${locations.length} locations`);
}

importLocations();
```

### Option 3: Use Firebase CLI with JSON Import

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Import data (requires proper Firestore export format)
# Note: This requires converting to Firestore export format
```

## Notes

- **Coordinates**: The script uses approximate coordinates. You may want to verify/update these with exact GPS coordinates for better map accuracy.
- **Crowd Levels**: Default crowd levels are randomly generated. Update these via the Admin Panel in your app.
- **Menu Items**: Menu items are extracted from descriptions using keyword matching. You may want to manually refine these.
- **Collection Name**: Check your app code - some use `diningLocations` (camelCase) and others use `dininglocations` (lowercase). Make sure the collection name matches what your app expects.

## Troubleshooting

**Script fails to fetch HTML:**

- Check your internet connection
- Verify the URL is still valid: https://dining.okstate.edu/locations/

**Parsing issues:**

- The website structure may have changed. Update the `parseHTML` function accordingly.

**Coordinates are inaccurate:**

- Update the `LOCATION_COORDINATES` object in `scraper.js` with verified GPS coordinates
- Or manually update coordinates in Firestore after import

## Updating Locations

Re-run the scraper periodically to catch new locations or changes:

```bash
node scraper.js
```

Then manually update Firestore or use an import script to merge new/changed locations.
