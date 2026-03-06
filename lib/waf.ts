import { UAParser } from 'ua-parser-js';

// --- DICTIONARIES & PATTERNS ---

// 1. HTTP Request Path Honeypots (Common scanner targets)
export const HONEYPOT_PATHS = [
    '/.env',
    '/.git/config',
    '/.git/',
    '/wp-login.php',
    '/wp-admin',
    '/phpmyadmin',
    '/pma',
    '/admin/db',
    '/config.php',
    '/backup.sql',
    '/database.sql',
    '/etc/passwd',
    '/aws/credentials'
];

// 2. High-Risk Payload Regexes (SQLi, XSS, Path Traversal)
export const THREAT_PATTERNS = [
    { type: 'SQL_INJECTION', regex: /(?:'|%27).*?(?:OR|AND|UNION|SELECT|SLEEP|BENCHMARK|@@version)/i },
    { type: 'SQL_INJECTION', regex: /(--|\#|\/\*).*$/ }, // SQL comments
    { type: 'XSS', regex: /(<|%3C).*?(script|img|svg|iframe|body|on\w+)/i },
    { type: 'XSS', regex: /javascript:/i },
    { type: 'PATH_TRAVERSAL', regex: /(?:\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/i },
    { type: 'COMMAND_INJECTION', regex: /(?:\|\||&&|;|`|\$\(|\r|\n).*?(?:cat|ls|nc|sh|bash|wget|curl|ping)/i }
];

// 3. Known Hacker Tools / Scanners (User-Agents)
export const KNOWN_SCANNER_TOOLS = [
    'sqlmap',
    'nmap',
    'nikto',
    'zmeu',
    'dirbuster',
    'gobuster',
    'burp',
    'postman',
    'curl', // often used for scripting attacks if unexpected
    'python-requests',
    'go-http-client',
    'java/',
    'masscan',
    'acunetix'
];

// 4. Cloudflare Rule ID to Human Readable (Common Rules)
export const CLOUDFLARE_RULE_MAP: Record<string, string> = {
    '100030': 'SQL Injection',
    '100085': 'XSS (Cross-Site Scripting)',
    '100015': 'Local File Inclusion (LFI)',
    '100035': 'Remote Code Execution (RCE)',
    '100095': 'Directory Traversal',
    '100045': 'Bad Bot / Scraper',
    '100075': 'Known Malicious User-Agent'
};

// --- ANALYSIS ENGINE ---

export interface AttackReport {
    isHackingAttempt: boolean;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    attackType: string;
    toolUsed: string;
    payloadSnippet: string | null;
    sourceType: 'Browser' | 'Scanner Bot' | 'Script';
}

/**
 * Analyzes a request for malicious activity
 * @param url The requested URL (including query params)
 * @param userAgent The User-Agent header
 * @param decodedBody The payload/body (if any)
 * @returns AttackReport
 */
export function analyzeRequest(url: string, userAgent: string, decodedBody: string = ''): AttackReport {
    let report: AttackReport = {
        isHackingAttempt: false,
        threatLevel: 'LOW',
        attackType: 'Unknown',
        toolUsed: 'Unknown',
        payloadSnippet: null,
        sourceType: 'Browser'
    };

    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const fullQuery = urlObj.search;
    const uaLower = userAgent.toLowerCase();

    // 1. Parse Tool/Device
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();

    // Check for known scanner tools
    for (const tool of KNOWN_SCANNER_TOOLS) {
        if (uaLower.includes(tool)) {
            report.isHackingAttempt = true;
            report.threatLevel = 'HIGH';
            report.attackType = 'Automated Vulnerability Scan';
            report.toolUsed = tool.toUpperCase();
            report.sourceType = 'Scanner Bot';
            break;
        }
    }

    if (!report.isHackingAttempt && (!browser.name || browser.name === 'Unknown browser')) {
        // Suspicious: No valid browser detected, likely a script
        report.sourceType = 'Script';
    } else if (!report.isHackingAttempt) {
        report.toolUsed = `${browser.name || 'Unknown'} ${browser.version || ''}`.trim();
    }

    // 2. Check Honeypots (CRITICAL threat)
    for (const honeypot of HONEYPOT_PATHS) {
        if (path.toLowerCase().startsWith(honeypot)) {
            report.isHackingAttempt = true;
            report.threatLevel = 'CRITICAL';
            report.attackType = 'Honeypot Trigger (Unauthorized Access Attempt)';
            report.payloadSnippet = `Targeted forbidden file: ${path}`;
            return report; // Immediate return, critical
        }
    }

    // 3. Scan Query Params and Body for Payloads
    const dataToScan = decodeURIComponent(fullQuery + " " + decodedBody);

    for (const pattern of THREAT_PATTERNS) {
        const match = dataToScan.match(pattern.regex);
        if (match) {
            report.isHackingAttempt = true;
            report.threatLevel = 'CRITICAL';
            report.attackType = pattern.type;
            // Extract the exact string that triggered it
            report.payloadSnippet = match[0].substring(0, 50); // Keep first 50 chars of payload
            break;
        }
    }

    return report;
}

/**
 * Translates a Cloudflare Rule ID into a readable attack type
 */
export function getCloudflareAttackType(ruleId: string, defaultAction: string): string {
    if (CLOUDFLARE_RULE_MAP[ruleId]) {
        return CLOUDFLARE_RULE_MAP[ruleId];
    }
    // Fallback if rule unknown
    if (defaultAction === 'block') return "Cloudflare WAF Block (Unknown Rule)";
    if (defaultAction.includes('challenge')) return "Suspicious Activity (Challenged)";
    return "Unknown Threat";
}
