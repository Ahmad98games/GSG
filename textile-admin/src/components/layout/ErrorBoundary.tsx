import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Industrial Vault Uncaught Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#09090b] border border-red-900/20 rounded-lg animate-in zoom-in-95">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-[14px] font-black text-white uppercase italic tracking-widest mb-2">Module Execution Failure</h2>
          <p className="text-[10px] text-zinc-500 font-mono-vault mb-6 max-w-xs text-center uppercase">
            {this.state.error?.message || 'Kernel Panic during view resolution'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <RefreshCw className="w-3 h-3" />
            Restart Node
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
