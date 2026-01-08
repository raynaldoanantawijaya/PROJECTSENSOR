import "server-only";
import { initializeApp, getApps, cert, getApp, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { SERVICE_ACCOUNT_KEY } from "./firebase-service-key";

export function getAdminAuth() {
    // Prevent multiple initializations in dev mode
    if (getApps().length === 0) {
        try {
            initializeApp({
                credential: cert(SERVICE_ACCOUNT_KEY as any)
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
        initializeApp({
            credential: cert(SERVICE_ACCOUNT_KEY as any)
        });
    }
    return getFirestore(getApp());
}
