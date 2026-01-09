"use client";

import Link from "next/link";
import { useEffect, useState, use, useMemo } from "react";
import { storageService, Sensor } from '@/lib/storage';
import { useSmartSensorData } from "@/lib/smart-sensor";

interface KwhData {
    name: string;
    kwh: number;
    voltage: number;
    current: number;
    status: "Active" | "Inactive" | "Maintenance";
    updated: string;
}

export default function KwhSensorDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [sensor, setSensor] = useState<Sensor | null>(null);
    const [isVisible, setIsVisible] = useState(true);

    // Dynamic Data State
    const [power, setPower] = useState(0);
    const [data, setData] = useState<KwhData | null>(null);

    // History for Chart
    const [history, setHistory] = useState<number[]>(new Array(21).fill(0));
    const [hoverData, setHoverData] = useState<{ x: number, y: number, val: number } | null>(null);
    const [activeFilter, setActiveFilter] = useState('Live');

    // Visibility Listener
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
                setData({
                    name: found.name,
                    kwh: 0,
                    voltage: 220,
                    current: 0,
                    status: found.status === 'active' ? "Active" : "Inactive",
                    updated: "Syncing..."
                });
            } else {
                setSensor({ id: 'err', name: 'Sensor Not Found', type: 'kwh', status: 'inactive' });
            }
        };
        fetchSensor();
    }, [id]);

    // 2. SMART PROXY CONNECTION (Bandwidth Saver)
    const safeSensor = sensor || { id: 'loading', status: 'inactive', name: '', type: 'kwh' } as Sensor;
    const { speed: smartPower, lastUpdated, isConnected } = useSmartSensorData(safeSensor, isVisible, 5000);

    // Sync Data
    useEffect(() => {
        if (!sensor || !isConnected) return;

        setPower(smartPower);

        // Push to History
        setHistory(prev => [...prev.slice(1), smartPower]);

        setData(prev => prev ? ({
            ...prev,
            kwh: smartPower, // Using hook val as kWh/Power
            current: smartPower / 220, // Estimate Current
            updated: "Live",
            status: smartPower > 0 ? "Active" : "Inactive"
        }) : null);

    }, [smartPower, lastUpdated, isConnected, sensor]);

    // Chart Helpers
    const valToY = (val: number) => {
        const maxVal = 500; // Assume max 500 kWh for graph scaling
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

    if (!data || !sensor) return <div className="p-10 text-white text-center">Loading...</div>;

    return (
        <div className="flex flex-col p-6 md:p-10 gap-6 max-w-[1280px] mx-auto w-full">
            {/* Top Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[10px] md:text-sm mb-2 text-[#92a4c9]">
                        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <Link href="/dashboard/kwh" className="hover:text-white transition-colors">Sensor Kwh</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <span className="text-white">{sensor.name}</span>
                    </div>
                    <h1 className="text-white text-3xl font-bold tracking-tight">Sensor Kwh Meter</h1>
                    <p className="text-[#92a4c9] text-sm">Monitoring konsumsi energi Panel A secara real-time</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#232f48]/50 rounded-full border border-green-500/20">
                    <div className="size-2 rounded-full bg-green-500 live-dot"></div>
                    <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Live Data</span>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COLUMN: Real-time Metrics (7 cols) */}
                <div className="lg:col-span-7 bg-[#192233] rounded-xl border border-[#232f48] shadow-lg p-6 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-50"></div>
                    <h3 className="text-white text-lg font-semibold w-full text-left mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#92a4c9]">bolt</span>
                        Real-time Metrics
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full h-full content-center">
                        {/* Daya */}
                        <div className="bg-[#232f48]/30 rounded-lg p-4 flex flex-col gap-1 border border-[#232f48] hover:border-blue-500/50 transition-colors">
                            <div className="flex items-center gap-2 text-[#92a4c9] mb-1">
                                <span className="material-symbols-outlined text-yellow-400 text-xl">bolt</span>
                                <span className="text-xs font-medium uppercase tracking-wide">Daya</span>
                            </div>
                            <span className="text-2xl font-bold text-white">{(power * 0.8).toFixed(1)} <span className="text-sm font-medium text-[#92a4c9]">kW</span></span>
                        </div>
                        {/* Arus */}
                        <div className="bg-[#232f48]/30 rounded-lg p-4 flex flex-col gap-1 border border-[#232f48] hover:border-blue-500/50 transition-colors">
                            <div className="flex items-center gap-2 text-[#92a4c9] mb-1">
                                <span className="material-symbols-outlined text-blue-400 text-xl">waves</span>
                                <span className="text-xs font-medium uppercase tracking-wide">Arus</span>
                            </div>
                            <span className="text-2xl font-bold text-white">{data.current.toFixed(0)} <span className="text-sm font-medium text-[#92a4c9]">A</span></span>
                        </div>
                        {/* Tegangan */}
                        <div className="bg-[#232f48]/30 rounded-lg p-4 flex flex-col gap-1 border border-[#232f48] hover:border-blue-500/50 transition-colors">
                            <div className="flex items-center gap-2 text-[#92a4c9] mb-1">
                                <span className="material-symbols-outlined text-orange-400 text-xl">electrical_services</span>
                                <span className="text-xs font-medium uppercase tracking-wide">Tegangan</span>
                            </div>
                            <span className="text-2xl font-bold text-white">{data.voltage} <span className="text-sm font-medium text-[#92a4c9]">V</span></span>
                        </div>
                        {/* Energi */}
                        <div className="bg-[#232f48]/30 rounded-lg p-4 flex flex-col gap-1 border border-[#232f48] hover:border-blue-500/50 transition-colors">
                            <div className="flex items-center gap-2 text-[#92a4c9] mb-1">
                                <span className="material-symbols-outlined text-green-400 text-xl">electric_meter</span>
                                <span className="text-xs font-medium uppercase tracking-wide">Energi</span>
                            </div>
                            <span className="text-2xl font-bold text-white">{data.kwh.toFixed(1)} <span className="text-sm font-medium text-[#92a4c9]">kWh</span></span>
                        </div>
                        {/* Power Factor */}
                        <div className="bg-[#232f48]/30 rounded-lg p-4 flex flex-col gap-1 border border-[#232f48] hover:border-blue-500/50 transition-colors">
                            <div className="flex items-center gap-2 text-[#92a4c9] mb-1">
                                <span className="material-symbols-outlined text-purple-400 text-xl">speed</span>
                                <span className="text-xs font-medium uppercase tracking-wide">Power Factor</span>
                            </div>
                            <span className="text-2xl font-bold text-white">0.95</span>
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
                            <span className="text-[#92a4c9] text-sm font-medium">Panel ID</span>
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

            {/* ENERGY HISTORY CHART */}
            <div className="flex flex-col bg-[#192233] rounded-xl border border-[#232f48] shadow-lg p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
                    <div className="flex items-center justify-between w-full md:w-auto gap-6">
                        <div>
                            <h3 className="text-white text-base md:text-lg font-semibold">Power History</h3>
                            <p className="text-[#92a4c9] text-[10px] md:text-xs">Real-time usage fluctuation</p>
                        </div>

                        {/* Dynamic Power Display */}
                        <div className="bg-[#111722] border border-[#232f48] rounded-lg px-3 py-1.5 flex flex-col items-end md:items-start min-w-[80px]">
                            <span className="text-[9px] text-[#92a4c9] font-medium uppercase tracking-wider">{hoverData ? "Recorded" : "Live"}</span>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-lg md:text-xl font-bold ${hoverData ? 'text-blue-400' : 'text-white'}`}>
                                    {hoverData ? hoverData.val.toFixed(1) : (power * 0.8).toFixed(1)}
                                </span>
                                <span className="text-[10px] text-[#92a4c9] font-medium">kW</span>
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
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5"></stop>
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"></stop>
                                </linearGradient>
                            </defs>
                            <path d={areaD} fill="url(#lineGradient)"></path>
                            <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
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
        </div>
    );
}
