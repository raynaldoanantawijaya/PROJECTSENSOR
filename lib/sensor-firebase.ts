import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const sensorFirebaseConfig = {
    apiKey: "AIzaSyDbfFC7p7G0KVEFKaKM_V6PkMMjgUA1NQ0",
    authDomain: "esp32-speed-monitor.firebaseapp.com",
    databaseURL: "https://esp32-speed-monitor-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "esp32-speed-monitor",
    storageBucket: "esp32-speed-monitor.firebasestorage.app",
    messagingSenderId: "885299347088",
    appId: "1:885299347088:web:b494c68af1e40e23af2215",
    measurementId: "G-5RKH8TP2BP"
};

// Initialize Secondary Firebase App just for Sensors
// We give it a specific name "sensorApp" to avoid conflict with the main Auth app
let sensorApp: FirebaseApp;

try {
    sensorApp = getApp("sensorApp");
} catch (e) {
    sensorApp = initializeApp(sensorFirebaseConfig, "sensorApp");
}

export const sensorDb = getDatabase(sensorApp);
