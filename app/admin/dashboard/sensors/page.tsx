"use client";

import React, { useEffect, useState } from 'react';
import { storageService, Sensor, User } from '@/lib/storage';
import { authService } from '@/lib/auth';

const COMMANDER_EMAIL = process.env.NEXT_PUBLIC_COMMANDER_EMAIL || "anantawijaya212@gmail.com";
const COMMANDER_NAME = process.env.NEXT_PUBLIC_COMMANDER_NAME || "Commander";

export default function AdminSensorsPage() {
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
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
        const init = async () => {
            await storageService.init();
            const allSensors = await storageService.getSensors();
            setSensors(allSensors);

            // Auth Check
            const users = await storageService.getUsers();
            authService.onAuthStateChanged((firebaseUser) => {
                const email = firebaseUser?.email;
                if (email) {
                    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
                    if (found) setCurrentUser(found);
                    // Mock commander if not found but matches email (first run)
                    else if (email.toLowerCase() === COMMANDER_EMAIL.toLowerCase()) {
                        setCurrentUser({
                            id: 'commander',
                            username: COMMANDER_NAME,
                            email: email,
                            role: 'admin',
                            subRole: 'all',
                            permissions: { viewSpeed: true, viewSack: true, viewKwh: true, canEdit: true }
                        });
                    }
                }
            });
        };
        init();
    }, []);

    // Derived State
    const isCommander = currentUser?.email.toLowerCase() === COMMANDER_EMAIL.toLowerCase();
    const userSubRole = currentUser?.subRole;

    // Filter Logic
    const getVisibleSensors = () => {
        if (!userSubRole || userSubRole === 'all') return sensors;
        if (userSubRole === 'printing') return sensors.filter(s => s.type === 'speed');
        if (userSubRole === 'sylum') return sensors.filter(s => s.type === 'sack');
        if (userSubRole === 'listrik') return sensors.filter(s => s.type === 'kwh');
        return sensors;
    };

    const visibleSensors = getVisibleSensors();

    const handleSaveSensor = async () => {
        if (!isCommander && !currentUser?.permissions?.canEdit) {
            alert("Access Denied: You do not have 'Edit Permission' enabled.");
            return;
        }

        if (!newSensor.id || !newSensor.name) {
            alert("ID and Name are required");
            return;
        }

        // Sub-role validation
        if (userSubRole && userSubRole !== 'all') {
            const requiredType =
                userSubRole === 'printing' ? 'speed' :
                    userSubRole === 'sylum' ? 'sack' :
                        userSubRole === 'listrik' ? 'kwh' : null;

            if (requiredType && newSensor.type !== requiredType) {
                alert(`Access Denied: You can only manage ${requiredType} sensors.`);
                return;
            }
        }

        await storageService.saveSensor(newSensor as Sensor);
        const latestSensors = await storageService.getSensors();
        setSensors(latestSensors);

        // Reset (keep type locked if subrole exists)
        const defaultType =
            userSubRole === 'printing' ? 'speed' :
                userSubRole === 'sylum' ? 'sack' :
                    userSubRole === 'listrik' ? 'kwh' : 'speed';

        setNewSensor({
            id: '',
            name: '',
            type: defaultType,
            status: 'active',
            firebaseConfig: '',
            firebasePath: '',
            spreadsheetUrl: ''
        });
        setIsEditing(false);
        alert(isEditing ? "Sensor updated successfully" : "Sensor added successfully");
    };

    const handleEditSensor = (sensor: Sensor) => {
        if (!isCommander && !currentUser?.permissions?.canEdit) {
            alert("Access Denied: You do not have 'Edit Permission' enabled.");
            return;
        }

        if (userSubRole && userSubRole !== 'all') {
            // Extra check
            const allowed =
                (userSubRole === 'printing' && sensor.type === 'speed') ||
                (userSubRole === 'sylum' && sensor.type === 'sack') ||
                (userSubRole === 'listrik' && sensor.type === 'kwh');

            if (!allowed) {
                alert("You are not authorized to edit this sensor category.");
                return;
            }
        }

        setNewSensor(sensor);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        const defaultType =
            userSubRole === 'printing' ? 'speed' :
                userSubRole === 'sylum' ? 'sack' :
                    userSubRole === 'listrik' ? 'kwh' : 'speed';

        setNewSensor({ id: '', name: '', type: defaultType, status: 'active', firebaseConfig: '', firebasePath: '', spreadsheetUrl: '' });
        setIsEditing(false);
    };

    const handleDeleteSensor = async (id: string, type: string) => {
        if (!isCommander && !currentUser?.permissions?.canEdit) {
            alert("Access Denied: You do not have 'Edit Permission' enabled.");
            return;
        }

        if (userSubRole && userSubRole !== 'all') {
            const allowed =
                (userSubRole === 'printing' && type === 'speed') ||
                (userSubRole === 'sylum' && type === 'sack') ||
                (userSubRole === 'listrik' && type === 'kwh');

            if (!allowed) {
                alert("You are not authorized to delete this sensor category.");
                return;
            }
        }

        if (confirm("Are you sure you want to delete this sensor?")) {
            await storageService.deleteSensor(id);
            setSensors(await storageService.getSensors());
            if (isEditing && newSensor.id === id) {
                handleCancelEdit();
            }
        }
    };

    // Auto-set type for restricted users when component loads or user changes
    useEffect(() => {
        if (userSubRole && userSubRole !== 'all' && !isEditing) {
            const fixedType =
                userSubRole === 'printing' ? 'speed' :
                    userSubRole === 'sylum' ? 'sack' :
                        userSubRole === 'listrik' ? 'kwh' : 'speed';
            setNewSensor(prev => ({ ...prev, type: fixedType }));
        }
    }, [userSubRole, isEditing]);

    return (
        <>
            <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:px-12">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-white tracking-tight text-3xl font-bold leading-tight">Sensor Management</h2>
                            <p className="text-[#92a4c9] text-base font-normal">Add and configure sensors, machine details, and connection settings.</p>
                            {userSubRole && userSubRole !== 'all' && (
                                <span className="inline-block bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded text-xs font-bold uppercase w-fit">
                                    Restricted Access: {userSubRole} Department
                                </span>
                            )}
                        </div>
                        {isCommander && (
                            <button
                                onClick={async () => {
                                    if (confirm("DANGER: This will delete ALL sensors. Are you sure?")) {
                                        if (confirm("Really? This action cannot be undone.")) {
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
                        )}
                    </div>

                    {/* Registration Form */}
                    <div className={`border rounded-xl p-6 transition-colors ${isEditing ? 'bg-amber-500/5 border-amber-500/20' : 'bg-[#232f48]/30 border-white/5'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-semibold flex items-center gap-2 ${isEditing ? 'text-amber-400' : 'text-white'}`}>
                                <span className="material-symbols-outlined text-primary">{isEditing ? 'edit' : 'app_registration'}</span>
                                {isEditing ? `Edit Sensor: ${newSensor.id}` : 'Register New Sensor Node'}
                            </h3>
                            {isEditing && (
                                <button onClick={handleCancelEdit} className="text-xs text-[#92a4c9] hover:text-white flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">close</span> Cancel Edit
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-[#92a4c9]">Sensor ID</label>
                                <input
                                    className={`w-full bg-[#111722] border border-[#3b4b68] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 placeholder-[#92a4c9]/50 focus:outline-none ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="e.g. SPD-04"
                                    value={newSensor.id}
                                    onChange={e => setNewSensor({ ...newSensor, id: e.target.value })}
                                    disabled={isEditing}
                                />
                                <p className="text-xs text-[#92a4c9]/70">Unique ID {isEditing ? '(Cannot be changed)' : '(used in URL)'}.</p>
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
                                    className={`w-full bg-[#111722] border border-[#3b4b68] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 appearance-none focus:outline-none 
                                        ${(userSubRole && userSubRole !== 'all') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    value={newSensor.type}
                                    onChange={e => setNewSensor({ ...newSensor, type: e.target.value as any })}
                                    disabled={!!(userSubRole && userSubRole !== 'all')}
                                >
                                    <option value="speed">Speed Sensor</option>
                                    <option value="sack">Sack Sensor</option>
                                    <option value="kwh">KWH Meter</option>
                                </select>
                                {(userSubRole && userSubRole !== 'all') && <p className="text-xs text-amber-500">Locked to your department.</p>}
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
                                            // JSON cleanup logic (omitted for brevity but kept in mind if needed)
                                            // Note: In a real replace, I'm pasting the FULL content so I need the logic here.
                                            // Re-using the logic from previous file read.

                                            if (val.includes("=") && !val.includes(":")) {
                                                const parts = val.split("=");
                                                if (parts.length > 1) {
                                                    val = parts.slice(1).join("=").trim();
                                                    if (val.endsWith(";")) val = val.slice(0, -1);
                                                }
                                            }
                                            val = val.replace(/^\s*\/\/.*/gm, '');
                                            const knownKeys = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'measurementId'];
                                            knownKeys.forEach(key => {
                                                val = val.replace(new RegExp(`\\b${key}\\s*:`, 'g'), `"${key}":`);
                                            });
                                            val = val.replace(/'/g, '"');
                                            val = val.replace(/,\s*}/g, '}');
                                            val = val.replace(/,\s*]/g, ']');

                                            setNewSensor({ ...newSensor, firebaseConfig: val });
                                        }}
                                    />
                                    <p className="text-xs text-[#92a4c9]/70">Paste the full Firebase config object here. If empty, the default project config will be used.</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            {isEditing && (
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-5 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white text-sm font-medium transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={handleSaveSensor}
                                className={`px-5 py-2 rounded-lg text-white shadow-lg shadow-primary/20 text-sm font-medium transition-all ${isEditing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-blue-600'}`}
                            >
                                {isEditing ? 'Update Sensor' : 'Save Sensor'}
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
                                    {visibleSensors.map((sensor) => (
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
                                                    onClick={() => handleEditSensor(sensor)}
                                                    className="p-2 mr-2 hover:bg-amber-500/20 text-[#92a4c9] hover:text-amber-500 rounded-lg transition-colors"
                                                    title="Edit Sensor"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSensor(sensor.id, sensor.type)}
                                                    className="p-2 hover:bg-red-500/20 text-[#92a4c9] hover:text-red-500 rounded-lg transition-colors"
                                                    title="Delete Sensor"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {visibleSensors.length === 0 && (
                                <div className="p-10 text-center text-[#92a4c9]">
                                    <p>No sensors found for your department.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="h-10"></div>
            </main>
        </>
    );
}
