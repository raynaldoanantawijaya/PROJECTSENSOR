import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { firebaseConfig, dbPath, value } = body;

        if (!dbPath) {
            return NextResponse.json({ error: 'Missing dbPath' }, { status: 400 });
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
