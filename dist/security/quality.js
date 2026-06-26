import { estimateComplexity } from "../core/utils.js";
// ─── Rules ────────────────────────────────────────────────────────────────────
const QUALITY_RULES = [
    // TypeScript quality
    {
        code: "TS001",
        pattern: /:\s*any\b/g,
        message: "Explicit 'any' type weakens type safety",
        suggestion: "Use unknown, a specific type, or a generic",
        severity: "warning",
        category: "types",
    },
    {
        code: "TS002",
        pattern: /as\s+any\b/g,
        message: "Type cast to 'any'",
        suggestion: "Use a proper type assertion or type guard",
        severity: "warning",
        category: "types",
    },
    {
        code: "TS003",
        pattern: /\/\/\s*@ts-ignore/g,
        message: "@ts-ignore suppresses type errors",
        suggestion: "Fix the underlying type error instead",
        severity: "warning",
        category: "types",
    },
    {
        code: "TS004",
        pattern: /\/\/\s*@ts-nocheck/g,
        message: "@ts-nocheck disables TypeScript for the entire file",
        suggestion: "Fix type errors individually rather than disabling checks",
        severity: "error",
        category: "types",
    },
    // Error handling
    {
        code: "QA001",
        pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
        message: "Empty catch block — errors silently swallowed",
        suggestion: "Log the error or handle it explicitly",
        severity: "error",
        category: "quality",
    },
    {
        code: "QA002",
        pattern: /catch\s*\([^)]*\)\s*\{\s*\/\//g,
        message: "Catch block only has a comment",
        suggestion: "Add actual error handling logic",
        severity: "warning",
        category: "quality",
    },
    {
        code: "QA003",
        pattern: /Promise\s*\.\s*all\s*\(/g,
        check: (content) => content.includes("Promise.all(") && !content.includes(".catch(") && !content.includes("try"),
        message: "Promise.all() without error handling",
        suggestion: "Wrap in try/catch or add .catch() — one rejection fails all",
        severity: "warning",
        category: "quality",
    },
    // Debug leftovers
    {
        code: "QA010",
        pattern: /console\.log\s*\(/g,
        message: "console.log() left in code",
        suggestion: "Remove or replace with a proper logger (pino, winston)",
        severity: "warning",
        category: "style",
    },
    {
        code: "QA011",
        pattern: /console\.error\s*\(\s*(?!new Error)/g,
        message: "console.error() — consider a structured logger",
        suggestion: "Use a structured logger with log levels for production",
        severity: "hint",
        category: "style",
    },
    // Dead code patterns
    {
        code: "DC001",
        pattern: /\/\/\s*TODO(?!\s*:.*(?:auth|security|sanitize|encrypt))/gi,
        message: "Unresolved TODO comment",
        suggestion: "Create a ticket and link it, or resolve it now",
        severity: "hint",
        category: "dead-code",
    },
    {
        code: "DC002",
        pattern: /\/\/\s*FIXME/gi,
        message: "FIXME comment — known broken code",
        suggestion: "This should be prioritized for fixing",
        severity: "warning",
        category: "dead-code",
    },
    {
        code: "DC003",
        pattern: /\/\/\s*HACK/gi,
        message: "HACK comment — fragile or technical debt",
        suggestion: "Document why and plan a proper fix",
        severity: "hint",
        category: "dead-code",
    },
    // Performance
    {
        code: "PERF001",
        pattern: /await\s+Promise\.all\s*\(\s*\[[\s\S]{0,300}\.map\s*\(/g,
        message: "Good: parallel async with Promise.all + map",
        suggestion: "✓ Already using parallel execution pattern",
        severity: "info",
        category: "performance",
    },
    {
        code: "PERF002",
        check: (content, lines) => {
            // Detect sequential awaits inside loops
            return /for\s*\(/.test(content) && /await\s+/.test(content) &&
                lines.some((l, i) => {
                    const block = lines.slice(Math.max(0, i - 3), i + 3).join("\n");
                    return /for\s*\(/.test(block) && /await\s+/.test(block);
                });
        },
        message: "Sequential await inside a loop — potential performance issue",
        suggestion: "Use Promise.all() to parallelize async operations",
        severity: "warning",
        category: "performance",
    },
    // React specific
    {
        code: "RCT001",
        pattern: /useEffect\s*\(\s*(?:async|\(\)\s*=>\s*\{[\s\S]*?await)/g,
        message: "async function directly in useEffect",
        suggestion: "Define async function inside useEffect body, call it there",
        severity: "warning",
        category: "quality",
    },
    {
        code: "RCT002",
        pattern: /key\s*=\s*\{\s*index\s*\}/g,
        message: "Array index used as React key",
        suggestion: "Use a stable unique ID (e.g., item.id) as key",
        severity: "warning",
        category: "quality",
    },
    // File size
    {
        code: "SIZE001",
        check: (_, lines) => lines.length > 400,
        message: (content) => `File has ${content.split("\n").length} lines — too large`,
        suggestion: "Split into smaller, focused modules",
        severity: "warning",
        category: "quality",
    },
    {
        code: "SIZE002",
        check: (_, lines) => lines.length > 800,
        message: (content) => `File has ${content.split("\n").length} lines — critically large`,
        suggestion: "Urgent: decompose into multiple files",
        severity: "error",
        category: "quality",
    },
    // Complexity
    {
        code: "CPLX001",
        check: (content) => estimateComplexity(content) > 20,
        message: (content) => `High cyclomatic complexity (~${estimateComplexity(content)})`,
        suggestion: "Break down complex functions into smaller units",
        severity: "warning",
        category: "complexity",
    },
    {
        code: "CPLX002",
        check: (content) => estimateComplexity(content) > 40,
        message: (content) => `Very high cyclomatic complexity (~${estimateComplexity(content)}) — hard to test`,
        suggestion: "Urgent refactor: extract logic into separate functions",
        severity: "error",
        category: "complexity",
    },
    // Env / config
    {
        code: "ENV001",
        pattern: /process\.env\.[A-Z_]+(?!\s*\?\?|\s*\|\||\s*!)/g,
        message: "process.env access without fallback",
        suggestion: "Add ?? 'default' or validate at startup",
        severity: "hint",
        category: "quality",
    },
];
// ─── Scanner ──────────────────────────────────────────────────────────────────
export function scanQuality(file, content) {
    const issues = [];
    const lines = content.split("\n");
    for (const rule of QUALITY_RULES) {
        if (rule.pattern) {
            const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const upTo = content.slice(0, match.index);
                const lineNum = upTo.split("\n").length;
                const msg = typeof rule.message === "function"
                    ? rule.message(content)
                    : rule.message;
                // Skip info/hint duplicates
                if (rule.severity === "info" && issues.some(i => i.code === rule.code && i.file === file))
                    break;
                issues.push({
                    file,
                    line: lineNum,
                    severity: rule.severity,
                    category: rule.category,
                    code: rule.code,
                    message: msg,
                    suggestion: rule.suggestion,
                });
                if (match.index === pattern.lastIndex)
                    pattern.lastIndex++;
            }
        }
        else if (rule.check) {
            if (rule.check(content, lines)) {
                const msg = typeof rule.message === "function"
                    ? rule.message(content)
                    : rule.message;
                issues.push({
                    file,
                    severity: rule.severity,
                    category: rule.category,
                    code: rule.code,
                    message: msg,
                    suggestion: rule.suggestion,
                });
            }
        }
    }
    return issues;
}
