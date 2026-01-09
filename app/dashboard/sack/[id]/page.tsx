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

    // Config Editing State
    const [targetVal, setTargetVal] = useState(50);
    const [toleranceVal, setToleranceVal] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    // Save Config Handler
    const handleSaveConfig = async (key: 'target' | 'tolerance', val: number) => {
        if (!sensor) return;
        setIsSaving(true);
        try {
            const updatedSensor = {
                ...sensor,
                targetValue: key === 'target' ? val : targetVal,
                tolerance: key === 'tolerance' ? val : toleranceVal
            };
            await storageService.saveSensor(updatedSensor);
            setSensor(updatedSensor);
            if (key === 'target') setTargetVal(val);
            else setToleranceVal(val);
        } catch (e) {
            alert("Gagal menyimpan konfigurasi");
        }
        setIsSaving(false);
    }

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
                if (found.targetValue !== undefined) setTargetVal(found.targetValue);
                if (found.tolerance !== undefined) setToleranceVal(found.tolerance);
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
        <div className="flex flex-col p-6 md:p-10 gap-6 max-w-[1280px] mx-auto w-full">
            {/* Top Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[10px] md:text-sm mb-2 text-[#92a4c9]">
                        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <Link href="/dashboard/sack" className="hover:text-white transition-colors">Sensor Karung</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <span className="text-white">{sensor.name}</span>
                    </div>
                    <h1 className="text-white text-3xl font-bold tracking-tight">Sensor Lebar Karung</h1>
                    <p className="text-[#92a4c9] text-sm">Monitoring lebar karung mesin A secara real-time</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#232f48]/50 rounded-full border border-green-500/20">
                    <div className="size-2 rounded-full bg-green-500 live-dot"></div>
                    <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Live Data</span>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COLUMN: Primary Ruler Visualization (7 cols) */}
                <div className="lg:col-span-7 bg-[#192233] rounded-xl border border-[#232f48] shadow-lg p-6 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-50"></div>
                    <h3 className="text-white text-lg font-semibold w-full text-left mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#92a4c9]">straighten</span>
                        Primary Ruler
                    </h3>

                    <div className="w-full relative px-2 mb-8 mt-2">
                        <div className="relative h-16 w-full bg-[#111722] border border-[#232f48] rounded-lg flex items-end overflow-hidden">
                            {/* Color Zones Background */}
                            <div className="absolute top-0 left-0 h-full w-full opacity-10"
                                style={{ background: 'linear-gradient(to right, #ef4444 0%, #ef4444 20%, #eab308 20%, #eab308 40%, #22c55e 40%, #22c55e 60%, #eab308 60%, #eab308 80%, #ef4444 80%, #ef4444 100%)' }}>
                            </div>

                            {/* Ruler Ticks */}
                            <div className="absolute bottom-0 w-full h-full flex justify-between px-4 pb-2 items-end">
                                {[...Array(21)].map((_, i) => (
                                    <div key={i} className={`w-px bg-[#334155] ${i % 5 === 0 ? 'h-3 md:h-4' : 'h-1 md:h-2'}`}></div>
                                ))}
                            </div>

                            {/* Dynamic Needle/Arrow */}
                            <div className="absolute top-0 h-full w-1 transition-all duration-500 ease-out z-10"
                                style={{ left: `${Math.min(100, Math.max(0, count))}%` }}>
                                <div className="absolute -top-1 -left-3 bg-white text-slate-900 text-xs font-bold px-1.5 py-0.5 rounded shadow-lg">
                                    {count}
                                </div>
                                <div className="absolute top-6 -left-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-white"></div>
                                <div className="h-full w-0.5 bg-white/50 mx-auto mt-6"></div>
                            </div>
                        </div>

                        {/* Ruler Labels */}
                        <div className="flex justify-between w-full px-4 mt-2 text-[10px] text-[#64748b]">
                            <span>0</span>
                            <span>20</span>
                            <span>40</span>
                            <span>60</span>
                            <span>80</span>
                            <span>100</span>
                        </div>

                        {/* Big Value Display */}
                        <div className="flex justify-center items-baseline mt-4">
                            <span className="text-4xl font-bold text-white">{count}</span>
                            <span className="text-sm text-[#92a4c9] ml-1">cm</span>
                        </div>
                    </div>

                    <div className="flex w-full justify-between items-center border-t border-[#232f48] pt-4 mt-2">
                        <div className="flex flex-col">
                            <span className="text-[#92a4c9] text-xs">Current Zone</span>
                            {/* Logic to determine zone based on target and tolerance */}
                            {Math.abs(count - targetVal) <= toleranceVal ? (
                                <span className="text-green-500 text-sm font-bold flex items-center gap-1">
                                    <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Safe (Optimal)
                                </span>
                            ) : (
                                <span className="text-red-500 text-sm font-bold flex items-center gap-1">
                                    <span className="size-2 bg-red-500 rounded-full animate-pulse"></span>
                                    Warning
                                </span>
                            )}
                        </div>
                        <div className="flex gap-4 md:gap-8">
                            {/* Editable Target Width */}
                            <div className="flex flex-col text-right group relative">
                                <span className="text-[#92a4c9] text-xs pb-0.5">Target Width</span>
                                <div className="flex items-center justify-end gap-1 relative">
                                    <input
                                        type="number"
                                        className="w-16 bg-transparent text-right text-white text-sm font-medium focus:outline-none border-b border-dashed border-slate-600 focus:border-solid focus:border-blue-500 transition-all p-0 m-0"
                                        value={targetVal || ''}
                                        onChange={(e) => setTargetVal(Number(e.target.value))}
                                        onBlur={(e) => handleSaveConfig('target', Number(e.target.value))}
                                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                        placeholder="0"
                                    />
                                    <span className="text-white text-sm font-medium">cm</span>
                                    <span className="material-symbols-outlined text-[12px] text-blue-500 absolute -right-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">edit</span>
                                </div>
                            </div>

                            {/* Editable Tolerance */}
                            <div className="flex flex-col text-right group relative">
                                <span className="text-[#92a4c9] text-xs pb-0.5">Tolerance</span>
                                <div className="flex items-center justify-end gap-1 relative">
                                    <input
                                        type="number"
                                        className="w-12 bg-transparent text-right text-white text-sm font-medium focus:outline-none border-b border-dashed border-slate-600 focus:border-solid focus:border-blue-500 transition-all p-0 m-0"
                                        value={toleranceVal || ''}
                                        onChange={(e) => setToleranceVal(Number(e.target.value))}
                                        onBlur={(e) => handleSaveConfig('tolerance', Number(e.target.value))}
                                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                        placeholder="0"
                                    />
                                    <span className="text-white text-sm font-medium">cm</span>
                                    <span className="material-symbols-outlined text-[12px] text-blue-500 absolute -right-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">edit</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Sensor Details (5 cols) */}
                <div className="lg:col-span-5 bg-[#192233] rounded-xl border border-[#232f48] shadow-lg p-0 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-[#232f48] bg-[#1d273b]">
                        <h3 className="text-white text-base font-semibold">Sensor Details</h3>
                    </div>
                    <div className="p-6 flex flex-col gap-6 flex-1 justify-center">
                        <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                            <span className="text-[#92a4c9] text-sm font-medium">Machine ID</span>
                            <span className="text-white text-base font-medium">{sensor.name}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                            <span className="text-[#92a4c9] text-sm font-medium">Status</span>
                            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-green-500/10 text-green-500 text-sm font-semibold w-fit border border-green-500/20">
                                <span className="size-2 rounded-full bg-green-500"></span>
                                {isConnected ? "Online" : "Offline"}
                            </span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                            <span className="text-[#92a4c9] text-sm font-medium">Last Update</span>
                            <span className="text-white text-sm">2 seconds ago</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* WIDTH HISTORY CHART */}
            <div className="flex flex-col bg-[#192233] rounded-xl border border-[#232f48] shadow-lg p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
                    <div className="flex items-center justify-between w-full md:w-auto gap-6">
                        <div>
                            <h3 className="text-white text-base md:text-lg font-semibold">Width History</h3>
                            <p className="text-[#92a4c9] text-[10px] md:text-xs">Product width consistency</p>
                        </div>

                        {/* Dynamic Width Display */}
                        <div className="bg-[#111722] border border-[#232f48] rounded-lg px-3 py-1.5 flex flex-col items-end md:items-start min-w-[80px]">
                            <span className="text-[9px] text-[#92a4c9] font-medium uppercase tracking-wider">{hoverData ? "Recorded" : "Live"}</span>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-lg md:text-xl font-bold ${hoverData ? 'text-blue-400' : 'text-white'}`}>
                                    {hoverData ? Math.round(hoverData.val) : count}
                                </span>
                                <span className="text-[10px] text-[#92a4c9] font-medium">cm</span>
                            </div>
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex bg-[#111722] rounded-lg p-1 border border-[#232f48] self-start md:self-auto overflow-x-auto max-w-full">
                        {['Live', '15m', '1h', '1D'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-2 py-1 md:px-3 text-[10px] md:text-xs font-medium transition-all rounded whitespace-nowrap ${activeFilter === filter ? 'bg-primary text-white shadow-sm' : 'text-[#92a4c9] hover:text-white'}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-[#111722]/50 rounded-lg border border-[#232f48]/50 overflow-hidden relative">
                    <div
                        className="relative w-full h-[200px] sm:h-[250px] md:h-[300px] cursor-crosshair group"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHoverData(null)}
                    >
                        {/* Grid */}
                        <div className="absolute inset-x-0 bottom-0 h-full flex flex-col justify-between pointer-events-none p-4">
                            <div className="w-full h-px bg-[#232f48] border-t border-dashed border-[#334155]"></div>
                            <div className="w-full h-px bg-[#232f48] border-t border-dashed border-[#334155]"></div>
                            <div className="w-full h-px bg-[#232f48] border-t border-dashed border-[#334155]"></div>
                            <div className="w-full h-px bg-[#232f48] border-t border-dashed border-[#334155]"></div>
                            <div className="w-full h-px bg-[#232f48]"></div>
                        </div>

                        {/* CHART SVG (INTERACTIVE) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <defs>
                                <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#135bec" stopOpacity="0.5"></stop>
                                    <stop offset="100%" stopColor="#135bec" stopOpacity="0"></stop>
                                </linearGradient>
                            </defs>
                            <path d={areaD} fill="url(#lineGradient)"></path>
                            <path d={pathD} fill="none" stroke="#135bec" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                        </svg>

                        {/* Interactive Logic */}
                        {hoverData ? (
                            <>
                                <div className="absolute top-0 bottom-0 w-px bg-white/20 border-l border-dashed border-white/40 pointer-events-none" style={{ left: `${hoverData.x}%` }} />
                                <div className="absolute size-3 bg-white border-2 border-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
                                    style={{ left: `${hoverData.x}%`, top: `${hoverData.y}%` }}>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>

                <div className="flex justify-between text-[10px] text-[#92a4c9] px-2 mt-2">
                    <span>10:00</span>
                    <span>10:05</span>
                    <span>10:10</span>
                    <span>10:15</span>
                    <span>10:20</span>
                    <span>10:25</span>
                </div>
            </div>

            {/* Additional Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#192233] p-4 rounded-xl border border-[#232f48] flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <span className="material-symbols-outlined">analytics</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[#92a4c9] text-xs font-medium">Average Width</span>
                        <span className="text-white text-lg font-bold">52 cm</span>
                    </div>
                </div>
                <div className="bg-[#192233] p-4 rounded-xl border border-[#232f48] flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[#92a4c9] text-xs font-medium">Peak Width</span>
                        <span className="text-white text-lg font-bold">58 cm</span>
                    </div>
                </div>
                <div className="bg-[#192233] p-4 rounded-xl border border-[#232f48] flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                        <span className="material-symbols-outlined">error_outline</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[#92a4c9] text-xs font-medium">Downtime Today</span>
                        <span className="text-white text-lg font-bold">0m</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
