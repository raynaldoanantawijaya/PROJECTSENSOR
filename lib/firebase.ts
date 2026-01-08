import { initializeApp, getApps, getApp } from "firebase/app";
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    query,
    onSnapshot
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBY12B5rXh6v8EG5mHqf3u83M36VV1jId0",
    authDomain: "sensor-1b556.firebaseapp.com",
    databaseURL: "https://sensor-1b556-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sensor-1b556",
    storageBucket: "sensor-1b556.firebasestorage.app",
    messagingSenderId: "147308510450",
    appId: "1:147308510450:web:2792dc7fea12017971646b",
    measurementId: "G-19N43T4KN7"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Authenticate anonymously removed in favor of explicit Email/Password auth
export const initFirebase = async () => {
    // App is initialized at top level
    console.log("Firebase initialized");
};
