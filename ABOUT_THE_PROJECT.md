## Inspiration

As OSU students, we've all experienced the frustration of walking across campus to a dining hall only to find a 20-minute line. We waste valuable time that could be spent studying, socializing, or resting. There's no way to know how crowded a location is before you arrive, and you don't even know what food is actually available until you get there.

We wanted to solve this problem with technology that every student could use. **Pete's Plate & Pace** was born from the simple question: "What if students could see real-time crowd levels and menus before deciding where to eat?"

## What it does

**Pete's Plate & Pace** is a real-time dining intelligence dashboard for OSU students. It provides:

- **Live Crowd Levels** - See exactly how busy each dining location is right now with color-coded markers (🟢 Green = Low, 🟡 Yellow = Medium, 🔴 Red = High)
- **Interactive Campus Map** - Visual overview of all dining locations with clickable markers showing detailed information
- **AI-Powered Recommendations** - Get personalized top 5 recommendations based on distance, crowd level, time of day, and your food preferences
- **Smart Food Search** - Find locations serving specific foods ("Pizza", "Coffee") or use quick filters like "In a Hurry" or "Least Crowded"
- **Real-Time Updates** - Changes appear instantly across all devices without refreshing (true real-time synchronization)

The "wow moment": Open the admin panel on one screen and the map on another. Move a crowd level slider → watch the map update instantly across all connected devices!


## How we built it

**Frontend:**
- React 18 with Vite for fast development and optimized builds
- React Leaflet for interactive mapping with OpenStreetMap
- React Router for smooth navigation
- CSS Modules for component-scoped styling

**Backend & Database:**
- Firebase Firestore for real-time NoSQL database with instant synchronization using `onSnapshot` listeners
- Firebase Functions for serverless API endpoints (sensor integration)
- Firebase Hosting for fast, global CDN deployment

**Location Information**
- Scraped dining options details from OSU dining website
- Fetched and processed position coordinate details from Google Map and OpenStreetMap

**Algorithms:**
- Custom scoring algorithm for AI recommendations (considers distance, crowd level, meal context, preferences, and menu variety)
- Haversine formula for accurate distance calculations
- Custom OSU coordinate system for precise campus location mapping
- Multi-source menu search across official menus, live menus, and detailed menu structures

**Sensor Integration:**
- Arudino 
- Python client (`SensorClient.py`) for Arduino/sensor devices to send crowd level updates
- RESTful API endpoints for data ingestion
- Real-time Firestore updates from sensor data

The entire stack is deployed on Firebase for seamless integration and scalability.

---

## Challenges we ran into

1. **Real-Time Synchronization** - Initially tried polling, but switched to Firebase Firestore's real-time listeners for true instant updates. Learning to work with `onSnapshot` and handle connection states was challenging.

2. **Coordinate Accuracy** - OSU buildings needed precise GPS coordinates. We built a custom coordinate mapping system with fallback handling for locations without exact coordinates.

3. **Map Marker Overlap** - Multiple dining locations sometimes shared the same building coordinates. Implemented a coordinate offset system to prevent marker overlap.

4. **Firebase Functions Compatibility** - Hit dependency conflicts between `firebase-admin` v13 and `firebase-functions`. Resolved by using compatible versions (firebase-admin v12 with firebase-functions v5).

5. **Crowdedness Calculation** - Stochastic crowd flow modeling to predict the business at a given location.

---

## Accomplishments that we're proud of

**True Real-Time System** - Built a fully real-time application with instant updates across all clients using Firebase Firestore's `onSnapshot` listeners. No polling, no refresh needed!

**Custom AI Recommendation Engine** - Created a sophisticated multi-factor scoring algorithm that considers distance, crowd levels, time of day, food preferences, and menu variety to provide personalized recommendations.

**Interactive Campus Map** - Built a fully functional interactive map with color-coded markers, location popups, and auto-zoom features specifically optimized for OSU campus.

**Full-Stack Firebase Deployment** - Successfully deployed both frontend (Firebase Hosting) and backend (Firebase Functions) in a unified Firebase ecosystem.

**Community Features** - Implemented crowdsourcing so students can contribute real-time menu updates, creating a community-driven platform.

**Responsive Design** - Created a mobile-friendly interface that works seamlessly on all devices.

**Sensor Integration** - Built a complete sensor API and Python client for future Arduino/sensor device integration.

**Comprehensive Documentation** - Created extensive documentation including setup guides, deployment instructions, and technical details.

**Most importantly**: We built something that solves a real problem we face every day as OSU students!

---

## What we learned

- **Firebase Real-Time Capabilities** - Deep dive into Firestore's real-time listeners and how to handle connection states, offline mode, and data synchronization.

- **Geolocation & Mapping** - Understanding coordinate systems, the Haversine formula, and working with mapping libraries (Leaflet/OpenStreetMap).

- **Full-Stack Firebase** - Deploying a complete application on Firebase including Hosting, Functions, and Firestore, and understanding how they integrate.

- **Algorithm Design** - Creating a scoring algorithm that balances multiple factors (distance, crowd, time, preferences) to provide meaningful recommendations.

- **API Design** - Building RESTful endpoints for sensor data ingestion with proper error handling, validation, and rate limiting considerations.

- **Project Management** - Managing scope, prioritizing features, and building a demo-ready product within hackathon time constraints.

---

## What's next for Pete's Plate & Pace

- **LLM Integration** - Integrate OpenAI/Gemini for more natural language-based recommendations
- **User Authentication** - Personal accounts with saved preferences and dining history
- **Mobile App** - Native iOS/Android applications for on-the-go access
- **Historical Analytics** - Track crowd level patterns over time to predict busy periods
- **Push Notifications** - Alert students when favorite locations have low crowds
- **Direct API Integration** - Connect directly with OSU Dining Services API
- **Multi-Campus Support** - Expand to other universities
- **Restaurant Partnerships** - Integrate with off-campus dining options
- **Nutritional Information** - Add calorie counts and nutritional data to menu items

**Our Goal**: Make Pete's Plate & Pace the go-to app for every OSU student when deciding where to eat, ultimately saving students thousands of hours each semester.
