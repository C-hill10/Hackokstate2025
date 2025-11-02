# 🚀 Quick Setup Instructions

Follow these steps to get Pete's Plate & Pace running in 10 minutes!

## Step 1: Install Dependencies (2 min)

```bash
npm install
```

## Step 2: Set Up Firebase (5 min)

1. **Create Firebase Project:**
   - Go to https://console.firebase.google.com/
   - Click "Add project"
   - Name it (e.g., "petes-plate-pace")
   - Disable Google Analytics (optional, for speed)
   - Click "Create project"

2. **Enable Firestore:**
   - In Firebase Console, click "Firestore Database"
   - Click "Create database"
   - Select "Start in test mode"
   - Choose a location (pick closest)
   - Click "Enable"

3. **Get Your Config:**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Click "Project settings"
   - Scroll down to "Your apps"
   - Click the `</>` (web) icon
   - Register app (name it anything)
   - Copy the `firebaseConfig` values

4. **Update Config File:**
   - Open `src/firebase/config.js`
   - Replace the placeholder values with your actual Firebase config

## Step 3: Add Sample Data (3 min)

1. **In Firestore Console:**
   - Click "Start collection"
   - Collection ID: `diningLocations`
   - Click "Next"

2. **Add Document 1:**
   - Document ID: Leave auto-generated
   - Add fields:
     - `name` (string): `Kerr-Drummond`
     - `coordinates` (map):
       - `lat` (number): `36.1285`
       - `lng` (number): `-97.0673`
     - `status` (string): `open`
     - `crowdLevel` (number): `50`
     - `officialMenu` (array): Add `Pizza`, `Salad Bar`, `Burgers`
   - Click "Save"

3. **Add Document 2:**
   - Click "Add document"
   - Add fields:
     - `name` (string): `Union Market`
     - `coordinates` (map):
       - `lat` (number): `36.1250`
       - `lng` (number): `-97.0650`
     - `status` (string): `open`
     - `crowdLevel` (number): `30`
     - `officialMenu` (array): `Sandwiches`, `Sushi`, `Starbucks`
   - Click "Save"

## Step 4: Run the App (30 sec)

```bash
npm run dev
```

Open http://localhost:5173 in your browser!

## ✅ Verify It Works

1. **Map View:**
   - You should see markers on the map
   - Click a marker to see the popup
   - Colors indicate crowd levels

2. **Admin Panel:**
   - Go to http://localhost:5173/admin
   - You should see your locations with sliders
   - Move a slider → Watch it update!

3. **Real-time Test:**
   - Open two browser windows:
     - Window 1: http://localhost:5173 (map)
     - Window 2: http://localhost:5173/admin
   - Move slider in admin panel
   - Watch map update in real-time! 🎉

## 🐛 Troubleshooting

**"No dining locations found"**
- Check collection name is exactly `diningLocations`
- Verify Firebase config in `src/firebase/config.js`
- Check browser console for errors

**Map doesn't load**
- Check browser console
- Verify Firestore has data
- Make sure coordinates are numbers (not strings)

**Build errors**
- Delete `node_modules` and run `npm install` again
- Make sure you have Node.js 18+

## 📚 Next Steps

- See [README.md](./README.md) for full documentation
- See [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md) for detailed Firestore setup
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions

## 🎯 Ready for Demo?

1. ✅ Map shows markers
2. ✅ Admin panel has sliders
3. ✅ Real-time updates work
4. ✅ Popups show location info

**You're ready to demo Phase 1!** 🚀
