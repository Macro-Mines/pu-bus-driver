import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyARKn3gfNWA0cwDGU7x6cDi_nRNAgGN0OA",
  authDomain: "pu-bus.firebaseapp.com",
  databaseURL: "https://pu-bus-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pu-bus",
  storageBucket: "pu-bus.firebasestorage.app",
  messagingSenderId: "368216113936",
  appId: "1:368216113936:web:7a61133e16c7855eef1b95",
  measurementId: "G-JXN6L097NM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export default app;
