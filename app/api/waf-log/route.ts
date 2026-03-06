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
