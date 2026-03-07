import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        // Basic validation
        if (!payload.source || !payload.clientIP) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const db = getAdminFirestore();
        const logsRef = db.collection('waf_logs');

        // Add server-side timestamp for absolute reliability
        const finalData = {
            ...payload,
            serverReceivedAt: new Date().toISOString()
        };

        await logsRef.add(finalData);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to save WAF log:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE - Clear all WAF logs
export async function DELETE() {
    try {
        const db = getAdminFirestore();
        const logsRef = db.collection('waf_logs');

        // Get all documents in batches of 100 and delete them
        const snapshot = await logsRef.limit(500).get();

        if (snapshot.empty) {
            return NextResponse.json({ success: true, deleted: 0 });
        }

        const batch = db.batch();
        snapshot.docs.forEach((doc: any) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        return NextResponse.json({ success: true, deleted: snapshot.size });
    } catch (error: any) {
        console.error("Failed to delete WAF logs:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
