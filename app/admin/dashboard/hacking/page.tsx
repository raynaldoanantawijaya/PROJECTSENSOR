"use client";

import { useState, useEffect } from "react";

interface WAFEvent {
    id?: string;
    datetime: string;
    clientIP: string;
    clientCountryName?: string;
    clientCity?: string;
    clientRegion?: string;
    clientISP?: string;
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
    // Client Hints (real device model from Chrome 110+)
    deviceModel?: string;
    devicePlatform?: string;
    devicePlatformVersion?: string;
    deviceMobile?: string;
    deviceBrands?: string;
}

// --- Enhanced Device Parser with Brand/Model ---
function parseDevice(ua: string): { browser: string; os: string; device: string; brand: string } {
    if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown', brand: '' };

    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';
    let brand = '';

    // Browser detection (order matters - check specific before generic)
    if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
    else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
    else if (/UCBrowser/i.test(ua)) browser = 'UC Browser';
    else if (/Brave/i.test(ua)) browser = 'Brave';
    else if (/Vivaldi/i.test(ua)) browser = 'Vivaldi';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/MSIE|Trident/i.test(ua)) browser = 'IE';
    // Bots / Tools
    else if (/sqlmap/i.test(ua)) { browser = 'SQLMap'; device = 'Bot'; }
    else if (/nmap/i.test(ua)) { browser = 'Nmap'; device = 'Bot'; }
    else if (/nikto/i.test(ua)) { browser = 'Nikto'; device = 'Bot'; }
    else if (/python-requests|python-urllib/i.test(ua)) { browser = 'Python'; device = 'Bot'; }
    else if (/curl/i.test(ua)) { browser = 'cURL'; device = 'Bot'; }
    else if (/Go-http/i.test(ua)) { browser = 'Go HTTP'; device = 'Bot'; }
    else if (/wget/i.test(ua)) { browser = 'Wget'; device = 'Bot'; }
    else if (/Postman/i.test(ua)) { browser = 'Postman'; device = 'Bot'; }

    // OS + Brand/Model detection
    if (/Android/i.test(ua)) {
        os = 'Android';
        device = 'Mobile';

        // Extract Android device model (appears after ";" before ")")
        // e.g., "Linux; Android 14; SM-S918B" -> SM-S918B
        const modelMatch = ua.match(/Android\s[\d.]+;\s*([^)]+)\)/);
        if (modelMatch) {
            let model = modelMatch[1].trim();
            // Remove "Build/" suffix if present
            model = model.replace(/\s*Build\/.*$/i, '').trim();

            // Map known model prefixes to brands
            if (/^SM-/i.test(model)) brand = `Samsung ${mapSamsungModel(model)}`;
            else if (/^SAMSUNG/i.test(model)) brand = `Samsung ${model.replace(/^SAMSUNG[-\s]*/i, '')}`;
            else if (/^Redmi|^POCO|^Mi\s|^M\d{4}/i.test(model)) brand = `Xiaomi ${model}`;
            else if (/^RMX|^CPH|^A\d{3}[A-Z]*/i.test(model) && /OPPO|Realme/i.test(ua)) brand = `OPPO/Realme ${model}`;
            else if (/^RMX/i.test(model)) brand = `Realme ${model}`;
            else if (/^CPH/i.test(model)) brand = `OPPO ${model}`;
            else if (/^V\d{4}/i.test(model)) brand = `Vivo ${model}`;
            else if (/^vivo/i.test(model)) brand = `Vivo ${model.replace(/^vivo\s*/i, '')}`;
            else if (/^Pixel/i.test(model)) brand = `Google ${model}`;
            else if (/^ASUS|^ZS|^ZE|^ZB/i.test(model)) brand = `ASUS ${model}`;
            else if (/^LG-|^LM-/i.test(model)) brand = `LG ${model}`;
            else if (/^moto|^XT/i.test(model)) brand = `Motorola ${model}`;
            else if (/^Nokia/i.test(model)) brand = `Nokia ${model.replace(/^Nokia\s*/i, '')}`;
            else if (/^IN\d{4}/i.test(model)) brand = `Infinix ${model}`;
            else if (/^itel/i.test(model)) brand = `Itel ${model}`;
            else if (/^TECNO/i.test(model)) brand = `Tecno ${model}`;
            else if (model === 'K' || model === 'M') brand = 'Android (model hidden)';
            else brand = model;
        }
    } else if (/iPhone/i.test(ua)) {
        os = 'iOS';
        device = 'Mobile';
        brand = 'Apple iPhone';
        // Try to get iOS version
        const iosMatch = ua.match(/iPhone OS (\d+[_\.]\d+)/);
        if (iosMatch) brand = `Apple iPhone (iOS ${iosMatch[1].replace('_', '.')})`;
    } else if (/iPad/i.test(ua)) {
        os = 'iPadOS';
        device = 'Tablet';
        brand = 'Apple iPad';
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
        os = 'macOS';
        brand = 'Apple Mac';
        const macMatch = ua.match(/Mac OS X (\d+[_\.]\d+)/);
        if (macMatch) os = `macOS ${macMatch[1].replace(/_/g, '.')}`;
    } else if (/Windows NT 10/i.test(ua)) {
        os = 'Windows 10/11';
        brand = 'PC Windows';
    } else if (/Windows NT 6\.3/i.test(ua)) {
        os = 'Windows 8.1';
        brand = 'PC Windows';
    } else if (/Windows NT 6\.1/i.test(ua)) {
        os = 'Windows 7';
        brand = 'PC Windows';
    } else if (/Windows/i.test(ua)) {
        os = 'Windows';
        brand = 'PC Windows';
    } else if (/CrOS/i.test(ua)) {
        os = 'Chrome OS';
        brand = 'Chromebook';
    } else if (/Linux/i.test(ua)) {
        os = 'Linux';
        brand = 'PC Linux';
    }

    if (device === 'Bot') brand = browser;

    return { browser, os, device, brand };
}

// Map Samsung model codes to readable names (common ones)
function mapSamsungModel(code: string): string {
    const map: Record<string, string> = {
        'SM-S928': 'Galaxy S24 Ultra', 'SM-S926': 'Galaxy S24+', 'SM-S921': 'Galaxy S24',
        'SM-S918': 'Galaxy S23 Ultra', 'SM-S916': 'Galaxy S23+', 'SM-S911': 'Galaxy S23',
        'SM-S908': 'Galaxy S22 Ultra', 'SM-S906': 'Galaxy S22+', 'SM-S901': 'Galaxy S22',
        'SM-G998': 'Galaxy S21 Ultra', 'SM-G996': 'Galaxy S21+', 'SM-G991': 'Galaxy S21',
        'SM-G988': 'Galaxy S20 Ultra', 'SM-G986': 'Galaxy S20+', 'SM-G981': 'Galaxy S20',
        'SM-G973': 'Galaxy S10', 'SM-G975': 'Galaxy S10+', 'SM-G970': 'Galaxy S10e',
        'SM-N986': 'Galaxy Note 20 Ultra', 'SM-N981': 'Galaxy Note 20',
        'SM-N975': 'Galaxy Note 10+', 'SM-N970': 'Galaxy Note 10',
        'SM-F946': 'Galaxy Z Fold5', 'SM-F936': 'Galaxy Z Fold4', 'SM-F926': 'Galaxy Z Fold3',
        'SM-F731': 'Galaxy Z Flip5', 'SM-F721': 'Galaxy Z Flip4', 'SM-F711': 'Galaxy Z Flip3',
        'SM-A546': 'Galaxy A54', 'SM-A536': 'Galaxy A53', 'SM-A526': 'Galaxy A52',
        'SM-A346': 'Galaxy A34', 'SM-A336': 'Galaxy A33', 'SM-A156': 'Galaxy A15',
        'SM-A146': 'Galaxy A14', 'SM-A057': 'Galaxy A05s', 'SM-A055': 'Galaxy A05',
        'SM-A236': 'Galaxy A23', 'SM-A135': 'Galaxy A13', 'SM-A127': 'Galaxy A12',
        'SM-M146': 'Galaxy M14', 'SM-M536': 'Galaxy M53',
    };
    // Match on the first 6 chars of the code (e.g., SM-S928)
    const prefix = code.substring(0, 6).toUpperCase();
    return map[prefix] || code;
}

// Map raw Client Hints model string to readable brand name
function mapModelToBrand(model: string): string {
    if (!model) return 'Unknown Device';
    // Samsung
    if (/^SM-/i.test(model)) return `Samsung ${mapSamsungModel(model)}`;
    if (/^SAMSUNG/i.test(model)) return `Samsung ${model.replace(/^SAMSUNG[-\s]*/i, '')}`;
    // Xiaomi
    if (/^Redmi|^POCO|^Mi\s/i.test(model)) return `Xiaomi ${model}`;
    if (/^M\d{4}/i.test(model)) return `Xiaomi ${model}`;
    // OPPO / Realme
    if (/^RMX/i.test(model)) return `Realme ${model}`;
    if (/^CPH/i.test(model)) return `OPPO ${model}`;
    // Vivo
    if (/^V\d{4}|^vivo/i.test(model)) return `Vivo ${model.replace(/^vivo\s*/i, '')}`;
    // Google
    if (/^Pixel/i.test(model)) return `Google ${model}`;
    // Others
    if (/^ASUS|^ZS|^ZE/i.test(model)) return `ASUS ${model}`;
    if (/^LG-|^LM-/i.test(model)) return `LG ${model}`;
    if (/^moto|^XT/i.test(model)) return `Motorola ${model}`;
    if (/^Nokia/i.test(model)) return `Nokia ${model.replace(/^Nokia\s*/i, '')}`;
    if (/^IN\d{4}/i.test(model)) return `Infinix ${model}`;
    if (/^TECNO/i.test(model)) return `Tecno ${model}`;
    if (/^itel/i.test(model)) return `Itel ${model}`;
    if (/^HUAWEI|^VOG|^ELS/i.test(model)) return `Huawei ${model}`;
    if (/^OnePlus|^KB|^LE/i.test(model)) return `OnePlus ${model}`;
    return model;
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
                await fetchEvents();
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

    // Build location string from available geo data
    const getLocation = (ev: WAFEvent) => {
        const parts = [ev.clientCity, ev.clientRegion, ev.clientCountryName].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Unknown';
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
                            Pantau ancaman keamanan presisi tinggi yang dicegat oleh Cloudflare Edge dan App Firewall.
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
                            <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
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
                                Semua log serangan akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-[#232f48] transition-colors">Batal</button>
                                <button onClick={handleDeleteAll} disabled={isDeleting} className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white transition-colors flex items-center gap-2">
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
                                    <th className="px-4 py-4">Waktu</th>
                                    <th className="px-4 py-4">IP & Lokasi</th>
                                    <th className="px-4 py-4">Device & Browser</th>
                                    <th className="px-4 py-4">Action</th>
                                    <th className="px-4 py-4">Serangan</th>
                                    <th className="px-4 py-4">Target & Payload</th>
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
                                                <p>Sistem aman. Tidak ada serangan terdeteksi.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    events.map((ev, idx) => {
                                        const d = parseDevice(ev.userAgent || '');
                                        return (
                                            <tr key={ev.id || idx} className={`transition-colors ${ev.isCustomWaf ? 'bg-red-50/30 dark:bg-red-900/5 hover:bg-red-50 dark:hover:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#151d2a]'}`}>
                                                <td className="px-4 py-3 text-gray-600 dark:text-slate-300 text-xs">
                                                    {formatDate(ev.datetime)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col max-w-[180px]">
                                                        <span className="text-gray-900 dark:text-white font-medium font-mono text-xs">{ev.clientIP}</span>
                                                        <span className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                                                            <span className="truncate" title={getLocation(ev)}>{getLocation(ev)}</span>
                                                        </span>
                                                        {ev.clientISP && (
                                                            <span className="text-[10px] text-gray-400 dark:text-slate-500 truncate mt-0.5" title={ev.clientISP}>
                                                                ISP: {ev.clientISP}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col max-w-[170px]">
                                                        <span className="text-gray-900 dark:text-white text-xs font-medium flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[13px]">
                                                                {d.device === 'Mobile' ? 'smartphone' : d.device === 'Tablet' ? 'tablet' : d.device === 'Bot' ? 'smart_toy' : 'computer'}
                                                            </span>
                                                            {/* Prefer Client Hints model, then UA-parsed brand */}
                                                            {ev.deviceModel
                                                                ? mapModelToBrand(ev.deviceModel)
                                                                : (d.brand || d.browser)}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                                                            {d.browser} • {ev.devicePlatform && ev.devicePlatformVersion
                                                                ? `${ev.devicePlatform} ${ev.devicePlatformVersion}`
                                                                : d.os}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getActionBadge(ev)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col max-w-[180px]">
                                                        <span className="text-gray-900 dark:text-white font-medium text-xs text-wrap">{ev.source}</span>
                                                        {ev.attackLabel && ev.attackLabel !== ev.source && (
                                                            <span className="text-[11px] text-orange-500 dark:text-orange-400 mt-0.5 text-wrap font-medium">{ev.attackLabel}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 max-w-[250px]">
                                                    <div className="flex flex-col gap-1">
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
