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
    '/aws/credentials',
    '/xmlrpc.php',
    '/wp-config.php',
    '/administrator',
    '/.htaccess',
    '/.htpasswd',
    '/server-status',
    '/cgi-bin/',
    '/shell',
];

// 2. High-Risk Payload Regexes (SQLi, XSS, Path Traversal)
// Each pattern is carefully tuned to avoid false positives
export const THREAT_PATTERNS: { type: string; regex: RegExp; label: string }[] = [
    // SQL Injection - tautology and common probes
    { type: 'SQL_INJECTION', regex: /(?:'|%27|"|%22)\s*(?:OR|AND)\s/i, label: "SQLi: OR/AND tautology" },
    { type: 'SQL_INJECTION', regex: /(?:1\s*=\s*1|'='|'=')/i, label: "SQLi: Always-true condition (1=1)" },
    { type: 'SQL_INJECTION', regex: /UNION\s+(ALL\s+)?SELECT/i, label: "SQLi: UNION SELECT" },
    { type: 'SQL_INJECTION', regex: /UNION(%20|\+)+(ALL(%20|\+)+)?SELECT/i, label: "SQLi: UNION SELECT (encoded)" },
    { type: 'SQL_INJECTION', regex: /SELECT\s+.{0,50}\s+FROM\s+\w/i, label: "SQLi: SELECT FROM query" },
    { type: 'SQL_INJECTION', regex: /(?:SLEEP|BENCHMARK|WAITFOR\s+DELAY)\s*\(/i, label: "SQLi: Time-based blind" },
    { type: 'SQL_INJECTION', regex: /@@(?:version|datadir|hostname|basedir)/i, label: "SQLi: Server variable probe" },
    { type: 'SQL_INJECTION', regex: /(?:DROP|ALTER|TRUNCATE|DELETE)(?:\s|%20|\+)+(?:TABLE|FROM|DATABASE)\b/i, label: "SQLi: Destructive query" },
    { type: 'SQL_INJECTION', regex: /(?:INTO\s+(?:OUT|DUMP)FILE|LOAD_FILE\s*\()/i, label: "SQLi: File operation" },
    { type: 'SQL_INJECTION', regex: /(?:information_schema|sysobjects|syscolumns)/i, label: "SQLi: Schema enumeration" },
    { type: 'SQL_INJECTION', regex: /(?:CHAR|CONCAT|CAST|CONVERT)\s*\(.*(?:0x|SELECT)/i, label: "SQLi: Encoded injection" },
    { type: 'SQL_INJECTION', regex: /(?:ORDER\s+BY\s+\d{2,}|GROUP\s+BY\s+\d{2,})/i, label: "SQLi: Column enumeration" },

    // XSS
    { type: 'XSS', regex: /<\s*script[\s>]/i, label: "XSS: Script tag" },
    { type: 'XSS', regex: /on(?:error|load|click|mouseover|focus|blur)\s*=/i, label: "XSS: Event handler" },
    { type: 'XSS', regex: /javascript\s*:/i, label: "XSS: javascript: protocol" },
    { type: 'XSS', regex: /<\s*(?:iframe|object|embed|applet|form|base)\b/i, label: "XSS: Dangerous HTML tag" },
    { type: 'XSS', regex: /(?:%3C|<)\s*(?:svg|img)\s[^>]*(?:on\w+)\s*=/i, label: "XSS: SVG/IMG event injection" },

    // Path Traversal / LFI
    { type: 'PATH_TRAVERSAL', regex: /(?:\.\.\/){2,}/i, label: "LFI: Directory traversal (../)" },
    { type: 'PATH_TRAVERSAL', regex: /(?:%2e%2e(?:%2f|%5c)){2,}/i, label: "LFI: Encoded directory traversal" },
    { type: 'PATH_TRAVERSAL', regex: /\/etc\/(?:passwd|shadow|hosts)/i, label: "LFI: Linux system file access" },
    { type: 'PATH_TRAVERSAL', regex: /(?:c:|C:)(?:\\|%5c)windows/i, label: "LFI: Windows system file access" },

    // Command Injection & RCE
    { type: 'COMMAND_INJECTION', regex: /(?:;|\|\||&&|\n|\r)\s*(?:cat|ls|whoami|id|uname|pwd|wget|curl|nc|bash|sh|php)\b/i, label: "RCE: Command chaining" },
    { type: 'COMMAND_INJECTION', regex: /(?:\beval\b|\bexec\b|\bsystem\b|\bpthru\b|\bpopen\b)\s*\(/i, label: "RCE: Code execution function" },
    { type: 'COMMAND_INJECTION', regex: /(?:cmd|exec|command|run)=.*?(?:whoami|cat|id|uname|wget|curl)/i, label: "RCE: Direct command payload" },
    { type: 'COMMAND_INJECTION', regex: /\$\(\s*(?:cat|ls|whoami|id|uname|pwd)\b/i, label: "RCE: Subshell execution" },
    { type: 'COMMAND_INJECTION', regex: /\|\s*(?:cat|ls|whoami|id|uname|bash|sh)\b/i, label: "RCE: Pipe injection" },

    // SSRF & Cloud Metadata
    { type: 'SSRF', regex: /(?:127\.0\.0\.1|localhost|0\.0\.0\.0|169\.254\.169\.254|metadata\.google\.internal)/i, label: "SSRF: Internal/Cloud IP access" },

    // NoSQL Injection (MongoDB, CouchDB, etc.)
    { type: 'NOSQL_INJECTION', regex: /\{\s*"\$ne"\s*:/i, label: "NoSQLi: $ne operator" },
    { type: 'NOSQL_INJECTION', regex: /\{\s*"\$(?:gt|gte|lt|lte|in|nin)"\s*:/i, label: "NoSQLi: Comparison operator" },
    { type: 'NOSQL_INJECTION', regex: /\$where\s*:/i, label: "NoSQLi: $where clause" },

    // Server-Side Template Injection (SSTI)
    { type: 'SSTI', regex: /\{\{.*(?:config|items|request|session).*\}\}/i, label: "SSTI: Payload injection ({{...}})" },
    { type: 'SSTI', regex: /\$\{(?:jndi|config|sys|env).*?\}/i, label: "SSTI: EL/JNDI injection (${...})" },
    { type: 'SSTI', regex: /<%(?:=|).*(?:java|lang|Runtime|exec).*?%>/i, label: "SSTI: Java/JSP injection" },

    // XML External Entity (XXE)
    { type: 'XXE', regex: /<!ENTITY\s+[^>]+SYSTEM\s+['"]/i, label: "XXE: External system entity" },
    { type: 'XXE', regex: /<!DOCTYPE\s+[^>]+\[/i, label: "XXE: DOCTYPE declaration" },

    // LDAP & XPath Injection
    { type: 'LDAP_INJECTION', regex: /\(\s*\|\s*\(\s*\w+\s*=/i, label: "LDAPi: OR logic injection" },
    { type: 'LDAP_INJECTION', regex: /\*\)\s*\(\s*\w+\s*=\s*\*/i, label: "LDAPi: Wildcard bypass" },
    { type: 'XPATH_INJECTION', regex: /']\s*\||\s*or\s+.*='.*?/i, label: "XPath: OR condition bypass" },

    // Deserialization / Object Injection (PHP, Java)
    { type: 'DESERIALIZATION', regex: /O:\d+:"[^"]+":\d+:/i, label: "PHP Object Injection" },
    { type: 'DESERIALIZATION', regex: /rO0ABX[A-Za-z0-9+/=]+/i, label: "Java Deserialization (Base64 Magic)" },
];

// 3. Known Hacker Tools / Scanners (User-Agents)
// Only flag clearly malicious automated tools, not generic HTTP clients
export const KNOWN_SCANNER_TOOLS: { pattern: string; label: string }[] = [
    // --- SQL & DB Scanners ---
    { pattern: 'sqlmap', label: 'SQLMap (SQL Injection Scanner)' },
    { pattern: 'havij', label: 'Havij (SQL Injection Tool)' },
    { pattern: 'pangolin', label: 'Pangolin (SQL Injection Scanner)' },
    { pattern: 'bsqlbf', label: 'Blind SQL Brute Forcer' },

    // --- Vulnerability Scanners & Proxies ---
    { pattern: 'nikto', label: 'Nikto (Web Vulnerability Scanner)' },
    { pattern: 'zmeu', label: 'ZmEu (Exploit Scanner)' },
    { pattern: 'acunetix', label: 'Acunetix (Vulnerability Scanner)' },
    { pattern: 'nessus', label: 'Nessus (Vulnerability Scanner)' },
    { pattern: 'openvas', label: 'OpenVAS (Vulnerability Scanner)' },
    { pattern: 'w3af', label: 'w3af (Web Attack Framework)' },
    { pattern: 'netsparker', label: 'Netsparker (Web Scanner)' },
    { pattern: 'appscan', label: 'IBM AppScan' },
    { pattern: 'arachni', label: 'Arachni (Web Scanner)' },
    { pattern: 'burp', label: 'Burp Suite (Web Proxy/Scanner)' },
    { pattern: 'zaproxy', label: 'OWASP ZAP (Web Scanner)' },
    { pattern: 'nuclei', label: 'Nuclei (Targeted Vulnerability Scanner)' },
    { pattern: 'qualys', label: 'Qualys WAS' },
    { pattern: 'tenable', label: 'Tenable (Vulnerability Scanner)' },

    // --- Directory & File Bruteforcers ---
    { pattern: 'dirbuster', label: 'DirBuster (Directory Bruteforcer)' },
    { pattern: 'gobuster', label: 'GoBuster (Directory Bruteforcer)' },
    { pattern: 'ffuf', label: 'Ffuf (Fast Web Fuzzer)' },
    { pattern: 'wfuzz', label: 'Wfuzz (Web Fuzzer)' },
    { pattern: 'dirb', label: 'Dirb (Web Content Scanner)' },

    // --- Reconnaissance & Info Gathering ---
    { pattern: 'nmap', label: 'Nmap (Network Scanner)' },
    { pattern: 'masscan', label: 'Masscan (Port Scanner)' },
    { pattern: 'zgrab', label: 'ZGrab (Application Scanner)' },
    { pattern: 'whatweb', label: 'WhatWeb (Nextgen Web Scanner)' },
    { pattern: 'wappalyzer', label: 'Wappalyzer (Tech Profiler)' },
    { pattern: 'amass', label: 'Amass (Network Mapping)' },
    { pattern: 'sublist3r', label: 'Sublist3r (Subdomain Enum)' },

    // --- CMS & Specific Exploits ---
    { pattern: 'wpscan', label: 'WPScan (WordPress Scanner)' },
    { pattern: 'droopescan', label: 'Droopescan (CMS Scanner)' },
    { pattern: 'joomscan', label: 'JoomScan (Joomla Scanner)' },
    { pattern: 'commix', label: 'Commix (Command Injection Tool)' },
    { pattern: 'jbrofuzz', label: 'JBroFuzz (Fuzzer)' },

    // --- Frameworks & Exploitation Bots ---
    { pattern: 'metasploit', label: 'Metasploit (Exploit Framework)' },
    { pattern: 'cobaltstrike', label: 'Cobalt Strike (Threat Emulation)' },
    { pattern: 'empire', label: 'PowerShell Empire' },
    { pattern: 'hydra', label: 'THC-Hydra (Network Bruteforcer)' },
    { pattern: 'patator', label: 'Patator (Bruteforcer)' },

    // --- Generic Automated/Scripting Tools (Often Malicious in large volumes) ---
    // Note: Use caution with generic ones if API clients need them
    { pattern: 'python-requests', label: 'Python Requests (Automated Script)' },
    { pattern: 'go-http-client', label: 'Go HTTP Client (Automated Bot)' },
    { pattern: 'python-urllib', label: 'Python Urllib (Automated Script)' },
    { pattern: 'libwww-perl', label: 'Perl libwww (Automated Script)' },
    { pattern: 'java/', label: 'Java Default Client (Automated Bot)' },
];

// 4. Cloudflare Rule ID to Human Readable (Common Managed Rules)
export const CLOUDFLARE_RULE_MAP: Record<string, string> = {
    '100030': 'SQL Injection',
    '100031': 'SQL Injection (Encoded)',
    '100085': 'XSS (Cross-Site Scripting)',
    '100086': 'XSS (Encoded)',
    '100015': 'Local File Inclusion (LFI)',
    '100035': 'Remote Code Execution (RCE)',
    '100095': 'Directory Traversal',
    '100045': 'Bad Bot / Scraper',
    '100075': 'Known Malicious User-Agent',
};

// --- ANALYSIS ENGINE ---

export interface AttackReport {
    isHackingAttempt: boolean;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    attackType: string;
    attackLabel: string;
    toolUsed: string;
    payloadSnippet: string | null;
    sourceType: 'Browser' | 'Scanner Bot' | 'Script';
}

/**
 * Analyzes a request for malicious activity.
 * Designed for Edge Runtime (no Node.js-only dependencies).
 */
export function analyzeRequest(url: string, userAgent: string, cookies: string = ""): AttackReport {
    const report: AttackReport = {
        isHackingAttempt: false,
        threatLevel: 'LOW',
        attackType: 'Unknown',
        attackLabel: 'Unknown',
        toolUsed: 'Unknown',
        payloadSnippet: null,
        sourceType: 'Browser'
    };

    let path = '';
    let fullQuery = '';

    try {
        const urlObj = new URL(url);
        path = urlObj.pathname;
        fullQuery = urlObj.search;
    } catch {
        // If URL parsing fails, just use the raw string
        path = url;
    }

    const uaLower = userAgent.toLowerCase();

    // --- STEP 1: Check for known scanner tools in User-Agent ---
    for (const tool of KNOWN_SCANNER_TOOLS) {
        if (uaLower.includes(tool.pattern)) {
            report.isHackingAttempt = true;
            report.threatLevel = 'HIGH';
            report.attackType = 'Automated Vulnerability Scan';
            report.attackLabel = tool.label;
            report.toolUsed = tool.label;
            report.sourceType = 'Scanner Bot';
            report.payloadSnippet = `User-Agent: ${userAgent.substring(0, 80)}`;
            break;
        }
    }

    // Determine if it looks like a real browser or a script
    if (!report.isHackingAttempt) {
        const looksLikeBrowser = /mozilla|chrome|safari|firefox|edge|opera/i.test(uaLower);
        if (!looksLikeBrowser && userAgent.length > 0) {
            report.sourceType = 'Script';
        }
        // Set tool to the raw UA (truncated)
        report.toolUsed = userAgent.substring(0, 60) || 'Unknown';
    }

    // --- STEP 2: Check Honeypots (CRITICAL) ---
    const pathLower = path.toLowerCase();
    for (const honeypot of HONEYPOT_PATHS) {
        if (pathLower === honeypot || pathLower.startsWith(honeypot)) {
            report.isHackingAttempt = true;
            report.threatLevel = 'CRITICAL';
            report.attackType = 'Honeypot Trigger';
            report.attackLabel = `Unauthorized file/path access: ${honeypot}`;
            report.payloadSnippet = `Path: ${path}`;
            return report; // Immediate return
        }
    }

    // --- STEP 3: Scan URL Query for attack payloads ---
    // We scan BOTH the decoded AND raw query to catch encoded attacks
    const dataSources: string[] = [];

    // Add decoded version
    try {
        const decoded = decodeURIComponent(fullQuery);
        if (decoded.length > 1) dataSources.push(decoded);
    } catch {
        // decodeURIComponent failed, add raw
    }

    // Also add the raw query as-is (catches doubly-encoded payloads)
    if (fullQuery.length > 1) dataSources.push(fullQuery);

    // Also scan cookies for injected payloads (like XSS in session tokens)
    if (cookies.length > 0) {
        dataSources.push(cookies);
        try {
            dataSources.push(decodeURIComponent(cookies));
        } catch { }
    }

    for (const dataToScan of dataSources) {
        if (report.isHackingAttempt) break;
        for (const pattern of THREAT_PATTERNS) {
            const match = dataToScan.match(pattern.regex);
            if (match) {
                report.isHackingAttempt = true;
                report.threatLevel = 'CRITICAL';
                report.attackType = pattern.type;
                report.attackLabel = pattern.label;
                report.payloadSnippet = match[0].substring(0, 80);
                break;
            }
        }
    }

    // --- STEP 4: Also scan the path itself for payloads (e.g., /api/user/../../etc/passwd) ---
    if (!report.isHackingAttempt) {
        let pathToScan = '';
        try {
            pathToScan = decodeURIComponent(path);
        } catch {
            pathToScan = path;
        }

        for (const pattern of THREAT_PATTERNS) {
            const match = pathToScan.match(pattern.regex);
            if (match) {
                report.isHackingAttempt = true;
                report.threatLevel = 'HIGH';
                report.attackType = pattern.type;
                report.attackLabel = pattern.label;
                report.payloadSnippet = match[0].substring(0, 80);
                break;
            }
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
    if (defaultAction === 'block') return "Cloudflare WAF Block (Unknown Rule)";
    if (defaultAction.includes('challenge')) return "Suspicious Activity (Challenged)";
    return "Unknown Threat";
}
