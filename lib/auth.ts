
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
        try {
            // Remove active session from Firestore before clearing local storage
            const userStr = localStorage.getItem('currentUser');
            const sessionToken = localStorage.getItem('sessionToken');

            if (userStr && sessionToken) {
                try {
                    const user = JSON.parse(userStr) as AppUser;
                    // Always fetch latest to avoid overwriting newer sessions incorrectly
                    const latestUser = await authService.getUserRole(user.email);
                    if (latestUser && latestUser.activeSessions) {
                        const updatedSessions = latestUser.activeSessions.filter(s => s !== sessionToken);
                        await storageService.saveUser({ ...latestUser, activeSessions: updatedSessions });
                    }
                } catch (e) {
                    console.error("Failed to clear session from Firestore", e);
                }
            }

            await firebaseSignOut(auth);
            localStorage.removeItem('currentUser');
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('currentAdmin');
        } catch (error) {
            console.error("Logout failed:", error);
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
