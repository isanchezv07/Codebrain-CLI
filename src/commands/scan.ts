import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { analyzeProject } from "../core/analyzer.js";
import {
  formatIssue,
  formatGrade,
  printSummaryTable,
  buildTree,
  printTree,
  SEVERITY_ICON,
} from "../utils/display.js";
import { readFilesRecursive, safeRead } from "../core/utils.js";
import { aiArchitectureReview, getApiKey } from "../ai/client.js";
import type { Issue } from "../core/types.js";
import path from "path";

export async function scanCommand(dir: string): Promise<void> {
  const absDir = path.resolve(dir);

  console.log(chalk.bold.cyan(`\n⚡ Codebrain Scan — ${absDir}\n`));

  // Ask what to include
  const { categories } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "categories",
      message: "Select analysis categories:",
      choices: [
        { name: "🔐 Security (vulnerabilities, secrets)", value: "security", checked: true },
        { name: "✨ Code quality", value: "quality", checked: true },
        { name: "🏷️  TypeScript types", value: "types", checked: true },
        { name: "⚡ Performance", value: "performance", checked: true },
        { name: "🔀 Complexity", value: "complexity", checked: true },
        { name: "💀 Dead code / TODOs", value: "dead-code", checked: false },
        { name: "🎨 Style", value: "style", checked: false },
      ],
    },
  ]);

  const { minSeverity } = await inquirer.prompt([
    {
      type: "list",
      name: "minSeverity",
      message: "Minimum severity to show:",
      choices: [
        { name: "🔴 Critical only", value: "critical" },
        { name: "🟠 Error and above", value: "error" },
        { name: "🟡 Warning and above", value: "warning" },
        { name: "⚪ Everything (hints too)", value: "hint" },
      ],
      default: "warning",
    },
  ]);

  const spinner = ora({
    text: "Scanning project…",
    color: "cyan",
  }).start();

  const result = await analyzeProject(absDir, {
    categories: categories as Issue["category"][],
  });

  spinner.succeed(
    chalk.green(`Scanned ${result.stats.files} files in ${result.duration}ms`)
  );

  // Filter by severity
  const severityOrder = ["hint", "info", "warning", "error", "critical"];
  const minIdx = severityOrder.indexOf(minSeverity);
  const filtered = result.issues.filter(
    (i) => severityOrder.indexOf(i.severity) >= minIdx
  );

  // Sort: critical first
  filtered.sort(
    (a, b) =>
      severityOrder.indexOf(b.severity) - severityOrder.indexOf(a.severity)
  );

  // Show file tree
  const files = readFilesRecursive(absDir);
  const tree = buildTree(files, absDir);
  console.log(chalk.bold.yellow("\n📁 Project Structure\n"));
  printTree(tree);

  // Score
  console.log("\n");
  console.log(formatGrade(result.score, result.grade));

  // Issues
  if (filtered.length === 0) {
    console.log(chalk.green("\n✅ No issues found in selected categories/severity!\n"));
  } else {
    console.log(
      chalk.bold(`\n── Issues (${filtered.length}) ─────────────────────────────────\n`)
    );

    // Group by file
    const byFile = new Map<string, Issue[]>();
    for (const issue of filtered) {
      if (!byFile.has(issue.file)) byFile.set(issue.file, []);
      byFile.get(issue.file)!.push(issue);
    }

    for (const [file, issues] of byFile) {
      const rel = file.replace(absDir + "/", "");
      const hasCritical = issues.some((i) => i.severity === "critical");
      const header = hasCritical
        ? chalk.bgRed.white.bold(` ${rel} `)
        : chalk.bold(rel);

      console.log(`\n${header}`);
      for (const issue of issues) {
        console.log(formatIssue(issue, absDir));
      }
    }
  }

  // Summary
  printSummaryTable(result, absDir);

  // Optional AI analysis
  const apiKey = getApiKey();
  if (apiKey) {
    const { doAI } = await inquirer.prompt([
      {
        type: "confirm",
        name: "doAI",
        message: "Run AI architecture review? (uses Claude API)",
        default: false,
      },
    ]);

    if (doAI) {
      const aiSpinner = ora("Asking Claude for architecture review…").start();
      try {
        const structure = files
          .slice(0, 50)
          .map((f) => f.replace(absDir + "/", ""))
          .join("\n");

        const statsStr = `Files: ${result.stats.files}, Lines: ${result.stats.totalLines}, ` +
          `Avg complexity: ${result.stats.avgComplexity}, ` +
          `Languages: ${Object.entries(result.stats.langs).map(([l, n]) => `${l}(${n})`).join(", ")}`;

        const review = await aiArchitectureReview(
          structure,
          statsStr,
          result.issues.filter((i) => i.severity === "critical" || i.severity === "error"),
          apiKey
        );
        aiSpinner.succeed("AI review complete");
        console.log(chalk.bold.cyan("\n🤖 AI Architecture Review\n"));
        console.log(review);
      } catch (e: unknown) {
        aiSpinner.fail("AI review failed: " + (e instanceof Error ? e.message : String(e)));
      }
    }
  } else {
    console.log(
      chalk.dim("\n  💡 Set ANTHROPIC_API_KEY to enable AI-powered analysis\n")
    );
  }
}
