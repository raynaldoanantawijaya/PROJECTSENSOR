"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { storageService } from '@/lib/storage';

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        storageService.init();
    }, []);

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
