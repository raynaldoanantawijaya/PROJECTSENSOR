import { NextRequest, NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/lib/memory-cache';

// Force dynamic behaviour for this API route
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { firebaseConfig, dbPath } = body;

        // Validasi input: Path wajib ada.
        if (!dbPath) {
            console.error("[Proxy] Error: Missing dbPath");
            return NextResponse.json({ error: 'Missing dbPath' }, { status: 400 });
        }

        // Default Database URL
        let databaseUrl = "https://esp32-speed-monitor-default-rtdb.asia-southeast1.firebasedatabase.app";
        let usedSource = "DEFAULT_FALLBACK";

        // Jika ada config custom, coba parse.
        if (firebaseConfig && typeof firebaseConfig === 'string') {
            let jsonString = firebaseConfig.trim();

            // LOG DEEP DEBUG
            // console.log("[Proxy Debug] Raw Config Length:", jsonString.length);

            // AGGRESSIVE REPAIR: Cari kurung kurawal pertama dan terakhir
            // Ini mengatasi masalah jika ada teks sampah di depan/belakang JSON
            const firstBrace = jsonString.indexOf('{');
            const lastBrace = jsonString.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                // Potong string hanya ambil bagian valid JSON-nya
                jsonString = jsonString.substring(firstBrace, lastBrace + 1);

                try {
                    const configObj = JSON.parse(jsonString);
                    if (configObj.databaseURL) {
                        databaseUrl = configObj.databaseURL;
                        usedSource = "CUSTOM_CONFIG";
                    } else {
                        console.warn("[Proxy] JSON Valid but NO databaseURL found!");
                    }
                } catch (e: any) {
                    console.error("[Proxy] JSON Parse ERROR:", e.message);
                    console.error("[Proxy] Extracted String was:", jsonString);
                }
            } else {
                console.warn("[Proxy] Config Invalid: No {} brackets found.");
            }
        }

        console.log(`[Proxy] DB SOURCE: ${usedSource} | URL: ${databaseUrl}`);

        // 1. GENERATE CACHE KEY
        const cleanBaseUrl = databaseUrl.replace(/\/+$/, '');
        const cleanPath = dbPath.replace(/^\/+|\/+$/g, '');
        const cacheKey = `${cleanBaseUrl}/${cleanPath}`;

        // 2. CHECK CACHE
        const cachedData = getFromCache(cacheKey);
        if (cachedData !== null) {
            // HIT! Return cached data instantly.
            return NextResponse.json({
                data: cachedData,
                source: 'cache'
            });
        }

        // 3. FETCH FROM FIREBASE (Cache Miss)
        const debugUrl = `${cleanBaseUrl}/${cleanPath}.json`;

        // LOG URL Untuk Debugging User
        console.log("---------------------------------------------------");
        console.log("[Proxy] FINAL URL (Try click this):");
        console.log(debugUrl);
        console.log("---------------------------------------------------");

        // Fetch
        const response = await fetch(debugUrl);

        if (!response.ok) {
            throw new Error(`Firebase Error: ${response.statusText} (${response.status})`);
        }

        const data = await response.json();

        // LOG Hasil Data
        console.log(`[Proxy] FETCH SUCCESS | Data:`, JSON.stringify(data));

        // 4. SAVE TO CACHE (TTL: 5 Seconds)
        setCache(cacheKey, data, 5);

        return NextResponse.json({
            data: data,
            source: 'firebase'
        });

    } catch (error: any) {
        console.error("Proxy Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
    }
}
