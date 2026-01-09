"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authService } from '@/lib/auth';
import { storageService, User } from '@/lib/storage';

interface AdminSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const COMMANDER_EMAIL = process.env.NEXT_PUBLIC_COMMANDER_EMAIL || "anantawijaya212@gmail.com";
const COMMANDER_NAME = process.env.NEXT_PUBLIC_COMMANDER_NAME || "RAYNALDO ANANTA WIJAYA";

export default function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
    const pathname = usePathname();
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);

    React.useEffect(() => {
        const init = async () => {
            await storageService.init();
            const users = await storageService.getUsers();

            authService.onAuthStateChanged((firebaseUser) => {
                if (firebaseUser?.email) {
                    // FORCE COMMANDER OVERRIDE
                    if (firebaseUser.email.toLowerCase() === COMMANDER_EMAIL.toLowerCase()) {
                        setCurrentUser({
                            id: 'commander',
                            username: COMMANDER_NAME,
                            email: firebaseUser.email,
                            role: 'COMMANDER' as any, // Visual override
                            subRole: 'all',
                            permissions: { viewSpeed: true, viewSack: true, viewKwh: true, canEdit: true }
                        });
                        return;
                    }

                    const found = users.find(u => u.email.toLowerCase() === firebaseUser.email!.toLowerCase());
                    if (found) {
                        setCurrentUser(found);
                    }
                }
            });
        };
        init();
    }, []);

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

    const isCommander = currentUser?.email.toLowerCase() === COMMANDER_EMAIL.toLowerCase();

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
                    {/* User Profile Section with Integrated Logout */}
                    {currentUser && (
                        <div className="flex items-center gap-3 px-2 p-2 bg-[#1a2336]/50 rounded-lg border border-white/5 mx-[-8px]">
                            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm border 
                                ${isCommander ? 'bg-amber-500/20 text-amber-500 border-amber-500/20' : 'bg-blue-500/20 text-blue-500 border-blue-500/20'}`}>
                                <span className="material-symbols-outlined text-[20px]">
                                    {isCommander ? 'local_police' : 'security'}
                                </span>
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <p className={`text-sm font-bold truncate ${isCommander ? 'text-amber-500' : 'text-white'}`}>
                                    {currentUser?.username || 'Admin'}
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] text-[#92a4c9]">
                                    <span className="uppercase font-medium tracking-wide">{currentUser?.role}</span>
                                    {currentUser?.subRole && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-[#3b4b68]"></span>
                                            <span className="uppercase text-white/50">{currentUser.subRole}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
