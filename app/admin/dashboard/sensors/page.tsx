"use client";

import React, { useEffect, useState } from 'react';
import { storageService, Sensor } from '@/lib/storage';

export default function AdminSensorsPage() {
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [newSensor, setNewSensor] = useState<Partial<Sensor>>({
        id: '',
        name: '',
        type: 'speed',
        status: 'active',
        firebaseConfig: '',
        firebasePath: '',
        spreadsheetUrl: ''
    });

    useEffect(() => {
        const loadSensors = async () => {
            await storageService.init();
            setSensors(await storageService.getSensors());
        };
        loadSensors();
    }, []);

    const handleSaveSensor = async () => {
        if (!newSensor.id || !newSensor.name) {
            alert("ID and Name are required");
            return;
        }
        await storageService.saveSensor(newSensor as Sensor);
        setSensors(await storageService.getSensors());
        setNewSensor({ id: '', name: '', type: 'speed', status: 'active', firebaseConfig: '', firebasePath: '', spreadsheetUrl: '' });
        alert("Sensor added successfully");
    };

    const handleDeleteSensor = async (id: string) => {
        if (confirm("Are you sure you want to delete this sensor?")) {
            await storageService.deleteSensor(id);
            setSensors(await storageService.getSensors());
        }
    };

    return (
        <>
            <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:px-12">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-white tracking-tight text-3xl font-bold leading-tight">Sensor Management</h2>
                            <p className="text-[#92a4c9] text-base font-normal">Add and configure sensors, machine details, and connection settings.</p>
                        </div>
                        <button
                            onClick={async () => {
                                if (confirm("DANGER: This will delete ALL sensors. Are you sure?")) {
                                    if (confirm("Really? This action cannot be undone.")) {
                                        // Extend StorageService type usage if needed or ignore TS error for now as we just added it
                                        // @ts-ignore
                                        if (storageService.deleteAllSensors) {
                                            // @ts-ignore
                                            await storageService.deleteAllSensors();
                                            setSensors([]);
                                            alert("All sensors deleted.");
                                        } else {
                                            alert("Feature not supported in this version.");
                                        }
                                    }
                                }
                            }}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">delete_forever</span>
                            Delete All Sensors
                        </button>
                    </div>

                    {/* Registration Form */}
                    <div className="bg-[#232f48]/30 border border-white/5 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">app_registration</span>
                            Register New Sensor Node
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-[#92a4c9]">Sensor ID</label>
                                <input
                                    className="w-full bg-[#111722] border border-[#3b4b68] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 placeholder-[#92a4c9]/50 focus:outline-none"
                                    placeholder="e.g. SPD-04"
                                    value={newSensor.id}
                                    onChange={e => setNewSensor({ ...newSensor, id: e.target.value })}
                                />
                                <p className="text-xs text-[#92a4c9]/70">Unique ID (used in URL).</p>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-[#92a4c9]">Machine Name</label>
                                <input
                                    className="w-full bg-[#111722] border border-[#3b4b68] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 placeholder-[#92a4c9]/50 focus:outline-none"
                                    placeholder="e.g. Conveyor Belt 4"
                                    value={newSensor.name}
                                    onChange={e => setNewSensor({ ...newSensor, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-[#92a4c9]">Sensor Category</label>
                                <select
                                    className="w-full bg-[#111722] border border-[#3b4b68] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 appearance-none focus:outline-none"
                                    value={newSensor.type}
                                    onChange={e => setNewSensor({ ...newSensor, type: e.target.value as any })}
                                >
                                    <option value="speed">Speed Sensor</option>
                                    <option value="sack">Sack Sensor</option>
                                    <option value="kwh">KWH Meter</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-[#92a4c9]">Firebase Database Path (Node)</label>
                                <input
                                    className="w-full bg-[#111722] border border-[#3b4b68] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 placeholder-[#92a4c9]/50 focus:outline-none"
                                    placeholder="e.g. sensor1/live/speed"
                                    value={newSensor.firebasePath || ''}
                                    onChange={e => setNewSensor({ ...newSensor, firebasePath: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-[#92a4c9]">Excel Report Link (Google Sheet)</label>
                                <input
                                    className="w-full bg-[#111722] border border-[#3b4b68] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 placeholder-[#92a4c9]/50 focus:outline-none"
                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                    value={newSensor.spreadsheetUrl || ''}
                                    onChange={e => setNewSensor({ ...newSensor, spreadsheetUrl: e.target.value })}
                                />
                                <p className="text-xs text-[#92a4c9]/70">Full link to the Google Sheet.</p>
                            </div>

                            <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2">
                                <label className="block text-sm font-medium text-[#92a4c9]">Firebase Realtime DB API Config (JSON)</label>
                                <div className="flex flex-col gap-2">
                                    <textarea
                                        className="w-full bg-[#111722] border border-[#3b4b68] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-3 placeholder-[#92a4c9]/50 focus:outline-none font-mono text-xs"
                                        placeholder='{ "apiKey": "...", "databaseURL": "..." }'
                                        rows={5}
                                        value={newSensor.firebaseConfig || ''}
                                        onChange={e => {
                                            let val = e.target.value;

                                            // 1. Strip JS variable declaration (const x = ...)
                                            if (val.includes("=") && !val.includes(":")) {
                                                // Basic check: if equal exists but maybe it's inside valid json? 
                                                // Usually valid JSON doesn't have = outside strings.
                                                // JS config: const config = { ... }
                                                const parts = val.split("=");
                                                if (parts.length > 1) {
                                                    val = parts.slice(1).join("=").trim();
                                                    if (val.endsWith(";")) val = val.slice(0, -1);
                                                }
                                            }

                                            // 2. Remove comments (Careful not to remove https://)
                                            // Only remove lines starting with // (Full line comments)
                                            val = val.replace(/^\s*\/\/.*/gm, '');

                                            // Remove inline comments only if they are preceded by whitespace and not part of URL
                                            // This is hard. Let's stick to full line comments removal to save URLs.

                                            // 3. Smart Key Quoting (Fix keys: -> "keys":)
                                            const knownKeys = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'measurementId'];
                                            knownKeys.forEach(key => {
                                                val = val.replace(new RegExp(`\\b${key}\\s*:`, 'g'), `"${key}":`);
                                            });

                                            // 4. Cleanup quotes (single ' to double ")
                                            val = val.replace(/'/g, '"');

                                            // 5. Remove trailing commas before closing brace
                                            val = val.replace(/,\s*}/g, '}');
                                            val = val.replace(/,\s*]/g, ']');

                                            setNewSensor({ ...newSensor, firebaseConfig: val });
                                        }}
                                    />
                                    <p className="text-xs text-[#92a4c9]/70">Paste the full Firebase config object here. If empty, the default project config will be used.</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleSaveSensor}
                                className="px-5 py-2 rounded-lg bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/20 text-sm font-medium transition-all"
                            >
                                Save Sensor
                            </button>
                        </div>
                    </div>

                    {/* Sensor Table */}
                    <div className="bg-[#232f48] border border-white/5 rounded-xl shadow-md overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-[#1a2336] border-b border-[#3b4b68]">
                                        <th className="p-5 text-xs font-semibold tracking-wide text-[#92a4c9] uppercase">ID</th>
                                        <th className="p-5 text-xs font-semibold tracking-wide text-[#92a4c9] uppercase">Machine Name</th>
                                        <th className="p-5 text-xs font-semibold tracking-wide text-[#92a4c9] uppercase">Category</th>
                                        <th className="p-5 text-xs font-semibold tracking-wide text-[#92a4c9] uppercase">Status</th>
                                        <th className="p-5 text-xs font-semibold tracking-wide text-[#92a4c9] uppercase text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {sensors.map((sensor) => (
                                        <tr key={sensor.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="p-5 text-white font-mono text-sm">{sensor.id}</td>
                                            <td className="p-5 text-white font-medium text-sm">{sensor.name}</td>
                                            <td className="p-5">
                                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${sensor.type === 'speed' ? 'bg-cyan-400/10 text-cyan-400 ring-cyan-400/20' :
                                                    sensor.type === 'sack' ? 'bg-purple-400/10 text-purple-400 ring-purple-400/20' :
                                                        'bg-orange-400/10 text-orange-400 ring-orange-400/20'
                                                    }`}>
                                                    {sensor.type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${sensor.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                    <span className={`text-xs font-medium ${sensor.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                                                        {sensor.status === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <button
                                                    onClick={() => handleDeleteSensor(sensor.id)}
                                                    className="p-2 hover:bg-red-500/20 text-[#92a4c9] hover:text-red-500 rounded-lg transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="h-10"></div>
            </main>
        </>
    );
}
