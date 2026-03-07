"use client";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import DashboardLoadingSpinner from "@/components/DashboardLoadingSpinner";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('currentUser');
        const loginTimestamp = localStorage.getItem('loginTimestamp');
        const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

        // Security Check: Session Expiry
        if (loginTimestamp) {
            const timeElapsed = Date.now() - parseInt(loginTimestamp);
            if (timeElapsed > EIGHT_HOURS_MS) {
                console.warn("Session expired (8 hours limit). Logging out...");
                localStorage.removeItem('currentUser');
                localStorage.removeItem('loginTimestamp');
                import("@/lib/auth").then(({ authService }) => authService.logout());
                router.push('/');
                return;
            }
        }

        if (!storedUser) {
            router.push('/');
        } else {
            setAuthorized(true);
        }
    }, [router]);

    // SESSION HEARTBEAT: Check every 30s if this device's session is still valid.
    // If an admin clicked "Reset Devices", the sessionToken will be removed from
    // activeSessions in Firestore, and the next heartbeat will force-logout this browser.
    useEffect(() => {
        if (!authorized) return;

        const validateSession = async () => {
            try {
                const sessionToken = localStorage.getItem('sessionToken');
                const userStr = localStorage.getItem('currentUser');
                if (!sessionToken || !userStr) return;

                const user = JSON.parse(userStr);
                if (!user?.email) return;

                // Use the secure API endpoint to get fresh user data
                const firebaseUser = auth.currentUser;
                if (!firebaseUser) return;

                const idToken = await firebaseUser.getIdToken();
                const res = await fetch('/api/dashboard-data?type=users', {
                    headers: { 'Authorization': `Bearer ${idToken}` }
                });

                if (!res.ok) return;
                const data = await res.json();
                const users = data.users || [];

                const latestUser = users.find(
                    (u: any) => u.email.toLowerCase() === user.email.toLowerCase()
                );

                if (!latestUser) {
                    // User has been deleted from Firestore entirely
                    console.warn("User account deleted. Forcing logout...");
                    localStorage.clear();
                    router.push('/');
                    return;
                }

                const sessions = latestUser.activeSessions || [];
                if (!sessions.includes(sessionToken)) {
                    // Session was cleared by admin → force logout
                    console.warn("Session invalidated by admin. Forcing logout...");
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('sessionToken');
                    localStorage.removeItem('loginTimestamp');
                    import("@/lib/auth").then(({ authService }) => {
                        import("firebase/auth").then(({ signOut }) => {
                            signOut(authService as any).catch(() => { });
                        });
                    }).catch(() => { });
                    alert("Sesi Anda telah diakhiri oleh Admin. Silakan login kembali.");
                    window.location.href = '/';
                }
            } catch (e) {
                console.error("Session validation error:", e);
            }
        };

        // Check immediately once, then every 30 seconds
        validateSession();
        const intervalId = setInterval(validateSession, 30000);

        return () => clearInterval(intervalId);
    }, [authorized, router]);

    // Track Page Views — ONLY for sensor detail pages (e.g. /dashboard/speed/SPD-02)
    // Excel detail pages have their own dedicated VIEW_EXCEL log with sensor name.
    useEffect(() => {
        if (authorized && pathname) {
            const segments = pathname.split('/').filter(Boolean);
            const isDetailPage = segments.length === 3 && segments[0] === 'dashboard';
            const isExcelPage = segments[1] === 'excel'; // Excel has its own logger

            if (isDetailPage && !isExcelPage) {
                import('@/lib/activity-logger').then(({ oncePerSessionLog }) => {
                    oncePerSessionLog('VIEW_PAGE', pathname);
                }).catch(e => console.error("Logger error:", e));
            }
        }
    }, [pathname, authorized]);

    if (!authorized) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <DashboardLoadingSpinner message="Memverifikasi sesi..." />
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white h-screen flex flex-col overflow-hidden">
            <Header onMenuClick={() => setSidebarOpen(true)} />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0b0f17] p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
