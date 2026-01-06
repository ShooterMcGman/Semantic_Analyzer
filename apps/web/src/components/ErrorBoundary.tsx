import { Component, ErrorInfo, ReactNode } from "react";

type ErrorBoundaryProps = {
    children: ReactNode;
};

type ErrorBoundaryState = {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("React Crash:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-slate-900 text-red-400 font-mono h-screen overflow-auto">
                    <h1 className="text-2xl font-bold mb-4">⚠️ CRITICAL RENDER ERROR</h1>
                    <div className="bg-slate-800 p-4 rounded border border-red-500/50 mb-4">
                        <h2 className="text-xl text-white mb-2">{this.state.error?.toString()}</h2>
                        <details className="whitespace-pre-wrap text-sm text-slate-400 cursor-pointer">
                            <summary className="mb-2 text-blue-400">View Stack Trace</summary>
                            {this.state.errorInfo?.componentStack}
                        </details>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
                    >
                        Reload Application
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
