

export const GraphView = ({ data }: { data: any }) => {
    const sortedNodes = (data?.nodes || []).sort((a: any, b: any) => (b.foundIn?.length || 0) - (a.foundIn?.length || 0));
    const edges = data?.edges || [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
            {/* LEFT COL: Top Entities (Nodes) */}
            <div className="md:col-span-1 bg-slate-800/50 border border-slate-700 rounded-xl p-4 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 sticky top-0 bg-slate-900/90 py-2">
                    Core Entities ({sortedNodes.length})
                </h3>
                <div className="space-y-2">
                    {sortedNodes.map((n: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800">
                            <div>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mr-2 uppercase tracking-wide 
                  ${n.type === 'PERSON' ? 'bg-blue-900/50 text-blue-300' :
                                        n.type === 'TOPIC' ? 'bg-purple-900/50 text-purple-300' :
                                            n.type === 'EMOTION' ? 'bg-red-900/50 text-red-300' : 'bg-slate-700 text-slate-300'}`}>
                                    {n.type}
                                </span>
                                <span className="text-slate-200 text-sm font-medium">{n.label}</span>
                            </div>
                            <span className="text-xs text-slate-500 font-mono">
                                {n.foundIn?.length || 0} chunks
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT COL: Intersects (Edges) */}
            <div className="md:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-4 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 sticky top-0 bg-slate-900/90 py-2">
                    Semantic Intersects ({edges.length})
                </h3>
                <div className="space-y-2">
                    {edges.map((e: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded bg-slate-900/30 border border-slate-800/50 hover:border-slate-600 transition-colors group">
                            {/* Chunk Badge */}
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-xs font-mono text-slate-500 border border-slate-700">
                                {e.chunkId}
                            </div>

                            {/* Relationship Flow */}
                            <div className="flex-grow flex items-center gap-2 text-sm">
                                <span className="font-bold text-blue-300">{e.source.replace('per_', '').replace('topic_', '')}</span>

                                <div className="flex flex-col items-center px-2">
                                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{e.relation}</span>
                                    <div className="w-16 h-0.5 bg-slate-700 group-hover:bg-blue-500/50 transition-colors"></div>
                                </div>

                                <span className="font-bold text-purple-300">{e.target.replace('per_', '').replace('topic_', '')}</span>
                            </div>

                            {/* Weight Meter */}
                            <div className="w-16 flex gap-0.5">
                                {[...Array(10)].map((_, idx) => (
                                    <div key={idx} className={`h-1.5 w-full rounded-sm ${idx < (e.weight || 0) ? 'bg-cyan-500' : 'bg-slate-800'}`} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
