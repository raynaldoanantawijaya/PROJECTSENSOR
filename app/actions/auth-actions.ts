"use server";

import { cookies } from "next/headers";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";

interface CreateUserResult {
    success: boolean;
    uid?: string;
    error?: string;
}

// Helper to verify session and role
async function verifyAdminSession() {
    const sessionCookie = (await cookies()).get("session")?.value;
    if (!sessionCookie) return null;

    try {
        const auth = getAdminAuth();
        // Verify session cookie
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        const uid = decodedClaims.uid;

        // Check Firestore Role
        const db = getAdminFirestore();
        const userDoc = await db.collection("users").doc(uid).get();

        if (!userDoc.exists) return null;

        const userData = userDoc.data();
        const role = (userData?.role || "").toLowerCase();

        if (role === 'admin' || role === 'commander') {
            return {
                uid,
                role,
                email: userData?.email,
                subRole: userData?.subRole,
                canEdit: userData?.permissions?.canEdit
            };
        }
        return null;
    } catch (error) {
        return null;
    }
}

const COMMANDER_EMAIL = process.env.NEXT_PUBLIC_COMMANDER_EMAIL || "anantawijaya212@gmail.com";

export async function createUserAction(email: string, password: string, displayName: string): Promise<CreateUserResult> {
    const caller = await verifyAdminSession();
    if (!caller) {
        return { success: false, error: "Unauthorized: Invalid or expired session." };
    }

    // Permission Check
    const isCommander = caller.email?.toLowerCase() === COMMANDER_EMAIL.toLowerCase();
    if (!isCommander && !caller.canEdit) {
        return { success: false, error: "Unauthorized: You do not have permission to create users." };
    }

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

export async function deleteUserAction(targetUid: string): Promise<{ success: boolean; error?: string }> {
    const caller = await verifyAdminSession();
    if (!caller) {
        return { success: false, error: "Unauthorized: Invalid or expired session." };
    }

    const isCallerCommander = caller.email?.toLowerCase() === COMMANDER_EMAIL.toLowerCase();

    // Permission Check
    if (!isCallerCommander && !caller.canEdit) {
        return { success: false, error: "Unauthorized: You do not have permission to delete users." };
    }

    try {
        const db = getAdminFirestore();
        const auth = getAdminAuth();

        // Fetch Target User to check protections
        const targetDoc = await db.collection("users").doc(targetUid).get();
        if (!targetDoc.exists) {
            // If not in DB but in Auth? Edge case, but let's assume we need DB data for check
            // If strictly auth delete, proceed with caution. But here we enforce logic.
            // Let's try to get auth user to check email at least
            try {
                const targetAuth = await auth.getUser(targetUid);
                if (targetAuth.email?.toLowerCase() === COMMANDER_EMAIL.toLowerCase()) {
                    return { success: false, error: "Cannot delete Commander." };
                }
            } catch (e) {
                // User might not exist
            }
        } else {
            const targetData = targetDoc.data();
            const targetEmail = (targetData?.email || "").toLowerCase();

            // 1. Protect Commander
            if (targetEmail === COMMANDER_EMAIL.toLowerCase()) {
                return { success: false, error: "Cannot delete Commander." };
            }

            // 2. Protect Admins
            if (targetData?.role === 'admin' && !isCallerCommander) {
                return { success: false, error: "Access Denied: You cannot delete another Administrator." };
            }

            // 3. Protect 'All' SubRole
            if (targetData?.subRole === 'all' && caller.subRole !== 'all' && !isCallerCommander) {
                return { success: false, error: "Access Denied: You cannot delete an All-Access User." };
            }
        }

        await auth.deleteUser(targetUid);
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return { success: false, error: error.message || "Failed to delete user in Firebase Auth" };
    }
}

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

async function verifyTurnstileToken(token: string): Promise<boolean> {
    if (!TURNSTILE_SECRET_KEY) return true; // Bypass if not configured (dev mode safe)

    try {
        const formData = new URLSearchParams();
        formData.append('secret', TURNSTILE_SECRET_KEY);
        formData.append('response', token);

        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();
        return data.success === true;
    } catch (e) {
        console.error("Turnstile verification failed:", e);
        return false;
    }
}

export async function loginAdminAction(idToken: string, turnstileToken: string): Promise<{ success: boolean; error?: string }> {
    try {
        // 0. Verify Turnstile
        const isHuman = await verifyTurnstileToken(turnstileToken);
        if (!isHuman) {
            return { success: false, error: "Security Check Failed. Please reload and try again." };
        }

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
        const role = (userData?.role || "").toLowerCase();
        if (role !== 'admin' && role !== 'commander') {
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
