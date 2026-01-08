"use client";

import Link from "next/link";
import { useEffect, useState, use, useMemo } from "react";
import { storageService, Sensor } from '@/lib/storage';
import { useSmartSensorData } from "@/lib/smart-sensor";

export default function SackSensorDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [sensor, setSensor] = useState<Sensor | null>(null);
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    // History for chart
    const [history, setHistory] = useState<number[]>(new Array(21).fill(0));
    const [hoverData, setHoverData] = useState<{ x: number, y: number, val: number } | null>(null);
    const [activeFilter, setActiveFilter] = useState('Live');

    // Track Visiblity
    useEffect(() => {
        const handleVis = () => setIsVisible(document.visibilityState === 'visible');
        document.addEventListener("visibilitychange", handleVis);
        return () => document.removeEventListener("visibilitychange", handleVis);
    }, []);

    // 1. Fetch Sensor Metadata
    useEffect(() => {
        const fetchSensor = async () => {
            await storageService.init();
            const sensors = await storageService.getSensors();
            const found = sensors.find(s => s.id === id);
            if (found) {
                setSensor(found);
            } else {
                setSensor({ id: 'err', name: 'Sensor Not Found', type: 'sack', status: 'inactive' });
            }
        };
        fetchSensor();
    }, [id]);

    // 2. SMART DATA HOOK
    const safeSensor = sensor || { id: 'loading', status: 'inactive', name: '', type: 'sack' } as Sensor;
    const { speed: smartCount, lastUpdated, isConnected } = useSmartSensorData(safeSensor, isVisible, 5000);

    // Sync Data Logic
    useEffect(() => {
        if (!sensor || !isConnected) return;
        setCount(smartCount);
        setHistory(prev => [...prev.slice(1), smartCount]);
    }, [smartCount, lastUpdated, isConnected, sensor]);

    // Chart Helper
    const valToY = (val: number) => {
        const maxVal = 1000; // Asumsi max produksi per sesi
        const percentage = Math.min(1, Math.max(0, val / maxVal));
        return 90 - (percentage * 80);
    };

    const chartPoints = useMemo(() => {
        return history.map((val, i) => ({
            x: i * 5,
            y: valToY(val)
        }));
    }, [history]);

    const generatePath = (points: { x: number, y: number }[], close: boolean = false) => {
        if (points.length === 0) return "";
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            d += ` L ${points[i].x} ${points[i].y}`;
        }
        if (close) return `${d} L 100 100 L 0 100 Z`;
        return d;
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const index = Math.round(x / 5);
        const safeIndex = Math.max(0, Math.min(history.length - 1, index));
        const point = chartPoints[safeIndex];
        const exactValue = history[safeIndex];
        setHoverData({ x: point.x, y: point.y, val: exactValue });
    };

    const pathD = generatePath(chartPoints);
    const areaD = generatePath(chartPoints, true);

    if (!sensor) return <div className="p-10 text-white text-center">Loading...</div>;

    return (
        <div className="flex flex-col gap-6 max-w-[1280px] mx-auto w-full">
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm mb-2 text-[#92a4c9]">
                        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <Link href="/dashboard/sack" className="hover:text-white transition-colors">Sensor Karung</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <span className="text-white">{sensor?.name}</span>
                    </div>
                    <h1 className="text-white text-3xl font-bold tracking-tight">Sensor Produksi Karung</h1>
                    <p className="text-[#92a4c9] text-sm">Real-time counting & monitoring</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#232f48]/50 rounded-full border border-emerald-500/20">
                    <div className="size-2 rounded-full bg-emerald-500 live-dot"></div>
                    <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Live Data</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* PRIMARY COUNTER */}
                <div className="lg:col-span-12 bg-[#192233] rounded-xl border border-[#232f48] shadow-lg p-6 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>

                    <div className="flex items-center gap-6 z-10">
                        <div className="size-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                            <span className="material-symbols-outlined text-4xl">shopping_bag</span>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-[#92a4c9] text-sm font-medium uppercase tracking-wider mb-1">Total Produksi (Sesi Ini)</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-white text-5xl font-bold tracking-tight">{count}</span>
                                <span className="text-white/50 text-xl font-medium">Bags</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 mt-6 md:mt-0 z-10">
                        <div className="flex flex-col items-end">
                            <span className="text-[#92a4c9] text-xs">Target Harian</span>
                            <span className="text-white font-bold text-lg">5,000</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[#92a4c9] text-xs">Pencapaian</span>
                            <span className="text-emerald-400 font-bold text-lg">{((count / 5000) * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Background Decor */}
                    <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
                        <span className="material-symbols-outlined text-[150px]">shopping_bag</span>
                    </div>
                </div>

            </div>

            {/* PRODUCTION CHART */}
            <div className="flex flex-col bg-[#192233] rounded-xl border border-[#232f48] shadow-lg p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
                    <div>
                        <h3 className="text-white text-base md:text-lg font-semibold">Grafik Produksi</h3>
                        <p className="text-[#92a4c9] text-[10px] md:text-xs">Trend produksi per interval waktu</p>
                    </div>
                    <div className="bg-[#111722] border border-[#232f48] rounded-lg px-3 py-1.5 flex flex-col items-end min-w-[80px]">
                        <span className="text-[9px] text-[#92a4c9] font-medium uppercase tracking-wider">{hoverData ? "Recorded" : "Live"}</span>
                        <span className={`text-xl font-bold ${hoverData ? 'text-blue-400' : 'text-white'}`}>
                            {hoverData ? Math.round(hoverData.val) : count}
                        </span>
                    </div>
                </div>

                <div className="bg-[#111722]/50 rounded-lg border border-[#232f48]/50 overflow-hidden relative">
                    <div
                        className="relative w-full h-[200px] md:h-[300px] cursor-crosshair group"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHoverData(null)}
                    >
                        {/* Grid Lines */}
                        <div className="absolute inset-x-0 bottom-0 h-full flex flex-col justify-between pointer-events-none p-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-full h-px bg-[#232f48] last:border-0 border-t border-dashed border-[#334155]"></div>
                            ))}
                        </div>

                        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <defs>
                                <linearGradient id="sackGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.5"></stop>
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0"></stop>
                                </linearGradient>
                            </defs>
                            <path d={areaD} fill="url(#sackGradient)"></path>
                            <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                        </svg>

                        {/* Interactive Logic */}
                        {hoverData && (
                            <>
                                <div className="absolute top-0 bottom-0 w-px bg-white/20 border-l border-dashed border-white/40 pointer-events-none" style={{ left: `${hoverData.x}%` }} />
                                <div className="absolute size-3 bg-white border-2 border-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
                                    style={{ left: `${hoverData.x}%`, top: `${hoverData.y}%` }}>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
