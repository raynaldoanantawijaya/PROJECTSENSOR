import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UAParser } from 'ua-parser-js';

// Types
export interface ActivityLog {
    userId: string;
    userEmail: string;
    action: string;
    details: string;
    deviceInfo: string;
    isSuspicious: boolean;
    timestamp: any; // Firestore serverTimestamp
}

/**
 * Parses user agent to a readable string (e.g., "Chrome 122 on Windows 10")
 */
function getDeviceInfo(): string {
    if (typeof window === 'undefined') return 'Unknown Device';
    try {
        const parser = new UAParser(window.navigator.userAgent);
        const browser = parser.getBrowser();
        const os = parser.getOS();
        return `${browser.name || 'Unknown Browser'} ${browser.version || ''} on ${os.name || 'Unknown OS'} ${os.version || ''}`.trim();
    } catch {
        return window.navigator.userAgent || 'Unknown Device';
    }
}

/**
 * Checks if the user has made more than 15 page views in the last 60 seconds.
 */
function checkSuspiciousActivity(): boolean {
    if (typeof window === 'undefined') return false;

    const now = Date.now();
    const timestampsStr = sessionStorage.getItem('activity_timestamps');
    let timestamps: number[] = [];

    if (timestampsStr) {
        try {
            timestamps = JSON.parse(timestampsStr);
        } catch { }
    }

    // Keep only timestamps from the last 60 seconds
    const ONE_MINUTE = 60 * 1000;
    timestamps = timestamps.filter(t => now - t < ONE_MINUTE);

    // Add current timestamp
    timestamps.push(now);
    sessionStorage.setItem('activity_timestamps', JSON.stringify(timestamps));

    // If more than 15 actions in a minute, flag as suspicious
    return timestamps.length > 15;
}

/**
 * Core function to log activity to Firestore
 */
export async function logUserActivity(action: string, details: string) {
    if (typeof window === 'undefined') return;

    try {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) return; // Don't log anonymous users if not logged in

        const user = JSON.parse(userStr);
        if (!user || !user.id || !user.email) return;

        // Skip logging for admins if you want to save more quota, 
        // but it's usually better to log everyone for security audits.

        let isSuspicious = false;
        if (action.startsWith('VIEW_PAGE')) {
            isSuspicious = checkSuspiciousActivity();
        }

        const logEntry: ActivityLog = {
            userId: user.id,
            userEmail: user.email,
            action,
            details,
            deviceInfo: getDeviceInfo(),
            isSuspicious,
            timestamp: serverTimestamp()
        };

        const activityRef = collection(db, 'user_activity');
        await addDoc(activityRef, logEntry);
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}

/**
 * Throttled logger for page views to save Firebase quota.
 * Only logs the same page view once per minute.
 */
export function throttleLog(action: 'VIEW_PAGE', details: string) {
    if (typeof window === 'undefined') return;

    const cacheKey = `last_log_${action}_${details}`;
    const lastLogTime = sessionStorage.getItem(cacheKey);
    const now = Date.now();
    const ONE_MINUTE = 60 * 1000;

    if (lastLogTime) {
        if (now - parseInt(lastLogTime, 10) < ONE_MINUTE) {
            // Skipped due to throttling
            return;
        }
    }

    // Remember we just logged it
    sessionStorage.setItem(cacheKey, now.toString());

    // Actually write the log
    logUserActivity(action, details);
}
