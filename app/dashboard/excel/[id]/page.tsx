"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { storageService } from "@/lib/storage";

export default function ExcelDetail() {
    const params = useParams();
    const id = (params?.id as string) || "sensor1";

    // FALLBACK DEFAULTS
    const DEFAULT_SHEET = "https://docs.google.com/spreadsheets/d/1ijV_1Bd3DIQbYt0Vzhuj4YBwEkVIuaygMHwA2jECHMs/edit?gid=0#gid=0";

    const [sensorName, setSensorName] = useState(id);
    const [embedUrl, setEmbedUrl] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        const init = async () => {
            try {
                await storageService.init();
                const sensors = await storageService.getSensors();
                const currentSensor = sensors.find(s => s.id === id);

                let targetSheetUrl = DEFAULT_SHEET;

                if (currentSensor) {
                    setSensorName(currentSensor.name);
                    if (currentSensor.spreadsheetUrl) {
                        targetSheetUrl = currentSensor.spreadsheetUrl;
                    }
                }

                // Construct URLs
                // 1. Preview URL: Replace /edit... with /preview...
                // Regex looks for /edit followed by anything until end of string, OR just /edit
                let embed = targetSheetUrl.replace(/\/edit.*$/, '/preview');
                if (!embed.includes('/preview')) embed += '/preview'; // Safety append if no edit found
                // Ensure query params are preserved if they were cut off? 
                // Actually /preview usually ignores params except gid. 
                // Better approach: 
                // If url has `gid=...`, keep it.
                if (targetSheetUrl.includes("gid=")) {
                    const gidMatch = targetSheetUrl.match(/gid=(\d+)/);
                    if (gidMatch) {
                        embed += `?gid=${gidMatch[1]}`;
                    }
                }

                // 2. Download URL: Replace /edit... with /export?format=xlsx...
                // We need to parse the URL to be safe
                let download = "";
                try {
                    // Extract ID and GID
                    // Standard URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=GID
                    const urlObj = new URL(targetSheetUrl);
                    const pathParts = urlObj.pathname.split('/');
                    const dIndex = pathParts.indexOf('d');
                    if (dIndex !== -1 && pathParts[dIndex + 1]) {
                        const spreadSheetId = pathParts[dIndex + 1];
                        let gid = "0";

                        // Try to find GID in hash (#gid=123) or search (?gid=123)
                        const hashGid = urlObj.hash.match(/gid=(\d+)/);
                        const searchGid = urlObj.searchParams.get("gid");

                        if (searchGid) gid = searchGid;
                        else if (hashGid) gid = hashGid[1];

                        download = `https://docs.google.com/spreadsheets/d/${spreadSheetId}/export?format=xlsx&gid=${gid}`;

                        // Re-construct embed more robustly
                        embed = `https://docs.google.com/spreadsheets/d/${spreadSheetId}/preview?gid=${gid}`;
                    } else {
                        // Fallback if URL parsing fails standard pattern
                        download = targetSheetUrl.replace(/\/edit.*$/, '/export?format=xlsx');
                        embed = targetSheetUrl.replace(/\/edit.*$/, '/preview');
                    }
                } catch (e) {
                    // Simple regex fallback
                    download = targetSheetUrl.replace(/\/edit.*$/, '/export?format=xlsx');
                    embed = targetSheetUrl.replace(/\/edit.*$/, '/preview');
                }

                setEmbedUrl(embed);
                setDownloadUrl(download);

            } catch (err) {
                console.error("Page Init Error:", err);
            }
        };

        if (id) init();
    }, [id]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] -mx-4 -mb-4 md:-m-8">
            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 md:px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f172a] shrink-0 z-20 relative gap-3">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/excel" className="size-10 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{sensorName} Log</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                    {/* ZOOM CONTROLS */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button
                            onClick={handleZoomOut}
                            className="size-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50"
                            disabled={zoom <= 0.5}
                            title="Zoom Out"
                        >
                            <span className="material-symbols-outlined text-[18px]">remove</span>
                        </button>
                        <span className="text-xs font-medium w-10 text-center text-slate-600 dark:text-slate-300 select-none">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            className="size-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50"
                            disabled={zoom >= 2}
                            title="Zoom In"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                    </div>

                    <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        <span className="hidden sm:inline">Download .XLSX</span>
                        <span className="sm:hidden">XLSX</span>
                    </a>
                </div>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 w-full bg-slate-50 dark:bg-[#1e293b] relative overflow-auto touch-pan-x touch-pan-y custom-scrollbar">
                {embedUrl ? (
                    <div
                        className="relative origin-top-left"
                        style={{
                            // The "Sizer" forces the parent scrollbar to appear
                            width: `${Math.max(zoom * 100, 100)}%`,
                            height: `${Math.max(zoom * 100, 100)}%`,
                            // Mobile: Force a minimum width to ensure horizontal scrolling is possible/easy
                            // even at 100% zoom if the screen is narrow.
                            minWidth: '100%',
                        }}
                    >
                        <div
                            className="absolute inset-0 origin-top-left transition-transform duration-200 ease-out"
                            style={{
                                // Counter-scale dimensions so the content renders at the "original" resolution
                                // then gets scaled up visually.
                                width: `${100 / zoom}%`,
                                height: `${100 / zoom}%`,
                                transform: `scale(${zoom})`
                            }}
                        >
                            <iframe
                                src={embedUrl}
                                className="w-full h-full border-0 bg-white"
                                title={`Preview Data ${sensorName}`}
                                loading="lazy"
                            ></iframe>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        <p>Loading Spreadsheet Config...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
