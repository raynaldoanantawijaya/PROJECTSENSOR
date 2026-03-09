"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import DashboardLoadingSpinner from '@/components/DashboardLoadingSpinner';

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Verify admin session via server action
        const checkAuth = async () => {
            try {
                const { verifyAdminSession } = await import('@/app/actions/auth-actions');
                const session = await verifyAdminSession();

                if (!session || (session.role !== 'admin' && session.role !== 'commander')) {
                    router.replace('/admin');
                    return;
                }
                setAuthorized(true);
            } catch (e) {
                // If server action fails, allow access since middleware already validated cookie
                console.error("Admin session check failed:", e);
                setAuthorized(true);
            }
        };
        checkAuth();
    }, [router]);

    if (!authorized) {
        return <DashboardLoadingSpinner message="Memverifikasi akses admin..." />;
    }

    return (
        <div className="bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-white h-screen overflow-hidden flex flex-row antialiased font-display">
            <AdminSidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0 bg-[#101622] relative">
                <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    {children}
                </div>
            </div>
        </div>
    );
}
