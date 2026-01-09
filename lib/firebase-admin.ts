import "server-only";
import { initializeApp, getApps, cert, getApp, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Helper to get credentials safely
function getServiceAccount() {
    // 1. Try fetching from Environment Variable (Vercel / Production)
    const jsonKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (jsonKey) {
        try {
            return JSON.parse(jsonKey);
        } catch (e) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY env var", e);
        }
    }

    // 2. Fallback check for Development
    // Note: We removed the static require("./firebase-service-key") to prevent Vercel build errors.
    // For local development, please add FIREBASE_SERVICE_ACCOUNT_KEY to your .env.local file.
    console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not found in environment variables.");
    return null;
}

export function getAdminAuth() {
    // Prevent multiple initializations in dev mode
    if (getApps().length === 0) {
        try {
            const credential = getServiceAccount();
            if (!credential) {
                throw new Error("Missing Firebase Admin Credentials (Env Var or Local File)");
            }

            initializeApp({
                credential: cert(credential)
            });
        } catch (e) {
            console.error("Firebase Admin Init Error:", e);
            throw e;
        }
    }
    return getAuth(getApp());
}

export function getAdminFirestore() {
    if (getApps().length === 0) {
        const credential = getServiceAccount();
        if (credential) {
            initializeApp({
                credential: cert(credential)
            });
        }
    }
    return getFirestore(getApp());
}
