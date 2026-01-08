"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { storageService, Sensor, User } from "@/lib/storage";
import { useRouter } from "next/navigation";

export default function DashboardHome() {
    const router = useRouter();
    const [counts, setCounts] = useState({ speed: 0, sack: 0, kwh: 0 });
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            await storageService.init();
            const storedUser = localStorage.getItem('currentUser');

            if (!storedUser) {
                router.push('/');
                return;
            }

            try {
                const sessionUser = JSON.parse(storedUser);
                // Fetch fresh data
                const allUsers = await storageService.getUsers();
                const freshUser = allUsers.find(u => u.id === sessionUser.id);
                setUser(freshUser || sessionUser);

                const sensors = await storageService.getSensors();
                setCounts({
                    speed: sensors.filter(s => s.type === 'speed').length,
                    sack: sensors.filter(s => s.type === 'sack').length,
                    kwh: sensors.filter(s => s.type === 'kwh').length
                });
            } catch (e) {
                console.error("Dashboard init error:", e);
                // Only redirect if absolutely necessary, but for now log error to keep user on page
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [router]);

    if (isLoading) return null; // or a loading spinner

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Dashboard Overview
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Welcome back, <span className="font-semibold text-primary">{user?.username}</span>. Real-time monitoring status.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                        Live Updates
                    </span>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/25 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            refresh
                        </span>
                        Refresh Data
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {user?.permissions.viewSpeed && (
                    <Link href="/dashboard/speed" className="group relative bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark p-6 cursor-pointer hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-6 right-6 flex items-center gap-2">
                            <span className="size-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                            <span className="text-xs font-medium text-green-500">Online</span>
                        </div>
                        <div className="size-12 rounded-lg bg-blue-50 dark:bg-primary/10 flex items-center justify-center text-primary mb-5 group-hover:scale-110 transition-transform duration-300">
                            <span className="material-symbols-outlined text-3xl">speed</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                            Sensor Kecepatan
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
                            Monitors conveyor belt velocity to ensure optimal production flow.
                        </p>
                        <div className="flex items-end justify-between border-t border-gray-100 dark:border-border-dark pt-4">
                            <div>
                                <p className="text-xs text-slate-400 mb-1">
                                    Jumlah mesin yang di monitoring
                                </p>
                                <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
                                    {counts.speed} <span className="text-sm font-medium text-slate-500">mesin</span>
                                </p>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform">
                                arrow_forward
                            </span>
                        </div>
                    </Link>
                )}

                {user?.permissions.viewSack && (
                    <Link href="/dashboard/sack" className="group relative bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark p-6 cursor-pointer hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-6 right-6 flex items-center gap-2">
                            <span className="size-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                            <span className="text-xs font-medium text-green-500">Active</span>
                        </div>
                        <div className="size-12 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-5 group-hover:scale-110 transition-transform duration-300">
                            <span className="material-symbols-outlined text-3xl">
                                inventory_2
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                            Sensor Karung
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
                            Counts units processed per hour at the packaging station.
                        </p>
                        <div className="flex items-end justify-between border-t border-gray-100 dark:border-border-dark pt-4">
                            <div>
                                <p className="text-xs text-slate-400 mb-1">
                                    Jumlah mesin yang di monitoring
                                </p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {counts.sack} <span className="text-sm font-medium text-slate-500">mesin</span>
                                </p>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform">
                                arrow_forward
                            </span>
                        </div>
                    </Link>
                )}

                {user?.permissions.viewKwh && (
                    <Link href="/dashboard/kwh" className="group relative bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark p-6 cursor-pointer hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-6 right-6 flex items-center gap-2">
                            <span className="size-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></span>
                            <span className="text-xs font-medium text-yellow-500">Stable</span>
                        </div>
                        <div className="size-12 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5 group-hover:scale-110 transition-transform duration-300">
                            <span className="material-symbols-outlined text-3xl">bolt</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                            Sensor KWH
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
                            Tracks real-time energy consumption for efficiency analysis.
                        </p>
                        <div className="flex items-end justify-between border-t border-gray-100 dark:border-border-dark pt-4">
                            <div>
                                <p className="text-xs text-slate-400 mb-1">
                                    Jumlah mesin yang di monitoring
                                </p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {counts.kwh} <span className="text-sm font-medium text-slate-500">mesin</span>
                                </p>
                            </div>
                            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:translate-x-1 transition-transform">
                                arrow_forward
                            </span>
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
}
