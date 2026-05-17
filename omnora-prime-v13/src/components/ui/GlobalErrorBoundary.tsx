"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F1113] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#1A1D21] border border-red-500/20 p-8 rounded-sm space-y-6 shadow-2xl">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-sm">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">System Interruption</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Noxis Core safely halted a crash</p>
              </div>
            </div>

            <div className="p-4 bg-black/40 border border-white/5 rounded-sm">
              <p className="text-[10px] font-mono text-red-400/80 leading-relaxed overflow-hidden text-ellipsis">
                {this.state.error?.message || "An unexpected runtime error occurred."}
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-white text-onyx text-[10px] font-black uppercase tracking-widest rounded-sm hover:brightness-90 transition-all flex items-center justify-center space-x-2"
              >
                <RefreshCw size={14} />
                <span>Force Restart System</span>
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full py-3 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-white/10 transition-all flex items-center justify-center space-x-2 border border-white/5"
              >
                <Home size={14} />
                <span>Return to Safety (Dashboard)</span>
              </button>
            </div>

            <p className="text-[8px] text-gray-600 font-bold uppercase text-center tracking-tighter">
              Error reported to Noxis Sentinel Diagnostic Engine
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
