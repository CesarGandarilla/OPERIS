// src/firebase/inventarios.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_APP_ID,
} from "@env";

// Configuración de tu proyecto Firebase (operis-b12d2)
const firebaseConfig = {
  apiKey: "AIzaSyBVNZkbwkM4YKx0SAvj0esh9YM72iK3N8U",
  authDomain: "operis-b12d2.firebaseapp.com",
  databaseURL: "https://operis-b12d2-default-rtdb.firebaseio.com",
  projectId: "operis-b12d2",
  storageBucket: "operis-b12d2.firebasestorage.app",
  messagingSenderId: "942888743319",
  appId: "1:942888743319:web:7302aab687d35dd850d4d2",
  measurementId: "G-EHX4XGBZTN"
};

// Evita inicializar dos veces
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);
