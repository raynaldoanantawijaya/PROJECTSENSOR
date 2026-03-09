// API Route for authenticated dashboard data fetching

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";

// GET /api/dashboard-data?type=sensors|users|both
// Requires: Authorization: Bearer <firebaseIdToken>
export async function GET(req: NextRequest) {
    try {
        // 1. Validate the Firebase ID Token
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        const auth = getAdminAuth();

        try {
            await auth.verifyIdToken(idToken);
        } catch (e) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        const db = getAdminFirestore();
        const type = req.nextUrl.searchParams.get("type") || "both";

        // 2. Fetch sensors and users in PARALLEL for maximum speed
        const [sensorsSnapshot, usersSnapshot] = await Promise.all([
            (type === "sensors" || type === "both") ? db.collection("sensors").get() : null,
            (type === "users" || type === "both") ? db.collection("users").get() : null
        ]);

        const result: any = {};

        if (sensorsSnapshot) {
            result.sensors = sensorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        if (usersSnapshot) {
            result.users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        // 3. Return with short cache (5s stale-while-revalidate for instant subsequent loads)
        const response = NextResponse.json(result);
        response.headers.set('Cache-Control', 'private, max-age=0, s-maxage=5, stale-while-revalidate=10');
        return response;
    } catch (e: any) {
        console.error("Dashboard data API error:", e);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

