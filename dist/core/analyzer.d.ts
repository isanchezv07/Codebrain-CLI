import type { AnalysisResult, Issue } from "./types.js";
export declare function analyzeProject(dir: string, options?: {
    security?: boolean;
    quality?: boolean;
    categories?: Issue["category"][];
}): Promise<AnalysisResult>;
export type { AnalysisResult, Issue };
