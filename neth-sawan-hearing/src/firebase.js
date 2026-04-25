import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Replace with your actual Firebase config from Firebase Console
//projectId: "nethsawan-ca228",
const firebaseConfig = {
  apiKey: "AIzaSyD3dJeYQwZ87gGncbcP14NDFCfQNzncP5g",
  authDomain: "nethsawan-ca228.firebaseapp.com",
  projectId: "nethsawan-ca228",
  storageBucket: "nethsawan-ca228.firebasestorage.app",
  messagingSenderId: "883239486246",
  appId: "1:883239486246:web:f3cefa2d6da0b7c01877e7"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export const auth = getAuth(app);
export const db = getFirestore(app);