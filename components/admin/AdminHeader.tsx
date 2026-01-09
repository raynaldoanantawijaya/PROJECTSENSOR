"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

interface AdminHeaderProps {
    onMenuClick?: () => void;
    children?: React.ReactNode;
}

export default function AdminHeader({ onMenuClick, children }: AdminHeaderProps) {
    const pathname = usePathname();

    const getPageTitle = () => {
        if (pathname === '/admin/dashboard') return 'Admin Home';
        if (pathname.includes('/users')) return 'User Control';
        if (pathname.includes('/sensors')) return 'Sensor Control';
        if (pathname.includes('/templates')) return 'Template Editor';
        return 'Admin Panel';
    };

    return (
        <header className="h-16 border-b border-[#232f48] px-6 md:px-10 flex items-center justify-between bg-[#111722]/80 backdrop-blur-md sticky top-0 z-10 w-full shrink-0">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-1 -ml-2 text-[#92a4c9] hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">{getPageTitle()}</h2>
            </div>
            <div className="flex items-center gap-4">
                {children}
                <button
                    onClick={async (e) => {
                        e.preventDefault();
                        try {
                            const { logoutAdminAction } = await import('@/app/actions/auth-actions');
                            await logoutAdminAction();
                            localStorage.removeItem('currentAdmin');
                            window.location.href = '/admin';
                        } catch (error) {
                            console.error("Logout failed", error);
                            window.location.href = '/admin';
                        }
                    }}
                    title="Logout"
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                </button>
            </div>
        </header>
    );
}
