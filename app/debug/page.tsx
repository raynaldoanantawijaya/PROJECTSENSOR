"use client";

import { useState, useEffect } from 'react';
import { storageService } from '@/lib/storage';

export default function DebugPage() {
    const [sensors, setSensors] = useState<any[]>([]);
    const [testResults, setTestResults] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            storageService.init();
            const data = await storageService.getSensors();
            setSensors(data);
        };
        load();
    }, []);

    const testProxy = async (sensor: any) => {
        setLoading(true);
        try {
            const res = await fetch('/api/proxy/firebase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firebaseConfig: sensor.firebaseConfig,
                    dbPath: sensor.firebasePath
                })
            });
            const json = await res.json();
            setTestResults(prev => ({ ...prev, [sensor.id]: json }));
        } catch (err: any) {
            setTestResults(prev => ({ ...prev, [sensor.id]: { error: err.toString() } }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 bg-black min-h-screen text-white font-mono text-xs">
            <h1 className="text-2xl mb-5 font-bold text-green-500">SYSTEM DIAGNOSTIC TOOL</h1>

            <div className="space-y-10">
                {sensors.map(s => (
                    <div key={s.id} className="border border-gray-700 p-5 rounded-lg">
                        <div className="flex justify-between mb-2">
                            <h3 className="text-lg font-bold text-blue-400">{s.name} ({s.id})</h3>
                            <button
                                onClick={() => testProxy(s)}
                                className="bg-blue-600 px-4 py-1 rounded hover:bg-blue-500 text-white font-bold"
                            >
                                {loading ? 'TESTING...' : 'TEST PROXY CONNECTION'}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-900 p-4 rounded overflow-auto max-h-[300px]">
                                <h4 className="text-gray-500 mb-2 border-b border-gray-700 pb-1">STORED CONFIGURATION (FIRESTORE)</h4>
                                <pre className="whitespace-pre-wrap text-yellow-300">
                                    Path: {s.firebasePath}
                                    {'\n'}
                                    Config: {s.firebaseConfig}
                                </pre>
                            </div>

                            <div className="bg-gray-900 p-4 rounded overflow-auto max-h-[300px]">
                                <h4 className="text-gray-500 mb-2 border-b border-gray-700 pb-1">PROXY RESPONSE RESULT</h4>
                                {testResults[s.id] ? (
                                    <pre className={`whitespace-pre-wrap ${testResults[s.id].error ? 'text-red-400' : 'text-green-400'}`}>
                                        {JSON.stringify(testResults[s.id], null, 2)}
                                    </pre>
                                ) : (
                                    <p className="text-gray-600 italic">Click Test button to see data...</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {sensors.length === 0 && <p>No sensors found in database.</p>}
        </div>
    );
}
