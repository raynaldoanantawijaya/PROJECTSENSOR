import { auth } from "@/lib/firebase";
import { Sensor, User } from "@/lib/storage";

/**
 * Fetches dashboard data (sensors and/or users) from the secure API endpoint.
 * Requires the Firebase Auth user to be signed in.
 * This bypasses the Firestore Client SDK which is blocked by strict security rules.
 */
export async function fetchDashboardData(type: 'sensors' | 'users' | 'both' = 'both'): Promise<{ sensors: Sensor[]; users: User[] }> {
    const firebaseUser = auth.currentUser;
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
        return {
            sensors: data.sensors || [],
            users: data.users || []
        };
    } catch (e) {
        console.error('Dashboard data fetch error:', e);
        return { sensors: [], users: [] };
    }
}
