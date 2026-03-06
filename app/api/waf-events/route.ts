import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

export const revalidate = 60; // Cache for 60 seconds to avoid hitting API limits

export async function GET() {
    let cloudflareEvents: any[] = [];

    // 1. Fetch Cloudflare WAF Events (if configured)
    if (CLOUDFLARE_API_TOKEN && CLOUDFLARE_ZONE_ID) {
        const query = `
        query GetWAFEvents($zoneTag: string, $limit: Int!) {
            viewer {
                zones(filter: { zoneTag: $zoneTag }) {
                    firewallEventsAdaptive(
                        limit: $limit,
                        filter: {
                            datetime_geq: "${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}",
                            action_in: ["block", "managed_challenge", "jschallenge", "log"]
                        },
                        orderBy: [datetime_DESC]
                    ) {
                        datetime
                        clientIP
                        clientCountryName
                        action
                        ruleId
                        source
                        clientRequestURI
                        userAgent
                    }
                }
            }
        }
        `;

        try {
            const cfRes = await fetch('https://api.cloudflare.com/client/v4/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                },
                body: JSON.stringify({ query, variables: { zoneTag: CLOUDFLARE_ZONE_ID, limit: 100 } })
            });

            const cfData = await cfRes.json();
            if (!cfData.errors) {
                cloudflareEvents = cfData?.data?.viewer?.zones?.[0]?.firewallEventsAdaptive || [];
            } else {
                console.error("Cloudflare GraphQL Error:", JSON.stringify(cfData.errors));
            }
        } catch (e) {
            console.error("Cloudflare Fetch Error:", e);
        }
    }

    // 2. Fetch Custom Next.js High-Precision WAF Logs from Firestore
    let customEvents: any[] = [];
    try {
        const db = getAdminFirestore();

        // Get logs from the last 24 hours
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const logsSnapshot = await db.collection('waf_logs')
            .where('datetime', '>=', yesterday)
            .orderBy('datetime', 'desc')
            .limit(100)
            .get();

        logsSnapshot.forEach((doc: any) => {
            const data = doc.data();
            customEvents.push({
                ...data,
                id: doc.id,
                isCustomWaf: true // Flag to identify high-precision logs
            });
        });
    } catch (e) {
        console.error("Firestore Fetch Error for WAF Logs:", e);
    }

    // 3. Combine and Sort
    const allEvents = [...cloudflareEvents, ...customEvents].sort((a, b) => {
        return new Date(b.datetime).getTime() - new Date(a.datetime).getTime();
    });

    // Take top 150 most recent events overall
    return NextResponse.json({ success: true, events: allEvents.slice(0, 150) });
}
