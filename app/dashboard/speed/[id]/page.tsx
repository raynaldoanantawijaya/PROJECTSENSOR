"use client";

import Link from "next/link";
import { useEffect, useState, use, useMemo } from "react";
import { storageService, Sensor } from '@/lib/storage';
import { useSmartSensorData } from "@/lib/smart-sensor";

interface SpeedData {
    name: string;
    speed: number;
    unit: string;
    status: "Running" | "Stopped" | "Maintenance";
    updated: string;
}

export default function SpeedSensorDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [sensor, setSensor] = useState<Sensor | null>(null);
    const [speed, setSpeed] = useState(0);
    const [unit, setUnit] = useState('M/min');

    // History data for the chart (21 points for 0-100 X-axis with step 5)
    // Initialize with 0s
    const [history, setHistory] = useState<number[]>(new Array(21).fill(0));

    const [data, setData] = useState<SpeedData | null>(null);
    const [hoverData, setHoverData] = useState<{ x: number, y: number, val: number } | null>(null);
    const [activeFilter, setActiveFilter] = useState('Live');
    const [isVisible, setIsVisible] = useState(true);

    // Track Page Visibility
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
                setUnit(found.unit || 'M/min');
                setData({
                    name: found.name,
                    speed: 0,
                    unit: found.unit || 'M/min',
                    status: found.status === 'active' ? "Running" : "Stopped",
                    updated: "Syncing..."
                });
            } else {
                setSensor({ id: 'err', name: 'Sensor Not Found', type: 'speed', status: 'inactive' });
            }
        };
        fetchSensor();
    }, [id]);

    // 2. SMART DATA CONNECTION (Bandwidth Optimized)
    // Polls Server Cache every 5s. Server hits Firebase max 1x/5s.
    const safeSensor = sensor || { id: 'loading', status: 'inactive', name: '', type: 'speed' } as Sensor;
    const { speed: smartSpeed, lastUpdated, isConnected } = useSmartSensorData(safeSensor, isVisible, 5000);

    // Sync Hook Data to Local State & History
    useEffect(() => {
        if (!sensor || !isConnected) return;

        setSpeed(smartSpeed);

        // Push to History chart 
        setHistory(prev => [...prev.slice(1), smartSpeed]);

        setData(prev => prev ? ({
            ...prev,
            speed: smartSpeed,
            status: smartSpeed > 0 ? "Running" : "Stopped",
            updated: "Live"
        }) : null);

    }, [smartSpeed, lastUpdated, isConnected, sensor]);

    // Derived Statistics
    const TARGET_SPEED = 150;

    const stats = useMemo(() => {
        const activeData = history.filter(h => h > 0);
        const avg = activeData.length > 0
            ? Math.round(activeData.reduce((a, b) => a + b, 0) / activeData.length)
            : 0;
        const peak = Math.max(...history);
        return { avg, peak };
    }, [history]);

    const zone = useMemo(() => {
        if (speed >= TARGET_SPEED) {
            return {
                label: "Optimal (Target Met)",
                color: "text-green-400",
                dot: "bg-green-500",
                statusClass: "bg-green-500/10 text-green-400 border-green-500/20"
            };
        }
        if (speed >= TARGET_SPEED * 0.7) {
            return {
                label: "Warning (Under Speed)",
                color: "text-yellow-400",
                dot: "bg-yellow-500",
                statusClass: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
            };
        }
        return {
            label: "Critical (Slow/Stopped)",
            color: "text-red-400",
            dot: "bg-red-500",
            statusClass: "bg-red-500/10 text-red-400 border-red-500/20"
        };
    }, [speed, TARGET_SPEED]);

    const valToY = (val: number) => {
        const maxSpeed = 200;
        const percentage = Math.min(1, Math.max(0, val / maxSpeed));
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

    if (!data || !sensor) return <div className="p-10 text-white text-center">Loading...</div>;

    const pathD = generatePath(chartPoints);
    const areaD = generatePath(chartPoints, true);

    return (
        <div className="flex flex-col gap-6 max-w-[1280px] mx-auto w-full">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[10px] md:text-sm mb-2 text-[#92a4c9]">
                        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <Link href="/dashboard/speed" className="hover:text-white transition-colors">Sensor Kecepatan</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <span className="text-white">{sensor?.name}</span>
                    </div>
                    <h1 className="text-white text-3xl font-bold tracking-tight">Sensor Kecepatan</h1>
                    <p className="text-[#92a4c9] text-sm">Monitoring kecepatan mesin secara real-time</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#232f48]/50 rounded-full border border-green-500/20">
                    <div className="size-2 rounded-full bg-green-500 live-dot"></div>
                    <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Live Data</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* PRIMARY GAUGE */}
                <div className="lg:col-span-7 bg-[#192233] rounded-xl border border-[#232f48] shadow-lg p-6 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-50"></div>
                    <h3 className="text-white text-lg font-semibold w-full text-left mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#92a4c9]">speed</span>
                        Primary Gauge
                    </h3>

                    <div className="relative w-full max-w-[400px] aspect-[2/1] mt-4 mb-8">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 200 110">
                            <defs>
                                <linearGradient id="gaugeGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity="1"></stop>
                                    <stop offset="40%" stopColor="#eab308" stopOpacity="1"></stop>
                                    <stop offset="100%" stopColor="#22c55e" stopOpacity="1"></stop>
                                </linearGradient>
                            </defs>
                            <path className="gauge-bg gauge-arc" d="M 20 100 A 80 80 0 0 1 180 100" stroke="#232f48" fill="none" strokeWidth="12" strokeLinecap="round"></path>
                            <path className="gauge-arc" d="M 20 100 A 80 80 0 0 1 180 100" stroke="url(#gaugeGradient)" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (speed / 200))}></path>

                            <g className="needle" style={{
                                transform: `rotate(${(speed / 200) * 180}deg)`,
                                transformOrigin: "0 100", // Pivot di kiri
                                transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1)"
                            }}>
                                <path transform="translate(100, 100) rotate(-90)" d="M 0 0 L 0 -70" stroke="#fff" strokeWidth="3"></path>
                                <circle cx="100" cy="100" fill="#fff" r="6"></circle>
                            </g>

                            <text fill="#64748b" fontSize="10" textAnchor="middle" x="20" y="115">0</text>
                            <text fill="#fff" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))" fontSize="32" fontWeight="bold" textAnchor="middle" x="100" y="80">{speed}</text>
                            <text fill="#92a4c9" fontSize="12" textAnchor="middle" x="100" y="120">{unit}</text>
                            <text fill="#64748b" fontSize="10" textAnchor="middle" x="180" y="115">200</text>
                        </svg>
                    </div>

                    <div className="flex w-full justify-between items-center border-t border-[#232f48] pt-4 mt-2">
                        <div className="flex flex-col">
                            <span className="text-[#92a4c9] text-xs">Current Zone</span>
                            <span className={`${zone.color} text-sm font-bold flex items-center gap-1`}>
                                <span className={`size-2 ${zone.dot} rounded-full animate-pulse`}></span>
                                {zone.label}
                            </span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span className="text-[#92a4c9] text-xs">Target Speed</span>
                            <span className="text-white text-sm font-medium">{TARGET_SPEED} {unit}</span>
                        </div>
                    </div>
                </div>

                {/* SENSOR DETAILS */}
                <div className="lg:col-span-5 bg-[#192233] rounded-xl border border-[#232f48] shadow-lg p-0 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-[#232f48] bg-[#1d273b]">
                        <h3 className="text-white text-base font-semibold">Sensor Details</h3>
                    </div>
                    <div className="p-6 flex flex-col gap-6 flex-1 justify-center">
                        <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                            <span className="text-[#92a4c9] text-sm font-medium">Machine ID</span>
                            <span className="text-white text-base font-medium">{sensor?.id}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                            <span className="text-[#92a4c9] text-sm font-medium">Status</span>
                            <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-sm font-semibold w-fit border ${data?.status === 'Running' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                <span className={`size-2 rounded-full ${data?.status === 'Running' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                {data?.status}
                            </span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] gap-4 items-center">
                            <span className="text-[#92a4c9] text-sm font-medium">Last Update</span>
                            <span className="text-white text-sm">Live</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SPEED HISTORY CHART */}
            <div className="flex flex-col bg-[#192233] rounded-xl border border-[#232f48] shadow-lg p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
                    <div className="flex items-center justify-between w-full md:w-auto gap-6">
                        <div>
                            <h3 className="text-white text-base md:text-lg font-semibold">Speed History</h3>
                            <p className="text-[#92a4c9] text-[10px] md:text-xs">Historical performance over time</p>
                        </div>

                        {/* Dynamic Speed Display (Moved to Header) */}
                        <div className="bg-[#111722] border border-[#232f48] rounded-lg px-3 py-1.5 flex flex-col items-end md:items-start min-w-[80px]">
                            <span className="text-[9px] text-[#92a4c9] font-medium uppercase tracking-wider">{hoverData ? "Recorded" : "Live"}</span>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-lg md:text-xl font-bold ${hoverData ? 'text-blue-400' : 'text-white'}`}>
                                    {hoverData ? Math.round(hoverData.val) : speed}
                                </span>
                                <span className="text-[10px] text-[#92a4c9] font-medium">{unit}</span>
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

            {/* FOOTER SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#192233] p-4 rounded-xl border border-[#232f48] flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <span className="material-symbols-outlined">analytics</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[#92a4c9] text-xs font-medium">Average Speed (Session)</span>
                        <span className="text-white text-lg font-bold">{stats.avg} {unit}</span>
                    </div>
                </div>
                <div className="bg-[#192233] p-4 rounded-xl border border-[#232f48] flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[#92a4c9] text-xs font-medium">Peak Speed (Session)</span>
                        <span className="text-white text-lg font-bold">{stats.peak} {unit}</span>
                    </div>
                </div>
                <div className="bg-[#192233] p-4 rounded-xl border border-[#232f48] flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                        <span className="material-symbols-outlined">error_outline</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[#92a4c9] text-xs font-medium">Downtime</span>
                        <span className="text-white text-lg font-bold">{speed === 0 ? "Active" : "0m"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
