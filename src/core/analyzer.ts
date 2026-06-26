import path from "path";
import type { AnalysisResult, Issue, ProjectStats } from "./types.js";
import { readFilesRecursive, safeRead, getFileStats, relPath } from "./utils.js";
import { scanSecurity } from "../security/rules.js";
import { scanQuality } from "../security/quality.js";

// ─── Score Calculation ────────────────────────────────────────────────────────

const SEVERITY_PENALTY: Record<Issue["severity"], number> = {
  critical: 20,
  error: 10,
  warning: 3,
  info: 0,
  hint: 0,
};

function computeScore(issues: Issue[]): { score: number; grade: string } {
  let score = 100;

  for (const issue of issues) {
    score -= SEVERITY_PENALTY[issue.severity];
  }

  score = Math.max(0, score);

  let grade = "F";
  if (score >= 95) grade = "S";
  else if (score >= 85) grade = "A";
  else if (score >= 75) grade = "B";
  else if (score >= 60) grade = "C";
  else if (score >= 45) grade = "D";

  return { score, grade };
}

// ─── Project Stats ────────────────────────────────────────────────────────────

function buildProjectStats(
  files: string[],
  root: string,
  allIssues: Issue[]
): { stats: ProjectStats; fileStats: ReturnType<typeof getFileStats>[] } {
  const fileStats = files.map(getFileStats);

  const langs: Record<string, number> = {};
  let totalLines = 0;
  let codeLines = 0;
  let commentLines = 0;
  let totalComplexity = 0;

  for (const fs of fileStats) {
    totalLines += fs.lines;
    codeLines += fs.code;
    commentLines += fs.comments;
    totalComplexity += fs.complexity;
    langs[fs.lang] = (langs[fs.lang] ?? 0) + fs.lines;
  }

  const largest = fileStats.sort((a, b) => b.lines - a.lines)[0];
  
  // Count issues per file
  const issueCount: Record<string, number> = {};
  for (const issue of allIssues) {
    issueCount[issue.file] = (issueCount[issue.file] ?? 0) + 1;
  }
  const mostIssuesFile = Object.entries(issueCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

  return {
    stats: {
      files: files.length,
      totalLines,
      codeLines,
      commentLines,
      langs,
      avgComplexity: files.length ? Math.round(totalComplexity / files.length) : 0,
      largestFile: largest ? relPath(largest.path, root) : "",
      mostIssues: mostIssuesFile ? relPath(mostIssuesFile, root) : "",
    },
    fileStats,
  };
}

// ─── Main Analyzer ────────────────────────────────────────────────────────────

export async function analyzeProject(
  dir: string,
  options: {
    security?: boolean;
    quality?: boolean;
    categories?: Issue["category"][];
  } = {}
): Promise<AnalysisResult> {
  const { security = true, quality: checkQuality = true } = options;

  const start = Date.now();
  const files = readFilesRecursive(dir);
  const allIssues: Issue[] = [];

  for (const file of files) {
    const content = safeRead(file);
    if (!content) continue;

    if (security) {
      allIssues.push(...scanSecurity(file, content));
    }
    if (checkQuality) {
      allIssues.push(...scanQuality(file, content));
    }
  }

  // Filter by category if requested
  const filtered =
    options.categories && options.categories.length > 0
      ? allIssues.filter((i) => options.categories!.includes(i.category))
      : allIssues;

  const { stats, fileStats } = buildProjectStats(files, dir, filtered);
  const { score, grade } = computeScore(filtered);

  return {
    issues: filtered,
    stats,
    fileStats,
    score,
    grade,
    duration: Date.now() - start,
  };
}

export type { AnalysisResult, Issue };
