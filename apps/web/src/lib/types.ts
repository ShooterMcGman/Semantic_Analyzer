import { Type, Schema } from "@google/genai";

export type AnalysisMode = "dashboard" | "graph" | "timeline" | "subtext";

export type SanitizerReport = {
    repairs: number;
    nodes_raw: number;
    edges_raw: number;
    nodes_kept: number;
    edges_kept: number;
    nodes_dropped_empty_id: number;
    edges_dropped_missing_endpoint: number;
    edges_dropped_missing_relation: number;
    edges_dropped_nonexistent_endpoint: number;
    stub_nodes_created: number;
};

export const dashboardSchema: Schema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, executiveSummary: { type: Type.STRING }, sentimentScore: { type: Type.NUMBER }, sentimentLabel: { type: Type.STRING }, weeklyAnalysis: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { period: { type: Type.STRING }, summary: { type: Type.STRING }, deepDive: { type: Type.STRING }, dominantTheme: { type: Type.STRING } } } }, participants: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, role: { type: Type.STRING }, coreDesire: { type: Type.STRING }, communicationStyle: { type: Type.STRING } } } }, actionItems: { type: Type.ARRAY, items: { type: Type.STRING } } } };
export const graphSchema: Schema = { type: Type.OBJECT, properties: { nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, label: { type: Type.STRING }, type: { type: Type.STRING }, foundIn: { type: Type.ARRAY, items: { type: Type.NUMBER } } } } }, edges: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: { type: Type.STRING }, target: { type: Type.STRING }, relation: { type: Type.STRING }, weight: { type: Type.NUMBER }, chunkId: { type: Type.NUMBER } } } } } };
export const timelineSchema: Schema = { type: Type.OBJECT, properties: { chronology: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { timestamp: { type: Type.STRING }, event: { type: Type.STRING }, significance: { type: Type.STRING }, tags: { type: Type.ARRAY, items: { type: Type.STRING } } } } } } };
export const subtextSchema: Schema = { type: Type.OBJECT, properties: { scott: { type: Type.OBJECT, properties: { psychologicalState: { type: Type.STRING }, attachmentStyle: { type: Type.STRING }, triggers: { type: Type.ARRAY, items: { type: Type.STRING } } } }, mer: { type: Type.OBJECT, properties: { psychologicalState: { type: Type.STRING }, attachmentStyle: { type: Type.STRING }, triggers: { type: Type.ARRAY, items: { type: Type.STRING } } } }, unspokenDynamics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { observation: { type: Type.STRING }, implication: { type: Type.STRING }, evidence: { type: Type.STRING } } } } } };
