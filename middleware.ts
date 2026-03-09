import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { analyzeRequest } from "./lib/waf";

export async function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl;

    // 1. HIGH-PRECISION WAF & HONEYPOT CHECK
    const fullUrl = request.url;
    const userAgent = request.headers.get("user-agent") || "";
    const cookiesRaw = request.headers.get("cookie") || "";

    const attackReport = analyzeRequest(fullUrl, userAgent, cookiesRaw);

    if (attackReport.isHackingAttempt) {
        // Collect attacker data - prioritize Cloudflare's real-IP headers
        const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "Unknown IP";

        // CF-IPCountry returns accurate 2-letter code
        const countryCode = request.headers.get("cf-ipcountry") || request.headers.get("x-vercel-ip-country") || "XX";
        const COUNTRY_NAMES: Record<string, string> = {
            'ID': 'Indonesia', 'US': 'United States', 'CN': 'China', 'RU': 'Russia',
            'SG': 'Singapore', 'IN': 'India', 'DE': 'Germany', 'NL': 'Netherlands',
            'GB': 'United Kingdom', 'FR': 'France', 'JP': 'Japan', 'KR': 'South Korea',
            'BR': 'Brazil', 'AU': 'Australia', 'CA': 'Canada', 'MY': 'Malaysia',
            'TH': 'Thailand', 'VN': 'Vietnam', 'PH': 'Philippines', 'HK': 'Hong Kong',
            'TW': 'Taiwan', 'UA': 'Ukraine', 'IR': 'Iran', 'PK': 'Pakistan',
            'BD': 'Bangladesh', 'NG': 'Nigeria', 'TR': 'Turkey', 'IT': 'Italy',
            'ES': 'Spain', 'PL': 'Poland', 'RO': 'Romania', 'XX': 'Unknown',
            'T1': 'Tor Exit Node'
        };
        const country = COUNTRY_NAMES[countryCode] || countryCode;

        // --- Client Hints: real device model (Chrome 110+ hides model in UA) ---
        const chModel = request.headers.get("sec-ch-ua-model")?.replace(/"/g, '') || '';
        const chPlatform = request.headers.get("sec-ch-ua-platform")?.replace(/"/g, '') || '';
        const chPlatformVersion = request.headers.get("sec-ch-ua-platform-version")?.replace(/"/g, '') || '';
        const chMobile = request.headers.get("sec-ch-ua-mobile") || '';
        const chUA = request.headers.get("sec-ch-ua")?.replace(/"/g, '') || '';

        const logData = {
            datetime: new Date().toISOString(),
            clientIP: ip,
            clientCountryName: country,
            action: 'block',
            ruleId: 'CUSTOM_WAF',
            source: attackReport.attackType,
            attackLabel: attackReport.attackLabel,
            clientRequestURI: pathname + search,
            userAgent: userAgent,
            // Client Hints for precise device info
            deviceModel: chModel,
            devicePlatform: chPlatform,
            devicePlatformVersion: chPlatformVersion,
            deviceMobile: chMobile,
            deviceBrands: chUA,
            threatLevel: attackReport.threatLevel,
            toolUsed: attackReport.toolUsed,
            payloadSnippet: attackReport.payloadSnippet,
            sourceType: attackReport.sourceType
        };

        // Fire and forget log request
        const origin = request.nextUrl.origin;
        fetch(`${origin}/api/waf-log`, {
            method: 'POST',
            body: JSON.stringify(logData),
            headers: { 'Content-Type': 'application/json' }
        }).catch(e => console.error("WAF logging failed", e));

        // Block the request
        return new NextResponse(
            JSON.stringify({ error: "Access Denied", message: "Malicious activity detected and logged." }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // 2. AUTHENTICATION & ROUTING LOGIC
    const session = request.cookies.get("session");

    if (pathname.startsWith("/admin/dashboard")) {
        if (!session) {
            return NextResponse.redirect(new URL("/admin", request.url));
        }
    }

    // Note: Removed auto-redirect from /admin → /admin/dashboard.
    // The layout's verifyAdminSession() handles auth, and /admin page must be
    // accessible to clear stale cookies via logoutAdminAction().

    // 3. Add Accept-CH header to ALL responses to request Client Hints from browser
    const response = NextResponse.next();
    response.headers.set('Accept-CH', 'Sec-CH-UA-Model, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version, Sec-CH-UA-Full-Version-List, Sec-CH-UA-Mobile');
    response.headers.set('Permissions-Policy', 'ch-ua-model=(self), ch-ua-platform=(self), ch-ua-platform-version=(self), ch-ua-mobile=(self)');
    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|api/waf-log|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
    ],
};
