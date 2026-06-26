export type Severity = "critical" | "error" | "warning" | "info" | "hint";
export type Category = "security" | "quality" | "complexity" | "performance" | "style" | "types" | "dead-code" | "dependencies";
export interface Issue {
    file: string;
    line?: number;
    severity: Severity;
    category: Category;
    code: string;
    message: string;
    suggestion?: string;
}
export interface FileStats {
    path: string;
    lines: number;
    blank: number;
    comments: number;
    code: number;
    complexity: number;
    lang: string;
}
export interface ProjectStats {
    files: number;
    totalLines: number;
    codeLines: number;
    commentLines: number;
    langs: Record<string, number>;
    avgComplexity: number;
    largestFile: string;
    mostIssues: string;
}
export interface AnalysisResult {
    issues: Issue[];
    stats: ProjectStats;
    fileStats: FileStats[];
    score: number;
    grade: string;
    duration: number;
}
export interface AIMode {
    mode: "static" | "ai" | "both";
    apiKey?: string;
}
