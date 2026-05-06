import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Antigravity ErrorBoundary caught:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message ?? 'Unknown runtime exception'
      const errorStack = this.state.error?.stack ?? 'No stack trace available.'
      return (
        <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-onyx px-6 py-10 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(54,255,151,0.16),transparent_55%)]" />
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-[0_36px_120px_-48px_rgba(0,0,0,0.8),0_0_90px_-25px_rgba(54,255,151,0.28)] backdrop-blur-xl sm:p-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-toxic/45 bg-toxic/12 shadow-[0_0_48px_-8px_rgba(54,255,151,0.55)]">
              <svg className="h-7 w-7 text-toxic" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.27 0 2.06-1.323 1.47-2.343L14.47 5.343C13.87 4.323 12.38 4.323 11.78 5.343L3.53 16.657C2.94 17.677 3.73 19 5 19z" />
              </svg>
            </div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-toxic/90">Antigravity IDE</p>
            <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Intelligence Interrupt</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
              A transient synchronization issue interrupted the GreenDrive intelligence pipeline. You can safely restart this session.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary-toxic mt-8 rounded-full bg-toxic px-8 py-3 text-sm font-extrabold text-onyx transition hover:bg-white"
            >
              Reconnect Session
            </button>

            <details className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/12 bg-black/35 text-start">
              <summary className="cursor-pointer list-none px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/72">
                Technical details
              </summary>
              <div className="border-t border-white/10 px-4 pb-4 pt-3">
                <p className="mb-3 text-xs font-semibold text-toxic">Message</p>
                <pre className="overflow-auto rounded-lg bg-black/45 p-3 text-[10px] text-white/70">{errorMessage}</pre>
                <p className="mb-3 mt-4 text-xs font-semibold text-toxic">Stack trace</p>
                <pre className="max-h-52 overflow-auto rounded-lg bg-black/45 p-3 text-[10px] text-white/45">{errorStack}</pre>
              </div>
            </details>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
