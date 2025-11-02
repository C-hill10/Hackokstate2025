# Firestore Security Rules - Quick Fix

## The Problem

You're seeing: "Missing or insufficient permissions"

This means your Firestore security rules are blocking reads/writes.

## Quick Fix (For Demo/Hackathon)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `hackokstate25`
3. Click **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace the entire rules section with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

6. Click **Publish**

## What This Does

- Allows **all reads and writes** for the demo
- Perfect for hackathons/demos
- ⚠️ **Not for production** - this allows anyone to read/write

## For Production (Later)

After the demo, update to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dininglocations/{document=**} {
      allow read: if true;  // Anyone can read
      allow write: if request.auth != null;  // Only authenticated users can write
    }
  }
}
```

## Verify It Works

After publishing the rules:

1. Refresh your browser
2. Check the console - you should see `Firestore snapshot received: X documents`
3. The map and admin panel should load

## Collection Name Note

I noticed you changed the collection name to `'dininglocations'` (lowercase). Make sure:

- Your Firestore collection is named exactly `dininglocations` (lowercase)
- OR change it back to `diningLocations` (with capital L) if your Firestore collection uses that

The collection name must match exactly (case-sensitive)!
