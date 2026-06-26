import inquirer from "inquirer";
import chalk from "chalk";
import figlet from "figlet";
import path from "path";
import { scanCommand } from "./commands/scan.js";
import { bugsCommand } from "./commands/bugs.js";
import { explainCommand } from "./commands/explain.js";
import { doctorCommand } from "./commands/doctor.js";
import { scoreCommand } from "./commands/score.js";
import { petCommand } from "./commands/pet.js";
import { getApiKey } from "./ai/client.js";

// ─── Header ───────────────────────────────────────────────────────────────────

function printHeader(): void {
  console.clear();

  const banner = figlet.textSync("CODEBRAIN", {
    font: "ANSI Shadow",
    horizontalLayout: "default",
  });

  // Manual gradient: cyan → blue
  const lines = banner.split("\n");
  const colors = [
    chalk.hex("#00FFFF"),
    chalk.hex("#00E5FF"),
    chalk.hex("#00CCFF"),
    chalk.hex("#00B3FF"),
    chalk.hex("#0099FF"),
    chalk.hex("#007FFF"),
    chalk.hex("#0066FF"),
  ];

  for (let i = 0; i < lines.length; i++) {
    console.log(colors[Math.min(i, colors.length - 1)](lines[i]));
  }

  const apiKey = getApiKey();
  const aiStatus = apiKey
    ? chalk.green("✔ AI enabled (Claude)")
    : chalk.yellow("⚠  AI disabled");

  console.log(
    chalk.dim("  The ultimate code analysis CLI  ") +
    chalk.dim("v2.0") +
    "  " +
    aiStatus
  );
  console.log(
    chalk.dim("  by ") + chalk.hex("#00CCFF").bold("Isanchezv")
  );
  console.log(chalk.dim("─".repeat(65)));

  if (!apiKey) {
    console.log();
    console.log(chalk.yellow("  🤖 Enable AI mode (Claude) in 2 steps:"));
    console.log();
    console.log(
      chalk.dim("  1. Get your API key at ") +
      chalk.cyan("https://console.anthropic.com")
    );
    console.log();
    console.log(chalk.dim("  2. Set it in your terminal:"));
    console.log();
    console.log(
      chalk.dim("     One session only:   ") +
      chalk.white("export ANTHROPIC_API_KEY=sk-ant-...")
    );
    console.log(
      chalk.dim("     Permanent (zsh):    ") +
      chalk.white("echo 'export ANTHROPIC_API_KEY=sk-ant-...' >> ~/.zshrc && source ~/.zshrc")
    );
    console.log(
      chalk.dim("     Permanent (bash):   ") +
      chalk.white("echo 'export ANTHROPIC_API_KEY=sk-ant-...' >> ~/.bashrc && source ~/.bashrc")
    );
    console.log();
    console.log(
      chalk.dim("  ⚠  Never paste your key inside the code or commit it to git.")
    );
    console.log(chalk.dim("─".repeat(65)));
  }

  console.log();
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

const MENU_CHOICES = [
  {
    name: `${chalk.cyan("⚡ Scan")}         ${chalk.dim("Full project analysis — security, quality, complexity")}`,
    value: "scan",
    short: "Scan",
  },
  {
    name: `${chalk.red("🐛 Bugs")}         ${chalk.dim("Find bugs and vulnerabilities (static + AI)")}`,
    value: "bugs",
    short: "Bugs",
  },
  {
    name: `${chalk.yellow("📊 Score")}        ${chalk.dim("Project health score and grade")}`,
    value: "score",
    short: "Score",
  },
  {
    name: `${chalk.blue("🧠 Explain")}      ${chalk.dim("Understand a file (AI-powered)")}`,
    value: "explain",
    short: "Explain",
  },
  {
    name: `${chalk.green("🩺 Doctor")}       ${chalk.dim("Check project environment and tooling")}`,
    value: "doctor",
    short: "Doctor",
  },
  {
    name: `${chalk.green("🐶 Pet")}       ${chalk.dim("Your virtual coding assistant")}`,
    value: "pet",
    short: "Pet",
  },
  new inquirer.Separator(chalk.dim("─".repeat(50))),
  {
    name: `${chalk.dim("✕ Exit")}`,
    value: "exit",
    short: "Exit",
  },
];

// ─── Main Loop ────────────────────────────────────────────────────────────────

export async function startMenu(): Promise<void> {
  while (true) {
    printHeader();

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: chalk.bold("What do you want to do?"),
        choices: MENU_CHOICES,
        pageSize: 10,
      },
    ]);

    console.log();

    try {
      switch (action) {
        case "scan":
          await scanCommand(".");
          break;

        case "bugs":
          await bugsCommand(".");
          break;

        case "score":
          await scoreCommand(".");
          break;

        case "explain": {
          const { file } = await inquirer.prompt([
            {
              type: "input",
              name: "file",
              message: "File path to explain:",
              validate: (v: string) => v.trim() ? true : "Enter a file path",
            },
          ]);
          await explainCommand(file.trim());
          break;
        }
        case "doctor":
          await doctorCommand();
          break;

        case "pet":
          await petCommand();
          break;

        case "exit":
          console.log(chalk.cyan("\nBye 👋\n"));
          process.exit(0);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("force closed")) {
        // Ctrl+C — go back to menu
        continue;
      }
      console.log(chalk.red("\n" + (e instanceof Error ? e.message : String(e)) + "\n"));
    }

    await inquirer.prompt([
      {
        type: "input",
        name: "_",
        message: chalk.dim("Press Enter to return to menu…"),
      },
    ]);
  }
}
