
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { storageService, Sensor } from "@/lib/storage";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue, off } from "firebase/database";

import { useSmartSensorData } from "@/lib/smart-sensor";

const getStatusParams = (status: Sensor['status']) => {
    switch (status) {
        case 'active':
            return {
                color: 'emerald',
                text: 'Normal',
                icon: 'speed',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
                fg: 'text-emerald-400',
                iconBg: 'bg-[#135bec]/20',
                iconColor: 'text-[#135bec]',
                pathFill: "M0,70 Q30,65 60,75 T120,60 T180,70 T240,50 T300,45 V100 H0 Z",
                pathStroke: "M0,70 Q30,65 60,75 T120,60 T180,70 T240,50 T300,45"
            };
        case 'maintenance':
            return {
                color: 'amber',
                text: 'Warning',
                icon: 'warning',
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/20',
                fg: 'text-amber-400',
                iconBg: 'bg-amber-500/20',
                iconColor: 'text-amber-500',
                pathFill: "M0,50 Q30,40 60,30 T120,45 T180,20 T240,35 T300,10 V100 H0 Z",
                pathStroke: "M0,50 Q30,40 60,30 T120,45 T180,20 T240,35 T300,10"
            };
        case 'inactive':
        default:
            return {
                color: 'rose',
                text: 'Stopped',
                icon: 'error',
                bg: 'bg-rose-500/10',
                border: 'border-rose-500/20',
                fg: 'text-rose-400',
                iconBg: 'bg-rose-500/20',
                iconColor: 'text-rose-500',
                pathFill: "M0,50 L40,50 L50,90 L300,90 V100 H0 Z",
                pathStroke: "M0,50 L40,50 L50,90 L300,90"
            };
    }
};

const SpeedSensorCard = ({ sensor, isVisible }: { sensor: Sensor; isVisible: boolean }) => {
    // USE SMART PROXY: Fetches via API, Cached on Server, Updates every 5s
    // Since sensor updates every 10s, checking every 5s is sufficient and efficient.
    const { speed } = useSmartSensorData(sensor, isVisible, 5000);

    // Derived Visual Style based on Realtime Speed
    // Logic matches Detail Page: >= 150 Green, >= 105 Yellow, < 105 Red
    const style = (() => {
        // 1. If manually set to Maintenance/Inactive in Admin, respect that
        if (sensor.status === 'maintenance') return getStatusParams('maintenance');
        if (sensor.status === 'inactive') return getStatusParams('inactive');

        // 2. If Active, color depends on Speed
        const TARGET_SPEED = 150;
        if (speed >= TARGET_SPEED) return getStatusParams('active'); // Green
        if (speed >= TARGET_SPEED * 0.7) return getStatusParams('maintenance'); // Yellow
        // Else Red (Critical/Slow)
        const criticalStyle = getStatusParams('inactive');
        return { ...criticalStyle, text: speed === 0 ? 'Stopped' : 'Critical' };
    })();


    return (
        <Link href={`/dashboard/speed/${sensor.id}`} className="flex flex-col rounded-xl border border-[#324467] bg-[#1a2332] overflow-hidden hover:border-[#4b628b] transition-colors shadow-lg shadow-black/20 group">
            <div className="p-6 flex flex-col gap-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-full ${style.iconBg} flex items-center justify-center ${style.iconColor}`}>
                            <span className="material-symbols-outlined">{style.icon}</span>
                        </div>
                        <div>
                            <h3 className="text-white text-base font-semibold">{sensor.name}</h3>
                            <p className="text-[#92a4c9] text-xs">ID: {sensor.id}</p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${style.bg} ${style.border} ${style.fg} text-xs font-medium uppercase tracking-wide`}>
                        <span className={`size-1.5 rounded-full bg-current ${sensor.status === 'active' ? 'animate-pulse' : ''}`}></span>
                        {style.text}
                    </span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{speed}</span>
                    <span className="text-[#92a4c9] text-sm font-medium">M/min</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#92a4c9] border-t border-[#324467] pt-4 mt-auto">
                    <div className="flex items-center gap-1">
                        <span className={`material-symbols-outlined ${style.fg}`} style={{ fontSize: "16px" }}>
                            {sensor.status === 'inactive' ? 'trending_down' : 'trending_up'}
                        </span>
                        <span className={`${style.fg} font-medium`}>
                            {sensor.status === 'inactive' ? '-100%' : '+2.4%'}
                        </span>
                        <span>vs last hour</span>
                    </div>
                    <div className="ml-auto">
                        Updated recently
                    </div>
                </div>
            </div>
            <div className="h-24 w-full bg-[#151c2a] relative">
                <svg className="w-full h-full absolute bottom-0 left-0" preserveAspectRatio="none" viewBox="0 0 300 100">
                    <defs>
                        <linearGradient id={`grad${sensor.id}`} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={sensor.status === 'active' ? '#10b981' : sensor.status === 'maintenance' ? '#f59e0b' : '#f43f5e'} stopOpacity="0.2"></stop>
                            <stop offset="100%" stopColor={sensor.status === 'active' ? '#10b981' : sensor.status === 'maintenance' ? '#f59e0b' : '#f43f5e'} stopOpacity="0"></stop>
                        </linearGradient>
                    </defs>
                    <path d={style.pathFill} fill={`url(#grad${sensor.id})`}></path>
                    <path d={style.pathStroke} fill="none" stroke={sensor.status === 'active' ? '#10b981' : sensor.status === 'maintenance' ? '#f59e0b' : '#f43f5e'} strokeWidth="2"></path>
                </svg>
            </div>
        </Link>
    );
};

export default function SpeedSensorPage() {
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Load Sensors
        const load = async () => {
            storageService.init();
            const allSensors = await storageService.getSensors();
            setSensors(allSensors.filter(s => s.type === 'speed'));
        };
        load();

        // Handle Page Visibility to save bandwidth
        const handleVisibilityChange = () => {
            setIsVisible(document.visibilityState === 'visible');
            // console.log("Visibility Changed:", document.visibilityState);
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    return (
        <div className="max-w-[1400px]">
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Link href="/dashboard" className="text-[#92a4c9] hover:text-white transition-colors font-medium">Dashboard</Link>
                            <span className="material-symbols-outlined text-[#526079] text-sm">chevron_right</span>
                            <span className="text-white font-medium">Sensor Kecepatan</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-white tracking-tight text-xl sm:text-3xl font-bold">Sensor Kecepatan</h2>
                            <p className="text-[#92a4c9] text-xs sm:text-sm font-normal">Monitoring kecepatan mesin secara real-time</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sensors.length > 0 ? (
                    sensors.map((sensor) => (
                        <SpeedSensorCard key={sensor.id} sensor={sensor} isVisible={isVisible} />
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
