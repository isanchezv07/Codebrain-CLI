// ─── Rule Registry ────────────────────────────────────────────────────────────
const SECURITY_RULES = [
    // Hardcoded secrets
    {
        code: "SEC001",
        pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"`][^'"`]{4,}/gi,
        message: "Hardcoded password detected",
        suggestion: "Use environment variables or a secrets manager",
        severity: "critical",
    },
    {
        code: "SEC002",
        pattern: /(?:api[_-]?key|apikey|secret[_-]?key)\s*[:=]\s*['"`][A-Za-z0-9_\-]{8,}/gi,
        message: "Hardcoded API key detected",
        suggestion: "Move to .env and add .env to .gitignore",
        severity: "critical",
    },
    {
        code: "SEC003",
        pattern: /(?:sk-|pk-|ghp_|glpat-|xoxb-|AKIA)[A-Za-z0-9_\-]{10,}/g,
        message: "Token/API key pattern detected (OpenAI, GitHub, AWS, etc.)",
        suggestion: "Revoke this key immediately if committed, move to env vars",
        severity: "critical",
    },
    {
        code: "SEC004",
        pattern: /private[_-]?key\s*[:=]\s*['"`][^'"`]{10,}/gi,
        message: "Hardcoded private key",
        suggestion: "Load from environment or secrets vault",
        severity: "critical",
    },
    // Injection risks
    {
        code: "SEC010",
        pattern: /eval\s*\(/g,
        message: "Use of eval() — code injection risk",
        suggestion: "Avoid eval(); use JSON.parse() or safer alternatives",
        severity: "critical",
    },
    {
        code: "SEC011",
        pattern: /new\s+Function\s*\(/g,
        message: "Dynamic Function constructor — code injection risk",
        suggestion: "Avoid dynamic code construction",
        severity: "error",
    },
    {
        code: "SEC012",
        pattern: /child_process\.(exec|execSync)\s*\([^)]*\$\{/g,
        message: "Unsanitized variable in shell exec — command injection risk",
        suggestion: "Use execFile() with argument arrays, never interpolate user input",
        severity: "critical",
    },
    {
        code: "SEC013",
        pattern: /\.innerHTML\s*=/g,
        message: "innerHTML assignment — XSS risk",
        suggestion: "Use textContent or DOMPurify to sanitize HTML",
        severity: "error",
    },
    {
        code: "SEC014",
        pattern: /document\.write\s*\(/g,
        message: "document.write() — XSS risk",
        suggestion: "Use DOM manipulation methods instead",
        severity: "error",
    },
    {
        code: "SEC015",
        pattern: /dangerouslySetInnerHTML/g,
        message: "React dangerouslySetInnerHTML — potential XSS",
        suggestion: "Sanitize input with DOMPurify before using this prop",
        severity: "warning",
    },
    // Crypto / hashing
    {
        code: "SEC020",
        pattern: /createHash\s*\(\s*['"`]md5['"`]\s*\)/g,
        message: "MD5 hashing — weak, broken algorithm",
        suggestion: "Use SHA-256 or bcrypt for passwords",
        severity: "error",
    },
    {
        code: "SEC021",
        pattern: /createHash\s*\(\s*['"`]sha1['"`]\s*\)/g,
        message: "SHA-1 hashing — weak algorithm",
        suggestion: "Use SHA-256 or SHA-512",
        severity: "warning",
    },
    {
        code: "SEC022",
        pattern: /Math\.random\s*\(\s*\)/g,
        message: "Math.random() is not cryptographically secure",
        suggestion: "Use crypto.randomBytes() or crypto.getRandomValues()",
        severity: "warning",
    },
    // Network / HTTP
    {
        code: "SEC030",
        pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/g,
        message: "Non-HTTPS URL — data transmitted in plaintext",
        suggestion: "Use HTTPS for all external requests",
        severity: "warning",
    },
    {
        code: "SEC031",
        pattern: /rejectUnauthorized\s*:\s*false/g,
        message: "SSL certificate verification disabled",
        suggestion: "Never disable certificate verification in production",
        severity: "critical",
    },
    {
        code: "SEC032",
        pattern: /cors\s*\(\s*\{\s*origin\s*:\s*['"]\*['"]/g,
        message: "CORS wildcard origin — any domain can call this API",
        suggestion: "Restrict CORS to known origins",
        severity: "warning",
    },
    // SQL / NoSQL injection
    {
        code: "SEC040",
        pattern: /`\s*SELECT.*\$\{/gi,
        message: "String interpolation in SQL query — SQL injection risk",
        suggestion: "Use parameterized queries or an ORM",
        severity: "critical",
    },
    {
        code: "SEC041",
        pattern: /`\s*(?:INSERT|UPDATE|DELETE|DROP).*\$\{/gi,
        message: "String interpolation in SQL write query — SQL injection risk",
        suggestion: "Use parameterized queries or prepared statements",
        severity: "critical",
    },
    // Path traversal
    {
        code: "SEC050",
        pattern: /readFile(?:Sync)?\s*\([^)]*req\.(body|params|query)/g,
        message: "User-controlled path in file read — path traversal risk",
        suggestion: "Validate and sanitize paths, use path.basename()",
        severity: "critical",
    },
    // Prototype pollution
    {
        code: "SEC060",
        pattern: /Object\.assign\s*\(\s*\{\s*\}/g,
        message: "Object.assign with empty object — possible prototype pollution",
        suggestion: "Use structuredClone() or explicit property copying",
        severity: "hint",
    },
    // Debug/dev leftovers
    {
        code: "SEC070",
        pattern: /(?:debugger)\s*;/g,
        message: "debugger statement in code",
        suggestion: "Remove debugger statements before deploying",
        severity: "warning",
    },
    {
        code: "SEC071",
        pattern: /TODO\s*:.*(?:auth|security|sanitize|encrypt|validate)/gi,
        message: "Unresolved security TODO",
        suggestion: "Address this security concern before shipping",
        severity: "warning",
    },
];
// ─── Scanner ──────────────────────────────────────────────────────────────────
export function scanSecurity(file, content) {
    const issues = [];
    const lines = content.split("\n");
    for (const rule of SECURITY_RULES) {
        // Reset lastIndex for global regexes
        rule.pattern.lastIndex = 0;
        let match;
        const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
        while ((match = pattern.exec(content)) !== null) {
            // Find line number
            const upTo = content.slice(0, match.index);
            const lineNum = upTo.split("\n").length;
            issues.push({
                file,
                line: lineNum,
                severity: rule.severity,
                category: "security",
                code: rule.code,
                message: rule.message,
                suggestion: rule.suggestion,
            });
            // Avoid infinite loop on zero-length matches
            if (match.index === pattern.lastIndex)
                pattern.lastIndex++;
        }
    }
    return issues;
}
