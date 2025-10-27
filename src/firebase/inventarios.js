// Importar SDKs necesarios
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDaYLc0ZOchAbNCiRLYLbHOl1TuOGuAXO4",
  authDomain: "abcd-836d0.firebaseapp.com",
  projectId: "abcd-836d0",
  storageBucket: "abcd-836d0.firebasestorage.app",
  messagingSenderId: "603057717907",
  appId: "1:603057717907:web:31fa144014180a0ec10366"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar Firestore para usarlo en otros archivos
export const db = getFirestore(app);