
import { auth } from "./firebase";
import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser
} from "firebase/auth";
import { User as AppUser } from "./storage";

export const authService = {
    // Login with Email & Password
    login: async (email: string, pass: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            return userCredential.user;
        } catch (error: any) {
            console.error("Login failed:", error.code, error.message);
            throw error;
        }
    },

    // Logout
    logout: async () => {
        const userStr = localStorage.getItem('currentUser');
        const sessionToken = localStorage.getItem('sessionToken');

        // Always clear local storage first
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('loginTimestamp');
        localStorage.removeItem('currentAdmin');

        // Clean session from backend (fire-and-forget — never block logout)
        if (userStr && sessionToken) {
            try {
                const user = JSON.parse(userStr) as AppUser;
                // Use dynamic import to call the Server Action
                import('@/app/actions/auth-actions').then(({ cleanupSessionAction }) => {
                    cleanupSessionAction(user.id, sessionToken).catch(() => { });
                }).catch(() => { });
            } catch (e) {
                // Don't block logout
            }
        }

        try {
            await firebaseSignOut(auth);
        } catch (e) {
            console.error("Firebase signOut error:", e);
        }
    },

    // Get current user role from backend API
    getUserRole: async (email: string): Promise<AppUser | undefined> => {
        const { fetchDashboardData } = await import('@/lib/dashboard-data');
        const { users } = await fetchDashboardData('users');
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    },

    // Auth State Observer
    onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
        return onAuthStateChanged(auth, callback);
    }
};
