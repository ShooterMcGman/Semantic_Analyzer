

export const DashboardView = ({ data }: { data: any }) => (
    <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-3">{data?.title || "Report"}</h3>
            <p className="text-slate-300 whitespace-pre-wrap">{data?.executiveSummary}</p>
            <div className="mt-4 space-y-2">
                {(data?.actionItems || []).map((item: string, i: number) => (
                    <div key={i} className="text-sm text-green-400 font-mono">• {item}</div>
                ))}
            </div>
        </div>
    </div>
);
