# Troubleshooting Guide

## Pages Appear Empty

### 1. Check Browser Console (F12)

The app now logs helpful information. Look for:

- `Firestore snapshot received: X documents` - tells you if data is being fetched
- `Location data: [document-id] [data]` - shows what data was received
- Any red error messages

### 2. Verify Firebase Config

Make sure `src/firebase/config.js` has:

- ✅ `import { getFirestore } from "firebase/firestore"`
- ✅ Your actual Firebase project config values
- ✅ `export const db = getFirestore(app)`

### 3. Check Firestore Security Rules

Go to Firebase Console > Firestore Database > Rules

**For development/demo, use:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // Allows all reads/writes
    }
  }
}
```

**For production, use:**

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

### 4. Verify Collection and Document Structure

**Collection name:** Must be exactly `diningLocations` (case-sensitive!)

**Required fields in each document:**

```javascript
{
  "name": "Kerr-Drummond",           // string
  "coordinates": {                    // map
    "lat": 36.1285,                  // number
    "lng": -97.0673                  // number
  },
  "status": "open",                  // string ("open" or "closed")
  "crowdLevel": 50                   // number (0-100)
}
```

**Optional fields:**

```javascript
{
  "officialMenu": ["Pizza", "Burgers"],  // array of strings
  "liveMenu": [...]                       // array of maps
}
```

### 5. Check Data Types

**Common mistakes:**

- ❌ `coordinates.lat` as string `"36.1285"` → Should be number `36.1285`
- ❌ `crowdLevel` as string `"50"` → Should be number `50`
- ❌ Collection name has spaces or wrong casing

### 6. Verify Document Exists

In Firebase Console:

1. Go to Firestore Database
2. Click on `diningLocations` collection
3. You should see at least one document
4. Click on the document to see its fields

### 7. Test Firestore Connection

Open browser console and run:

```javascript
// This should work if Firebase is configured correctly
import { db } from "./src/firebase/config.js";
import { collection, getDocs } from "firebase/firestore";

getDocs(collection(db, "diningLocations"))
  .then((snapshot) => {
    console.log("Documents:", snapshot.size);
    snapshot.forEach((doc) => {
      console.log(doc.id, doc.data());
    });
  })
  .catch((error) => {
    console.error("Error:", error);
  });
```

## Common Errors

### "FirebaseError: Missing or insufficient permissions"

**Fix:** Update Firestore security rules (see #3 above)

### "Firebase: Error (auth/invalid-api-key)"

**Fix:** Check your Firebase config in `src/firebase/config.js`

### Map loads but no markers appear

**Check:**

- Documents have `coordinates.lat` and `coordinates.lng` (as numbers!)
- Coordinates are valid (lat: -90 to 90, lng: -180 to 180)

### Admin panel shows "No locations found"

**Check:**

- Collection name is exactly `diningLocations`
- Documents have required fields (name, coordinates, crowdLevel, status)
- Check browser console for logs

## Quick Verification Checklist

- [ ] Firebase config is correct in `src/firebase/config.js`
- [ ] `getFirestore` is imported
- [ ] Firestore is enabled in Firebase Console
- [ ] Collection name is `diningLocations` (exact match)
- [ ] At least one document exists in the collection
- [ ] Document has: name, coordinates (lat/lng as numbers), crowdLevel, status
- [ ] Firestore rules allow reads
- [ ] Browser console shows no errors
- [ ] Browser console shows `Firestore snapshot received: X documents`

## Still Having Issues?

1. **Check the browser console** - the app now logs helpful debugging info
2. **Verify your data structure** matches the example exactly
3. **Try adding a new document** in Firebase Console to test
4. **Check network tab** - see if Firestore requests are being made
5. **Restart dev server** - `Ctrl+C` then `npm run dev`

## Need Help?

The app now shows helpful error messages on the page itself. Look for:

- Error messages with red borders
- "No locations found" messages with checklists
- Console logs showing what data is being received
