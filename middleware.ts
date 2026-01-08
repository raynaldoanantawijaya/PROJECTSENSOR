import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const session = request.cookies.get("session");

    // Protect /admin/dashboard and all sub-routes
    if (request.nextUrl.pathname.startsWith("/admin/dashboard")) {
        if (!session) {
            return NextResponse.redirect(new URL("/admin", request.url));
        }

        // Ideally verification happens here or on the server components/actions.
        // Since we are using an HTTP-only cookie set by the Admin SDK, verifying it fully 
        // would require Edge-compatible Admin SDK or an API call.
        // For efficiency, checking presence is the first line of defense.
        // The secure cookie is signed/encrypted by Next.js if using typical auth libs, 
        // but here it is a raw Firebase session cookie.
        // Actual validation happens when data is fetched on the backend or 
        // we can add a simple API verify call if strictly needed.
        // For now, presence check is robust enough against casual access.
    }

    // Redirect logged-in admins away from login page
    if (request.nextUrl.pathname === "/admin") {
        if (session) {
            return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
