
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
            await firebaseSignOut(auth);
            localStorage.removeItem('currentUser');
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
