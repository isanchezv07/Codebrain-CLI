import { type ChalkInstance } from "chalk";
import type { Issue, AnalysisResult } from "../core/types.js";
export declare const SEVERITY_COLOR: Record<Issue["severity"], ChalkInstance>;
export declare const SEVERITY_ICON: Record<Issue["severity"], string>;
export declare const CATEGORY_ICON: Record<Issue["category"], string>;
export declare function formatSeverity(s: Issue["severity"]): string;
export declare function formatIssue(issue: Issue, root: string): string;
export declare function formatGrade(score: number, grade: string): string;
export declare function printSummaryTable(result: AnalysisResult, root: string): void;
interface TreeNode {
    name: string;
    type: "file" | "dir";
    children?: TreeNode[];
}
export declare function buildTree(files: string[], root: string): TreeNode;
export declare function printTree(node: TreeNode, prefix?: string, isLast?: boolean): void;
export {};
