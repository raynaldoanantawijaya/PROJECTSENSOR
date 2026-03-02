import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const session = request.cookies.get("session");

    // Protect /admin/dashboard and all sub-routes
    if (request.nextUrl.pathname.startsWith("/admin/dashboard")) {
        if (!session) {
            return NextResponse.redirect(new URL("/admin", request.url));
        }
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
