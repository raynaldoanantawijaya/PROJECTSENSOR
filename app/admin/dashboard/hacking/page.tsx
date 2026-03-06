"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";

interface WAFEvent {
    datetime: string;
    clientIP: string;
    clientCountryName: string;
    action: string;
    ruleId: string;
    source: string;
    clientRequestURI: string;
    userAgent: string;
}

export default function HackingLogsPage() {
    const [events, setEvents] = useState<WAFEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchEvents = async () => {
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/waf-events");
            const data = await res.json();
            if (data.success) {
                setEvents(data.events || []);
            } else {
                setError(data.error || "Gagal mengambil data dari Cloudflare");
            }
        } catch (e: any) {
            setError(e.message || "Terjadi kesalahan jaringan");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Format Date ID
    const formatDate = (isoString: string) => {
        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'medium',
            timeZone: 'Asia/Jakarta'
        }).format(new Date(isoString));
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'block':
                return <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded text-xs font-bold uppercase">Blocked</span>;
            case 'managed_challenge':
            case 'jschallenge':
                return <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded text-xs font-bold uppercase">Challenged</span>;
            case 'log':
                return <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded text-xs font-bold uppercase">Logged</span>;
            default:
                return <span className="text-gray-400">{action}</span>;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0b0f17] transition-colors">
            <AdminHeader />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1400px] mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500">security</span>
                            Hacking & WAF Logs
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                            Pantau ancaman keamanan, SQL Injection, XSS, dan serangan DDoS yang dicegat oleh Cloudflare.
                        </p>
                    </div>
                    <button
                        onClick={fetchEvents}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-primary/20"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>
                            refresh
                        </span>
                        Refresh API
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 dark:text-red-400">
                        <span className="material-symbols-outlined">error</span>
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <div className="bg-white dark:bg-[#111722] rounded-xl border border-gray-200 dark:border-[#232f48] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 dark:bg-[#192233] text-gray-600 dark:text-slate-300 font-semibold border-b border-gray-200 dark:border-[#232f48]">
                                <tr>
                                    <th className="px-6 py-4">Waktu (WIB)</th>
                                    <th className="px-6 py-4">IP & Lokasi</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Source / Tipe Serangan</th>
                                    <th className="px-6 py-4 w-1/4">Target URL / Payload</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-[#232f48]">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                Mengambil data WAF dari Cloudflare...
                                            </div>
                                        </td>
                                    </tr>
                                ) : events.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-symbols-outlined text-4xl opacity-50">verified_user</span>
                                                <p>Sistem aman. Tidak ada serangan terdeteksi dalam 24 jam terakhir.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    events.map((ev, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#151d2a] transition-colors">
                                            <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                                                {formatDate(ev.datetime)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 dark:text-white font-medium font-mono">{ev.clientIP}</span>
                                                    <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                                        <span className="material-symbols-outlined text-[14px]">public</span>
                                                        {ev.clientCountryName || "Unknown"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getActionBadge(ev.action)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col max-w-[200px]">
                                                    <span className="text-gray-900 dark:text-white font-medium text-wrap">{ev.source}</span>
                                                    {(ev.ruleId || ev.userAgent) && (
                                                        <span className="text-xs text-gray-500 dark:text-slate-400 mt-1 truncate" title={ev.userAgent}>
                                                            {ev.userAgent || `Rule: ${ev.ruleId}`}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-[300px]">
                                                <div className="text-gray-600 dark:text-slate-300 text-sm truncate bg-gray-100 dark:bg-[#1a2332] px-2 py-1 rounded font-mono" title={ev.clientRequestURI}>
                                                    {ev.clientRequestURI}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
