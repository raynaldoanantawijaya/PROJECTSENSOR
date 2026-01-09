"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { storageService, Sensor, User } from "@/lib/storage";

const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-');

export default function ExcelPreviewPage() {
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [user, setUser] = useState<User | null>(null);

    // CONFIG DIRECT DOWNLOAD (XLSX) - Default Fallback REMOVED
    // const SPREADSHEET_ID = "1ijV_1Bd3DIQbYt0Vzhuj4YBwEkVIuaygMHwA2jECHMs";
    // const DEFAULT_DOWNLOAD_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx&gid=0`;

    useEffect(() => {
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

    const getSensorsByType = (type: Sensor['type']) => {
        return sensors.filter(s => s.type === type);
    };

    const getSensorDownloadUrl = (sensor: Sensor): string | null => {
        if (!sensor.spreadsheetUrl || sensor.spreadsheetUrl.trim() === "") return null;

        let url = sensor.spreadsheetUrl;
        try {
            // Basic validation check
            if (!url.includes("docs.google.com/spreadsheets")) {
                // If it's not a google sheet url, strictly speaking we might want to allow it 
                // if it's a direct link to another file, but for now let's assume sheets.
                // If valid elsewhere, return as is? No, let's be strict or return null if not recognizable.
                // Assuming mostly Google Sheets for this project.
                // Return null if it doesn't look like a URL at all.
                if (!url.startsWith('http')) return null;
            }

            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const dIndex = pathParts.indexOf('d');
            if (dIndex !== -1 && pathParts[dIndex + 1]) {
                const spreadSheetId = pathParts[dIndex + 1];
                let gid = "0";
                const hashGid = urlObj.hash.match(/gid=(\d+)/);
                const searchGid = urlObj.searchParams.get("gid");
                if (searchGid) gid = searchGid;
                else if (hashGid) gid = hashGid[1];

                return `https://docs.google.com/spreadsheets/d/${spreadSheetId}/export?format=xlsx&gid=${gid}`;
            } else {
                return url.replace(/\/edit.*$/, '/export?format=xlsx');
            }
        } catch (e) {
            // Fallback: If it has /edit, try to swap. Otherwise return raw if valid URL? 
            // Better to return null if we can't guarantee a download link.
            if (url.includes('/edit')) {
                return url.replace(/\/edit.*$/, '/export?format=xlsx');
            }
            return null;
        }
    };

    const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>, url: string | null) => {
        if (!url) {
            e.preventDefault();
            alert("Tidak ada file yang bisa didownload");
        }
    };

    const speedSensors = getSensorsByType('speed');
    const sackSensors = getSensorsByType('sack');
    const kwhSensors = getSensorsByType('kwh');

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm mb-1">
                    <Link href="/dashboard" className="text-[#92a4c9] hover:text-white transition-colors font-medium">Dashboard</Link>
                    <span className="material-symbols-outlined text-[#526079] text-sm">chevron_right</span>
                    <span className="text-white font-medium">Database</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Database</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-2xl">
                            Access and manage your daily sensor data logs. Download simplified reports for offline analysis.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Speed Sensors */}
                {user?.permissions.viewSpeed && (
                    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="px-4 py-5 border-b border-gray-200 dark:border-border-dark flex justify-between items-center bg-gray-50/50 dark:bg-[#1e2736]">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
                                    <span className="material-symbols-outlined">speed</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Sensor Kecepatan</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Daily velocity logs</p>
                                </div>
                            </div>
                            <div className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                                {speedSensors.length} Files
                            </div>
                        </div>
                        {speedSensors.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-border-dark/50">
                                {speedSensors.map((sensor) => {
                                    const downloadUrl = getSensorDownloadUrl(sensor);
                                    return (
                                        <div key={sensor.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1e2736]/50 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="size-9 rounded-lg bg-green-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-green-200 dark:border-emerald-500/20">
                                                    <span className="material-symbols-outlined text-sm">description</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-gray-200 group-hover:text-primary transition-colors">Report {sensor.name}</p>
                                                    <p className="text-xs text-slate-500">Updated today at 08:00 AM</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* PREVIEW -> INTERNAL */}
                                                <Link
                                                    href={`/dashboard/excel/${sensor.id}?type=speed`}
                                                    className="size-9 flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:text-white hover:bg-primary dark:hover:bg-primary rounded-lg transition-colors border border-transparent hover:border-primary"
                                                    title="Preview Data"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                </Link>
                                                {/* DOWNLOAD -> DIRECT XLSX DYNAMIC */}
                                                <a
                                                    href={downloadUrl || "#"}
                                                    onClick={(e) => handleDownloadClick(e, downloadUrl)}
                                                    download={!!downloadUrl}
                                                    className={`size-9 flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:text-white hover:bg-green-600 dark:hover:bg-green-600 rounded-lg transition-colors border border-transparent hover:border-green-600 ${!downloadUrl ? 'opacity-50 cursor-pointer' : ''}`}
                                                    title={downloadUrl ? "Download .XLSX" : "No file available (Tampilkan pesan)"}
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                No Speed Sensors Configured
                            </div>
                        )}
                    </div>
                )}

                {/* Sack Sensors */}
                {user?.permissions.viewSack && (
                    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="px-4 py-5 border-b border-gray-200 dark:border-border-dark flex justify-between items-center bg-gray-50/50 dark:bg-[#1e2736]">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-500/20">
                                    <span className="material-symbols-outlined">inventory_2</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Sensor Karung</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Production count logs</p>
                                </div>
                            </div>
                            <div className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                                {sackSensors.length} Files
                            </div>
                        </div>
                        {sackSensors.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-border-dark/50">
                                {sackSensors.map((sensor) => {
                                    const downloadUrl = getSensorDownloadUrl(sensor);
                                    return (
                                        <div key={sensor.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1e2736]/50 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="size-9 rounded-lg bg-green-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-green-200 dark:border-emerald-500/20">
                                                    <span className="material-symbols-outlined text-sm">description</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-gray-200 group-hover:text-primary transition-colors">Report {sensor.name}</p>
                                                    <p className="text-xs text-slate-500">Updated today at 08:30 AM</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/dashboard/excel/${sensor.id}?type=sack`}
                                                    className="size-9 flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:text-white hover:bg-primary dark:hover:bg-primary rounded-lg transition-colors border border-transparent hover:border-primary"
                                                    title="Preview Data"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                </Link>
                                                <a
                                                    href={downloadUrl || "#"}
                                                    onClick={(e) => handleDownloadClick(e, downloadUrl)}
                                                    download={!!downloadUrl}
                                                    className={`size-9 flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:text-white hover:bg-green-600 dark:hover:bg-green-600 rounded-lg transition-colors border border-transparent hover:border-green-600 ${!downloadUrl ? 'opacity-50 cursor-pointer' : ''}`}
                                                    title={downloadUrl ? "Download .XLSX" : "No file available (Tampilkan pesan)"}
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                No Sack Sensors Configured
                            </div>
                        )}
                    </div>
                )}

                {/* KWH Sensors */}
                {user?.permissions.viewKwh && (
                    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="px-4 py-5 border-b border-gray-200 dark:border-border-dark flex justify-between items-center bg-gray-50/50 dark:bg-[#1e2736]">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-500/20">
                                    <span className="material-symbols-outlined">bolt</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Sensor KWH</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Energy consumption logs</p>
                                </div>
                            </div>
                            <div className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                                {kwhSensors.length} Files
                            </div>
                        </div>
                        {kwhSensors.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-border-dark/50">
                                {kwhSensors.map((sensor) => {
                                    const downloadUrl = getSensorDownloadUrl(sensor);
                                    return (
                                        <div key={sensor.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1e2736]/50 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="size-9 rounded-lg bg-green-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-green-200 dark:border-emerald-500/20">
                                                    <span className="material-symbols-outlined text-sm">description</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-gray-200 group-hover:text-primary transition-colors">Report {sensor.name}</p>
                                                    <p className="text-xs text-slate-500">Updated today at 09:00 AM</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/dashboard/excel/${sensor.id}?type=kwh`}
                                                    className="size-9 flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:text-white hover:bg-primary dark:hover:bg-primary rounded-lg transition-colors border border-transparent hover:border-primary"
                                                    title="Preview Data"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                </Link>
                                                <a
                                                    href={downloadUrl || "#"}
                                                    onClick={(e) => handleDownloadClick(e, downloadUrl)}
                                                    download={!!downloadUrl}
                                                    className={`size-9 flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:text-white hover:bg-green-600 dark:hover:bg-green-600 rounded-lg transition-colors border border-transparent hover:border-green-600 ${!downloadUrl ? 'opacity-50 cursor-pointer' : ''}`}
                                                    title={downloadUrl ? "Download .XLSX" : "No file available (Tampilkan pesan)"}
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                No KWH Sensors Configured
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
