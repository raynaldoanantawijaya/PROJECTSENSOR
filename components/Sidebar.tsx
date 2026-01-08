"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { storageService, Sensor, User } from "@/lib/storage";

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Initialize storage and load sensors
        const init = async () => {
            await storageService.init();
            setSensors(await storageService.getSensors());

            const storedUserJSON = localStorage.getItem('currentUser');
            if (storedUserJSON) {
                try {
                    const sessionUser = JSON.parse(storedUserJSON);
                    const allUsers = await storageService.getUsers();
                    const freshUser = allUsers.find(u => u.id === sessionUser.id);
                    setUser(freshUser || sessionUser);
                } catch (e) {
                    console.error("Failed to parse user");
                }
            }
        };
        init();
    }, []);

    const isActive = (path: string) => pathname === path;

    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        dashboard: true,
        speed: false,
        sack: false,
        kwh: false
    });

    const toggleSection = (section: string) => {
        setExpanded(prev => {
            const isExpanding = !prev[section];
            const newExpanded = { ...prev, [section]: isExpanding };

            if (isExpanding && (section === 'speed' || section === 'sack' || section === 'kwh')) {
                newExpanded.speed = section === 'speed';
                newExpanded.sack = section === 'sack';
                newExpanded.kwh = section === 'kwh';
            }
            return newExpanded;
        });
    };

    useEffect(() => {
        const parts = pathname.split('/').filter(Boolean);

        if (pathname === '/dashboard') {
            setExpanded(prev => ({ ...prev, dashboard: false, speed: false, sack: false, kwh: false }));
        } else if (parts[1] === 'speed') {
            setExpanded(prev => ({
                ...prev,
                dashboard: true,
                speed: parts.length > 2 ? true : prev.speed,
                sack: false,
                kwh: false
            }));
        } else if (parts[1] === 'sack') {
            setExpanded(prev => ({
                ...prev,
                dashboard: true,
                speed: false,
                sack: parts.length > 2 ? true : prev.sack,
                kwh: false
            }));
        } else if (parts[1] === 'kwh') {
            setExpanded(prev => ({
                ...prev,
                dashboard: true,
                speed: false,
                sack: false,
                kwh: parts.length > 2 ? true : prev.kwh
            }));
        } else if (parts[1] === 'excel') {
            setExpanded(prev => ({ ...prev, dashboard: false, speed: false, sack: false, kwh: false }));
        }
    }, [pathname]);

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-background-dark border-r border-gray-200 dark:border-border-dark flex flex-col justify-between py-6 shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex items-center justify-between px-6 mb-6 lg:hidden">
                    <span className="font-bold text-lg text-slate-900 dark:text-white">Menu</span>
                    <button onClick={onClose} className="text-slate-500">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <nav className="px-3 space-y-1">
                    <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                        Main Menu
                    </p>

                    {/* Dashboard Tree Node */}
                    <div className="flex flex-col gap-1">
                        <Link
                            onClick={() => pathname === "/dashboard" && toggleSection("dashboard")}
                            href="/dashboard"
                            className={`flex items-center gap-1 p-2 rounded-lg transition-all cursor-pointer ${pathname === "/dashboard" || expanded["dashboard"]
                                ? "bg-slate-100 dark:bg-[#1e2736]"
                                : "hover:bg-slate-50 dark:hover:bg-surface-dark"
                                }`}>
                            <div className="p-1 rounded text-slate-400">
                                <span className="material-symbols-outlined text-sm">
                                    {expanded["dashboard"] ? "arrow_drop_down" : "chevron_right"}
                                </span>
                            </div>
                            <div className={`flex-1 flex items-center gap-3 ${pathname === "/dashboard" ? "text-primary font-bold" : "text-slate-600 dark:text-slate-300 font-medium"
                                }`}>
                                <span className={`material-symbols-outlined ${pathname === "/dashboard" ? "text-primary" : ""}`}>dashboard</span>
                                <span className="text-xs sm:text-sm">Dashboard</span>
                            </div>
                        </Link>

                        {/* Dashboard Children */}
                        {expanded["dashboard"] && (
                            <div className="flex flex-col gap-1 ml-2 border-l border-slate-200 dark:border-slate-800 pl-2">
                                {/* Speed Sensor */}
                                {user?.permissions.viewSpeed && (
                                    <div>
                                        <Link
                                            onClick={() => toggleSection("speed")}
                                            href="/dashboard/speed"
                                            className={`flex items-center gap-1 p-2 rounded-lg transition-all cursor-pointer ${pathname.includes("/speed") ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-slate-50 dark:hover:bg-surface-dark"
                                                }`}>
                                            <div className="p-1 rounded text-slate-400">
                                                <span className="material-symbols-outlined text-sm">
                                                    {expanded["speed"] ? "arrow_drop_down" : "chevron_right"}
                                                </span>
                                            </div>
                                            <div className={`flex-1 flex items-center gap-3 ${pathname === "/dashboard/speed" ? "text-primary font-bold" : "text-slate-600 dark:text-slate-300 font-medium"
                                                }`}>
                                                <span className={`material-symbols-outlined text-[20px] ${pathname.includes("/speed") ? "text-primary" : ""}`}>speed</span>
                                                <span className="text-xs sm:text-sm">Sensor Kecepatan</span>
                                            </div>
                                        </Link>
                                        {expanded["speed"] && (
                                            <div className="flex flex-col ml-6 mt-1 gap-1">
                                                {sensors.filter(s => s.type === 'speed').map((item) => (
                                                    <Link
                                                        key={item.id}
                                                        href={`/dashboard/speed/${item.id}`}
                                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive(`/dashboard/speed/${item.id}`)
                                                            ? "bg-primary text-white shadow-sm"
                                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark"
                                                            }`}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">settings_applications</span>
                                                        <span className="text-xs sm:text-sm">{item.name}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Sack Sensor */}
                                {user?.permissions.viewSack && (
                                    <div>
                                        <Link
                                            onClick={() => toggleSection("sack")}
                                            href="/dashboard/sack"
                                            className={`flex items-center gap-1 p-2 rounded-lg transition-all cursor-pointer ${pathname.includes("/sack") ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-slate-50 dark:hover:bg-surface-dark"
                                                }`}>
                                            <div className="p-1 rounded text-slate-400">
                                                <span className="material-symbols-outlined text-sm">
                                                    {expanded["sack"] ? "arrow_drop_down" : "chevron_right"}
                                                </span>
                                            </div>
                                            <div className={`flex-1 flex items-center gap-3 ${pathname === "/dashboard/sack" ? "text-primary font-bold" : "text-slate-600 dark:text-slate-300 font-medium"
                                                }`}>
                                                <span className={`material-symbols-outlined text-[20px] ${pathname.includes("/sack") ? "text-primary" : ""}`}>inventory_2</span>
                                                <span className="text-xs sm:text-sm">Sensor Lebar Karung</span>
                                            </div>
                                        </Link>
                                        {expanded["sack"] && (
                                            <div className="flex flex-col ml-6 mt-1 gap-1">
                                                {sensors.filter(s => s.type === 'sack').map((item) => (
                                                    <Link
                                                        key={item.id}
                                                        href={`/dashboard/sack/${item.id}`}
                                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive(`/dashboard/sack/${item.id}`)
                                                            ? "bg-primary text-white shadow-sm"
                                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark"
                                                            }`}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">straighten</span>
                                                        <span className="text-xs sm:text-sm">{item.name}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* KWH Sensor */}
                                {user?.permissions.viewKwh && (
                                    <div>
                                        <Link
                                            onClick={() => toggleSection("kwh")}
                                            href="/dashboard/kwh"
                                            className={`flex items-center gap-1 p-2 rounded-lg transition-all cursor-pointer ${pathname.includes("/kwh") ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-slate-50 dark:hover:bg-surface-dark"
                                                }`}>
                                            <div className="p-1 rounded text-slate-400">
                                                <span className="material-symbols-outlined text-sm">
                                                    {expanded["kwh"] ? "arrow_drop_down" : "chevron_right"}
                                                </span>
                                            </div>
                                            <div className={`flex-1 flex items-center gap-3 ${pathname === "/dashboard/kwh" ? "text-primary font-bold" : "text-slate-600 dark:text-slate-300 font-medium"
                                                }`}>
                                                <span className={`material-symbols-outlined text-[20px] ${pathname.includes("/kwh") ? "text-primary" : ""}`}>bolt</span>
                                                <span className="text-xs sm:text-sm">Sensor Kwh</span>
                                            </div>
                                        </Link>
                                        {expanded["kwh"] && (
                                            <div className="flex flex-col ml-6 mt-1 gap-1">
                                                {sensors.filter(s => s.type === 'kwh').map((item) => (
                                                    <Link
                                                        key={item.id}
                                                        href={`/dashboard/kwh/${item.id}`}
                                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive(`/dashboard/kwh/${item.id}`)
                                                            ? "bg-primary text-white shadow-sm"
                                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-dark"
                                                            }`}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">electric_meter</span>
                                                        <span className="text-xs sm:text-sm">{item.name}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Database Link */}
                    <div className="flex flex-col gap-1 mt-1">
                        <Link
                            href="/dashboard/excel"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all ${isActive("/dashboard/excel") || pathname.startsWith("/dashboard/excel/")
                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-dark"
                                }`}
                        >
                            <span className={`material-symbols-outlined transition-colors ${(!isActive("/dashboard/excel") && !pathname.startsWith("/dashboard/excel/")) && "group-hover:text-primary"}`}>
                                database
                            </span>
                            <span className="font-medium">Database</span>
                        </Link>
                    </div>
                </nav>
                <div className="px-6">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-surface-dark border border-gray-200 dark:border-border-dark">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-1.5 rounded bg-green-500/10 text-green-500">
                                <span className="material-symbols-outlined text-sm">wifi</span>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                System Online
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            All services operating normally.
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}
