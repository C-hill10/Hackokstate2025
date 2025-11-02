# 🍽️ Pete's Plate & Pace

**Real-time OSU Dining Intelligence Dashboard**

A comprehensive web application built for Oklahoma State University that provides real-time crowd levels, interactive maps, AI-powered food recommendations, and smart search capabilities to help students find the best dining options on campus.

![Status](https://img.shields.io/badge/status-ready-green)
![Built for](https://img.shields.io/badge/built%20for-HackOkState%202025-orange)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Features in Detail](#features-in-detail)
- [Firebase Setup](#firebase-setup)
- [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Pete's Plate & Pace is a real-time dining dashboard designed specifically for Oklahoma State University students. It helps students make informed decisions about where to eat by providing:

- **Live crowd level data** - See how busy each location is in real-time
- **Interactive campus map** - Visualize all dining locations on an OSU campus map
- **AI-powered recommendations** - Get personalized suggestions based on time, location, and preferences
- **Smart food search** - Find locations serving specific foods or filter by crowd level
- **Menu information** - View official menus, live crowd-sourced updates, and detailed menu items
- **Distance calculations** - See how far each location is from your current position

## ✨ Features

### 🗺️ Interactive Map
- Real-time map showing all OSU dining locations
- Color-coded markers based on crowd levels:
  - 🟢 Green: Low crowd (< 30%)
  - 🟡 Yellow: Medium crowd (30-70%)
  - 🔴 Red: High crowd (≥ 70%)
- Click markers to view detailed location information
- Auto-zoom to filtered search results
- Responsive map controls with legend

### 🤖 AI Food Recommender
- **Time-based recommendations** - Considers breakfast, lunch, dinner, and late-night options
- **Location-aware** - Factors in your distance from each location
- **Crowd level analysis** - Prioritizes locations with lower crowds
- **Menu matching** - Matches recommendations to your food preferences
- **Personalized messaging** - Provides contextual recommendations based on current time
- **Top 5 recommendations** with detailed reasoning for each suggestion

### 🔍 Smart Food Finder
- **Search by food type** - Find locations serving specific items (e.g., "Pizza", "Coffee", "Salad")
- **Quick filters**:
  - **In a Hurry** - Finds nearby locations with low crowd levels (< 50%)
  - **Least Crowded** - Shows all locations sorted by crowd level
- **Comprehensive menu search** - Searches across official menus, live menus, and detailed menu structures
- **Distance and walk time** - Shows distance in miles and estimated walking time
- **Sorting intelligence** - Results sorted by relevance, crowd level, and distance

### 📊 Admin Panel
- Real-time crowd level management
- Slider controls for updating crowd levels
- Live updates across all connected clients
- Easy-to-use interface for dining staff

### 👥 Crowdsourcing
- User-submitted menu updates
- Live menu items with timestamps
- Community-driven content updates
- Form integrated into location popups

### 📍 Location Details
Each location popup includes:
- Name and building information
- Current status (open/closed)
- Real-time crowd level with color indicators
- Official menu items
- Live menu updates (crowdsourced)
- Detailed menu by category
- Operating hours
- Grubhub availability (if applicable)
- Distance from your location
- Direct map links

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **React Router v6** - Client-side routing
- **React Leaflet** - Interactive map components
- **Leaflet** - Open-source mapping library

### Backend & Database
- **Firebase Firestore** - Real-time NoSQL database
- **Firebase Admin SDK** - Server-side operations
- **Firebase Realtime Listeners** - Instant data synchronization

### Utilities
- **Haversine Formula** - Accurate distance calculations
- **Geolocation API** - User location detection
- **Custom coordinate system** - OSU campus-specific coordinate handling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase account (free tier works)
- Modern web browser with geolocation support

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Hackokstate2025/hackokstate25
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project (or use existing)
   - Enable **Firestore Database** (start in test mode for development)
   - Get your Firebase config from Project Settings > General > Your apps

4. **Configure Firebase:**
   - Open `src/firebase/config.js`
   - Replace placeholder values with your Firebase config:
     ```javascript
     const firebaseConfig = {
       apiKey: "your-api-key",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "123456789",
       appId: "your-app-id"
     }
     ```

5. **Set up Firestore data:**
   - Create a collection named `dininglocations`
   - Add location documents following the structure in [Documentation/FIRESTORE_SETUP.md](hackokstate25/Documentation/FIRESTORE_SETUP.md)
   - See the documentation for detailed schema information

6. **Run the development server:**
   ```bash
   npm run dev
   ```
   - Open http://localhost:5173 in your browser

For detailed setup instructions, see [Documentation/SETUP_INSTRUCTIONS.md](hackokstate25/Documentation/SETUP_INSTRUCTIONS.md).

## 📁 Project Structure

```
Hackokstate2025/
├── hackokstate25/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapView.jsx           # Main map component
│   │   │   ├── LocationMarker.jsx   # Map markers with popups
│   │   │   ├── FoodFinder.jsx       # Search and filter component
│   │   │   ├── AIRecommendation.jsx # AI recommendation engine
│   │   │   ├── AdminPanel.jsx       # Admin controls for crowd levels
│   │   │   ├── CrowdsourceForm.jsx  # User menu submission form
│   │   │   ├── About.jsx            # About page
│   │   │   └── *.css               # Component styles
│   │   ├── firebase/
│   │   │   └── config.js            # Firebase configuration
│   │   ├── utils/
│   │   │   ├── accurateOSUCoordinates.js  # OSU coordinate system
│   │   │   └── coordinateOffset.js        # Marker offset handling
│   │   ├── App.jsx                  # Main app with routing
│   │   ├── App.css                  # Global app styles
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Base styles
│   ├── Documentation/              # Comprehensive documentation
│   │   ├── README.md
│   │   ├── SETUP_INSTRUCTIONS.md
│   │   ├── FIRESTORE_SETUP.md
│   │   ├── DEPLOYMENT.md
│   │   ├── PROJECT_STATUS.md
│   │   └── ...
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
└── README.md (this file)
```

## 🎯 Features in Detail

### AI Recommendation Engine

The AI recommendation system uses a sophisticated scoring algorithm that considers:

1. **Distance (30 points max)** - Closer locations score higher
2. **Crowd Level (25 points max)** - Lower crowds score higher
3. **Meal Context (20 points max)** - Matches recommendations to time of day:
   - Breakfast: eggs, pancakes, waffles, coffee, bagels
   - Lunch: sandwiches, salads, pizza, burgers, wraps
   - Dinner: pasta, grilled items, entrees, bowls
   - Late-night: grab-and-go, snacks, coffee
   - Afternoon: coffee, snacks, desserts, smoothies
4. **Preference Matching (15 points max)** - Matches user food preferences
5. **Variety (10 points max)** - Locations with more menu items score higher

The system generates personalized messages and provides detailed reasoning for each recommendation.

### Food Search System

The search functionality includes:

- **Multi-source menu search** - Searches across:
  - Official menu arrays
  - Live menu (crowdsourced) items
  - Detailed menu structures (nested categories)
- **Smart filtering** - Filters only open locations
- **Intelligent sorting**:
  - "In a Hurry": Distance first, then crowd level
  - "Least Crowded": Crowd level first, then distance
  - "Craving": Crowd level first, then distance
- **Real-time distance calculations** using the Haversine formula
- **Walk time estimates** (20 minutes per mile average)

### Coordinate System

The application uses a sophisticated coordinate system:

- **Accurate OSU coordinates** - Custom mapping of building names to precise coordinates
- **Coordinate offset system** - Prevents marker overlap when multiple locations share coordinates
- **Fallback handling** - Uses scraped coordinates when accurate coordinates aren't available

## 🔥 Firebase Setup

### Firestore Collection: `dininglocations`

Each document should follow this structure:

```json
{
  "name": "Kerr-Drummond",
  "building": "Kerr-Drummond Hall",
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
  ],
  "detailedMenu": {
    "Breakfast": ["Eggs", "Bacon", "Pancakes"],
    "Lunch": ["Pizza", "Salad", "Sandwiches"],
    "Dinner": ["Grilled Chicken", "Pasta", "Soup"]
  },
  "hours": [
    {"day": "Monday", "open": "7:00 AM", "close": "10:00 PM"}
  ],
  "hasGrubhub": true,
  "mapLink": "https://maps.google.com/...",
  "description": "Description of the location"
}
```

For detailed Firestore setup instructions, see [Documentation/FIRESTORE_SETUP.md](hackokstate25/Documentation/FIRESTORE_SETUP.md).

### Security Rules

Ensure your Firestore security rules allow read access. For development, you can use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dininglocations/{document=**} {
      allow read: if true;
      allow write: if false; // Admin panel should use authenticated write
    }
  }
}
```

For production rules, see [Documentation/FIRESTORE_RULES.md](hackokstate25/Documentation/FIRESTORE_RULES.md).

## 💻 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Tips

1. **Real-time testing**: Open the map view and admin panel side-by-side to see real-time updates
2. **Browser console**: Check for Firestore connection logs and errors
3. **Firebase emulator**: Consider using Firebase emulators for local development
4. **Coordinate accuracy**: Use the coordinate helper tools in the Documentation folder

### Code Style

- Uses functional React components with hooks
- CSS modules for component styling
- ES6+ JavaScript features
- Descriptive variable and function names

## 🚢 Deployment

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables if needed
4. Deploy automatically on push

### Option 2: Netlify

1. Push code to GitHub
2. Import project on [Netlify](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `dist`

### Option 3: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Follow prompts
npm run build
firebase deploy
```

For detailed deployment instructions, see [Documentation/DEPLOYMENT.md](hackokstate25/Documentation/DEPLOYMENT.md).

## 📚 Documentation

Comprehensive documentation is available in the `hackokstate25/Documentation/` folder:

- **[README.md](hackokstate25/Documentation/README.md)** - Main documentation
- **[SETUP_INSTRUCTIONS.md](hackokstate25/Documentation/SETUP_INSTRUCTIONS.md)** - Quick setup guide
- **[FIRESTORE_SETUP.md](hackokstate25/Documentation/FIRESTORE_SETUP.md)** - Database setup details
- **[DEPLOYMENT.md](hackokstate25/Documentation/DEPLOYMENT.md)** - Deployment instructions
- **[PROJECT_STATUS.md](hackokstate25/Documentation/PROJECT_STATUS.md)** - Current project status
- **[TROUBLESHOOTING.md](hackokstate25/Documentation/TROUBLESHOOTING.md)** - Common issues and solutions
- **[COORDINATE_UPDATE_GUIDE.md](hackokstate25/Documentation/COORDINATE_UPDATE_GUIDE.md)** - How to update coordinates
- **[IMPORT_GUIDE.md](hackokstate25/Documentation/IMPORT_GUIDE.md)** - Importing location data
- **[SCRAPER_README.md](hackokstate25/Documentation/SCRAPER_README.md)** - Web scraper documentation

## 🎓 Demo Tips

### The "Wow" Moment

1. **Two-screen demo**:
   - Open the main map on one screen
   - Open the admin panel on another screen
   - Move the crowd level slider → Watch the map update instantly!

2. **AI Recommendations**:
   - Show how recommendations change based on time of day
   - Demonstrate preference matching
   - Highlight the reasoning behind each recommendation

3. **Smart Search**:
   - Search for specific foods ("Pizza", "Coffee")
   - Use quick filters ("In a Hurry", "Least Crowded")
   - Show distance and walk time calculations

### Pitch Points

- **Real-time** - Emphasize instant updates across all devices
- **Problem-solution fit** - Busy students need this information
- **Local impact** - Solves a real OSU campus problem
- **Smart technology** - AI recommendations, distance calculations, intelligent filtering

## 🤝 Contributing

This project was built for HackOkState 2025. Contributions and improvements are welcome!

### Areas for Future Enhancement

- [ ] Web scraper for automatic menu updates
- [ ] LLM-based AI recommendations (OpenAI/Gemini integration)
- [ ] User authentication and personalized preferences
- [ ] Mobile app version
- [ ] Historical crowd level analytics
- [ ] Push notifications for crowd level changes
- [ ] Integration with OSU dining services API

## 📝 License

Built for HackOkState 2025

## 👥 Team

Created with ❤️ for the OSU community

## 🙏 Acknowledgments

- Oklahoma State University for the inspiration
- Firebase for the real-time database platform
- Leaflet and OpenStreetMap for mapping services
- The React community for excellent tools and libraries

---

**Need help?** Check the [Documentation](hackokstate25/Documentation/) folder or open an issue on GitHub.

