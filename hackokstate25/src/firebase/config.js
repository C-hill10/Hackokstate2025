// Firebase Configuration
// Replace these values with your Firebase project configuration
// You can find these in your Firebase Console > Project Settings > General > Your apps

// import { initializeApp } from 'firebase/app'
// import { getFirestore } from 'firebase/firestore'

// const firebaseConfig = {
//   // TODO: Replace with your Firebase project config
//   apiKey: "your-api-key",
//   authDomain: "your-project.firebaseapp.com",
//   projectId: "your-project-id",
//   storageBucket: "your-project.appspot.com",
//   messagingSenderId: "123456789",
//   appId: "your-app-id"
// }

// // Initialize Firebase
// const app = initializeApp(firebaseConfig)

// // Initialize Firestore
// export const db = getFirestore(app)
// export default app



// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCJoDTAg6msKOywPSc6N5jVSVP4SpphMwc",
  authDomain: "hackokstate25.firebaseapp.com",
  projectId: "hackokstate25",
  storageBucket: "hackokstate25.firebasestorage.app",
  messagingSenderId: "44912494103",
  appId: "1:44912494103:web:d3b5535f590c064bf1be52",
  measurementId: "G-P4H3HKNPDS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser)
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

// Initialize Firestore
export const db = getFirestore(app);
export default app;