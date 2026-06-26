import fs from "fs";
import path from "path";
// ─── Language Detection ───────────────────────────────────────────────────────
const LANG_MAP = {
    ".ts": "TypeScript",
    ".tsx": "TypeScript (React)",
    ".js": "JavaScript",
    ".jsx": "JavaScript (React)",
    ".mjs": "JavaScript (ESM)",
    ".cjs": "JavaScript (CJS)",
    ".astro": "Astro",
    ".vue": "Vue",
    ".svelte": "Svelte",
    ".py": "Python",
    ".css": "CSS",
    ".scss": "SCSS",
    ".html": "HTML",
    ".json": "JSON",
    ".md": "Markdown",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".env": "Env",
};
const IGNORE_DIRS = new Set([
    "node_modules", ".git", "dist", "build", ".next", ".nuxt",
    ".astro", "coverage", ".turbo", ".cache", "__pycache__", ".venv",
    "venv", ".tox", "target", "vendor",
]);
export const SUPPORTED_EXTENSIONS = new Set([
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".astro", ".vue", ".svelte", ".py", ".css", ".scss",
]);
// ─── File Reading ─────────────────────────────────────────────────────────────
export function readFilesRecursive(dir, exts = SUPPORTED_EXTENSIONS) {
    const results = [];
    function walk(current) {
        let entries;
        try {
            entries = fs.readdirSync(current, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            if (IGNORE_DIRS.has(entry.name))
                continue;
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            }
            else if (exts.has(path.extname(full).toLowerCase())) {
                results.push(full);
            }
        }
    }
    walk(dir);
    return results;
}
export function safeRead(file) {
    try {
        return fs.readFileSync(file, "utf-8");
    }
    catch {
        return "";
    }
}
export function detectLang(file) {
    return LANG_MAP[path.extname(file).toLowerCase()] ?? "Unknown";
}
// ─── File Stats ───────────────────────────────────────────────────────────────
export function getFileStats(file) {
    const content = safeRead(file);
    const lines = content.split("\n");
    let blank = 0;
    let comments = 0;
    let code = 0;
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed)
            blank++;
        else if (trimmed.startsWith("//") ||
            trimmed.startsWith("*") ||
            trimmed.startsWith("/*") ||
            trimmed.startsWith("#")) {
            comments++;
        }
        else {
            code++;
        }
    }
    return {
        path: file,
        lines: lines.length,
        blank,
        comments,
        code,
        complexity: estimateComplexity(content),
        lang: detectLang(file),
    };
}
// ─── Cyclomatic Complexity Estimator ─────────────────────────────────────────
export function estimateComplexity(content) {
    const patterns = [
        /\bif\b/g,
        /\belse\s+if\b/g,
        /\bfor\b/g,
        /\bwhile\b/g,
        /\bswitch\b/g,
        /\bcatch\b/g,
        /\?\s*[^:]/g, // ternary
        /\?\?/g, // nullish coalescing
        /&&/g,
        /\|\|/g,
    ];
    let total = 1; // base complexity
    for (const p of patterns) {
        const matches = content.match(p);
        if (matches)
            total += matches.length;
    }
    return total;
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
export function truncate(str, max) {
    return str.length > max ? str.slice(0, max - 1) + "…" : str;
}
export function relPath(file, root) {
    return path.relative(root, file) || file;
}
export function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes}B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
