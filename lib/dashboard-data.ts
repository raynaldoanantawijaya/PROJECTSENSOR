import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Sensor, User } from "@/lib/storage";

// Simple in-memory cache to avoid redundant API calls across components
let cachedResult: { sensors: Sensor[]; users: User[] } | null = null;
let cacheTime = 0;
const CACHE_TTL = 5000; // 5 seconds

/**
 * Waits for Firebase Auth to be ready (max 3 seconds).
 */
function waitForAuth(): Promise<import("firebase/auth").User | null> {
    return new Promise((resolve) => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            resolve(currentUser);
            return;
        }

        const timeout = setTimeout(() => {
            unsubscribe();
            resolve(null);
        }, 3000);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            clearTimeout(timeout);
            unsubscribe();
            resolve(user);
        });
    });
}

/**
 * Fetches dashboard data (sensors and/or users) from the secure API endpoint.
 * Automatically waits for Firebase Auth to be ready.
 * Uses a 5-second cache to avoid redundant API calls.
 */
export async function fetchDashboardData(type: 'sensors' | 'users' | 'both' = 'both'): Promise<{ sensors: Sensor[]; users: User[] }> {
    // Check cache first
    if (cachedResult && (Date.now() - cacheTime < CACHE_TTL)) {
        return cachedResult;
    }

    const firebaseUser = await waitForAuth();
    if (!firebaseUser) {
        return { sensors: [], users: [] };
    }

    try {
        const idToken = await firebaseUser.getIdToken();
        const res = await fetch(`/api/dashboard-data?type=${type}`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
        });

        if (!res.ok) {
            console.error('Dashboard data fetch failed:', res.status);
            return { sensors: [], users: [] };
        }

        const data = await res.json();
        const result = {
            sensors: data.sensors || [],
            users: data.users || []
        };

        // Cache the result
        cachedResult = result;
        cacheTime = Date.now();

        return result;
    } catch (e) {
        console.error('Dashboard data fetch error:', e);
        return { sensors: [], users: [] };
    }
}

/** Invalidate the cache (call after mutations) */
export function invalidateDashboardCache() {
    cachedResult = null;
    cacheTime = 0;
}

