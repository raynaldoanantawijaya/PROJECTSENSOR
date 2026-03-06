
import { auth } from "./firebase";
import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser
} from "firebase/auth";
import { storageService, User as AppUser } from "./storage";

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

        // Clean session from Firestore (best effort — don't block logout if this fails)
        if (userStr && sessionToken) {
            try {
                const user = JSON.parse(userStr) as AppUser;
                // Force-refresh from Firestore to get latest session list
                const users = await storageService.getUsers(true);
                const latestUser = users.find((u: AppUser) => u.email.toLowerCase() === user.email.toLowerCase());
                if (latestUser && latestUser.activeSessions) {
                    const updatedSessions = latestUser.activeSessions.filter((s: string) => s !== sessionToken);
                    await storageService.saveUser({ ...latestUser, activeSessions: updatedSessions });
                }
            } catch (e) {
                console.error("Failed to clear session from Firestore on logout:", e);
                // Don't block logout — user will be logged out locally regardless
            }
        }

        try {
            await firebaseSignOut(auth);
        } catch (e) {
            console.error("Firebase signOut error:", e);
        }
    },

    // Get current user role from Firestore based on Auth Email
    getUserRole: async (email: string): Promise<AppUser | undefined> => {
        const users = await storageService.getUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    },

    // Auth State Observer
    onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
        return onAuthStateChanged(auth, callback);
    }
};
