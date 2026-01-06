import React, { useState, useMemo, useEffect, useRef } from "react";
import { AnalysisMode } from "./lib/types";
import { BACKEND_URL, DEFAULT_MODEL, MONTH_NAMES, DATA_LEGEND, PROMPTS } from "./lib/constants";
import { Logger } from "./lib/logger";
import { initialSanitizerReport, sanitizeGraphTaglog } from "./lib/sanitizer";
import { parseXMLResponse, mergeResults } from "./lib/parser";
import { ProgressBar } from "./components/ProgressBar";
import { GraphView } from "./components/GraphView";
import { DashboardView } from "./components/DashboardView";
import { TimelineView } from "./components/TimelineView";
import { SubtextView } from "./components/SubtextView";

const App = () => {
    const [chunks, setChunks] = useState<any[]>([]);
    const [scope, setScope] = useState<string>("all");
    const [elapsedTime, setElapsedTime] = useState(0);
    const [estimatedRemaining, _setEstimatedRemaining] = useState<number | null>(null);
    const [totalToProcess, setTotalToProcess] = useState(0);
    const timerIntervalRef = useRef<number | null>(null);

    // --- FLIGHT RECORDER STATE ---
    const [rawByChunk, setRawByChunk] = useState<Record<number, string>>({});
    const [mergedRaw, setMergedRaw] = useState<string>("");
    const [sanitizerStats, setSanitizerStats] = useState(initialSanitizerReport);

    // --- DATE GROUPING LOGIC ---
    const monthGroups = useMemo(() => {
        const groups: Record<string, Set<number>> = {};
        let currentYear = 2025; // Base year assumption
        let lastMonth = -1;

        chunks.forEach((chunk, index) => {
            // Regex to find [ID|DD/MM] pattern
            const regex = /\|(\d{1,2})\/(\d{1,2})/g;
            let match;

            while ((match = regex.exec(chunk.text)) !== null) {
                const month = parseInt(match[2]); // 1-12

                // Safety: Ignore invalid months
                if (month < 1 || month > 12) continue;

                // Initialize lastMonth on first valid date found
                if (lastMonth === -1) lastMonth = month;

                // Year Rollover Heuristic
                if (lastMonth >= 10 && month <= 3) {
                    currentYear++;
                }
                // Update tracker
                lastMonth = month;

                // Create Key (YYYY-MM)
                const key = `${currentYear}-${month.toString().padStart(2, '0')}`;
                if (!groups[key]) groups[key] = new Set();
                groups[key].add(index);
            }
        });

        return Object.keys(groups).sort().map(key => {
            const [yearStr, monthStr] = key.split('-');
            const monthIndex = parseInt(monthStr); // 1-12

            // FIX: Subtract 1 because Arrays are 0-indexed
            const monthName = MONTH_NAMES[monthIndex - 1] || "Unknown";

            return {
                key: key,
                label: `${monthName} ${yearStr}`,
                indices: Array.from(groups[key]).sort((a, b) => a - b)
            };
        });
    }, [chunks]);

    const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mode, setMode] = useState<AnalysisMode | null>(null);
    const [masterResult, setMasterResult] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [modelName, _setModelName] = useState(DEFAULT_MODEL);
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);
                setChunks(json.chunks || []);
                setError(null);
            } catch (err) { setError("Invalid JSON"); }
        };
        reader.readAsText(file);
    };

    useEffect(() => {
        if (isProcessing) {
            const startTime = Date.now();
            timerIntervalRef.current = window.setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        } else {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
        return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
    }, [isProcessing]);

    const startAnalysis = async (selectedMode: AnalysisMode) => {
        if (!chunks.length) return;
        setMode(selectedMode);
        setIsProcessing(true);
        setMasterResult(null);
        setCurrentChunkIndex(0);
        setSanitizerStats(initialSanitizerReport); // RESET Stats
        setError(null);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        let currentMaster: any = null;
        let chunksProcessed = 0;

        Logger.log("KERNEL", `Starting Analysis: ${selectedMode.toUpperCase()} | Scope: ${scope}`);

        try {
            // --- SCOPE FILTERING ---
            let targetIndices: number[] = [];
            if (scope === "all") targetIndices = chunks.map((_, i) => i);
            else if (scope === "test-1") targetIndices = [0];
            else if (scope === "test-4") targetIndices = [0, 1, 2, 3].filter(i => i < chunks.length);
            else if (scope.startsWith("month-")) {
                const group = monthGroups.find(g => `month-${g.key}` === scope);
                if (group) targetIndices = group.indices;
            }

            const targetChunks = targetIndices.map(i => chunks[i]);
            setTotalToProcess(targetChunks.length);
            Logger.log("KERNEL", `Scope Filter: ${chunks.length} total -> ${targetChunks.length} target chunks`);

            // --- SEQUENTIAL LOOP ---
            for (const [index, chunk] of targetChunks.entries()) {
                if (controller.signal.aborted) break;

                const chunkId = index + 1;
                Logger.log("KERNEL", `Processing Chunk ${chunkId}/${targetChunks.length}...`);

                // 1. START TIMER
                const stopFetchTimer = Logger.time(`Fetch Chunk ${chunkId}`);

                try {
                    // INJECT ID INTO PROMPT
                    const sysPrompt = `
            ${DATA_LEGEND}
            CONTEXT: Analyzing Chunk #${chunkId}.
            ${PROMPTS[selectedMode]}
            OUTPUT: Valid XML as requested.
          `;

                    // 2. FETCH (Wait for API)
                    const res = await fetch(BACKEND_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        signal: controller.signal,
                        body: JSON.stringify({
                            model: modelName,
                            systemInstruction: sysPrompt,
                            chunkText: chunk.text
                        }),
                    });

                    if (!res.ok) throw new Error(await res.text());
                    const data = await res.json();
                    const text = data.rawOutput || (typeof data === 'string' ? data : JSON.stringify(data));

                    // --- FLIGHT RECORDER UPDATE ---
                    setRawByChunk(prev => ({ ...prev, [chunkId]: text }));
                    setMergedRaw(prev => prev + "\n" + text);

                    stopFetchTimer(); // Log Fetch Success

                    // 3. MERGE PROCESS
                    const stopMergeTimer = Logger.time(`Merge Chunk ${chunkId}`);

                    let chunkResult;

                    // --- GATEKEEPER INTEGRATION ---
                    if (selectedMode === 'graph') {
                        const { result: cleanResult, report } = sanitizeGraphTaglog(text, chunkId, true);

                        // Aggregate Stats
                        setSanitizerStats(prev => ({
                            repairs: prev.repairs + report.repairs,
                            nodes_raw: prev.nodes_raw + report.nodes_raw,
                            edges_raw: prev.edges_raw + report.edges_raw,
                            nodes_kept: prev.nodes_kept + report.nodes_kept,
                            edges_kept: prev.edges_kept + report.edges_kept,
                            nodes_dropped_empty_id: prev.nodes_dropped_empty_id + report.nodes_dropped_empty_id,
                            edges_dropped_missing_endpoint: prev.edges_dropped_missing_endpoint + report.edges_dropped_missing_endpoint,
                            edges_dropped_missing_relation: prev.edges_dropped_missing_relation + report.edges_dropped_missing_relation,
                            edges_dropped_nonexistent_endpoint: prev.edges_dropped_nonexistent_endpoint + report.edges_dropped_nonexistent_endpoint,
                            stub_nodes_created: prev.stub_nodes_created + report.stub_nodes_created
                        }));

                        chunkResult = cleanResult;
                    } else {
                        // Fallback for other modes
                        chunkResult = parseXMLResponse(text, selectedMode);

                        // ID INJECTION for non-graph modes
                        const tagWithChunk = (arr: any[]) => {
                            if (!arr) return [];
                            return arr.map(item => ({ ...item, chunkId: chunkId, foundIn: [chunkId] }));
                        };
                        if (chunkResult.chronology) chunkResult.chronology = tagWithChunk(chunkResult.chronology);
                        if (chunkResult.nodes) chunkResult.nodes = tagWithChunk(chunkResult.nodes);
                        if (chunkResult.edges) chunkResult.edges = tagWithChunk(chunkResult.edges);
                        if (chunkResult.unspokenDynamics) chunkResult.unspokenDynamics = tagWithChunk(chunkResult.unspokenDynamics);
                    }

                    // Merge and Update
                    currentMaster = mergeResults(selectedMode, currentMaster, chunkResult);
                    stopMergeTimer();

                    // Update UI
                    setMasterResult({ ...currentMaster });
                    chunksProcessed++;
                    setCurrentChunkIndex(chunksProcessed);

                } catch (err: any) {
                    console.error(`Chunk failed:`, err);
                    Logger.log("ERROR", `Chunk ${chunkId} Failed: ${err.message}`);
                    // Continue to next chunk
                }
            }


            // --- 4. POST-PROCESSING VALIDATION (CRITICAL) ---
            if (selectedMode === 'graph' && currentMaster) {
                Logger.log("KERNEL", "Running Graph Integrity Check...");
                const nodeList = currentMaster.nodes || [];
                const edgeList = currentMaster.edges || [];

                const nodeIds = new Set(nodeList.map((n: any) => n.id));
                const missingNodes = new Set<string>();

                // Check Edges
                const validEdges = edgeList.filter((e: any) => {
                    const s = e.source;
                    const t = e.target;
                    if (!nodeIds.has(s)) missingNodes.add(s);
                    if (!nodeIds.has(t)) missingNodes.add(t);
                    return true;
                });

                // Create Stubs
                if (missingNodes.size > 0) {
                    Logger.log("KERNEL", `Autogenerating ${missingNodes.size} stub nodes...`);
                    missingNodes.forEach(id => {
                        nodeList.push({
                            id: id,
                            label: id, // Fallback label
                            type: "UNKNOWN",
                            foundIn: [] // Stub has no direct text provenance 
                        });
                    });
                }

                currentMaster = { nodes: nodeList, edges: validEdges };
            }

            // Update UI Final State
            setMasterResult({ ...currentMaster });

        } catch (err: any) {
            if (err.name !== 'AbortError') {
                Logger.log("CRITICAL", err.message);
                setError(err.message);
            }
        } finally {
            setIsProcessing(false);
            Logger.log("KERNEL", "Analysis Process Ended");
        }
    };

    const downloadResult = (format: 'json' | 'xml' = 'json') => {
        if (format === 'json' && masterResult) {
            const blob = new Blob([JSON.stringify(masterResult, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${mode}-analysis.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        if (format === 'xml' && mergedRaw) {
            const blob = new Blob([mergedRaw], { type: "text/xml" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${mode}-raw.xml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Antigravity Analyzer 4.0</h1>
                    <p className="text-slate-400 text-sm">OpenRouter Engine | High-Fidelity Indexing</p>
                </div>
            </header>

            {!isProcessing && !masterResult && (
                <div className="max-w-xl mx-auto bg-slate-800/50 p-8 rounded-xl border border-slate-700 text-center">
                    <input type="file" onChange={handleFileUpload} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white file:font-semibold hover:file:bg-blue-500 mb-6" />

                    {chunks.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-center space-x-3 bg-slate-800/50 p-2 rounded-lg inline-flex mx-auto border border-slate-700 w-full max-w-md">
                                <select value={scope} onChange={(e) => setScope(e.target.value)} className="bg-slate-900 border border-slate-600 text-white text-sm rounded block w-full p-1.5 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="all">All Chunks ({chunks.length})</option>
                                    <option value="test-1">Test Mode: 1 Chunk</option>
                                    <option value="test-4">Test Mode: 4 Chunks</option>
                                    {monthGroups.map((g) => <option key={g.key} value={`month-${g.key}`}>{g.label} ({g.indices.length} chunks)</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => startAnalysis("dashboard")} className="px-4 py-3 bg-slate-700 hover:bg-blue-600 text-white rounded transition border border-slate-600">Dashboard</button>
                                <button onClick={() => startAnalysis("graph")} className="px-4 py-3 bg-slate-700 hover:bg-purple-600 text-white rounded transition border border-slate-600">Knowlege Graph</button>
                                <button onClick={() => startAnalysis("timeline")} className="px-4 py-3 bg-slate-700 hover:bg-orange-600 text-white rounded transition border border-slate-600">Timeline</button>
                                <button onClick={() => startAnalysis("subtext")} className="px-4 py-3 bg-slate-700 hover:bg-red-600 text-white rounded transition border border-slate-600">Subtext</button>
                            </div>
                        </div>
                    )}
                    {error && <div className="mt-4 text-red-400 text-sm">{error}</div>}
                </div>
            )}

            {isProcessing && (
                <div className="max-w-2xl mx-auto py-12 text-center space-y-6 animate-fade-in">
                    <h2 className="text-xl text-white font-medium">Processing Batch...</h2>
                    <ProgressBar
                        current={currentChunkIndex}
                        total={totalToProcess}
                        elapsed={elapsedTime}
                        estimated={estimatedRemaining}
                    />
                    <button onClick={() => abortControllerRef.current?.abort()} className="mt-6 px-4 py-2 bg-red-900/50 text-red-300 rounded border border-red-500/30 hover:bg-red-900/70 transition">Stop Analysis</button>
                </div>
            )}

            {masterResult && !isProcessing && (
                <div className="animate-fade-in">
                    <div className="flex justify-between mb-6 border-b border-slate-700 pb-4">
                        <h2 className="text-2xl font-bold text-white uppercase">{mode} ANALYSIS</h2>
                        <div className="flex gap-4">
                            <button onClick={() => downloadResult('json')} className="text-blue-400 hover:text-blue-300">Download JSON (RAG)</button>
                            <button onClick={() => downloadResult('xml')} className="text-orange-400 hover:text-orange-300">Download Raw XML (Audit)</button>
                            <button onClick={() => { setMasterResult(null); setMode(null); }} className="text-slate-400 hover:text-white">New Analysis</button>
                        </div>
                    </div>

                    {mode === "dashboard" && <DashboardView data={masterResult} />}
                    {mode === "graph" && <GraphView data={masterResult} />}
                    {mode === "timeline" && <TimelineView data={masterResult} />}
                    {mode === "subtext" && <SubtextView data={masterResult} />}
                </div>
            )}

            {/* DEBUG PANEL */}
            <div className="mt-12 bg-black/40 border-t border-slate-800 p-6 rounded-b-xl">
                <details>
                    <summary className="text-slate-500 font-mono text-xs cursor-pointer hover:text-white uppercase tracking-wider">
                        Debug Flight Recorder
                    </summary>
                    <div className="mt-4 grid grid-cols-1 gap-4 font-mono text-[10px] text-slate-400">
                        <div className="bg-slate-900 p-4 rounded border border-slate-700">
                            <h4 className="text-white mb-2">Internal State</h4>
                            <p>Chunks Processed: {currentChunkIndex}</p>
                            <p>Raw Buffer Size: {mergedRaw ? mergedRaw.length : 0} chars</p>
                            <p>Master Nodes: {masterResult?.nodes?.length || 0}</p>
                            <p>Master Edges: {masterResult?.edges?.length || 0}</p>
                        </div>

                        {/* SANITIZER REPORT */}
                        <div className="bg-slate-900 p-4 rounded border border-slate-700 text-orange-300">
                            <h4 className="text-white mb-2">Gatekeeper Report</h4>
                            <p>Repairs: {sanitizerStats.repairs}</p>
                            <p>Nodes Dropped: {sanitizerStats.nodes_dropped_empty_id}</p>
                            <p>Edges Dropped (Endpts): {sanitizerStats.edges_dropped_missing_endpoint}</p>
                            <p>Edges Dropped (Rel): {sanitizerStats.edges_dropped_missing_relation}</p>
                            <p>Stubs Created: {sanitizerStats.stub_nodes_created}</p>
                        </div>

                        <div className="bg-slate-900 p-4 rounded border border-slate-700">
                            <h4 className="text-white mb-2">Last Raw Output (Preview)</h4>
                            <pre className="whitespace-pre-wrap break-all h-48 overflow-y-auto bg-black p-2 rounded text-green-400">
                                {Object.values(rawByChunk).pop() || "Waiting for data..."}
                            </pre>
                        </div>
                    </div>
                </details>
            </div>
        </div>
    );
};

export default App;
