"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Sensor } from './storage';

export interface SackSensorData {
    lebar: number;       // Hasil pengukuran (measurement)
    offset: number;      // Hasil kalibrasi (calibration result)
    ir1: boolean;        // IR sensor 1
    ir2: boolean;        // IR sensor 2
    isConnected: boolean;
    lastUpdated: Date;
}

/**
 * Custom hook for sack sensors — reads multiple Firebase RTDB paths in parallel.
 * Uses the existing /api/proxy/firebase endpoint for each path.
 */
export const useSackSensorData = (
    sensor: Sensor,
    isVisible: boolean,
    intervalMs: number = 5000
): SackSensorData => {
    const [data, setData] = useState<SackSensorData>({
        lebar: 0,
        offset: 0,
        ir1: false,
        ir2: false,
        isConnected: false,
        lastUpdated: new Date()
    });

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const fetchPath = useCallback(async (path: string): Promise<any> => {
        if (!path) return null;
        try {
            const res = await fetch('/api/proxy/firebase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firebaseConfig: (sensor.firebaseConfig || '').trim(),
                    dbPath: path
                })
            });
            if (res.ok) {
                const json = await res.json();
                return json.data;
            }
        } catch (err) {
            console.error(`[SackSensor] Error fetching ${path}:`, err);
        }
        return null;
    }, [sensor.firebaseConfig]);

    useEffect(() => {
        if (sensor.status === 'inactive') {
            setData(d => ({ ...d, isConnected: false }));
            return;
        }

        if (!isVisible) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        const fetchAll = async () => {
            // Fetch all 4 paths in parallel
            const [lebarRaw, offsetRaw, ir1Raw, ir2Raw] = await Promise.all([
                sensor.sackPathLebar ? fetchPath(sensor.sackPathLebar) : Promise.resolve(null),
                sensor.sackPathOffset ? fetchPath(sensor.sackPathOffset) : Promise.resolve(null),
                sensor.sackPathIr1 ? fetchPath(sensor.sackPathIr1) : Promise.resolve(null),
                sensor.sackPathIr2 ? fetchPath(sensor.sackPathIr2) : Promise.resolve(null),
            ]);

            const parsedLebar = typeof lebarRaw === 'number' ? lebarRaw
                : typeof lebarRaw === 'string' ? parseFloat(lebarRaw) || 0
                    : 0;

            const parsedOffset = typeof offsetRaw === 'number' ? offsetRaw
                : typeof offsetRaw === 'string' ? parseFloat(offsetRaw) || 0
                    : 0;

            const parsedIr1 = ir1Raw === true || ir1Raw === 'true' || ir1Raw === 1;
            const parsedIr2 = ir2Raw === true || ir2Raw === 'true' || ir2Raw === 1;

            // Consider connected if at least lebar fetch returned something
            const connected = lebarRaw !== null;

            setData({
                lebar: parsedLebar,
                offset: parsedOffset,
                ir1: parsedIr1,
                ir2: parsedIr2,
                isConnected: connected,
                lastUpdated: new Date()
            });
        };

        fetchAll();
        timerRef.current = setInterval(fetchAll, intervalMs);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [sensor.id, sensor.status, sensor.sackPathLebar, sensor.sackPathOffset,
    sensor.sackPathIr1, sensor.sackPathIr2, sensor.firebaseConfig,
        isVisible, intervalMs, fetchPath]);

    return data;
};

/**
 * Write a value to a Firebase RTDB path (used for kalibrasi target).
 */
export const writeSackCalibration = async (
    firebaseConfig: string,
    kalibrasiPath: string,
    value: string
): Promise<boolean> => {
    try {
        // Get the logged-in user's ID for authentication
        let userToken = '';
        try {
            const stored = localStorage.getItem('currentUser');
            if (stored) {
                const user = JSON.parse(stored);
                userToken = user.id || user.email || 'authenticated-user';
            }
        } catch { }

        const res = await fetch('/api/proxy/firebase-write', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(userToken ? { 'X-User-Token': userToken } : {})
            },
            body: JSON.stringify({
                firebaseConfig: firebaseConfig,
                dbPath: kalibrasiPath,
                value: value
            })
        });
        return res.ok;
    } catch (err) {
        console.error('[SackSensor] Write error:', err);
        return false;
    }
};
