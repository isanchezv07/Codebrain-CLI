import chalk, { type ChalkInstance } from "chalk";
import type { Issue, AnalysisResult } from "../core/types.js";

// ─── Colors ───────────────────────────────────────────────────────────────────

export const SEVERITY_COLOR: Record<Issue["severity"], ChalkInstance> = {
  critical: chalk.bgRed.white.bold,
  error: chalk.red.bold,
  warning: chalk.yellow,
  info: chalk.cyan,
  hint: chalk.gray,
};

export const SEVERITY_ICON: Record<Issue["severity"], string> = {
  critical: "🔴",
  error: "🟠",
  warning: "🟡",
  info: "🔵",
  hint: "⚪",
};

export const CATEGORY_ICON: Record<Issue["category"], string> = {
  security: "🔐",
  quality: "✨",
  complexity: "🔀",
  performance: "⚡",
  style: "🎨",
  types: "🏷️",
  "dead-code": "💀",
  dependencies: "📦",
};

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatSeverity(s: Issue["severity"]): string {
  return SEVERITY_COLOR[s](s.toUpperCase().padEnd(8));
}

export function formatIssue(issue: Issue, root: string): string {
  const rel = issue.file.replace(root + "/", "").replace(root, "");
  const loc = issue.line ? chalk.gray(`:${issue.line}`) : "";
  const icon = SEVERITY_ICON[issue.severity];
  const code = chalk.gray(`[${issue.code}]`);

  const header = `${icon} ${chalk.bold(rel)}${loc} ${code}`;
  const msg = `   ${SEVERITY_COLOR[issue.severity](issue.message)}`;
  const sug = issue.suggestion
    ? `   ${chalk.dim("→")} ${chalk.dim(issue.suggestion)}`
    : "";

  return [header, msg, sug].filter(Boolean).join("\n");
}

// ─── Grade Display ────────────────────────────────────────────────────────────

export function formatGrade(score: number, grade: string): string {
  const bar = buildScoreBar(score);

  const gradeColor =
    grade === "S" || grade === "A"
      ? chalk.green.bold
      : grade === "B"
      ? chalk.blue.bold
      : grade === "C"
      ? chalk.yellow.bold
      : chalk.red.bold;

  const emoji =
    score >= 95 ? "🏆" : score >= 85 ? "🔥" : score >= 75 ? "✅" : score >= 60 ? "⚠️" : "💀";

  return [
    chalk.bold(`Score: ${score}/100  ${bar}  ${emoji}`),
    gradeColor(`Grade: ${grade}`),
  ].join("\n");
}

function buildScoreBar(score: number): string {
  const filled = Math.round(score / 5);
  const empty = 20 - filled;
  const color =
    score >= 85 ? chalk.green : score >= 70 ? chalk.yellow : chalk.red;
  return color("█".repeat(filled)) + chalk.gray("░".repeat(empty));
}

// ─── Summary Table ────────────────────────────────────────────────────────────

export function printSummaryTable(result: AnalysisResult, root: string): void {
  const bySeverity = {
    critical: result.issues.filter((i) => i.severity === "critical").length,
    error: result.issues.filter((i) => i.severity === "error").length,
    warning: result.issues.filter((i) => i.severity === "warning").length,
    hint: result.issues.filter((i) => i.severity === "hint" || i.severity === "info").length,
  };

  const byCategory: Record<string, number> = {};
  for (const issue of result.issues) {
    byCategory[issue.category] = (byCategory[issue.category] ?? 0) + 1;
  }

  console.log(chalk.bold("\n── Summary ──────────────────────────────────────\n"));

  console.log(
    [
      `  ${chalk.bgRed.white(" CRITICAL ")} ${bySeverity.critical}`,
      `  ${chalk.red.bold("ERROR    ")} ${bySeverity.error}`,
      `  ${chalk.yellow("WARNING  ")} ${bySeverity.warning}`,
      `  ${chalk.gray("HINT     ")} ${bySeverity.hint}`,
    ].join("   ")
  );

  console.log(chalk.bold("\n── By Category ──────────────────────────────────\n"));

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sorted) {
    const icon = CATEGORY_ICON[cat as Issue["category"]] ?? "•";
    const bar = "▪".repeat(Math.min(count, 30));
    console.log(
      `  ${icon} ${chalk.bold(cat.padEnd(14))} ${chalk.cyan(count.toString().padStart(3))}  ${chalk.dim(bar)}`
    );
  }

  const s = result.stats;
  console.log(chalk.bold("\n── Project Stats ────────────────────────────────\n"));
  console.log(`  Files analyzed : ${chalk.cyan(s.files)}`);
  console.log(`  Total lines    : ${chalk.cyan(s.totalLines.toLocaleString())}`);
  console.log(`  Code lines     : ${chalk.cyan(s.codeLines.toLocaleString())}`);
  console.log(`  Avg complexity : ${chalk.cyan(s.avgComplexity)}`);
  if (s.largestFile) console.log(`  Largest file   : ${chalk.dim(s.largestFile)}`);
  if (s.mostIssues) console.log(`  Most issues    : ${chalk.dim(s.mostIssues)}`);
  console.log(`  Duration       : ${chalk.dim(result.duration + "ms")}`);

  if (Object.keys(s.langs).length > 0) {
    const topLangs = Object.entries(s.langs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([l, n]) => `${l} (${n} lines)`)
      .join(", ");
    console.log(`  Languages      : ${chalk.dim(topLangs)}`);
  }
}

// ─── File Tree ────────────────────────────────────────────────────────────────

interface TreeNode {
  name: string;
  type: "file" | "dir";
  children?: TreeNode[];
}

export function buildTree(files: string[], root: string): TreeNode {
  const tree: TreeNode = { name: root.split("/").pop() ?? root, type: "dir", children: [] };

  for (const file of files) {
    const rel = file.replace(root, "").replace(/^[/\\]/, "");
    const parts = rel.split(/[/\\]/).filter(Boolean);
    let cur = tree;

    for (let i = 0; i < parts.length; i++) {
      const isFile = i === parts.length - 1;
      cur.children ??= [];
      let node = cur.children.find((c) => c.name === parts[i]);
      if (!node) {
        node = { name: parts[i], type: isFile ? "file" : "dir", children: isFile ? undefined : [] };
        cur.children.push(node);
      }
      if (!isFile && node.type === "dir") cur = node;
    }
  }

  return tree;
}

export function printTree(node: TreeNode, prefix = "", isLast = true): void {
  const connector = isLast ? "└── " : "├── ";
  const icon = node.type === "dir" ? chalk.blue("📁") : chalk.dim("📄");
  const name = node.type === "dir" ? chalk.bold(node.name) : chalk.dim(node.name);

  if (prefix || node.type === "dir") {
    console.log(prefix + (prefix ? connector : "") + icon + " " + name);
  }

  if (node.children) {
    const childPrefix = prefix + (prefix ? (isLast ? "    " : "│   ") : "");
    node.children.forEach((child, i) =>
      printTree(child, childPrefix, i === node.children!.length - 1)
    );
  }
}
