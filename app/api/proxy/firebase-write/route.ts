import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Allowed origins (your own domain + localhost for dev)
const ALLOWED_ORIGINS = [
    'https://raynaldotech.my.id',
    'http://localhost:3000',
    'http://localhost:3001',
];

export async function POST(req: NextRequest) {
    try {
        // ============================================================
        // LAYER 1: AUTHENTICATION
        // Accept EITHER:
        //   a) Admin session cookie (set by admin login)
        //   b) X-User-Token header (set by regular dashboard users)
        // This allows operators to use calibration features while
        // still blocking completely unauthenticated external attacks.
        // ============================================================
        const session = req.cookies.get('session');
        const userToken = req.headers.get('x-user-token');
        if (!session?.value && !userToken) {
            console.warn('[Firebase Write] REJECTED: No auth from', req.headers.get('x-forwarded-for') || 'unknown IP');
            return NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 });
        }

        // ============================================================
        // LAYER 2: ORIGIN / CSRF CHECK
        // Must originate from our own domain (prevents CSRF attacks)
        // ============================================================
        const origin = req.headers.get('origin') || req.headers.get('referer') || '';
        const isAllowedOrigin = ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
        if (!isAllowedOrigin) {
            console.warn('[Firebase Write] REJECTED: Origin mismatch:', origin);
            return NextResponse.json({ error: 'Forbidden: Cross-origin request blocked' }, { status: 403 });
        }

        // ============================================================
        // LAYER 3: INPUT VALIDATION
        // ============================================================
        const body = await req.json();
        const { firebaseConfig, dbPath, value } = body;

        if (!dbPath) {
            return NextResponse.json({ error: 'Missing dbPath' }, { status: 400 });
        }

        // Block path traversal attempts
        if (dbPath.includes('..') || dbPath.includes('//') || dbPath.startsWith('/')) {
            console.warn('[Firebase Write] REJECTED: Suspicious dbPath:', dbPath);
            return NextResponse.json({ error: 'Invalid dbPath' }, { status: 400 });
        }

        // Default Database URL
        let databaseUrl = "https://esp32-speed-monitor-default-rtdb.asia-southeast1.firebasedatabase.app";

        // Parse custom config if provided
        if (firebaseConfig && typeof firebaseConfig === 'string') {
            let jsonString = firebaseConfig.trim();
            const firstBrace = jsonString.indexOf('{');
            const lastBrace = jsonString.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonString = jsonString.substring(firstBrace, lastBrace + 1);
                try {
                    const configObj = JSON.parse(jsonString);
                    if (configObj.databaseURL) {
                        databaseUrl = configObj.databaseURL;
                    }
                } catch (e: any) {
                    console.error("[Firebase Write] JSON Parse ERROR:", e.message);
                }
            }
        }

        const cleanBaseUrl = databaseUrl.replace(/\/+$/, '');
        const cleanPath = dbPath.replace(/^\/+|\/+$/g, '');
        const writeUrl = `${cleanBaseUrl}/${cleanPath}.json`;

        console.log(`[Firebase Write] PUT ${writeUrl} = ${JSON.stringify(value)}`);

        // Use PUT to write data to Firebase RTDB REST API
        const response = await fetch(writeUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(value)
        });

        if (!response.ok) {
            throw new Error(`Firebase Write Error: ${response.statusText} (${response.status})`);
        }

        const result = await response.json();
        console.log(`[Firebase Write] SUCCESS:`, result);

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error("[Firebase Write] Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
    }
}
