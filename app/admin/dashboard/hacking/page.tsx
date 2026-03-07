"use client";

import { useState, useEffect } from "react";

interface WAFEvent {
    id?: string;
    datetime: string;
    clientIP: string;
    clientCountryName?: string;
    action: string;
    ruleId?: string;
    source: string;
    clientRequestURI?: string;
    userAgent?: string;
    isCustomWaf?: boolean;
    threatLevel?: string;
    toolUsed?: string;
    payloadSnippet?: string;
    attackLabel?: string;
    sourceType?: string;
}

// --- Device Parser (lightweight, no external deps) ---
function parseDevice(ua: string): { browser: string; os: string; device: string } {
    if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };

    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    // Browser detection
    if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
    else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Browser';
    else if (/UCBrowser/i.test(ua)) browser = 'UC Browser';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Chrome/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/MSIE|Trident/i.test(ua)) browser = 'IE';
    // Bot/Scanner detection
    else if (/sqlmap/i.test(ua)) browser = 'SQLMap';
    else if (/nmap/i.test(ua)) browser = 'Nmap';
    else if (/python/i.test(ua)) browser = 'Python Script';
    else if (/curl/i.test(ua)) browser = 'cURL';
    else if (/Go-http/i.test(ua)) browser = 'Go Script';
    else if (/java/i.test(ua)) browser = 'Java Script';

    // OS detection
    if (/Android/i.test(ua)) {
        os = 'Android';
        device = 'Mobile';
    } else if (/iPhone/i.test(ua)) {
        os = 'iOS (iPhone)';
        device = 'Mobile';
    } else if (/iPad/i.test(ua)) {
        os = 'iOS (iPad)';
        device = 'Tablet';
    } else if (/Windows NT 10/i.test(ua)) os = 'Windows 10/11';
    else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
    else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
    else if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) {
        os = 'Linux';
        if (/Android/i.test(ua)) { os = 'Android'; device = 'Mobile'; }
    }
    else if (/CrOS/i.test(ua)) os = 'Chrome OS';

    return { browser, os, device };
}

export default function HackingLogsPage() {
    const [events, setEvents] = useState<WAFEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const fetchEvents = async () => {
        setIsLoading(true);
        setError("");
        try {
            // Add timestamp to bust ALL caches (browser, CDN, Vercel)
            const res = await fetch(`/api/waf-events?_t=${Date.now()}`, { cache: 'no-store' });
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

    const handleDeleteAll = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch('/api/waf-log', { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setShowDeleteConfirm(false);
                await fetchEvents(); // Refresh after delete
            } else {
                setError("Gagal menghapus log: " + (data.error || ""));
            }
        } catch (e: any) {
            setError("Gagal menghapus: " + e.message);
        }
        setIsDeleting(false);
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
        <>
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
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isLoading || events.length === 0}
                            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 disabled:opacity-40 text-red-500 hover:text-white px-4 py-2 rounded-lg font-medium transition-all border border-red-500/20 hover:border-red-500"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            Hapus Log
                        </button>
                        <button
                            onClick={fetchEvents}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-primary hover:bg-blue-600 disabled:bg-primary/50 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-primary/20"
                        >
                            <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>
                                refresh
                            </span>
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-[#1a2332] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-[#232f48]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-red-500">warning</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hapus Semua Log?</h3>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                                Semua log serangan yang tersimpan di database akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#232f48] transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={isDeleting}
                                    className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white transition-colors flex items-center gap-2"
                                >
                                    {isDeleting && <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    {isDeleting ? 'Menghapus...' : 'Ya, Hapus Semua'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 dark:text-red-400">
                        <span className="material-symbols-outlined">error</span>
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Stats Bar */}
                {!isLoading && events.length > 0 && (
                    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white dark:bg-[#111722] rounded-xl border border-gray-200 dark:border-[#232f48] p-4">
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Total Serangan</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{events.length}</p>
                        </div>
                        <div className="bg-white dark:bg-[#111722] rounded-xl border border-gray-200 dark:border-[#232f48] p-4">
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">CRITICAL</p>
                            <p className="text-2xl font-bold text-red-500 mt-1">{events.filter(e => e.threatLevel === 'CRITICAL').length}</p>
                        </div>
                        <div className="bg-white dark:bg-[#111722] rounded-xl border border-gray-200 dark:border-[#232f48] p-4">
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">IP Unik</p>
                            <p className="text-2xl font-bold text-orange-500 mt-1">{new Set(events.map(e => e.clientIP)).size}</p>
                        </div>
                        <div className="bg-white dark:bg-[#111722] rounded-xl border border-gray-200 dark:border-[#232f48] p-4">
                            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Custom WAF</p>
                            <p className="text-2xl font-bold text-blue-500 mt-1">{events.filter(e => e.isCustomWaf).length}</p>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-[#111722] rounded-xl border border-gray-200 dark:border-[#232f48] shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 dark:bg-[#192233] text-gray-600 dark:text-slate-300 font-semibold border-b border-gray-200 dark:border-[#232f48]">
                                <tr>
                                    <th className="px-5 py-4">Waktu (WIB)</th>
                                    <th className="px-5 py-4">IP & Lokasi</th>
                                    <th className="px-5 py-4">Device</th>
                                    <th className="px-5 py-4">Action & Threat</th>
                                    <th className="px-5 py-4">Serangan & Detail</th>
                                    <th className="px-5 py-4 w-1/4">Target & Payload</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-[#232f48]">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                Mengambil metrik keamanan dari server...
                                            </div>
                                        </td>
                                    </tr>
                                ) : events.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-symbols-outlined text-4xl opacity-50">verified_user</span>
                                                <p>Sistem termonitor aman. Tidak ada serangan terdeteksi.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    events.map((ev, idx) => {
                                        const deviceInfo = parseDevice(ev.userAgent || '');
                                        return (
                                            <tr key={ev.id || idx} className={`transition-colors ${ev.isCustomWaf ? 'bg-red-50/30 dark:bg-red-900/5 hover:bg-red-50 dark:hover:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#151d2a]'}`}>
                                                <td className="px-5 py-4 text-gray-600 dark:text-slate-300 text-xs">
                                                    {formatDate(ev.datetime)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-900 dark:text-white font-medium font-mono text-xs">{ev.clientIP}</span>
                                                        <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <span className="material-symbols-outlined text-[13px]">public</span>
                                                            {ev.clientCountryName || "Unknown"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col max-w-[140px]">
                                                        <span className="text-gray-900 dark:text-white text-xs font-medium flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[13px]">
                                                                {deviceInfo.device === 'Mobile' ? 'smartphone' : deviceInfo.device === 'Tablet' ? 'tablet' : 'computer'}
                                                            </span>
                                                            {deviceInfo.browser}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{deviceInfo.os}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {getActionBadge(ev)}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col max-w-[200px]">
                                                        <span className="text-gray-900 dark:text-white font-medium text-xs text-wrap">
                                                            {ev.source}
                                                        </span>
                                                        {ev.attackLabel && ev.attackLabel !== ev.source && (
                                                            <span className="text-[11px] text-orange-500 dark:text-orange-400 mt-0.5 text-wrap font-medium">
                                                                {ev.attackLabel}
                                                            </span>
                                                        )}
                                                        {ev.toolUsed && (
                                                            <span className={`text-[11px] mt-0.5 truncate ${ev.toolUsed.includes('Scanner') || ev.toolUsed.includes('Map') ? 'text-red-500 font-bold' : 'text-gray-500 dark:text-slate-400'}`} title={ev.toolUsed}>
                                                                <span className="material-symbols-outlined text-[11px] align-text-bottom mr-0.5">{ev.isCustomWaf ? 'bug_report' : 'fingerprint'}</span>
                                                                {ev.toolUsed}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 max-w-[280px]">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="text-gray-600 dark:text-slate-300 text-xs truncate font-mono" title={ev.clientRequestURI}>
                                                            {ev.clientRequestURI}
                                                        </div>
                                                        {ev.payloadSnippet && (
                                                            <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-mono text-[10px] p-1.5 rounded border border-red-200 dark:border-red-900/30 break-all whitespace-normal">
                                                                <span className="font-bold">{ev.payloadSnippet}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </>
    );
}
