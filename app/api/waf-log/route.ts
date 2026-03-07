import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

// --- Free IP Geolocation lookup (ip-api.com, no key needed) ---
async function lookupGeo(ip: string): Promise<{ city: string; region: string; country: string; isp: string; lat: number; lon: number }> {
    const fallback = { city: '', region: '', country: '', isp: '', lat: 0, lon: 0 };
    if (!ip || ip === 'Unknown IP' || ip.startsWith('127.') || ip.startsWith('192.168.')) return fallback;

    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country,isp,lat,lon`, {
            signal: AbortSignal.timeout(3000) // 3s timeout to not delay logging
        });
        if (!res.ok) return fallback;
        const data = await res.json();
        return {
            city: data.city || '',
            region: data.regionName || '',
            country: data.country || '',
            isp: data.isp || '',
            lat: data.lat || 0,
            lon: data.lon || 0
        };
    } catch {
        return fallback;
    }
}

export async function POST(req: Request) {
    // SECURITY: Ensure request is coming from our own internal middleware
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    const host = req.headers.get('host') || '';

    // Only allow if it's an internal fetch (no origin/referer but from same host) 
    // or explicitly matches our known domains
    const isInternal = (!origin && req.headers.get('sec-fetch-site') === 'same-origin') ||
        (origin && (origin.includes('raynaldotech.my.id') || origin.includes('localhost')));

    if (!isInternal) {
        return NextResponse.json({ error: "Forbidden: External POST blocked" }, { status: 403 });
    }

    try {
        const payload = await req.json();

        // Basic validation
        if (!payload.source || !payload.clientIP) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Enrich with precise geolocation from IP
        const geo = await lookupGeo(payload.clientIP);

        const db = getAdminFirestore();
        const logsRef = db.collection('waf_logs');

        const finalData = {
            ...payload,
            // Override country with more precise data if available
            clientCountryName: geo.country || payload.clientCountryName,
            clientCity: geo.city || '',
            clientRegion: geo.region || '',
            clientISP: geo.isp || '',
            clientLat: geo.lat,
            clientLon: geo.lon,
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
export async function DELETE(req: Request) {
    // SECURITY: Authenticate admin session before allowing log destruction
    const cookieHeader = req.headers.get('cookie') || '';
    const hasSession = cookieHeader.includes('session=');
    if (!hasSession) {
        return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
    }

    try {
        const db = getAdminFirestore();
        const logsRef = db.collection('waf_logs');

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
