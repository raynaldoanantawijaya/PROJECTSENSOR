"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { storageService } from '@/lib/storage';

export default function AdminDashboardPage() {
    const [userCount, setUserCount] = useState(0);
    const [activeSensorCount, setActiveSensorCount] = useState(0);

    useEffect(() => {
        const initData = async () => {
            await storageService.init();

            // Calculate user count
            const users = await storageService.getUsers();
            setUserCount(users.length);

            // Calculate active sensors count
            const sensors = await storageService.getSensors();
            const activeCount = sensors.filter(s => s.status === 'active').length;
            setActiveSensorCount(activeCount);
        };
        initData();
    }, []);

    return (
        <>


            <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:px-12">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col gap-2 pt-2">
                        <h2 className="text-white tracking-tight text-3xl font-bold leading-tight">Welcome back, Administrator.</h2>
                        <p className="text-[#92a4c9] text-base font-normal">System status is nominal. 3 alerts require your attention.</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="flex flex-col gap-3 rounded-xl p-6 bg-[#232f48] border border-white/5 shadow-md">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <span className="material-symbols-outlined text-primary text-[24px]">group</span>
                                </div>
                                <span className="flex items-center text-[#0bda5e] text-xs font-bold bg-[#0bda5e]/10 px-2 py-1 rounded-full">+2%</span>
                            </div>
                            <div>
                                <p className="text-[#92a4c9] text-sm font-medium mb-1">Total Users</p>
                                <p className="text-white text-3xl font-bold tracking-tight">{userCount}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 rounded-xl p-6 bg-[#232f48] border border-white/5 shadow-md">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <span className="material-symbols-outlined text-primary text-[24px]">sensors</span>
                                </div>
                                <span className="flex items-center text-[#0bda5e] text-xs font-bold bg-[#0bda5e]/10 px-2 py-1 rounded-full">+5%</span>
                            </div>
                            <div>
                                <p className="text-[#92a4c9] text-sm font-medium mb-1">Active Sensors</p>
                                <p className="text-white text-3xl font-bold tracking-tight">{activeSensorCount}</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 rounded-xl p-6 bg-[#232f48] border border-white/5 shadow-md">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <span className="material-symbols-outlined text-primary text-[24px]">dns</span>
                                </div>
                                <span className="flex items-center text-white text-xs font-bold bg-primary/20 px-2 py-1 rounded-full">Updated</span>
                            </div>
                            <div>
                                <p className="text-[#92a4c9] text-sm font-medium mb-1">System Status</p>
                                <p className="text-white text-3xl font-bold tracking-tight">Operational</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="pt-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white text-xl font-bold">Quick Actions</h3>
                            <button className="text-primary text-sm font-semibold hover:text-white transition-colors">View All Actions</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* User Control Card */}
                            <div className="group relative flex flex-col rounded-xl overflow-hidden bg-[#232f48] border border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                                <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA_vAoNGN8_iOWKdD4EaDVlflIlTF_4wRoe7JiBgFHm5pr0apTegdVGbP8_jaNfEhPNxfvQh55byrI_ZQSbHZ21uYN6XXjKmGfmbDdk5fmZW2O0dqeL20hsaFQNypuqZogQ8lvdw0H20WpbNrRT5_1t72kaBExrMRUTe55vY1Hh8rGOExT64O-Sq_xRwfNULkPgqwTGjwVZ3eDu5Iqxj3bm6-SrGWeDHe1HL-ohTIc2M-e_889dH3Z-RzOlWYtPpfGKHRA9L2IO5m0U')" }}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#232f48] to-transparent opacity-90"></div>
                                    <div className="absolute bottom-4 left-6">
                                        <div className="bg-primary text-white p-2 rounded-lg shadow-lg inline-flex mb-2 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined">manage_accounts</span>
                                        </div>
                                        <h4 className="text-white text-lg font-bold">User Control</h4>
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <p className="text-[#92a4c9] text-sm leading-relaxed mb-6 flex-1">Manage access control lists, update user roles, and configure security permissions for the entire organization.</p>
                                    <Link href="/admin/dashboard/users" className="w-full py-3 px-4 rounded-lg bg-[#111722] hover:bg-primary border border-[#3b4b68] hover:border-primary text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
                                        Manage Users
                                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Sensor Control Card */}
                            <div className="group relative flex flex-col rounded-xl overflow-hidden bg-[#232f48] border border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                                <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDu3GaWQasWFUx4GNIyM5WsCV5WGxcQPYlr4lW9P3WDRLbsiNR_YxqMVOj8CWQzpg6LYT2BKwJOwSKWYwBy_G0jS3VP-NhpvaSMvZus_zMCOM1_uGjAJq_pIEPnFzOfbayKY0JqcUeAh7xezLCWnk1xUhNBVcwVIeMOML1fDtK-F7gsEvMgEDmpCnhcPi_-MXMOZOKkg98GoXpuKkDhx6ZlRDZxS6MBSt3qP0jsnyxQu44KNuGQB-w7eF09ASZwDRXX1ghoMPqexblO')" }}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#232f48] to-transparent opacity-90"></div>
                                    <div className="absolute bottom-4 left-6">
                                        <div className="bg-primary text-white p-2 rounded-lg shadow-lg inline-flex mb-2 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined">settings_remote</span>
                                        </div>
                                        <h4 className="text-white text-lg font-bold">Sensor Control</h4>
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <p className="text-[#92a4c9] text-sm leading-relaxed mb-6 flex-1">Monitor real-time telemetry, calibrate active units, and troubleshoot connection issues across the fleet.</p>
                                    <Link href="/admin/dashboard/sensors" className="w-full py-3 px-4 rounded-lg bg-[#111722] hover:bg-primary border border-[#3b4b68] hover:border-primary text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
                                        Manage Sensors
                                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Template Control Card */}
                            <div className="group relative flex flex-col rounded-xl overflow-hidden bg-[#232f48] border border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                                <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBBzYUno-vO0vSnH735NdWKuNvZf4iaIHE4q7BoXhLt_VPOHO0cJ_xNoYi9jJpkEJ4Zr4v40v4Ygv60mFrgSYYbI_1dAjMIsajoNR-WTM6sECKnS7gMDm0BiEOrdwF4RLEp1dkkpTwYdFTBfI-2CILLsEZBO-t-wU-VodVmYoJL78B4YNYvFBLiIVDObMYfU8hyZCHeMRKSO145tkVioFjwWWuVZuU1SNTdmQCFBG9gO88PUIxRDMC0yK4nMnHh_feWBcX9tA3uuizy')" }}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#232f48] to-transparent opacity-90"></div>
                                    <div className="absolute bottom-4 left-6">
                                        <div className="bg-primary text-white p-2 rounded-lg shadow-lg inline-flex mb-2 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined">tune</span>
                                        </div>
                                        <h4 className="text-white text-lg font-bold">Sensor Templates</h4>
                                    </div>
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <p className="text-[#92a4c9] text-sm leading-relaxed mb-6 flex-1">Create, edit, and deploy configuration blueprints to standardize settings across multiple sensor types.</p>
                                    <Link href="/admin/dashboard/templates" className="w-full py-3 px-4 rounded-lg bg-[#111722] hover:bg-primary border border-[#3b4b68] hover:border-primary text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
                                        View Templates
                                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-10"></div>
                </div>
            </main>
        </>
    );
}
