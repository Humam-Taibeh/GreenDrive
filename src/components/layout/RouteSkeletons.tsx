/** Premium-looking route fallbacks while lazy chunks resolve */

function ShimmerBar({ className }: { className?: string }) {
  return <div className={`gd-skeleton-bar rounded-lg ${className ?? ''}`} />
}

export function LandingRouteSkeleton() {
  return (
    <div
      className="min-h-[100dvh] min-h-svh bg-[#f5faf8] px-4 pt-[calc(env(safe-area-inset-top,0px)+5.5rem)] pb-16 dark:bg-[#000000] sm:px-8 lg:px-12"
      aria-hidden
    >
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="max-w-3xl space-y-4">
          <ShimmerBar className="h-3 w-40" />
          <ShimmerBar className="h-14 w-full max-w-xl sm:h-16" />
          <ShimmerBar className="h-6 w-full max-w-lg" />
          <ShimmerBar className="h-6 w-full max-w-md" />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <ShimmerBar className="h-14 w-full max-w-[220px] rounded-full sm:h-12" />
          <ShimmerBar className="h-14 w-full max-w-[200px] rounded-full sm:h-12" />
        </div>
      </div>
    </div>
  )
}

/** Near-instant handoff when /map chunk is already prefetched (avoids layout thrash) */
export function MapRouteSkeleton() {
  return (
    <div className="min-h-svh bg-zinc-100 dark:bg-onyx" aria-hidden>
      {/* Header Skeleton */}
      <div className="h-16 border-b border-black/10 bg-white/40 dark:border-white/10 dark:bg-white/[0.02]" />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px] sm:px-6">
        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <ShimmerBar className="h-8 w-48" />
            <ShimmerBar className="h-4 w-32" />
          </div>
          <ShimmerBar className="h-4 w-3/4" />
          {/* Location Input area */}
          <div className="h-48 rounded-3xl bg-white/40 dark:bg-white/[0.02] p-4 space-y-4">
            <ShimmerBar className="h-12 w-full" />
            <ShimmerBar className="h-12 w-full" />
            <ShimmerBar className="h-14 w-full rounded-xl" />
          </div>
          {/* Map Area */}
          <div className="h-[480px] rounded-2xl bg-white/40 dark:bg-white/[0.02] relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-gd-shimmer" style={{ backgroundSize: '200% 100%' }} />
          </div>
        </div>
        <aside className="space-y-4 hidden lg:block">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-white/40 dark:bg-white/[0.02] p-4" />
          ))}
        </aside>
      </div>
    </div>
  )
}
