import { NextResponse } from 'next/server';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

export const revalidate = 60; // Cache for 60 seconds to avoid hitting API limits

export async function GET() {
    if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
        return NextResponse.json(
            { error: "Cloudflare credentials not configured." },
            { status: 500 }
        );
    }

    // GraphQL query to fetch WAF block events from the last 24 hours
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
        const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            },
            body: JSON.stringify({
                query,
                variables: {
                    zoneTag: CLOUDFLARE_ZONE_ID,
                    limit: 100
                }
            })
        });

        const data = await res.json();

        if (data.errors) {
            console.error("Cloudflare GraphQL Error:", JSON.stringify(data.errors));
            return NextResponse.json({ error: "Failed to fetch from Cloudflare API", details: data.errors }, { status: 500 });
        }

        const events = data?.data?.viewer?.zones?.[0]?.firewallEventsAdaptive || [];

        return NextResponse.json({ success: true, events });
    } catch (error: any) {
        console.error("Fetch Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
