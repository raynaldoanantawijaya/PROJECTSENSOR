import { useState, useEffect, useRef } from 'react';
import { Sensor } from './storage';

/**
 * Hook to fetch sensor data efficiently via Proxy API or cleanup connection.
 * @param sensor The sensor object configuration
 * @param isVisible Page visibility state
 * @param intervalMs Polling interval (default 2000ms)
 */
export const useSmartSensorData = (sensor: Sensor, isVisible: boolean, intervalMs: number = 2000) => {
    const [data, setData] = useState({ speed: 0, lastUpdated: new Date(), isConnected: false });
    // We use a Ref to keep track of the interval so we can clear it
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Reset state on sensor change
        if (sensor.status === 'inactive') {
            setData(d => ({ ...d, speed: 0, isConnected: false }));
            return;
        }

        // If hidden, stop everything (Bandwidth Saver Level 1)
        if (!isVisible) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        const fetchData = async () => {
            try {
                // Prepare Payload
                const rawConfig = (sensor.firebaseConfig || '').trim();
                const dbPath = sensor.firebasePath || (sensor.id === 'SPD-01' ? 'sensor1/live/speed' : `${sensor.id}/live/speed`);

                // If no complex config, maybe we can't use proxy? 
                // Actually proxy needs config. If config invalid, proxy fails.
                // We'll try proxy.

                const res = await fetch('/api/proxy/firebase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        firebaseConfig: rawConfig,
                        dbPath: dbPath
                    })
                });

                if (res.ok) {
                    const json = await res.json();
                    const val = json.data;

                    // === PARSING PINTAR (DEEP SEARCH) ===
                    // Mencari angka valid secara rekursif di dalam object bersarang
                    const findValueRecursive = (obj: any, depth = 0): number | null => {
                        if (depth > 5) return null; // Batas kedalaman
                        if (obj === undefined || obj === null) return null;

                        // Jika langsung ketemu angka / string angka
                        if (typeof obj === 'number') return obj;
                        if (typeof obj === 'string') {
                            const parsed = parseFloat(obj);
                            return isNaN(parsed) ? null : parsed;
                        }

                        // Jika Object, cari di dalamnya
                        if (typeof obj === 'object') {
                            // 1. Prioritas: Cari key yang umum dulu
                            const priorityKeys = [
                                'value', 'speed', 'rpm', 'count', 'val',
                                'sacks', 'sack', 'power', 'kwh', 'kw',
                                'width', 'cm', 'distance', 'total', 'current',
                                'machine_speed', 'production'
                            ];

                            for (const key of priorityKeys) {
                                // Case-insensitive check optional, but standard JS keys are sensitive
                                if (key in obj) {
                                    const result = findValueRecursive(obj[key], depth + 1);
                                    if (result !== null) return result;
                                }
                            }

                            // 2. Fallback: Cari di semua key lain jika tidak ketemu di prioritas
                            // (Misal: "sensor1": 100)
                            for (const key in obj) {
                                if (!priorityKeys.includes(key)) {
                                    const result = findValueRecursive(obj[key], depth + 1);
                                    if (result !== null) return result;
                                }
                            }
                        }

                        return null;
                    };

                    const foundValue = findValueRecursive(val);
                    const newSpeed = foundValue !== null ? foundValue : 0;

                    setData({ speed: newSpeed, lastUpdated: new Date(), isConnected: true });
                } else {
                    console.warn(`[SmartSensor] Proxy Error ${sensor.id}:`, res.statusText);
                }

            } catch (err) {
                console.error(`[SmartSensor] Fetch Error ${sensor.id}`, err);
            }
        };

        // Initial Fetch
        fetchData();

        // Start Polling Interval
        // This is "Bandwidth Saver Level 2": Polling Cached API
        timerRef.current = setInterval(fetchData, intervalMs);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };

    }, [sensor.id, sensor.status, sensor.firebaseConfig, sensor.firebasePath, isVisible, intervalMs]);

    return data;
};
