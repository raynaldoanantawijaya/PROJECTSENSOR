"use server";

import { getAdminFirestore } from "@/lib/firebase-admin";
import { User, Sensor } from "@/lib/storage";
import { verifyAdminSession } from "./auth-actions"; // Need to export this from auth-actions

const COMMANDER_EMAIL = process.env.NEXT_PUBLIC_COMMANDER_EMAIL || "anantawijaya212@gmail.com";

// ============================================================================
// ADMIN SECURE SERVER ACTIONS
// These bypass the strict Client-Side Firestore Rules using Admin SDK
// ============================================================================

export async function saveUserAction(user: User): Promise<{ success: boolean; error?: string }> {
    const caller = await verifyAdminSession();
    if (!caller) return { success: false, error: "Unauthorized" };

    const isCommander = caller.email?.toLowerCase() === COMMANDER_EMAIL.toLowerCase();

    // Enforce basic permissions
    if (!isCommander && !caller.canEdit) {
        return { success: false, error: "Access Denied: You do not have edit permissions." };
    }

    // Role Escalation Protection: Only Commander can create/edit an admin
    if (user.role === 'admin' && !isCommander && caller.uid !== user.id) {
        return { success: false, error: "Access Denied: Only the Commander can grant Admin roles." };
    }

    // Sub-role Protection: Only Commander or 'All' sub-role can assign 'All' sub-role
    if (user.subRole === 'all' && caller.subRole !== 'all' && !isCommander) {
        return { success: false, error: "Access Denied: You cannot assign 'All' access." };
    }

    try {
        const db = getAdminFirestore();
        await db.collection("users").doc(user.id).set(user);
        return { success: true };
    } catch (error: any) {
        console.error("Save User Error:", error);
        return { success: false, error: error.message };
    }
}

export async function saveSensorAction(sensor: Sensor): Promise<{ success: boolean; error?: string }> {
    const caller = await verifyAdminSession();
    if (!caller) return { success: false, error: "Unauthorized" };

    const isCommander = caller.email?.toLowerCase() === COMMANDER_EMAIL.toLowerCase();

    if (!isCommander && !caller.canEdit) {
        return { success: false, error: "Access Denied: You do not have edit permissions." };
    }

    try {
        const db = getAdminFirestore();
        await db.collection("sensors").doc(sensor.id).set(sensor);
        return { success: true };
    } catch (error: any) {
        console.error("Save Sensor Error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteSensorAction(sensorId: string): Promise<{ success: boolean; error?: string }> {
    const caller = await verifyAdminSession();
    if (!caller) return { success: false, error: "Unauthorized" };

    const isCommander = caller.email?.toLowerCase() === COMMANDER_EMAIL.toLowerCase();

    if (!isCommander && !caller.canEdit) {
        return { success: false, error: "Access Denied: You do not have edit permissions." };
    }

    try {
        const db = getAdminFirestore();
        await db.collection("sensors").doc(sensorId).delete();
        return { success: true };
    } catch (error: any) {
        console.error("Delete Sensor Error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteAllSensorsAction(): Promise<{ success: boolean; error?: string }> {
    const caller = await verifyAdminSession();
    if (!caller) return { success: false, error: "Unauthorized" };

    const isCommander = caller.email?.toLowerCase() === COMMANDER_EMAIL.toLowerCase();

    if (!isCommander) { // EXTRA STRICT: Only Commander can delete ALL
        return { success: false, error: "Access Denied: Only Commander can wipe everything." };
    }

    try {
        const db = getAdminFirestore();
        const snapshot = await db.collection("sensors").get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        return { success: true };
    } catch (error: any) {
        console.error("Delete All Sensors Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getUsersAction(): Promise<{ success: boolean; data?: User[]; error?: string }> {
    const caller = await verifyAdminSession();
    if (!caller) return { success: false, error: "Unauthorized" };

    try {
        const db = getAdminFirestore();
        const snapshot = await db.collection("users").get();
        const users: User[] = [];
        snapshot.forEach(doc => {
            users.push(doc.data() as User);
        });
        return { success: true, data: users };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getSensorsAction(): Promise<{ success: boolean; data?: Sensor[]; error?: string }> {
    const caller = await verifyAdminSession();
    if (!caller) return { success: false, error: "Unauthorized" };

    try {
        const db = getAdminFirestore();
        const snapshot = await db.collection("sensors").get();
        const sensors: Sensor[] = [];
        snapshot.forEach(doc => {
            sensors.push(doc.data() as Sensor);
        });
        return { success: true, data: sensors };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getActivityLogsAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    const caller = await verifyAdminSession();
    if (!caller) return { success: false, error: "Unauthorized" };

    try {
        const db = getAdminFirestore();
        const snapshot = await db.collection("user_activity").orderBy("timestamp", "desc").limit(500).get();
        const logs: any[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            logs.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
            });
        });
        return { success: true, data: logs };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
