"use client";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { storageService } from "@/lib/storage";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        storageService.init();
        const storedUser = localStorage.getItem('currentUser');

        if (!storedUser) {
            router.push('/');
        } else {
            setAuthorized(true);
        }
    }, [router]);

    if (!authorized) {
        return <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
            <div className="size-8 border-2 border-primary border-t-white rounded-full animate-spin"></div>
        </div>;
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
