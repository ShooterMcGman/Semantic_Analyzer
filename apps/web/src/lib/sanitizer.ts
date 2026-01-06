import { SanitizerReport } from "./types";

export const initialSanitizerReport: SanitizerReport = {
    repairs: 0,
    nodes_raw: 0, edges_raw: 0,
    nodes_kept: 0, edges_kept: 0,
    nodes_dropped_empty_id: 0,
    edges_dropped_missing_endpoint: 0,
    edges_dropped_missing_relation: 0,
    edges_dropped_nonexistent_endpoint: 0,
    stub_nodes_created: 0
};



export const repairCommonTagMistakes = (text: string): { text: string, repairs: number } => {
    let repairs = 0;
    let out = text;

    // Fix: <target>VAL</source> or </parameter> etc. => </target>
    const patterns = [
        { re: /<target>\s*([^<]{1,500}?)\s*<\/(?:source|parameter|targe|traget|taget)>/gi, rep: "<target>$1</target>" },
        { re: /<source>\s*([^<]{1,500}?)\s*<\/(?:target|parameter)>/gi, rep: "<source>$1</source>" },
        { re: /<relation>\s*([^<]{1,500}?)\s*<\/(?:relations|rel)>/gi, rep: "<relation>$1</relation>" },
    ];

    for (const p of patterns) {
        // Count replacements
        const matches = out.match(p.re);
        if (matches) repairs += matches.length;
        out = out.replace(p.re, p.rep);
    }
    return { text: out, repairs };
};

export const sanitizeGraphTaglog = (rawText: string, chunkId: number, autoStub: boolean = true) => {
    // 1. Repair
    const { text: repaired, repairs } = repairCommonTagMistakes(rawText);
    const report: SanitizerReport = { ...initialSanitizerReport, repairs };

    // 2. Tolerant Extraction (Scope to <chunk> if possible, or simple fallback)
    // We assume the caller passes the whole raw text which usually contains one chunk


    const edgesOut: any[] = [];
    const nodeMap = new Map<string, any>();

    // Helper
    const getTag = (block: string, tag: string) => {
        const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`, 'i'));
        return match ? match[1].trim() : "";
    };

    // Extract Nodes
    const nodeMatches = repaired.matchAll(/<node>([\s\S]*?)<\/node>/gi);
    for (const match of nodeMatches) {
        report.nodes_raw++;
        const block = match[1];
        const id = getTag(block, 'id');
        if (!id) {
            report.nodes_dropped_empty_id++;
            continue;
        }

        // Upsert logic (in case duplicates in same chunk)
        if (!nodeMap.has(id)) {
            nodeMap.set(id, {
                id,
                label: getTag(block, 'label') || id,
                type: getTag(block, 'type') || "UNKNOWN",
                foundIn: [chunkId]
            });
        }
    }

    // Extract Edges
    const edgeMatches = repaired.matchAll(/<edge>([\s\S]*?)<\/edge>/gi);
    for (const match of edgeMatches) {
        report.edges_raw++;
        const block = match[1];
        const source = getTag(block, 'source');
        const target = getTag(block, 'target');
        const relation = getTag(block, 'relation');
        let weight = parseInt(getTag(block, 'weight')) || 1;
        if (weight < 1) weight = 1;
        if (weight > 10) weight = 10;

        if (!source || !target) {
            report.edges_dropped_missing_endpoint++;
            continue;
        }
        if (!relation) {
            report.edges_dropped_missing_relation++;
            // Optional: could continue if we want to tolerate missing relations, but strict is better
            continue;
        }

        edgesOut.push({ source, target, relation, weight, chunkId });
    }

    // 3. Enforce Invariants
    const finalEdges: any[] = [];

    for (const edge of edgesOut) {
        let sExists = nodeMap.has(edge.source);
        let tExists = nodeMap.has(edge.target);

        if (!sExists || !tExists) {
            if (autoStub) {
                if (!sExists) {
                    nodeMap.set(edge.source, { id: edge.source, label: edge.source, type: "UNKNOWN", foundIn: [] }); // Stub
                    report.stub_nodes_created++;
                    sExists = true;
                }
                if (!tExists) {
                    nodeMap.set(edge.target, { id: edge.target, label: edge.target, type: "UNKNOWN", foundIn: [] }); // Stub
                    report.stub_nodes_created++;
                    tExists = true;
                }
                finalEdges.push(edge);
            } else {
                report.edges_dropped_nonexistent_endpoint++;
            }
        } else {
            finalEdges.push(edge);
        }
    }

    report.nodes_kept = nodeMap.size;
    report.edges_kept = finalEdges.length;

    return {
        result: {
            nodes: Array.from(nodeMap.values()),
            edges: finalEdges
        },
        cleanedText: repaired,
        report
    };
};
