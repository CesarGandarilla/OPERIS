// src/firebase/inventarios.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_APP_ID,
} from "@env";

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  appId: FIREBASE_APP_ID,
};

// ✅ Evita inicializar dos veces
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// ✅ Exporta Firestore
export const db = getFirestore(app);

// ✅ (Opcional) exporta app si otras partes la necesitan
export default app;
