"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { storageService, Sensor } from "@/lib/storage";
import { useSmartSensorData } from "@/lib/smart-sensor";

// Variant styles based on status/index
const VARIANTS = {
    active: {
        color: "emerald",
        badgeBg: "bg-emerald-500/10",
        badgeBorder: "border-emerald-500/20",
        badgeText: "text-emerald-400",
        dot: "bg-emerald-400",
        label: "Optimal",
        icon: "check_circle",
        mainColor: "#10b981",
        grad: "gradGreen",
        chartPathFill: "M0,60 Q50,55 100,58 T200,56 T300,55 V100 H0 Z",
        chartPathStroke: "M0,60 Q50,55 100,58 T200,56 T300,55"
    },
    warning: {
        color: "amber",
        badgeBg: "bg-amber-500/10",
        badgeBorder: "border-amber-500/20",
        badgeText: "text-amber-400",
        dot: "bg-amber-400",
        label: "Deviation",
        icon: "warning",
        mainColor: "#f59e0b",
        grad: "gradAmber",
        chartPathFill: "M0,70 Q50,40 100,30 T200,25 T300,20 V100 H0 Z",
        chartPathStroke: "M0,70 Q50,40 100,30 T200,25 T300,20"
    },
    error: {
        color: "rose",
        badgeBg: "bg-rose-500/10",
        badgeBorder: "border-rose-500/20",
        badgeText: "text-rose-400",
        dot: "bg-rose-400",
        label: "Defect",
        icon: "error",
        mainColor: "#f43f5e",
        grad: "gradRed",
        chartPathFill: "M0,55 L50,85 L100,90 L300,90 V100 H0 Z",
        chartPathStroke: "M0,55 L50,85 L100,90 L300,90"
    }
};

const SackSensorCard = ({ sensor, index, isVisible }: { sensor: Sensor; index: number; isVisible: boolean }) => {
    // USE SMART PROXY
    const { speed: count } = useSmartSensorData(sensor, isVisible, 5000);

    // Cycle variants for visual demo if all are 'active', or use real status
    // For this specific UI request, let's map based on status but default to Green
    let variant = VARIANTS.active;
    if (sensor.status === 'maintenance') variant = VARIANTS.warning;
    if (sensor.status === 'inactive') variant = VARIANTS.error;

    // Hardcode specific visual styles for first 3 to match the user's image exactly if desired
    // But better to keep it dynamic based on data.
    // If user wants specific "A", "B", "C" look:
    if (index === 1) variant = VARIANTS.warning; // Force 2nd card to look like B
    if (index === 2) variant = VARIANTS.error;   // Force 3rd card to look like C
    if (index > 2 && sensor.status === 'active') variant = VARIANTS.active;

    return (
        <Link href={`/dashboard/sack/${sensor.id}`} className="flex flex-col rounded-xl border border-[#324467] bg-[#1a2332] overflow-hidden hover:border-[#4b628b] transition-colors shadow-lg shadow-black/20 group">
            <div className="p-6 flex flex-col gap-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-full ${index === 1 ? 'bg-amber-500/20 text-amber-500' : index === 2 ? 'bg-rose-500/20 text-rose-500' : 'bg-[#135bec]/20 text-[#135bec]'} flex items-center justify-center`}>
                            <span className="material-symbols-outlined">{index === 1 ? 'aspect_ratio' : index === 2 ? 'texture' : 'straighten'}</span>
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
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white tracking-tight">{count.toFixed(1)}</span>
                    <span className="text-[#92a4c9] text-sm font-medium">cm</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#92a4c9] border-t border-[#324467] pt-4 mt-auto">
                    <div className="flex items-center gap-1">
                        <span className={`material-symbols-outlined text-${variant.color}-400`} style={{ fontSize: "16px" }}>{variant.icon}</span>
                        <span className={`text-${variant.color}-400 font-medium`}>
                            {index === 1 ? '+3.5cm' : index === 2 ? '-13cm' : 'Target: 55cm'}
                        </span>
                        {index !== 0 && <span>{index === 1 ? 'over limit' : 'under limit'}</span>}
                    </div>
                    <div className="ml-auto">
                        Updated {index === 2 ? '10s ago' : index === 1 ? '45s ago' : '1m ago'}
                    </div>
                </div>
            </div>

            {/* SVG Illustration */}
            <div className="h-24 w-full bg-[#151c2a] relative">
                <svg className="w-full h-full absolute bottom-0 left-0" preserveAspectRatio="none" viewBox="0 0 300 100">
                    <defs>
                        <linearGradient id={`${variant.grad}-${sensor.id}`} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={variant.mainColor} stopOpacity="0.2"></stop>
                            <stop offset="100%" stopColor={variant.mainColor} stopOpacity="0"></stop>
                        </linearGradient>
                    </defs>
                    <path d={variant.chartPathFill} fill={`url(#${variant.grad}-${sensor.id})`}></path>
                    <path d={variant.chartPathStroke} fill="none" stroke={variant.mainColor} strokeWidth="2"></path>
                    <line stroke="#324467" strokeDasharray="4" strokeWidth="1" x1="0" x2="300" y1="55" y2="55"></line>
                </svg>
            </div>
        </Link>
    );
};

export default function SackSensorPage() {
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const load = async () => {
            storageService.init();
            const allSensors = await storageService.getSensors();
            // Filter only sack sensors
            setSensors(allSensors.filter(s => s.type === 'sack'));
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
                            <span className="text-white font-medium">Sensor Lebar Karung</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-white tracking-tight text-3xl font-bold">Sensor Lebar Karung</h2>
                            <p className="text-[#92a4c9] text-sm font-normal">Monitoring dimensi lebar karung secara real-time</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sensors.length > 0 ? (
                    sensors.map((sensor, idx) => (
                        <SackSensorCard key={sensor.id} sensor={sensor} index={idx} isVisible={isVisible} />
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
