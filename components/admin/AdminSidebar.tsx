"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path || pathname.startsWith(`${path}/`);
    };

    const handleLogout = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            const { logoutAdminAction } = await import('@/app/actions/auth-actions');
            await logoutAdminAction();
            localStorage.removeItem('currentAdmin'); // Clear legacy data just in case
            window.location.href = '/admin';
        } catch (error) {
            console.error("Logout failed", error);
            window.location.href = '/admin';
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`fixed inset-y-0 left-0 bg-[#111722] border-r border-[#232f48] flex flex-col flex-shrink-0 z-30 w-64 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-[#232f48]">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/20 p-1.5 rounded-lg">
                            <span className="material-symbols-outlined text-primary text-[24px]">admin_panel_settings</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-white text-base font-bold leading-none tracking-tight">Admin Panel</h1>
                        </div>
                    </div>
                    <button onClick={onClose} className="lg:hidden text-[#92a4c9] hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1.5">
                    <div className="px-3 mb-2">
                        <p className="text-xs font-semibold text-[#92a4c9] uppercase tracking-wider">Main Menu</p>
                    </div>

                    <Link
                        href="/admin/dashboard"
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${pathname === '/admin/dashboard'
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-[#92a4c9] hover:bg-[#232f48] hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">dashboard</span>
                        <p className="text-sm font-medium leading-normal">Dashboard</p>
                    </Link>

                    <Link
                        href="/admin/dashboard/users"
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive('/admin/dashboard/users')
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-[#92a4c9] hover:bg-[#232f48] hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">group</span>
                        <p className="text-sm font-medium leading-normal">Users</p>
                    </Link>

                    <Link
                        href="/admin/dashboard/sensors"
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive('/admin/dashboard/sensors')
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-[#92a4c9] hover:bg-[#232f48] hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">sensors</span>
                        <p className="text-sm font-medium leading-normal">Sensors</p>
                    </Link>

                    <Link
                        href="/admin/dashboard/templates"
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive('/admin/dashboard/templates')
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-[#92a4c9] hover:bg-[#232f48] hover:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">description</span>
                        <p className="text-sm font-medium leading-normal">Templates</p>
                    </Link>
                </nav>

                <div className="p-4 border-t border-[#232f48]">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-red-500/10 text-[#92a4c9] hover:text-red-500 transition-colors text-left group"
                    >
                        <span className="material-symbols-outlined text-[20px] group-hover:text-red-500 transition-colors">logout</span>
                        <p className="text-sm font-medium leading-normal">Logout</p>
                    </button>
                </div>
            </aside>
        </>
    );
}
