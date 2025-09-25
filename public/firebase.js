// JS/firebase.js

// Import Firebase v10.11.1 modules from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";


// ✅ Your Firebase configuration loaded from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyBWVb68ygv1EkWdJUOZgHx0lZyxsinr1I8",
  authDomain: "ai-trip-planner-58924.firebaseapp.com",
  projectId: "ai-trip-planner-58924",
  storageBucket: "ai-trip-planner-58924.firebasestorage.app",
  messagingSenderId: "646858456358",
  appId: "1:646858456358:web:871ded2c57ba49f0ef15e7",
  measurementId: "G-Q3LS4WPJTY"
};

// ✅ Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ✅ Export Firebase utilities for use in other files
export {
  auth,
  db,
  provider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs
};
