import type { Issue } from "../core/types.js";
export declare function aiExplainFile(file: string, content: string, apiKey: string): Promise<string>;
export declare function aiBugAnalysis(files: {
    path: string;
    content: string;
}[], staticIssues: Issue[], apiKey: string): Promise<string>;
export declare function aiCodeReview(file: string, content: string, apiKey: string): Promise<string>;
export declare function aiArchitectureReview(structure: string, stats: string, topIssues: Issue[], apiKey: string): Promise<string>;
export declare function getApiKey(): string | undefined;
export declare function validateApiKey(key: string): Promise<boolean>;
