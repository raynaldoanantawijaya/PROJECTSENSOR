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
 * Scraping detection counter — runs on EVERY navigation regardless of Firestore writes.
 * Counts page transitions in a rolling 60-second window.
 * Returns true if threshold is exceeded (>15 views/min).
 */
function countAndCheckScraping(): boolean {
    if (typeof window === 'undefined') return false;

    const now = Date.now();
    const timestampsStr = sessionStorage.getItem('activity_timestamps');
    let timestamps: number[] = [];

    if (timestampsStr) {
        try {
            timestamps = JSON.parse(timestampsStr);
        } catch { }
    }

    const ONE_MINUTE = 60 * 1000;
    timestamps = timestamps.filter(t => now - t < ONE_MINUTE);
    timestamps.push(now);
    sessionStorage.setItem('activity_timestamps', JSON.stringify(timestamps));

    return timestamps.length > 15;
}

/**
 * Core function to log activity to Firestore.
 * For LOGIN and EDIT_CONFIG: logs every call.
 * For VIEW_PAGE/VIEW_EXCEL: only used via oncePerSessionLog().
 */
export async function logUserActivity(action: string, details: string, forceSuspicious = false) {
    if (typeof window === 'undefined') return;

    try {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) return;

        const user = JSON.parse(userStr);
        if (!user || !user.id || !user.email) return;

        const logEntry: ActivityLog = {
            userId: user.id,
            userEmail: user.email,
            action,
            details,
            deviceInfo: await getDetailedDeviceInfo(),
            isSuspicious: forceSuspicious,
            timestamp: serverTimestamp()
        };

        const activityRef = collection(db, 'user_activity');
        await addDoc(activityRef, logEntry);
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}

/**
 * Log a page view ONCE per browser session. Uses sessionStorage so it resets when the tab/browser closes.
 * The scraping counter ALWAYS runs — if scraping is detected, a SCRAPING_ALERT is force-written.
 *
 * Flow:
 *   1. Always increment the scraping counter (every navigation).
 *   2. If this specific page hasn't been logged yet this session → write to Firestore (once).
 *   3. If scraping is detected → force-write a SCRAPING_ALERT to Firestore immediately.
 */
export function oncePerSessionLog(action: 'VIEW_PAGE' | 'VIEW_EXCEL', details: string) {
    if (typeof window === 'undefined') return;

    // Step 1: Always count this navigation for scraping detection
    const isScraping = countAndCheckScraping();

    // Step 2: Log the activity ONCE per session for this specific page
    const sessionKey = `logged_${action}_${details}`;
    if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, '1');
        logUserActivity(action, details);
    }

    // Step 3: If scraping detected, force-write an alert (throttled to 1 alert per minute max)
    if (isScraping) {
        const alertKey = 'last_scraping_alert';
        const lastAlert = sessionStorage.getItem(alertKey);
        const now = Date.now();

        if (!lastAlert || now - parseInt(lastAlert, 10) > 60000) {
            sessionStorage.setItem(alertKey, now.toString());
            logUserActivity('SCRAPING_ALERT', `Terdeteksi aktivitas mencurigakan! Kecepatan navigasi sangat tinggi.`, true);
        }
    }
}
