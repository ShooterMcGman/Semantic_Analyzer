

export const SubtextView = ({ data }: { data: any }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-900/10 border border-blue-500/30 p-4 rounded-xl">
            <h3 className="text-blue-300 font-bold mb-2">Scott</h3>
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{data?.scott?.psychologicalState}</p>
        </div>
        <div className="bg-purple-900/10 border border-purple-500/30 p-4 rounded-xl">
            <h3 className="text-purple-300 font-bold mb-2">Mer</h3>
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{data?.mer?.psychologicalState}</p>
        </div>
    </div>
);
