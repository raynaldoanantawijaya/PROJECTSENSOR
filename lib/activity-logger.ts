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
 * Detects if the browser is a mobile device pretending to be desktop
 * (e.g., Chrome "Request Desktop Site" on Android).
 */
function isMobileInDesktopMode(): boolean {
    if (typeof window === 'undefined') return false;

    // Check 1: navigator.userAgentData (Chromium) — reports real platform even in desktop mode
    const nav = navigator as any;
    if (nav.userAgentData?.platform === 'Android') return true;

    // Check 2: Touch support combined with no mouse pointer (strong heuristic)
    const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;

    // Check 3: UA says Linux but has touch → almost certainly Android in desktop mode
    const ua = window.navigator.userAgent;
    const uaSaysLinux = /Linux/.test(ua) && !/Android/.test(ua);

    if (hasTouch && uaSaysLinux) return true;

    return false;
}

/**
 * Parses user agent to a detailed, readable string including device brand & model.
 * Handles Android Desktop Mode correctly.
 * Example outputs:
 *   "Samsung SM-A546B | Chrome 122 | Android 13 | Mobile"
 *   "Apple iPhone | Safari 17.2 | iOS 17.2 | Mobile"
 *   "Desktop | Chrome 122 | Windows 10"
 *   "Android (Mode Desktop) | Chrome 145 | Mobile"
 */
function getDeviceInfo(): string {
    if (typeof window === 'undefined') return 'Unknown Device';
    try {
        const parser = new UAParser(window.navigator.userAgent);
        const browser = parser.getBrowser();
        const os = parser.getOS();
        const device = parser.getDevice();
        const isDesktopMode = isMobileInDesktopMode();

        const parts: string[] = [];

        // --- Device Brand & Model ---
        if (device.vendor || device.model) {
            const brandModel = [device.vendor, device.model].filter(Boolean).join(' ');
            parts.push(brandModel);
        } else if (isDesktopMode) {
            // UA is disguised as Desktop, but we know it's mobile
            parts.push('Android (Mode Desktop)');
        } else {
            // Fallback: try to detect from raw UA string for brands UAParser might miss
            const ua = window.navigator.userAgent;
            const brandMatch = ua.match(/;\s*(SM-\S+|V\d{4}\w?|RMX\d{4}|CPH\d{4}|M\d{4}|22\d{3}|23\d{3}|2[12]\d{3}|Pixel\s*\d*\s*\w*|POCO\s*\w+|Redmi\s*\w+)/i);
            if (brandMatch) {
                parts.push(brandMatch[1]);
            } else {
                parts.push(device.type === 'mobile' ? 'Mobile Device' : device.type === 'tablet' ? 'Tablet' : 'Desktop');
            }
        }

        // --- Browser ---
        if (browser.name) {
            parts.push(`${browser.name} ${browser.version || ''}`.trim());
        }

        // --- OS ---
        if (isDesktopMode && os.name === 'Linux') {
            // Override: It's actually Android in desktop mode
            parts.push('Android (Mode Desktop)');
        } else if (os.name) {
            parts.push(`${os.name} ${os.version || ''}`.trim());
        }

        // --- Device Type ---
        if (isDesktopMode) {
            parts.push('Mobile (Mode Desktop)');
        } else if (device.type) {
            const typeLabel = device.type.charAt(0).toUpperCase() + device.type.slice(1);
            parts.push(typeLabel);
        }

        return parts.join(' | ') || 'Unknown Device';
    } catch {
        return window.navigator.userAgent || 'Unknown Device';
    }
}

/**
 * Attempts to get high-entropy Client Hints for even more specific device info.
 * This is async because the browser may prompt the user or take time to resolve.
 * Falls back to basic getDeviceInfo() if not supported.
 * Client Hints are IMMUNE to "Request Desktop Site" — they always report the real device.
 */
async function getDetailedDeviceInfo(): Promise<string> {
    try {
        const nav = navigator as any;
        if (nav.userAgentData && typeof nav.userAgentData.getHighEntropyValues === 'function') {
            const hints = await nav.userAgentData.getHighEntropyValues([
                'model', 'platform', 'platformVersion', 'fullVersionList'
            ]);

            const parts: string[] = [];

            // Model (e.g., "SM-A546B", "Pixel 7 Pro") — always real even in desktop mode
            if (hints.model) {
                parts.push(hints.model);
            }

            // Browser from fullVersionList
            if (hints.fullVersionList && hints.fullVersionList.length > 0) {
                const mainBrowser = hints.fullVersionList.find((b: any) =>
                    !b.brand.includes('Chromium') && !b.brand.includes('Not')
                ) || hints.fullVersionList[0];
                if (mainBrowser) {
                    parts.push(`${mainBrowser.brand} ${mainBrowser.version}`);
                }
            }

            // Platform — always real (e.g. "Android", "Windows") even in desktop mode
            if (hints.platform) {
                let platformStr = `${hints.platform} ${hints.platformVersion || ''}`.trim();
                // Detect desktop mode: platform is Android but mobile flag is false
                if (hints.platform === 'Android' && hints.mobile === false) {
                    platformStr += ' (Mode Desktop)';
                }
                parts.push(platformStr);
            }

            // Mobile flag
            if (hints.mobile !== undefined) {
                if (hints.platform === 'Android') {
                    // It's always mobile hardware regardless of the flag
                    parts.push(hints.mobile ? 'Mobile' : 'Mobile (Mode Desktop)');
                } else {
                    parts.push(hints.mobile ? 'Mobile' : 'Desktop');
                }
            }

            if (parts.length > 0) {
                return parts.join(' | ');
            }
        }
    } catch {
        // Client Hints not supported or failed, fall through
    }

    // Fallback to UAParser-based detection
    return getDeviceInfo();
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
            deviceInfo: await getDetailedDeviceInfo(),
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
