import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { analyzeRequest } from "./lib/waf";

export async function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl;

    // 1. HIGH-PRECISION WAF & HONEYPOT CHECK
    // Extract details for analysis
    const fullUrl = request.url;
    const userAgent = request.headers.get("user-agent") || "";
    // Body scanning is limited in edge middleware, so we rely on URL/Query params + User-Agent

    const attackReport = analyzeRequest(fullUrl, userAgent);

    if (attackReport.isHackingAttempt) {
        // Collect attacker data
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "Unknown IP";
        const country = request.headers.get("x-vercel-ip-country") || "Unknown";

        // Asynchronously log the attack to our backend so we don't block the response time 
        // (but we immediately block the user)
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
            threatLevel: attackReport.threatLevel,
            toolUsed: attackReport.toolUsed,
            payloadSnippet: attackReport.payloadSnippet,
            sourceType: attackReport.sourceType
        };

        // Fire and forget log request (internal absolute URL required in middleware fetch)
        const origin = request.nextUrl.origin;
        fetch(`${origin}/api/waf-log`, {
            method: 'POST',
            body: JSON.stringify(logData),
            headers: { 'Content-Type': 'application/json' }
        }).catch(e => console.error("WAF logging failed", e));

        // Immediately block the request
        return new NextResponse(
            JSON.stringify({ error: "Access Denied", message: "Malicious activity detected and logged." }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // 2. AUTHENTICATION & ROUTING LOGIC
    const session = request.cookies.get("session");

    // Protect /admin/dashboard and all sub-routes
    if (pathname.startsWith("/admin/dashboard")) {
        if (!session) {
            return NextResponse.redirect(new URL("/admin", request.url));
        }
    }

    // Redirect logged-in admins away from login page
    if (pathname === "/admin") {
        if (session) {
            return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    // Match all paths except static files, next internals, and our own waf-log endpoint
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|api/waf-log|images|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
    ],
};
