import chalk from "chalk";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// ─── Check Types ──────────────────────────────────────────────────────────────

interface Check {
  name: string;
  group: string;
  ok: boolean;
  message: string;
  suggestion?: string;
  severity: "required" | "recommended" | "optional";
}

function fileExists(p: string): boolean {
  return fs.existsSync(path.resolve(p));
}

function cmdExists(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function cmdVersion(cmd: string): string {
  try {
    return execSync(`${cmd} --version`, { stdio: "pipe" }).toString().trim().split("\n")[0];
  } catch {
    return "not found";
  }
}

function readJson(p: string): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(p), "utf-8"));
  } catch {
    return {};
  }
}

// ─── Build Checks ─────────────────────────────────────────────────────────────

function buildChecks(): Check[] {
  const pkg = readJson("package.json") as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
    dependencies?: Record<string, string>;
    engines?: Record<string, string>;
  };

  const allDeps = {
    ...(pkg.devDependencies ?? {}),
    ...(pkg.dependencies ?? {}),
  };

  const hasScript = (s: string) => !!pkg.scripts?.[s];
  const hasDep = (d: string) => !!allDeps[d];
  const nodeVer = cmdVersion("node");
  const npmVer = cmdVersion("npm");

  return [
    // ── Environment ──────────────────────────────────────────────────────────
    {
      group: "Environment",
      name: "Node.js",
      ok: cmdExists("node"),
      message: `node ${nodeVer}`,
      severity: "required",
    },
    {
      group: "Environment",
      name: "npm / package manager",
      ok: cmdExists("npm") || cmdExists("pnpm") || cmdExists("bun"),
      message: `npm ${npmVer}`,
      severity: "required",
    },
    {
      group: "Environment",
      name: "Git",
      ok: cmdExists("git"),
      message: "git installed",
      severity: "required",
    },

    // ── Project Config ───────────────────────────────────────────────────────
    {
      group: "Project",
      name: "package.json",
      ok: fileExists("package.json"),
      message: "project config exists",
      suggestion: "Run: npm init",
      severity: "required",
    },
    {
      group: "Project",
      name: ".git repository",
      ok: fileExists(".git"),
      message: "git initialized",
      suggestion: "Run: git init",
      severity: "required",
    },
    {
      group: "Project",
      name: ".gitignore",
      ok: fileExists(".gitignore"),
      message: ".gitignore present",
      suggestion: "Create .gitignore to exclude node_modules, .env, dist",
      severity: "recommended",
    },
    {
      group: "Project",
      name: "README.md",
      ok: fileExists("README.md"),
      message: "README present",
      suggestion: "Add a README.md with usage instructions",
      severity: "recommended",
    },

    // ── TypeScript ───────────────────────────────────────────────────────────
    {
      group: "TypeScript",
      name: "tsconfig.json",
      ok: fileExists("tsconfig.json"),
      message: "TypeScript configured",
      suggestion: "Run: npx tsc --init",
      severity: hasDep("typescript") ? "required" : "optional",
    },
    {
      group: "TypeScript",
      name: "strict mode",
      ok: (() => {
        try {
          const tsconfig = readJson("tsconfig.json") as {
            compilerOptions?: { strict?: boolean };
          };
          return !!tsconfig?.compilerOptions?.strict;
        } catch {
          return false;
        }
      })(),
      message: "strict: true in tsconfig",
      suggestion: "Add \"strict\": true to compilerOptions",
      severity: "recommended",
    },

    // ── Security ─────────────────────────────────────────────────────────────
    {
      group: "Security",
      name: ".env in .gitignore",
      ok: (() => {
        if (!fileExists(".gitignore")) return false;
        const content = fs.readFileSync(".gitignore", "utf-8");
        return content.includes(".env");
      })(),
      message: ".env excluded from git",
      suggestion: "Add .env and .env.local to .gitignore",
      severity: "required",
    },
    {
      group: "Security",
      name: ".env file",
      ok: !fileExists(".env") || (() => {
        // If .env exists, warn if it contains real secrets
        const content = fs.readFileSync(".env", "utf-8");
        return !content.match(/[A-Z_]+=.{20,}/);
      })(),
      message: ".env file looks safe",
      suggestion: "Never commit real API keys to .env",
      severity: "recommended",
    },
    {
      group: "Security",
      name: "npm audit",
      ok: (() => {
        try {
          execSync("npm audit --audit-level=critical 2>&1", { stdio: "pipe" });
          return true;
        } catch {
          return false;
        }
      })(),
      message: "no critical vulnerabilities",
      suggestion: "Run: npm audit fix",
      severity: "required",
    },

    // ── Quality Tooling ──────────────────────────────────────────────────────
    {
      group: "Quality",
      name: "ESLint",
      ok: hasDep("eslint") || fileExists(".eslintrc.js") || fileExists(".eslintrc.json"),
      message: "linter configured",
      suggestion: "npm install -D eslint",
      severity: "recommended",
    },
    {
      group: "Quality",
      name: "Prettier",
      ok: hasDep("prettier") || fileExists(".prettierrc") || fileExists(".prettierrc.json"),
      message: "formatter configured",
      suggestion: "npm install -D prettier",
      severity: "recommended",
    },
    {
      group: "Quality",
      name: "test script",
      ok: hasScript("test"),
      message: "test script defined",
      suggestion: "Add \"test\": \"vitest\" or jest to package.json scripts",
      severity: "recommended",
    },
    {
      group: "Quality",
      name: "build script",
      ok: hasScript("build"),
      message: "build script defined",
      severity: "optional",
    },

    // ── CI / Deploy ──────────────────────────────────────────────────────────
    {
      group: "CI/CD",
      name: "GitHub Actions",
      ok: fileExists(".github/workflows"),
      message: "CI/CD configured",
      suggestion: "Create .github/workflows/ci.yml for automated checks",
      severity: "optional",
    },

    // ── Astro ────────────────────────────────────────────────────────────────
    ...(hasDep("astro") || fileExists("astro.config.mjs") || fileExists("astro.config.ts")
      ? [
          {
            group: "Astro",
            name: "astro.config",
            ok: fileExists("astro.config.mjs") || fileExists("astro.config.ts"),
            message: "Astro configured",
            severity: "required" as const,
          },
          {
            group: "Astro",
            name: "src/pages",
            ok: fileExists("src/pages"),
            message: "pages directory exists",
            severity: "required" as const,
          },
        ]
      : []),
  ];
}

// ─── Doctor Command ───────────────────────────────────────────────────────────

export async function doctorCommand(): Promise<void> {
  console.log(chalk.bold.cyan("\n🩺 Codebrain Doctor\n"));

  const checks = buildChecks();
  const groups = [...new Set(checks.map((c) => c.group))];

  let totalIssues = 0;
  let criticalIssues = 0;

  for (const group of groups) {
    const groupChecks = checks.filter((c) => c.group === group);
    console.log(chalk.bold.yellow(`\n  ${group}`));

    for (const check of groupChecks) {
      if (check.ok) {
        const label = chalk.dim(check.severity === "optional" ? "(optional)" : "");
        console.log(`    ${chalk.green("✔")} ${check.name.padEnd(28)} ${chalk.dim(check.message)} ${label}`);
      } else {
        totalIssues++;
        if (check.severity === "required") criticalIssues++;

        const severityTag =
          check.severity === "required"
            ? chalk.red("[required]")
            : check.severity === "recommended"
            ? chalk.yellow("[recommended]")
            : chalk.dim("[optional]");

        console.log(`    ${chalk.red("✗")} ${check.name.padEnd(28)} ${severityTag}`);
        if (check.suggestion) {
          console.log(`      ${chalk.dim("→ " + check.suggestion)}`);
        }
      }
    }
  }

  console.log("\n" + chalk.bold("── Summary ──────────────────────────────────────\n"));

  if (totalIssues === 0) {
    console.log(chalk.green("  ✨ Project is perfectly healthy!\n"));
  } else {
    if (criticalIssues > 0) {
      console.log(chalk.red(`  🚨 ${criticalIssues} required check(s) failing`));
    }
    console.log(chalk.yellow(`  ⚠️  ${totalIssues} total issue(s) to address\n`));
  }
}
