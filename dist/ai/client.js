// ─── Claude API Client ────────────────────────────────────────────────────────
const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";
async function callClaude(systemPrompt, userPrompt, apiKey) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: MODEL,
            max_tokens: 2048,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
        }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Claude API error ${res.status}: ${err}`);
    }
    const data = await res.json();
    return data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
}
// ─── AI Explain ───────────────────────────────────────────────────────────────
export async function aiExplainFile(file, content, apiKey) {
    const system = `You are an expert code reviewer. Analyze code files and provide clear, actionable insights.
Respond in the same language the user writes in (if in Spanish, respond in Spanish).
Be concise but thorough. Use markdown formatting.`;
    const prompt = `Analyze this file: ${file}

\`\`\`
${content.slice(0, 6000)}
\`\`\`

Provide:
1. **Purpose** — What this file does (2-3 sentences)
2. **Key exports/functions** — List main exports with brief descriptions
3. **Architecture notes** — How it fits in the codebase
4. **Potential issues** — Any bugs, edge cases, or improvements
5. **Quality rating** — 1-10 with justification`;
    return callClaude(system, prompt, apiKey);
}
// ─── AI Bug Analysis ──────────────────────────────────────────────────────────
export async function aiBugAnalysis(files, staticIssues, apiKey) {
    const system = `You are a senior software engineer and security expert. 
Find real bugs, security vulnerabilities, and logic errors.
Be direct and actionable. Prioritize by severity.
Respond in Spanish if the codebase uses Spanish comments/names.`;
    const filesSummary = files
        .slice(0, 5) // limit to avoid token overflow
        .map((f) => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 1500)}\n\`\`\``)
        .join("\n\n");
    const staticSummary = staticIssues
        .filter((i) => i.severity === "critical" || i.severity === "error")
        .slice(0, 20)
        .map((i) => `- [${i.code}] ${i.file}:${i.line ?? "?"} — ${i.message}`)
        .join("\n");
    const prompt = `Review this codebase for bugs and vulnerabilities.

Static analysis found these critical/error issues:
${staticSummary || "None detected"}

Code files:
${filesSummary}

Find:
1. **Logic bugs** — Incorrect behavior, off-by-one, null derefs
2. **Security vulnerabilities** — Beyond what static analysis caught
3. **Race conditions** — Async/concurrent issues
4. **Data validation gaps** — Missing input validation
5. **Quick wins** — Easy fixes with high impact

For each finding: file, line (if known), severity, explanation, fix.`;
    return callClaude(system, prompt, apiKey);
}
// ─── AI Code Review ───────────────────────────────────────────────────────────
export async function aiCodeReview(file, content, apiKey) {
    const system = `You are a principal engineer doing a thorough code review.
Focus on correctness, maintainability, and best practices.
Be direct. Give specific, actionable feedback.`;
    const prompt = `Code review for: ${file}

\`\`\`
${content.slice(0, 8000)}
\`\`\`

Review:
1. **Correctness** — Bugs, edge cases, error handling
2. **Security** — Vulnerabilities specific to this code
3. **Performance** — Bottlenecks, unnecessary operations
4. **Maintainability** — Readability, naming, structure
5. **Testing** — What tests are missing
6. **Refactor suggestions** — Specific improvements with code examples`;
    return callClaude(system, prompt, apiKey);
}
// ─── AI Architecture Review ───────────────────────────────────────────────────
export async function aiArchitectureReview(structure, stats, topIssues, apiKey) {
    const system = `You are a software architect. Analyze project structure and provide strategic advice.
Focus on scalability, maintainability, and best practices for the detected stack.`;
    const issuesSummary = topIssues
        .slice(0, 15)
        .map((i) => `- [${i.severity.toUpperCase()}] ${i.category}: ${i.message}`)
        .join("\n");
    const prompt = `Analyze this project architecture.

Project structure:
${structure}

Stats:
${stats}

Top issues found:
${issuesSummary}

Provide:
1. **Architecture assessment** — Strengths and weaknesses
2. **Tech stack observations** — Framework/library choices
3. **Structural improvements** — How to reorganize
4. **Missing concerns** — Testing, CI/CD, monitoring, etc.
5. **Roadmap** — Prioritized action items`;
    return callClaude(system, prompt, apiKey);
}
// ─── API Key Management ───────────────────────────────────────────────────────
export function getApiKey() {
    return process.env.ANTHROPIC_API_KEY;
}
export async function validateApiKey(key) {
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 5,
                messages: [{ role: "user", content: "hi" }],
            }),
        });
        return res.status !== 401;
    }
    catch {
        return false;
    }
}
