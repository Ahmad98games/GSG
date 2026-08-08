'use client'
import React, {
  Component, type ReactNode,
  type ErrorInfo,
} from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackRoute?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    console.error('[ErrorBoundary] Caught:', error, errorInfo)
    if (typeof window !== 'undefined' && (window as any).electronAPI?.log) {
      (window as any).electronAPI.log(`[UI ERROR] ${error.message}`)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full min-h-64 p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle size={28} className="text-red-400" />
            </div>

            <h2 className="text-lg font-bold text-white mb-2">
              Something went wrong
            </h2>

            <p className="text-sm text-gray-400 mb-2">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>

            <p className="text-xs text-gray-600 mb-6 font-mono">
              {this.state.errorInfo?.componentStack?.split('\n')[1]?.trim()}
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({
                    hasError: false,
                    error: null,
                    errorInfo: null,
                  })
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#60A5FA] text-black text-sm font-bold hover:bg-blue-400 transition-colors rounded-sm"
              >
                <RefreshCw size={13} />
                Try Again
              </button>

              <button
                onClick={() => {
                  window.location.href = '/dashboard'
                }}
                className="flex items-center gap-2 px-4 py-2 border border-white/10 text-gray-400 text-sm hover:border-white/20 transition-colors rounded-sm"
              >
                <Home size={13} />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
