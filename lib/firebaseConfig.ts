// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKsu47GZ7qrUQdCVFNH_1o1uMAFVD0UxY",
  authDomain: "shopapp-d465b.firebaseapp.com",
  projectId: "shopapp-d465b",
  storageBucket: "shopapp-d465b.firebasestorage.app",
  messagingSenderId: "603211838614",
  appId: "1:603211838614:web:85ace1790ebca267fcbeb7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export { app };

export const auth = getAuth(app);
export const db = getFirestore(app);