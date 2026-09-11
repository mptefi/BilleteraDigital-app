import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Configuración de Firebase usando variables de entorno (.env con EXPO_PUBLIC_)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBcVpneB_1ma1ykRqmnSWDSpvfCGoEn0-s",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "al-toque-808de.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "al-toque-808de",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "al-toque-808de.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "548124731916",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:548124731916:web:f123eff8249022c7701c29",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-YWWPS2Y1YZ",
};

// Inicializar Firebase SDK asegurando instancia única (Singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export default app;
