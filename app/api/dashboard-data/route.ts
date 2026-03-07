// API Route for authenticated dashboard data fetching

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";

// GET /api/dashboard-data?type=sensors|users|both
// Requires: Authorization: Bearer <firebaseIdToken>
// This endpoint is for REGULAR users on the main dashboard.
// It validates the Firebase ID Token (not admin session cookie).
export async function GET(req: NextRequest) {
    try {
        // 1. Validate the Firebase ID Token from the Authorization header
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        const auth = getAdminAuth();

        let decodedToken;
        try {
            decodedToken = await auth.verifyIdToken(idToken);
        } catch (e) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const uid = decodedToken.uid;
        const db = getAdminFirestore();

        // 2. Verify user exists in our database
        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 403 });
        }

        const type = req.nextUrl.searchParams.get("type") || "both";
        const result: any = {};

        // 3. Fetch requested data
        if (type === "sensors" || type === "both") {
            const sensorsSnapshot = await db.collection("sensors").get();
            result.sensors = sensorsSnapshot.docs.map(doc => doc.data());
        }

        if (type === "users" || type === "both") {
            const usersSnapshot = await db.collection("users").get();
            result.users = usersSnapshot.docs.map(doc => doc.data());
        }

        return NextResponse.json(result);
    } catch (e: any) {
        console.error("Dashboard data API error:", e);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
