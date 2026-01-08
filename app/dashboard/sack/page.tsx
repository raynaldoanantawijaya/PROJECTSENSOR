"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { storageService, Sensor } from "@/lib/storage";
import { useSmartSensorData } from "@/lib/smart-sensor";

const getStatusParams = (status: Sensor['status']) => {
    switch (status) {
        case 'active':
            return {
                style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                dot: "bg-emerald-500",
                text: "Active",
                icon: "check_circle",
                iconColor: "text-emerald-500"
            };
        case 'maintenance':
            return {
                style: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                dot: "bg-amber-500",
                text: "Maintenance",
                icon: "build",
                iconColor: "text-amber-500"
            };
        default:
            return {
                style: "bg-rose-500/10 text-rose-400 border-rose-500/20",
                dot: "bg-rose-500",
                text: "Inactive",
                icon: "error",
                iconColor: "text-rose-500"
            };
    }
};

const SackSensorCard = ({ sensor, isVisible }: { sensor: Sensor; isVisible: boolean }) => {
    // USE SMART PROXY: Fetches via API, Cached on Server, Updates every 5s
    const { speed: count } = useSmartSensorData(sensor, isVisible, 5000);
    const style = getStatusParams(sensor.status);

    return (
        <Link href={`/dashboard/sack/${sensor.id}`} className="flex flex-col rounded-xl border border-[#324467] bg-[#1a2332] overflow-hidden hover:border-[#4b628b] transition-colors shadow-lg shadow-black/20 group">
            <div className="p-6 flex flex-col gap-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-full bg-[#232f48] flex items-center justify-center ${style.iconColor}`}>
                            <span className="material-symbols-outlined">{style.icon}</span>
                        </div>
                        <div>
                            <h3 className="text-white text-base font-semibold">{sensor.name}</h3>
                            <p className="text-[#92a4c9] text-xs">ID: {sensor.id}</p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${style.style} text-xs font-medium uppercase tracking-wide`}>
                        <span className={`size-1.5 rounded-full ${style.dot} ${sensor.status === 'active' ? 'animate-pulse' : ''}`}></span>
                        {style.text}
                    </span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{count}</span>
                    <span className="text-[#92a4c9] text-sm font-medium">Sacks</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#92a4c9] border-t border-[#324467] pt-4 mt-auto">
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: "16px" }}>trending_up</span>
                        <span className="text-emerald-400 font-medium">+12%</span>
                        <span>vs yesterday</span>
                    </div>
                    <div className="ml-auto">
                        Updated recently
                    </div>
                </div>
            </div>
            {/* Simple Progress Bar Visual - Max assumed 5000 */}
            <div className="h-1.5 w-full bg-[#151c2a] relative">
                <div className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min(100, (count / 5000) * 100)}%` }}></div>
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
            setSensors(allSensors.filter(s => s.type === 'sack'));
        };
        load();

        const handleVis = () => setIsVisible(document.visibilityState === 'visible');
        document.addEventListener("visibilitychange", handleVis);
        return () => document.removeEventListener("visibilitychange", handleVis);
    }, []);

    return (
        <div className="max-w-[1400px]">
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-sm text-[#92a4c9]">
                            <Link href="/dashboard" className="hover:text-white transition-colors font-medium">Dashboard</Link>
                            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                            <span className="text-white font-medium">Sensor Karung</span>
                        </div>
                        <div>
                            <h2 className="text-white text-3xl font-bold tracking-tight mb-1">Sensor Karung</h2>
                            <p className="text-[#92a4c9] text-sm">Penghitungan output produksi karung otomatis</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sensors.length > 0 ? (
                    sensors.map((sensor) => (
                        <SackSensorCard key={sensor.id} sensor={sensor} isVisible={isVisible} />
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
