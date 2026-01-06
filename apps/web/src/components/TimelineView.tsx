

export const TimelineView = ({ data }: { data: any }) => (
    <div className="space-y-4 max-w-4xl mx-auto">
        <div className="relative border-l-2 border-slate-700 ml-4 pl-8 py-4 space-y-8">
            {(data?.chronology || []).map((ev: any, i: number) => (
                <div key={i} className="relative bg-slate-800/40 p-4 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-colors group">

                    {/* Timeline Dot (Color-coded by Tag) */}
                    <div className={`absolute -left-[41px] top-6 w-5 h-5 rounded-full border-4 border-slate-900 ${(ev.tags || []).includes('Conflict') ? 'bg-red-500' :
                        (ev.tags || []).includes('Intimacy') ? 'bg-purple-500' :
                            (ev.tags || []).includes('Decision') ? 'bg-green-500' : 'bg-blue-500'
                        }`} />

                    {/* Header Row */}
                    <div className="flex flex-wrap gap-2 justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {ev.timestamp}
                            </span>
                            <h3 className="text-slate-200 font-bold text-sm">{ev.event}</h3>
                        </div>

                        {/* Tags Row */}
                        <div className="flex gap-1">
                            {(ev.tags || []).map((tag: string, t: number) => (
                                <span key={t} className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/30">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-slate-300 leading-relaxed border-l-2 border-slate-700 pl-3 group-hover:border-blue-500/50 transition-colors">
                        {ev.significance}
                    </p>

                </div>
            ))}
        </div>
    </div>
);
