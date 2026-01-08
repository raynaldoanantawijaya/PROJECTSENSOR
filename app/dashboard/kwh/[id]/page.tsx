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
        <div className="flex flex-col gap-6 max-w-[1280px] mx-auto w-full">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm mb-2 text-[#92a4c9]">
                        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <Link href="/dashboard/kwh" className="hover:text-white transition-colors">Energy Monitor</Link>
                        <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                        <span className="text-white">{sensor?.name}</span>
                    </div>
                    <h1 className="text-white text-3xl font-bold tracking-tight">Power Monitor</h1>
                    <p className="text-[#92a4c9] text-sm">Real-time electricity consumption analysis</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#232f48]/50 rounded-full border border-green-500/20">
                    <div className="size-2 rounded-full bg-green-500 live-dot"></div>
                    <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Live Data</span>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Voltage */}
                <div className="bg-[#192233] p-6 rounded-xl border border-[#232f48] shadow-lg relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-yellow-500 text-6xl">bolt</span>
                    </div>
                    <h3 className="text-[#92a4c9] text-sm font-medium uppercase tracking-wider mb-2">Voltage</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl text-white font-bold">{data.voltage}</span>
                        <span className="text-yellow-500 font-semibold">V</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-[#232f48] rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 w-[95%]"></div>
                    </div>
                </div>

                {/* Current */}
                <div className="bg-[#192233] p-6 rounded-xl border border-[#232f48] shadow-lg relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-blue-500 text-6xl">electric_meter</span>
                    </div>
                    <h3 className="text-[#92a4c9] text-sm font-medium uppercase tracking-wider mb-2">Current</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl text-white font-bold">{data.current.toFixed(1)}</span>
                        <span className="text-blue-500 font-semibold">A</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-[#232f48] rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (data.current / 10) * 100)}%` }}></div>
                    </div>
                </div>

                {/* Power */}
                <div className="bg-[#192233] p-6 rounded-xl border border-[#232f48] shadow-lg relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-green-500 text-6xl">energy_savings_leaf</span>
                    </div>
                    <h3 className="text-[#92a4c9] text-sm font-medium uppercase tracking-wider mb-2">Total Energy</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl text-white font-bold">{data.kwh.toFixed(1)}</span>
                        <span className="text-green-500 font-semibold">kWh</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-[#232f48] rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 animate-pulse" style={{ width: '100%' }}></div>
                    </div>
                </div>
            </div>

            {/* CHART */}
            <div className="flex flex-col bg-[#192233] rounded-xl border border-[#232f48] shadow-lg p-4 md:p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-white text-lg font-semibold">Power Consumption Trend</h3>
                        <p className="text-[#92a4c9] text-xs">Real-time usage fluctuation</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[#92a4c9] text-xs uppercase">Current Load</p>
                        <p className="text-white text-xl font-bold">{power.toFixed(1)} <span className="text-sm font-normal text-[#92a4c9]">kWh</span></p>
                    </div>
                </div>

                <div className="bg-[#111722]/50 rounded-lg border border-[#232f48]/50 overflow-hidden relative">
                    <div
                        className="relative w-full h-[250px] cursor-crosshair group"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHoverData(null)}
                    >
                        {/* Grid */}
                        <div className="absolute inset-x-0 bottom-0 h-full flex flex-col justify-between pointer-events-none p-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-full h-px bg-[#232f48] last:border-0 border-t border-dashed border-[#334155]"></div>
                            ))}
                        </div>

                        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <defs>
                                <linearGradient id="powerGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5"></stop>
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"></stop>
                                </linearGradient>
                            </defs>
                            <path d={areaD} fill="url(#powerGradient)"></path>
                            <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                        </svg>

                        {hoverData && (
                            <>
                                <div className="absolute top-0 bottom-0 w-px bg-white/20 border-l border-dashed border-white/40 pointer-events-none" style={{ left: `${hoverData.x}%` }} />
                                <div className="absolute size-3 bg-white border-2 border-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
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
