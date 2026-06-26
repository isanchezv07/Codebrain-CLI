import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import { safeRead, detectLang, getFileStats, estimateComplexity } from "../core/utils.js";
import { scanSecurity } from "../security/rules.js";
import { scanQuality } from "../security/quality.js";
import { formatIssue, SEVERITY_ICON } from "../utils/display.js";
import { aiExplainFile, aiCodeReview, getApiKey } from "../ai/client.js";

export async function explainCommand(file: string): Promise<void> {
  const absFile = path.resolve(file);

  if (!fs.existsSync(absFile)) {
    console.log(chalk.red(`\n❌ File not found: ${absFile}\n`));
    return;
  }

  const content = safeRead(absFile);
  const stats = getFileStats(absFile);
  const lang = detectLang(absFile);
  const rel = path.basename(absFile);

  console.log(chalk.bold.cyan(`\n🧠 Explaining: ${rel}\n`));

  // Static metadata
  console.log(chalk.bold("── File Info ─────────────────────────────────────\n"));
  console.log(`  Language     : ${chalk.cyan(lang)}`);
  console.log(`  Lines        : ${chalk.cyan(stats.lines)} (${stats.code} code, ${stats.comments} comments, ${stats.blank} blank)`);
  console.log(`  Complexity   : ${complexityLabel(stats.complexity)}`);
  console.log(`  Size         : ${chalk.cyan(formatBytes(Buffer.byteLength(content, "utf8")))}`);

  // Functions / exports
  const lines = content.split("\n");
  const exports = extractExports(content, lang);
  const functions = extractFunctions(content);

  if (exports.length > 0) {
    console.log(chalk.bold("\n── Exports ───────────────────────────────────────\n"));
    for (const exp of exports.slice(0, 20)) {
      console.log(`  ${chalk.green("→")} ${exp}`);
    }
  }

  if (functions.length > 0) {
    console.log(chalk.bold("\n── Functions / Methods ───────────────────────────\n"));
    for (const fn of functions.slice(0, 20)) {
      console.log(`  ${chalk.blue("ƒ")} ${fn}`);
    }
  }

  // Static issues for this file
  const secIssues = scanSecurity(absFile, content);
  const qualIssues = scanQuality(absFile, content);
  const allIssues = [...secIssues, ...qualIssues].filter(
    (i) => i.severity === "critical" || i.severity === "error" || i.severity === "warning"
  );

  if (allIssues.length > 0) {
    console.log(chalk.bold(`\n── Static Issues (${allIssues.length}) ───────────────────────────\n`));
    for (const issue of allIssues) {
      console.log(formatIssue(issue, path.dirname(absFile)));
      console.log();
    }
  }

  // AI mode
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log(chalk.dim("\n  💡 Set ANTHROPIC_API_KEY for AI explanation\n"));
    return;
  }

  const { aiMode } = await inquirer.prompt([
    {
      type: "list",
      name: "aiMode",
      message: "AI analysis:",
      choices: [
        { name: "Skip", value: "none" },
        { name: "🧠 Explain — Purpose, structure, how it works", value: "explain" },
        { name: "🔍 Review — Bugs, security, improvements", value: "review" },
        { name: "🔥 Both", value: "both" },
      ],
      default: "explain",
    },
  ]);

  if (aiMode === "none") return;

  if (aiMode === "explain" || aiMode === "both") {
    const spinner = ora("Claude is reading your code…").start();
    try {
      const explanation = await aiExplainFile(rel, content, apiKey);
      spinner.succeed("Explanation ready");
      console.log(chalk.bold.cyan("\n🤖 AI Explanation\n"));
      console.log(explanation);
    } catch (e: unknown) {
      spinner.fail("AI explain failed: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  if (aiMode === "review" || aiMode === "both") {
    const spinner = ora("Claude is reviewing your code…").start();
    try {
      const review = await aiCodeReview(rel, content, apiKey);
      spinner.succeed("Review ready");
      console.log(chalk.bold.yellow("\n🔍 AI Code Review\n"));
      console.log(review);
    } catch (e: unknown) {
      spinner.fail("AI review failed: " + (e instanceof Error ? e.message : String(e)));
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function complexityLabel(n: number): string {
  if (n <= 5) return chalk.green(`${n} (simple)`);
  if (n <= 15) return chalk.yellow(`${n} (moderate)`);
  if (n <= 30) return chalk.red(`${n} (complex)`);
  return chalk.bgRed.white(`${n} (very complex)`);
}

function extractExports(content: string, lang: string): string[] {
  const results: string[] = [];
  const patterns = [
    /^export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+(\w+)/gm,
    /^export\s*\{\s*([^}]+)\s*\}/gm,
    /^module\.exports\s*=\s*\{([^}]+)\}/gm,
  ];
  for (const p of patterns) {
    let m: RegExpExecArray | null;
    while ((m = p.exec(content)) !== null) {
      results.push(m[1].trim());
    }
  }
  return [...new Set(results)];
}

function extractFunctions(content: string): string[] {
  const results: string[] = [];
  const patterns = [
    /(?:async\s+)?function\s+(\w+)\s*\(/g,
    /(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\(/g,
    /(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?(\w+)\s*=>/g,
    /^\s+(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/gm,
  ];
  for (const p of patterns) {
    let m: RegExpExecArray | null;
    while ((m = p.exec(content)) !== null) {
      const name = m[1];
      if (name && !["if", "for", "while", "switch", "catch"].includes(name)) {
        results.push(name);
      }
    }
  }
  return [...new Set(results)];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}
