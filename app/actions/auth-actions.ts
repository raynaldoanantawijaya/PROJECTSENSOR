"use server";

import { cookies, headers } from "next/headers";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";

interface CreateUserResult {
    success: boolean;
    uid?: string;
    error?: string;
}

// --------------------------------------------------------------------------------
// MEMORY RATE LIMITER
// Prevents Brute-Force scanning even if Turnstile is somehow replayed or bypassed
// --------------------------------------------------------------------------------
const loginAttempts = new Map<string, { count: number; lockUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

function checkRateLimit(ip: string): { allowed: boolean; error?: string } {
    const now = Date.now();
    const record = loginAttempts.get(ip);

    if (record) {
        if (now < record.lockUntil) {
            const minutesLeft = Math.ceil((record.lockUntil - now) / 60000);
            return { allowed: false, error: `Too many failed attempts. Try again in ${minutesLeft} minutes.` };
        }
        // Reset if lock time passed
        if (now > record.lockUntil && record.count >= MAX_ATTEMPTS) {
            loginAttempts.delete(ip);
        }
    }
    return { allowed: true };
}

function recordFailedAttempt(ip: string) {
    const now = Date.now();
    const record = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
    record.count += 1;

    if (record.count >= MAX_ATTEMPTS) {
        record.lockUntil = now + LOCKOUT_MS;
    }
    loginAttempts.set(ip, record);
}

function clearAttempts(ip: string) {
    loginAttempts.delete(ip);
}
// --------------------------------------------------------------------------------

// Helper to verify session and role
export async function verifyAdminSession() {
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

        // 4. Delete from Firestore Database explicitly
        await db.collection("users").doc(targetUid).delete();

        // 5. Delete from Firebase Auth
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
        // --- 1. IP-Based Rate Limiting ---
        const headersList = await headers();
        const ipstr = headersList.get("x-forwarded-for") || headersList.get("cf-connecting-ip") || "unknown";
        const ip = ipstr.split(',')[0].trim();

        const limitCheck = checkRateLimit(ip);
        if (!limitCheck.allowed) {
            return { success: false, error: limitCheck.error || "Security Lockout. Try again later." };
        }

        // --- 2. Verify Turnstile ---
        const isHuman = await verifyTurnstileToken(turnstileToken);
        if (!isHuman) {
            recordFailedAttempt(ip);
            return { success: false, error: "Security Check Failed. Please reload and try again." };
        }

        const auth = getAdminAuth();

        // --- 3. Verify ID Token ---
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // --- 4. Check Role in Firestore ---
        const db = getAdminFirestore();
        const userDoc = await db.collection("users").doc(uid).get();

        if (!userDoc.exists) {
            recordFailedAttempt(ip);
            return { success: false, error: "User data not found in database." };
        }

        const userData = userDoc.data();
        const role = (userData?.role || "").toLowerCase();
        if (role !== 'admin' && role !== 'commander') {
            recordFailedAttempt(ip);
            return { success: false, error: "Access Denied: You are not an admin." };
        }

        // --- 5. Create Session Cookie (expires in 8 hours) ---
        const expiresIn = 60 * 60 * 8 * 1000; // 8 hours
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

        // --- 6. Set Cookie & Clear Attempts ---
        (await cookies()).set("session", sessionCookie, {
            maxAge: expiresIn,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: "lax",
        });

        clearAttempts(ip); // Success! Reset rate limiter.
        return { success: true };
    } catch (error: any) {
        console.error("Login Action Error:", error);

        // Also record generic auth failures as attempts
        const headersList = await headers();
        const ipstr = headersList.get("x-forwarded-for") || headersList.get("cf-connecting-ip") || "unknown";
        const ip = ipstr.split(',')[0].trim();
        recordFailedAttempt(ip);

        return { success: false, error: "Authentication failed. " + (error.message || "") };
    }
}

export async function logoutAdminAction() {
    try {
        const sessionCookie = (await cookies()).get("session")?.value;
        if (sessionCookie) {
            const auth = getAdminAuth();
            const decodedClaims = await auth.verifySessionCookie(sessionCookie);
            // KILLS the session computationally at the Google Server level
            await auth.revokeRefreshTokens(decodedClaims.uid);
        }
    } catch (e) {
        console.warn("Session already invalid or expired during logout.");
    }

    (await cookies()).delete("session");
    return { success: true };
}
