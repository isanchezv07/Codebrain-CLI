import chalk from "chalk";
import ora from "ora";
import path from "path";
import { analyzeProject } from "../core/analyzer.js";
import { formatGrade, printSummaryTable } from "../utils/display.js";
export async function scoreCommand(dir) {
    const absDir = path.resolve(dir);
    console.log(chalk.bold.cyan("\n📊 Project Score\n"));
    const spinner = ora("Analyzing project…").start();
    const result = await analyzeProject(absDir);
    spinner.succeed(`Analyzed ${result.stats.files} files`);
    console.log("\n" + formatGrade(result.score, result.grade));
    // Category scores
    const categories = [
        "security", "quality", "types", "complexity", "performance", "dead-code"
    ];
    console.log(chalk.bold("\n── Category Breakdown ─────────────────────────────\n"));
    for (const cat of categories) {
        const catIssues = result.issues.filter((i) => i.category === cat);
        let catScore = 100;
        for (const i of catIssues) {
            if (i.severity === "critical")
                catScore -= 20;
            else if (i.severity === "error")
                catScore -= 10;
            else if (i.severity === "warning")
                catScore -= 3;
        }
        catScore = Math.max(0, catScore);
        const bar = buildMiniBar(catScore);
        const color = catScore >= 85 ? chalk.green : catScore >= 70 ? chalk.yellow : chalk.red;
        console.log(`  ${cat.padEnd(14)} ${bar} ${color(catScore.toString().padStart(3) + "/100")}  ` +
            chalk.dim(`(${catIssues.length} issues)`));
    }
    printSummaryTable(result, absDir);
    // Top issues to fix
    const topIssues = result.issues
        .filter((i) => i.severity === "critical" || i.severity === "error")
        .slice(0, 10);
    if (topIssues.length > 0) {
        console.log(chalk.bold.red(`\n── Top Issues to Fix ──────────────────────────────\n`));
        for (const issue of topIssues) {
            const rel = issue.file.replace(absDir + "/", "");
            const loc = issue.line ? `:${issue.line}` : "";
            console.log(`  ${chalk.red("•")} ${chalk.bold(issue.code)} — ${issue.message}`);
            console.log(`    ${chalk.dim(rel + loc)}`);
            if (issue.suggestion)
                console.log(`    ${chalk.dim("→ " + issue.suggestion)}`);
            console.log();
        }
    }
}
function buildMiniBar(score) {
    const filled = Math.round(score / 10);
    const empty = 10 - filled;
    const color = score >= 85 ? chalk.green : score >= 70 ? chalk.yellow : chalk.red;
    return color("█".repeat(filled)) + chalk.gray("░".repeat(empty));
}
