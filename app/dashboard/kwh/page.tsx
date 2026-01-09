"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { storageService, Sensor } from "@/lib/storage";
import { useSmartSensorData } from "@/lib/smart-sensor";

const VARIANTS = {
    active: {
        color: "emerald",
        badgeBg: "bg-emerald-500/10",
        badgeBorder: "border-emerald-500/20",
        badgeText: "text-emerald-400",
        dot: "bg-emerald-400",
        label: "Online",
        statusText: "Normal",
        statusIcon: "check_circle",
        mainColor: "#10b981",
        grad: "gradGreenA",
        chartPathFill: "M0,70 Q75,60 150,50 T300,30 V100 H0 Z",
        chartPathStroke: "M0,70 Q75,60 150,50 T300,30"
    },
    warning: {
        color: "amber",
        badgeBg: "bg-amber-500/10",
        badgeBorder: "border-amber-500/20",
        badgeText: "text-amber-400",
        dot: "bg-amber-400",
        label: "Warning",
        statusText: "Low Voltage",
        statusIcon: "warning",
        mainColor: "#f59e0b",
        grad: "gradAmberB",
        chartPathFill: "M0,60 Q25,40 50,55 T100,60 T150,45 T200,65 T250,50 T300,55 V100 H0 Z",
        chartPathStroke: "M0,60 Q25,40 50,55 T100,60 T150,45 T200,65 T250,50 T300,55"
    },
    stable: {
        color: "cyan",
        badgeBg: "bg-cyan-500/10",
        badgeBorder: "border-cyan-500/20",
        badgeText: "text-cyan-400",
        dot: "bg-cyan-400",
        label: "Stable",
        statusText: "High Load",
        statusIcon: "trending_up",
        mainColor: "#06b6d4",
        grad: "gradCyanC",
        chartPathFill: "M0,55 Q50,53 100,56 T200,54 T300,55 V100 H0 Z",
        chartPathStroke: "M0,55 Q50,53 100,56 T200,54 T300,55"
    }
};

const KwhSensorCard = ({ sensor, index, isVisible }: { sensor: Sensor; index: number; isVisible: boolean }) => {
    // USE SMART PROXY
    const { speed: power } = useSmartSensorData(sensor, isVisible, 5000);

    // Derived metrics for display
    const voltage = index === 1 ? 218.0 : index === 2 ? 222.1 : 224.5; // Simulate variation
    const current = (power / voltage) * 10; // Fake calculation for demo scale

    // Cycle variants
    let variant = VARIANTS.active;
    if (index === 1) variant = VARIANTS.warning;
    if (index === 2) variant = VARIANTS.stable;
    if (index > 2 && sensor.status === 'active') variant = VARIANTS.active;
    if (sensor.status === 'inactive') variant = VARIANTS.warning;

    return (
        <Link href={`/dashboard/kwh/${sensor.id}`} className="flex flex-col rounded-xl border border-[#324467] bg-[#1a2332] overflow-hidden hover:border-[#4b628b] transition-colors shadow-lg shadow-black/20 group">
            <div className="p-6 flex flex-col gap-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-[#135bec]/20 flex items-center justify-center text-[#135bec]">
                            <span className="material-symbols-outlined">bolt</span>
                        </div>
                        <div>
                            <h3 className="text-white text-base font-semibold">{sensor.name}</h3>
                            <p className="text-[#92a4c9] text-xs">ID: {sensor.id}</p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${variant.badgeBg} border ${variant.badgeBorder} ${variant.badgeText} text-xs font-medium uppercase tracking-wide`}>
                        <span className={`size-1.5 rounded-full ${variant.dot} ${sensor.status === 'active' ? 'animate-pulse' : ''}`}></span>
                        {variant.label}
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-2">
                    {/* Total Kwh */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#151c2a] border border-[#2d3a52]">
                        <div>
                            <p className="text-[#92a4c9] text-xs uppercase tracking-wider font-semibold">Total Kwh</p>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-xl font-bold text-white">{power.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                                <span className="text-[#92a4c9] text-xs">kWh</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-[#135bec]" style={{ fontSize: "20px" }}>electric_bolt</span>
                    </div>
                    {/* Tegangan */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#151c2a] border border-[#2d3a52]">
                        <div>
                            <p className="text-[#92a4c9] text-xs uppercase tracking-wider font-semibold">Tegangan</p>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-xl font-bold text-white">{voltage.toFixed(1)}</span>
                                <span className="text-[#92a4c9] text-xs">V</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-amber-500" style={{ fontSize: "20px" }}>electrical_services</span>
                    </div>
                    {/* Arus */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#151c2a] border border-[#2d3a52]">
                        <div>
                            <p className="text-[#92a4c9] text-xs uppercase tracking-wider font-semibold">Arus</p>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-xl font-bold text-white">{Math.max(0, current).toFixed(1)}</span>
                                <span className="text-[#92a4c9] text-xs">A</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-cyan-500" style={{ fontSize: "20px" }}>electric_meter</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#92a4c9] border-t border-[#324467] pt-4 mt-auto">
                    <div className="flex items-center gap-1">
                        <span className={`material-symbols-outlined text-${variant.color}-400`} style={{ fontSize: "16px" }}>{variant.statusIcon}</span>
                        <span className={`text-${variant.color}-400 font-medium`}>{variant.statusText}</span>
                    </div>
                    <div className="ml-auto">
                        Updated {index === 0 ? '1m ago' : index === 1 ? '45s ago' : '10s ago'}
                    </div>
                </div>
            </div>

            {/* SVG Chart */}
            <div className="h-16 w-full bg-[#151c2a] relative border-t border-[#2d3a52]">
                <svg className="w-full h-full absolute bottom-0 left-0" preserveAspectRatio="none" viewBox="0 0 300 100">
                    <defs>
                        <linearGradient id={`${variant.grad}-${sensor.id}`} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={variant.mainColor} stopOpacity="0.2"></stop>
                            <stop offset="100%" stopColor={variant.mainColor} stopOpacity="0"></stop>
                        </linearGradient>
                    </defs>
                    <path d={variant.chartPathFill} fill={`url(#${variant.grad}-${sensor.id})`}></path>
                    <path d={variant.chartPathStroke} fill="none" stroke={variant.mainColor} strokeWidth="2"></path>
                </svg>
            </div>
        </Link>
    );
};

export default function KwhSensorPage() {
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const load = async () => {
            storageService.init();
            const allSensors = await storageService.getSensors();
            setSensors(allSensors.filter(s => s.type === 'kwh'));
        };
        load();

        const handleVis = () => setIsVisible(document.visibilityState === 'visible');
        document.addEventListener("visibilitychange", handleVis);
        return () => document.removeEventListener("visibilitychange", handleVis);
    }, []);

    return (
        <div className="max-w-[1400px]">
            <header className="flex flex-col gap-4 mb-4">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-[10px] md:text-sm text-[#92a4c9]">
                            <Link href="/dashboard" className="hover:text-white transition-colors font-medium">Dashboard</Link>
                            <span className="material-symbols-outlined text-[#526079] text-sm">chevron_right</span>
                            <span className="text-white font-medium">Sensor Kwh</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-white tracking-tight text-3xl font-bold">Sensor Kwh</h2>
                            <p className="text-[#92a4c9] text-sm font-normal">Monitoring konsumsi listrik secara real-time</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sensors.length > 0 ? (
                    sensors.map((sensor, idx) => (
                        <KwhSensorCard key={sensor.id} sensor={sensor} index={idx} isVisible={isVisible} />
                    ))
                ) : (
                    <div className="col-span-full p-8 text-center border border-dashed border-gray-700 rounded-xl">
                        <p className="text-gray-400">Loading Sensors...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
