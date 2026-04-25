import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA6fU0qX4GVesvPsL8im2qv5c11W3CzeVE",
  authDomain: "farmacias-436a4.firebaseapp.com",
  projectId: "farmacias-436a4",
  storageBucket: "farmacias-436a4.firebasestorage.app",
  messagingSenderId: "115727068599",
  appId: "1:115727068599:web:bb25449ea1d547cb7ccc32"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);