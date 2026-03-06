"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";

interface WAFEvent {
    // Cloudflare specific
    datetime: string;
    clientIP: string;
    clientCountryName?: string;
    action: string;
    ruleId?: string;
    source: string;
    clientRequestURI?: string;
    userAgent?: string;

    // Custom High-Precision WAF specific
    isCustomWaf?: boolean;
    threatLevel?: string;
    toolUsed?: string;
    payloadSnippet?: string;
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
                setError(data.error || "Gagal mengambil data WAF");
            }
        } catch (e: any) {
            setError(e.message || "Terjadi kesalahan jaringan");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const formatDate = (isoString: string) => {
        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'medium',
            timeZone: 'Asia/Jakarta'
        }).format(new Date(isoString));
    };

    const getActionBadge = (ev: WAFEvent) => {
        if (ev.isCustomWaf) {
            return (
                <div className="flex flex-col gap-1 items-start">
                    <span className="bg-red-600/20 text-red-600 dark:text-red-400 border border-red-600/30 px-2 py-1 rounded text-xs font-bold uppercase">Blocked (App)</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${ev.threatLevel === 'CRITICAL' ? 'bg-red-500 text-white' :
                            ev.threatLevel === 'HIGH' ? 'bg-orange-500 text-white' :
                                'bg-yellow-500 text-white'
                        }`}>{ev.threatLevel}</span>
                </div>
            );
        }

        switch (ev.action) {
            case 'block':
                return <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2 py-1 rounded text-xs font-bold uppercase">Blocked (Edge)</span>;
            case 'managed_challenge':
            case 'jschallenge':
                return <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded text-xs font-bold uppercase">Challenged</span>;
            case 'log':
                return <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded text-xs font-bold uppercase">Logged</span>;
            default:
                return <span className="text-gray-400 uppercase text-xs font-bold">{ev.action}</span>;
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
                            Pantau ancaman keamanan presisi tinggi (SQLi, XSS, Scanner Bots) yang dicegat oleh Cloudflare Edge dan App Firewall.
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
                                    <th className="px-6 py-4">Action & Threat</th>
                                    <th className="px-6 py-4">Serangan & Alat (Tool)</th>
                                    <th className="px-6 py-4 w-1/3">Target & Payload (Exact Match)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-[#232f48]">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                Mengambil metrik keamanan dari server...
                                            </div>
                                        </td>
                                    </tr>
                                ) : events.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-symbols-outlined text-4xl opacity-50">verified_user</span>
                                                <p>Sistem termonitor aman. Tidak ada serangan terdeteksi dalam 24 jam terakhir.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    events.map((ev, idx) => (
                                        <tr key={idx} className={`transition-colors ${ev.isCustomWaf ? 'bg-red-50/30 dark:bg-red-900/5 hover:bg-red-50 dark:hover:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#151d2a]'}`}>
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
                                                {getActionBadge(ev)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col max-w-[220px]">
                                                    <span className="text-gray-900 dark:text-white font-medium text-wrap">
                                                        {ev.source}
                                                    </span>
                                                    {(ev.toolUsed || ev.userAgent || ev.ruleId) && (
                                                        <span className={`text-xs mt-1 truncate ${ev.toolUsed && (ev.toolUsed.includes('MAP') || ev.toolUsed.includes('SCAN')) ? 'text-red-500 font-bold' : 'text-gray-500 dark:text-slate-400'}`} title={ev.toolUsed || ev.userAgent}>
                                                            <span className="material-symbols-outlined text-[12px] align-text-bottom mr-1 px-0">{ev.isCustomWaf ? 'bug_report' : 'fingerprint'}</span>
                                                            {ev.toolUsed || ev.userAgent || `Rule: ${ev.ruleId}`}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-[350px]">
                                                <div className="flex flex-col gap-2">
                                                    <div className="text-gray-600 dark:text-slate-300 text-xs truncate" title={ev.clientRequestURI}>
                                                        {ev.clientRequestURI}
                                                    </div>
                                                    {ev.payloadSnippet && (
                                                        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-mono text-[11px] p-2 rounded border border-red-200 dark:border-red-900/30 break-all whitespace-normal">
                                                            Line Match: <span className="font-bold">{ev.payloadSnippet}</span>
                                                        </div>
                                                    )}
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
