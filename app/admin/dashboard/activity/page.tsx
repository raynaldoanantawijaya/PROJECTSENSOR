"use client";

import React, { useEffect, useState } from 'react';
import { storageService, User } from '@/lib/storage';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { ActivityLog } from '@/lib/activity-logger';

export default function AdminActivityPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            await storageService.init();

            const { getUsersAction, getActivityLogsAction } = await import('@/app/actions/admin-actions');
            const [usersRes, logsRes] = await Promise.all([getUsersAction(), getActivityLogsAction()]);

            setUsers(usersRes.data || []);

            const fetchedLogs = (logsRes.data || []).map((log: any) => ({
                ...log,
                timestamp: new Date(log.timestamp)
            }));
            setLogs(fetchedLogs);
        } catch (error) {
            console.error("Failed to load activity data:", error);
        }
        setIsLoading(false);
    };

    const handleResetSessions = async (userId: string) => {
        const targetUser = users.find(u => u.id === userId);
        if (!targetUser) return;

        if (confirm(`Apakah Anda yakin ingin me-reset (Logout paksa) semua perangkat untuk user ${targetUser.username}?`)) {
            try {
                const updatedUser = { ...targetUser, activeSessions: [] };
                const { saveUserAction } = await import('@/app/actions/admin-actions');
                const res = await saveUserAction(updatedUser);

                if (res.success) {
                    setUsers(users.map(u => u.id === userId ? updatedUser : u));
                    alert("Sesi berhasil di-reset. User sekarang bisa login dari perangkat baru.");
                } else {
                    console.error("Gagal reset sesi:", res.error);
                    alert("Gagal me-reset sesi: " + res.error);
                }
            } catch (error) {
                console.error("Gagal reset sesi:", error);
                alert("Gagal me-reset sesi.");
            }
        }
    };

    const handleClearAllLogs = async () => {
        if (!confirm('Apakah Anda yakin ingin menghapus SEMUA log aktivitas? Tindakan ini tidak bisa dikembalikan.')) return;
        try {
            const { clearLogsAction } = await import('@/app/actions/admin-actions');
            const res = await clearLogsAction();

            if (res.success) {
                setLogs([]);
                alert('Semua log aktivitas berhasil dihapus.');
            } else {
                alert('Gagal menghapus log: ' + res.error);
            }
        } catch (error) {
            console.error("Failed to clear logs:", error);
            alert('Terjadi kesalahan saat menghapus log.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:px-12">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-white tracking-tight text-3xl font-bold leading-tight">Aktivitas User</h2>
                        <p className="text-[#92a4c9] text-base font-normal">Pantau aktivitas pengguna dan kelola perangkat aktif.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleClearAllLogs}
                            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-lg border border-red-500/20 transition-all text-sm font-medium"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                            Hapus Semua Log
                        </button>
                        <button
                            onClick={loadData}
                            className="flex items-center gap-2 bg-[#232f48] hover:bg-[#3b4b68] text-white px-4 py-2.5 rounded-lg border border-white/5 transition-all text-sm font-medium"
                        >
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                            Refresh Data
                        </button>
                    </div>
                </div>

                {/* --- Section 1: Active Devices --- */}
                <div className="bg-[#232f48] border border-white/5 rounded-xl shadow-md overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-[#3b4b68] bg-[#1a2336] flex items-center gap-3">
                        <span className="material-symbols-outlined text-emerald-400">devices</span>
                        <h3 className="text-white font-semibold">Monitor Perangkat Aktif</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1a2336] border-b border-[#3b4b68]">
                                    <th className="p-4 text-xs font-semibold tracking-wide text-[#92a4c9] uppercase">User</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-[#92a4c9] uppercase">Sesi Aktif (Max 2)</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-[#92a4c9] uppercase text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.filter(u => u.role === 'user').map(user => {
                                    const activeCount = user.activeSessions?.length || 0;
                                    const isMaxed = activeCount >= 2;

                                    return (
                                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-4">
                                                <p className="text-white font-medium text-sm">{user.username}</p>
                                                <p className="text-[#92a4c9] text-xs">{user.email}</p>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-full max-w-[100px] h-2 bg-[#111722] rounded-full overflow-hidden`}>
                                                        <div
                                                            className={`h-full ${isMaxed ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                            style={{ width: `${(Math.min(activeCount, 2) / 2) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className={`text-xs font-bold ${isMaxed ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        {activeCount} / 2
                                                    </span>
                                                </div>
                                                {isMaxed && <p className="text-[10px] text-red-400 mt-1">Batas Tercapai</p>}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleResetSessions(user.id)}
                                                    disabled={activeCount === 0}
                                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed border border-red-500/20 rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    Reset Devices
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- Section 2: Activity Logs --- */}
                <div className="bg-[#232f48] border border-white/5 rounded-xl shadow-md overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-[#3b4b68] bg-[#1a2336] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-blue-400">history</span>
                            <h3 className="text-white font-semibold">100 Log Aktivitas Terakhir</h3>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1a2336] border-b border-[#3b4b68]">
                                    <th className="p-4 text-xs font-semibold tracking-wide text-[#92a4c9] uppercase">Waktu</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-[#92a4c9] uppercase">User</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-[#92a4c9] uppercase">Aktivitas</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-[#92a4c9] uppercase">Device / Info</th>
                                    <th className="p-4 text-xs font-semibold tracking-wide text-[#92a4c9] uppercase text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 whitespace-nowrap">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-[#92a4c9] text-sm italic">Belum ada aktivitas yang tercatat.</td>
                                    </tr>
                                ) : logs.map((log, i) => (
                                    <tr key={i} className={`transition-colors ${log.isSuspicious ? 'bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-white/[0.02]'}`}>
                                        <td className="p-4 align-top">
                                            <p className="text-white text-sm">{log.timestamp instanceof Date ? log.timestamp.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</p>
                                            <p className="text-[#92a4c9] text-xs">{log.timestamp instanceof Date ? log.timestamp.toLocaleTimeString('id-ID', { hour12: false }) : '-'}</p>
                                        </td>
                                        <td className="p-4 align-top">
                                            <p className="text-white text-sm font-medium">{log.userEmail.split('@')[0]}</p>
                                            <p className="text-[#92a4c9] text-[10px]">{log.userEmail}</p>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                                    ${log.action === 'LOGIN' ? 'bg-blue-500/20 text-blue-400' : ''}
                                                    ${log.action === 'EDIT_CONFIG' ? 'bg-amber-500/20 text-amber-400' : ''}
                                                    ${log.action === 'VIEW_PAGE' ? 'bg-slate-500/20 text-slate-300' : ''}
                                                    ${log.action === 'VIEW_EXCEL' ? 'bg-green-500/20 text-green-400' : ''}
                                                    ${log.action === 'SCRAPING_ALERT' ? 'bg-red-600/30 text-red-400 animate-pulse ring-1 ring-red-500/50' : ''}
                                                    ${!['LOGIN', 'EDIT_CONFIG', 'VIEW_PAGE', 'VIEW_EXCEL', 'SCRAPING_ALERT'].includes(log.action) ? 'bg-purple-500/20 text-purple-400' : ''}
                                                `}>
                                                    {log.action}
                                                </span>
                                            </div>
                                            <p className="text-gray-300 text-xs whitespace-normal max-w-[300px]">{log.details}</p>
                                        </td>
                                        <td className="p-4 align-top">
                                            <p className="text-gray-400 text-xs flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">devices</span>
                                                {log.deviceInfo || 'Unknown'}
                                            </p>
                                        </td>
                                        <td className="p-4 align-top text-right">
                                            {log.isSuspicious ? (
                                                <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-500 border border-red-500/30 px-2 py-1 rounded text-xs font-bold animate-pulse">
                                                    <span className="material-symbols-outlined text-[14px]">warning</span>
                                                    POTENSI SCRAPING
                                                </span>
                                            ) : (
                                                <span className="text-emerald-500 text-xs flex items-center justify-end gap-1 font-medium">
                                                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                    Aman
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="h-10"></div>
            </div>
        </main>
    );
}
