

export const ProgressBar = ({ current, total, elapsed, estimated }: { current: number, total: number, elapsed: number, estimated: number | null }) => (
    <div className="w-full max-w-xl mx-auto space-y-2">
        <div className="flex justify-between text-xs text-slate-400 font-mono uppercase tracking-wider">
            <span>Progress</span>
            <span>{Math.round((current / total) * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div className="h-full bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${(current / total) * 100}%` }} />
        </div>
        <div className="flex justify-between text-cyan-400 text-xs font-mono">
            <span>Elapsed: {elapsed}s</span>
            <span>{estimated !== null ? `Est: ${estimated}s left` : "Calculating..."}</span>
        </div>
    </div>
);
