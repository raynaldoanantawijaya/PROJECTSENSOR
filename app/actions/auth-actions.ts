"use server";

import { cookies } from "next/headers";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";

interface CreateUserResult {
    success: boolean;
    uid?: string;
    error?: string;
}

export async function createUserAction(email: string, password: string, displayName: string): Promise<CreateUserResult> {
    try {
        const auth = getAdminAuth();
        const userRecord = await auth.createUser({
            email,
            emailVerified: false,
            password,
            displayName,
            disabled: false,
        });

        return { success: true, uid: userRecord.uid };
    } catch (error: any) {
        console.error("Error creating new user:", error);
        return { success: false, error: error.message || "Failed to create user in Firebase Auth" };
    }
}

export async function deleteUserAction(uid: string): Promise<{ success: boolean; error?: string }> {
    try {
        const auth = getAdminAuth();
        await auth.deleteUser(uid);
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return { success: false, error: error.message || "Failed to delete user in Firebase Auth" };
    }
}

export async function loginAdminAction(idToken: string): Promise<{ success: boolean; error?: string }> {
    try {
        const auth = getAdminAuth();

        // 1. Verify ID Token
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // 2. Check Role in Firestore
        const db = getAdminFirestore();
        const userDoc = await db.collection("users").doc(uid).get();

        if (!userDoc.exists) {
            return { success: false, error: "User data not found in database." };
        }

        const userData = userDoc.data();
        if (userData?.role !== 'admin') {
            return { success: false, error: "Access Denied: You are not an admin." };
        }

        // 3. Create Session Cookie (expires in 5 days)
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

        // 4. Set Cookie
        (await cookies()).set("session", sessionCookie, {
            maxAge: expiresIn,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: "lax",
        });

        return { success: true };
    } catch (error: any) {
        console.error("Login Action Error:", error);
        return { success: false, error: "Authentication failed. " + (error.message || "") };
    }
}

export async function logoutAdminAction() {
    (await cookies()).delete("session");
    return { success: true };
}
