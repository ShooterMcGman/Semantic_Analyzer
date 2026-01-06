import { AnalysisMode } from "./types";

export const parseXMLResponse = (text: string, mode: AnalysisMode): any => {
    // Helper to extract content between simple tags <tag>Content</tag>
    const getTag = (block: string, tag: string) => {
        const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`, 'i'));
        return match ? match[1].trim() : "";
    };

    try {
        if (mode === 'timeline') {
            const events: any[] = [];
            const matches = text.matchAll(/<event>([\s\S]*?)<\/event>/g);
            for (const match of matches) {
                const block = match[1];
                events.push({
                    timestamp: getTag(block, 'timestamp'),
                    event: getTag(block, 'title'),
                    significance: getTag(block, 'significance'),
                    intensity: parseInt(getTag(block, 'intensity')) || 5, // Default to 5
                    volume: getTag(block, 'volume'),
                    tags: getTag(block, 'tags').split(',').map(t => t.trim()).filter(t => t)
                });
            }
            return { chronology: events };
        }

        if (mode === 'graph') {
            const nodes: any[] = [];
            const edges: any[] = [];

            // Parse Nodes: <node><id>...</id>...</node>
            const nodeMatches = text.matchAll(/<node>([\s\S]*?)<\/node>/g);
            for (const match of nodeMatches) {
                const block = match[1];
                nodes.push({
                    id: getTag(block, 'id'),
                    label: getTag(block, 'label'),
                    type: getTag(block, 'type')
                });
            }

            // Parse Edges: <edge><source>...</source>...</edge>
            const edgeMatches = text.matchAll(/<edge>([\s\S]*?)<\/edge>/g);
            for (const match of edgeMatches) {
                const block = match[1];
                edges.push({
                    source: getTag(block, 'source'),
                    target: getTag(block, 'target'),
                    relation: getTag(block, 'relation'),
                    weight: parseInt(getTag(block, 'weight')) || 1
                });
            }
            return { nodes, edges };
        }

        if (mode === 'dashboard') {
            const actions: string[] = [];
            const actionMatches = text.matchAll(/<action>([\s\S]*?)<\/action>/g);
            for (const match of actionMatches) actions.push(match[1].trim());

            return {
                title: getTag(text, 'title'),
                executiveSummary: getTag(text, 'summary'),
                actionItems: actions
            };
        }

        if (mode === 'subtext') {
            const dynamics: any[] = [];
            const dynMatches = text.matchAll(/<dynamic>([\s\S]*?)<\/dynamic>/g);
            for (const match of dynMatches) {
                const block = match[1];
                dynamics.push({
                    observation: getTag(block, 'observation'),
                    implication: getTag(block, 'implication')
                });
            }
            return {
                scott: { psychologicalState: getTag(text, 'scott_psych') },
                mer: { psychologicalState: getTag(text, 'mer_psych') },
                unspokenDynamics: dynamics
            };
        }
    } catch (e) {
        console.error("XML Parse Error:", e);
        // Return empty structure to prevent crash
        return {};
    }
    return {};
};

export const mergeResults = (mode: AnalysisMode, currentMaster: any, newResult: any) => {
    if (!currentMaster) return newResult;
    if (mode === 'graph') {
        // 1. Merge Nodes (Deduplicate by ID, accumulate 'foundIn' chunks)
        const nodeMap = new Map();
        // Load existing
        (currentMaster.nodes || []).forEach((n: any) => nodeMap.set(n.id, n));

        // Merge new
        (newResult.nodes || []).forEach((newNode: any) => {
            if (nodeMap.has(newNode.id)) {
                const existing = nodeMap.get(newNode.id);
                // Add current chunkId to the list of where this node was found
                const combinedChunks = Array.from(new Set([...(existing.foundIn || []), ...(newNode.foundIn || [])])).sort((a: any, b: any) => a - b);
                existing.foundIn = combinedChunks;
            } else {
                nodeMap.set(newNode.id, newNode);
            }
        });

        // 2. Merge Edges (Just append them, they are unique events per chunk)
        return {
            nodes: Array.from(nodeMap.values()),
            edges: [...(currentMaster.edges || []), ...(newResult.edges || [])]
        };
    }
    if (mode === 'timeline') return { chronology: [...(currentMaster.chronology || []), ...(newResult.chronology || [])] };
    if (mode === 'dashboard') return { ...currentMaster, executiveSummary: currentMaster.executiveSummary + "\n" + newResult.executiveSummary, actionItems: [...(currentMaster.actionItems || []), ...(newResult.actionItems || [])] };
    if (mode === 'subtext') return { scott: newResult.scott, mer: newResult.mer, unspokenDynamics: [...(currentMaster.unspokenDynamics || []), ...(newResult.unspokenDynamics || [])] };
    return newResult;
};
