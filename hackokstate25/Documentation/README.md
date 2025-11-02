# 🍽️ Pete's Plate & Pace

**Real-time OSU Dining Intelligence Dashboard**

A live dashboard for Oklahoma State University dining that shows real-time crowd levels, menus, and AI-powered recommendations.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase account (free tier works)
- Git

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project (or use existing)
   - Enable **Firestore Database** (start in test mode for development)
   - Go to Project Settings > General > Your apps
   - Add a web app if you haven't already
   - Copy your Firebase config values

3. **Configure Firebase:**
   - Open `src/firebase/config.js`
   - Replace the placeholder values with your Firebase config:
     ```javascript
     const firebaseConfig = {
       apiKey: "your-actual-api-key",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       // ... etc
     }
     ```

4. **Set up Firestore data:**
   - In Firebase Console, go to Firestore Database
   - Create a collection named: `diningLocations`
   - Add documents following the structure in [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md)

5. **Run the app:**
   ```bash
   npm run dev
   ```
   - Open http://localhost:5173 in your browser

## 📁 Project Structure

```
petes-plate-pace/
├── src/
│   ├── components/
│   │   ├── MapView.jsx          # Main map component
│   │   ├── LocationMarker.jsx   # Map markers with popups
│   │   ├── AdminPanel.jsx       # Admin controls for crowd levels
│   │   └── About.jsx            # About page
│   ├── firebase/
│   │   └── config.js            # Firebase configuration
│   ├── App.jsx                  # Main app with routing
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── package.json
├── vite.config.js
└── README.md
```

## 🎯 Features

### Phase 1: Core Demo ✅
- [x] Real-time map with OSU dining locations
- [x] Color-coded markers based on crowd levels (Green/Yellow/Red)
- [x] Admin panel with sliders to update crowd levels
- [x] Live updates via Firestore listeners

### Phase 2: Plate Finder (Next Steps)
- [ ] Menu display in location popups
- [ ] Crowdsourcing form for live menu updates
- [ ] Rules-based filtering ("In a hurry?", "Craving Pizza?")

### Phase 3: Wow Features (Stretch Goals)
- [ ] Web scraper (Cloud Function) for automatic menu updates
- [ ] LLM-based AI recommendations

## 🔧 Firebase Setup

### Firestore Collection: `diningLocations`

Each document should follow this structure:

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
      "time": "2025-11-01T15:30:00Z"
    }
  ]
}
```

See [FIRESTORE_SETUP.md](./FIRESTORE_SETUP.md) for detailed setup instructions.

## 🎨 Usage

### Main Map View
- Navigate to `/` to see the interactive map
- Click on any marker to see location details, menu, and crowd level
- Colors indicate crowd levels:
  - 🟢 Green: Low (< 30%)
  - 🟡 Yellow: Medium (30-70%)
  - 🔴 Red: High (≥ 70%)

### Admin Panel
- Navigate to `/admin` to control crowd levels
- Move sliders to update crowd levels in real-time
- Open the admin panel and main map side-by-side to see instant updates!

## 🛠️ Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Dependencies

- **React 18** - UI framework
- **React Router** - Routing
- **Firebase** - Real-time database
- **React Leaflet** - Interactive maps
- **Leaflet** - Map library
- **Vite** - Build tool

## 🚢 Deployment

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables if needed
4. Deploy!

### Option 2: Netlify

1. Push code to GitHub
2. Import project on [Netlify](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy!

### Option 3: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Follow prompts
npm run build
firebase deploy
```

## 🎓 Hackathon Demo Tips

1. **The Wow Moment:**
   - Open the app on one screen
   - Open `/admin` on another screen
   - Move the slider → Watch the map update instantly!

2. **Pitch Points:**
   - "Real-time" is the key word - emphasize instant updates
   - Show the problem-solution fit: busy students need this
   - Highlight the "Local Impact" - solves a real OSU problem

3. **Backup Plan:**
   - If scraper fails, use manual admin panel (already built!)
   - Test everything before the demo
   - Have sample data ready

## 📝 License

Built for HackOkState 2025

## 👥 Team

Created with ❤️ for the OSU community
