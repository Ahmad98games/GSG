"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldCheck, RefreshCw, Home, Copy, Check, LifeBuoy } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class NoxisErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // 1. Silent diagnostic console log
    console.error("[NoxisErrorBoundary] Caught handled component error:", error, errorInfo);

    // 2. Log to Electron logs if running in desktop environment
    try {
      if (typeof window !== "undefined") {
        const electronApi = (window as any).electronAPI || (window as any).electronWindow;
        if (electronApi?.logError) {
          electronApi.logError({
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            time: new Date().toISOString(),
          });
        }
      }
    } catch {}
  }

  private handleCopyDetails = async () => {
    const errorDetails = [
      `--- NOXIS ERROR REPORT ---`,
      `Time: ${new Date().toISOString()}`,
      `URL: ${typeof window !== "undefined" ? window.location.href : "unknown"}`,
      `Message: ${this.state.error?.message || "Unknown error"}`,
      `Stack: ${this.state.error?.stack || "No stack trace"}`,
      `Component Stack: ${this.state.errorInfo?.componentStack || "No component stack"}`,
    ].join("\n");

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(errorDetails);
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      }
    } catch (err) {
      console.warn("Failed to copy error report to clipboard:", err);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-[360px] flex-1 flex items-center justify-center p-6 bg-[#0B0E14] select-none text-slate-200">
          <div className="max-w-md w-full bg-[#131722] border border-white/10 rounded-md p-8 shadow-2xl text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={28} strokeWidth={1.75} />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-semibold tracking-tight text-white">
                Something went wrong on this page.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your data is completely safe. The issue has been contained and logged automatically.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full h-10 px-4 rounded-md bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.href = "/dashboard";
                  }
                }}
                className="w-full h-10 px-4 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Home size={14} />
                <span>Go to Dashboard</span>
              </button>

              <button
                type="button"
                onClick={this.handleCopyDetails}
                className="w-full h-9 px-3 rounded-md text-[11px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {this.state.copied ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Error Details Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Report Issue</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NoxisErrorBoundary;

