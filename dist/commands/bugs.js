import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import path from "path";
import { analyzeProject } from "../core/analyzer.js";
import { readFilesRecursive, safeRead } from "../core/utils.js";
import { formatIssue } from "../utils/display.js";
import { aiBugAnalysis, getApiKey } from "../ai/client.js";
export async function bugsCommand(dir) {
    const absDir = path.resolve(dir);
    console.log(chalk.bold.red("\n🐛 Bug Report\n"));
    const apiKey = getApiKey();
    const { mode } = await inquirer.prompt([
        {
            type: "list",
            name: "mode",
            message: "Analysis mode:",
            choices: [
                { name: "⚡ Static — Fast, rules-based (no API key needed)", value: "static" },
                ...(apiKey
                    ? [
                        { name: "🤖 AI — Claude deep analysis", value: "ai" },
                        { name: "🔥 Both — Static + AI combined", value: "both" },
                    ]
                    : [
                        {
                            name: chalk.dim("🤖 AI — Set ANTHROPIC_API_KEY to enable"),
                            value: "ai",
                            disabled: true,
                        },
                    ]),
            ],
            default: "static",
        },
    ]);
    const spinner = ora("Running static analysis…").start();
    const result = await analyzeProject(absDir, {
        security: true,
        quality: true,
    });
    // Only show real issues (not hints/info)
    const bugs = result.issues.filter((i) => i.severity === "critical" ||
        i.severity === "error" ||
        i.severity === "warning");
    bugs.sort((a, b) => {
        const order = ["critical", "error", "warning"];
        return order.indexOf(a.severity) - order.indexOf(b.severity);
    });
    spinner.succeed(`Static analysis: ${chalk.red(bugs.filter(i => i.severity === "critical").length + " critical")}, ` +
        `${chalk.yellow(bugs.filter(i => i.severity === "error").length + " errors")}, ` +
        `${chalk.dim(bugs.filter(i => i.severity === "warning").length + " warnings")}`);
    if (mode === "static" || mode === "both") {
        if (bugs.length === 0) {
            console.log(chalk.green("\n✅ No bugs found by static analysis!\n"));
        }
        else {
            // Group critical/error separately
            const critical = bugs.filter((i) => i.severity === "critical");
            const errors = bugs.filter((i) => i.severity === "error");
            const warnings = bugs.filter((i) => i.severity === "warning");
            if (critical.length > 0) {
                console.log(chalk.bgRed.white.bold(`\n🚨 CRITICAL (${critical.length}) — Fix immediately\n`));
                for (const issue of critical) {
                    console.log(formatIssue(issue, absDir));
                    console.log();
                }
            }
            if (errors.length > 0) {
                console.log(chalk.red.bold(`\n❌ Errors (${errors.length})\n`));
                for (const issue of errors) {
                    console.log(formatIssue(issue, absDir));
                    console.log();
                }
            }
            if (warnings.length > 0) {
                console.log(chalk.yellow(`\n⚠️  Warnings (${warnings.length})\n`));
                for (const issue of warnings) {
                    console.log(formatIssue(issue, absDir));
                    console.log();
                }
            }
        }
    }
    if ((mode === "ai" || mode === "both") && apiKey) {
        const aiSpinner = ora("Claude is analyzing your code…").start();
        try {
            const files = readFilesRecursive(absDir);
            // Pick most important files: largest, most issues, entry points
            const issueFiles = new Set(bugs.map((b) => b.file));
            const prioritized = [
                ...files.filter((f) => issueFiles.has(f)),
                ...files.filter((f) => !issueFiles.has(f)),
            ].slice(0, 8);
            const fileContents = prioritized.map((f) => ({
                path: f.replace(absDir + "/", ""),
                content: safeRead(f),
            }));
            const review = await aiBugAnalysis(fileContents, bugs, apiKey);
            aiSpinner.succeed("AI analysis complete");
            console.log(chalk.bold.cyan("\n🤖 Claude Bug Analysis\n"));
            console.log(review);
        }
        catch (e) {
            aiSpinner.fail("AI analysis failed: " + (e instanceof Error ? e.message : String(e)));
        }
    }
    // Final stats
    console.log(chalk.bold(`\n── Stats ────────────────────────────────────────\n` +
        `  Files: ${result.stats.files}  │  ` +
        `Total issues: ${bugs.length}  │  ` +
        `Score: ${result.score}/100 (${result.grade})\n`));
}
