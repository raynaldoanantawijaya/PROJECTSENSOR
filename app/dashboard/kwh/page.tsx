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

const KwhSensorCard = ({ sensor, isVisible }: { sensor: Sensor; isVisible: boolean }) => {
    // USE SMART PROXY: Fetches via API, Cached on Server, Updates every 5s
    const { speed: power } = useSmartSensorData(sensor, isVisible, 5000);
    const statusStyle = getStatusParams(sensor.status);

    return (
        <Link href={`/dashboard/kwh/${sensor.id}`} className="group relative flex flex-col bg-[#1a2332] border border-[#324467] rounded-xl overflow-hidden hover:border-[#4b628b] transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#135bec]/10">
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 w-full h-1 ${sensor.status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-gray-700'}`}></div>

            <div className="p-5 flex flex-col h-full gap-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-lg flex items-center justify-center bg-[#232f48] border border-[#324467] group-hover:border-[#135bec]/50 transition-colors`}>
                            <span className="material-symbols-outlined text-yellow-400">bolt</span>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-base group-hover:text-blue-400 transition-colors">{sensor.name}</h3>
                            <span className="text-xs text-[#92a4c9] font-mono">{sensor.id}</span>
                        </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusStyle.style}`}>
                        <div className={`size-1.5 rounded-full ${statusStyle.dot} ${sensor.status === 'active' ? 'animate-pulse' : ''}`}></div>
                        {statusStyle.text}
                    </div>
                </div>

                {/* Main Metric */}
                <div className="mt-2 text-center py-4 bg-[#151c2a] rounded-lg border border-[#324467]/50 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                        <span className="text-4xl font-bold text-white tracking-tighter">
                            {power.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </span>
                        <span className="text-xs font-medium text-[#92a4c9] uppercase tracking-widest">{sensor.unit || 'kWh'}</span>
                    </div>
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-blue-500/10 blur-2xl rounded-full opacity-50"></div>
                </div>

                {/* Footer Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="bg-[#232f48]/50 p-2 rounded-lg border border-[#324467]/30 flex flex-col items-center">
                        <span className="text-[10px] text-[#92a4c9] uppercase">Voltage</span>
                        <span className="text-sm font-semibold text-white">220 V</span>
                    </div>
                    <div className="bg-[#232f48]/50 p-2 rounded-lg border border-[#324467]/30 flex flex-col items-center">
                        <span className="text-[10px] text-[#92a4c9] uppercase">Current</span>
                        <span className="text-sm font-semibold text-white">{(power / 220).toFixed(1)} A</span>
                    </div>
                </div>
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
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-sm text-[#92a4c9]">
                            <Link href="/dashboard" className="hover:text-white transition-colors font-medium">Dashboard</Link>
                            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                            <span className="text-white font-medium">Energy Monitor</span>
                        </div>
                        <div>
                            <h2 className="text-white text-3xl font-bold tracking-tight mb-1">Listrik & Energi</h2>
                            <p className="text-[#92a4c9] text-sm">Monitoring konsumsi daya listrik mesin real-time</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sensors.length > 0 ? (
                    sensors.map((sensor) => (
                        <KwhSensorCard key={sensor.id} sensor={sensor} isVisible={isVisible} />
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-[#324467] rounded-xl bg-[#1a2332]/50">
                        <div className="inline-flex size-12 rounded-full bg-[#324467] items-center justify-center mb-4 text-[#92a4c9]">
                            <span className="material-symbols-outlined">sensors_off</span>
                        </div>
                        <p className="text-gray-400">Loading Sensors...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
