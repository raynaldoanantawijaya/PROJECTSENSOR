"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { storageService } from "@/lib/storage";

export default function ExcelDetail() {
    const params = useParams();
    const id = (params?.id as string) || "sensor1";

    const [sensorName, setSensorName] = useState(id);
    const [embedUrl, setEmbedUrl] = useState("");
    const [downloadUrl, setDownloadUrl] = useState("");
    const [zoom, setZoom] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [noFile, setNoFile] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                setIsLoading(true);
                await storageService.init();
                const sensors = await storageService.getSensors();
                const currentSensor = sensors.find(s => s.id === id);

                if (currentSensor) {
                    setSensorName(currentSensor.name);

                    if (!currentSensor.spreadsheetUrl || currentSensor.spreadsheetUrl.trim() === "") {
                        setNoFile(true);
                        setIsLoading(false);
                        return;
                    }

                    const targetSheetUrl = currentSensor.spreadsheetUrl;

                    // Simple validation regex for Google Sheets URL
                    if (!targetSheetUrl.includes("docs.google.com/spreadsheets")) {
                        setNoFile(true); // Invalid URL
                        setIsLoading(false);
                        return;
                    }

                    setNoFile(false);

                    // Construct URLs
                    // 1. Preview URL
                    let embed = targetSheetUrl.replace(/\/edit.*$/, '/preview');
                    if (!embed.includes('/preview')) embed += '/preview';

                    // Maintain GID if present
                    if (targetSheetUrl.includes("gid=")) {
                        const gidMatch = targetSheetUrl.match(/gid=(\d+)/);
                        if (gidMatch) {
                            embed += `?gid=${gidMatch[1]}`;
                        }
                    }

                    // 2. Download URL logic
                    let download = "";
                    try {
                        const urlObj = new URL(targetSheetUrl);
                        const pathParts = urlObj.pathname.split('/');
                        const dIndex = pathParts.indexOf('d');
                        if (dIndex !== -1 && pathParts[dIndex + 1]) {
                            const spreadSheetId = pathParts[dIndex + 1];
                            let gid = "0";

                            const hashGid = urlObj.hash.match(/gid=(\d+)/);
                            const searchGid = urlObj.searchParams.get("gid");

                            if (searchGid) gid = searchGid;
                            else if (hashGid) gid = hashGid[1];

                            download = `https://docs.google.com/spreadsheets/d/${spreadSheetId}/export?format=xlsx&gid=${gid}`;

                            // Re-construct embed more robustly based on ID
                            embed = `https://docs.google.com/spreadsheets/d/${spreadSheetId}/preview?gid=${gid}`;
                        } else {
                            download = targetSheetUrl.replace(/\/edit.*$/, '/export?format=xlsx');
                            embed = targetSheetUrl.replace(/\/edit.*$/, '/preview');
                        }
                    } catch (e) {
                        download = targetSheetUrl.replace(/\/edit.*$/, '/export?format=xlsx');
                        embed = targetSheetUrl.replace(/\/edit.*$/, '/preview');
                    }

                    setEmbedUrl(embed);
                    setDownloadUrl(download);
                } else {
                    // Sensor not found
                    setSensorName("Unknown Sensor");
                    setNoFile(true);
                }

            } catch (err) {
                console.error("Page Init Error:", err);
                setNoFile(true);
            } finally {
                setIsLoading(false);
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
                    {!noFile && !isLoading && (
                        <>
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
                                download
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                            >
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                <span className="hidden sm:inline">Download .XLSX</span>
                                <span className="sm:hidden">XLSX</span>
                            </a>
                        </>
                    )}
                </div>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 w-full bg-slate-50 dark:bg-[#1e293b] relative overflow-auto touch-pan-x touch-pan-y custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-slate-500">
                        <p>Loading Spreadsheet...</p>
                    </div>
                ) : noFile ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                        <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-slate-400">description_off</span>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">Tidak ada file excel</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Belum ada link spreadsheet yang dikonfigurasi untuk sensor ini.</p>
                        </div>
                    </div>
                ) : (
                    embedUrl && (
                        <div
                            className="relative origin-top-left"
                            style={{
                                width: `${Math.max(zoom * 100, 100)}%`,
                                height: `${Math.max(zoom * 100, 100)}%`,
                                minWidth: '100%',
                            }}
                        >
                            <div
                                className="absolute inset-0 origin-top-left transition-transform duration-200 ease-out"
                                style={{
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
                    )
                )}
            </div>
        </div>
    );
}
