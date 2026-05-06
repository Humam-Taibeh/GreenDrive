/** Output by Antigravity IDE */
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollMotionProps } from '../../lib/motion'
import { useLocale } from '../../contexts/LocaleContext'
import type { IntelligenceItem } from '../../types'

const baseLogs = [
  '[12:40:02.184] ingest terrain_tile lat=32.0136 lng=35.8734 res=512m … ok',
  '[12:40:02.201] DEM slope max_grade=6.8% seg=route_eco_3',
  '[12:40:02.219] fuel_model v=2.4 ΔL=+0.11 vs baseline (ascent_penalty=0.18)',
  '[12:40:02.236] stream elevation_delta → gemini_context token=compressed',
  '[12:40:02.251] rank routes [Eco-Friendly, Fastest, Cheapest] scores=[0.94,0.71,0.82]',
  '[12:40:02.268] await traffic_refresh channel=maps_rt … listening',
]

function GeminiSignalVisual() {
  return (
    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-black/8 bg-[radial-gradient(circle_at_20%_20%,rgba(54,255,151,0.22),transparent_42%),radial-gradient(circle_at_82%_10%,rgba(124,255,196,0.15),transparent_45%),linear-gradient(135deg,#f8fffb_0%,#eefaf4_45%,#e9f6ef_100%)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_20%_20%,rgba(54,255,151,0.2),transparent_42%),radial-gradient(circle_at_82%_10%,rgba(124,255,196,0.2),transparent_45%),linear-gradient(135deg,#040806_0%,#08120e_45%,#0a1712_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(54,255,151,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(54,255,151,0.12)_1px,transparent_1px)] bg-[size:24px_24px] opacity-30 dark:opacity-20" />
      <svg viewBox="0 0 420 260" className="relative h-full w-full">
        <defs>
          <linearGradient id="gd-ai-trace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#36ff97" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#7cffc4" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#d9ffee" stopOpacity="0.75" />
          </linearGradient>
          <filter id="gd-ai-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[34, 74, 112, 148, 186, 226].map((y) => (
          <circle key={`left-${y}`} cx="38" cy={y} r="4" fill="#36ff97" opacity="0.9" />
        ))}
        {[38, 86, 132, 178, 222].map((y) => (
          <circle key={`right-${y}`} cx="382" cy={y} r="4" fill="#b8ffe0" opacity="0.9" />
        ))}

        <g fill="none" stroke="url(#gd-ai-trace)" strokeWidth="2.3" filter="url(#gd-ai-glow)">
          <path d="M38 34 C120 34, 154 86, 230 92 S336 48, 382 38" className="animate-gd-shimmer" />
          <path d="M38 74 C122 80, 162 138, 236 128 S336 88, 382 86" />
          <path d="M38 112 C128 124, 168 168, 238 166 S336 138, 382 132" className="animate-gd-shimmer" />
          <path d="M38 148 C122 156, 160 204, 232 198 S336 180, 382 178" />
          <path d="M38 186 C118 190, 156 226, 228 226 S332 220, 382 222" className="animate-gd-shimmer" />
          <path d="M38 226 C128 214, 176 64, 238 92 S328 210, 382 132" />
        </g>

        <circle cx="208" cy="130" r="26" fill="none" stroke="#36ff97" strokeWidth="2.2" opacity="0.85" />
        <circle cx="208" cy="130" r="12" fill="#36ff97" opacity="0.25" />
        <text x="208" y="135" textAnchor="middle" fill="#36ff97" fontSize="9.5" fontWeight="700">
          GEMINI
        </text>
      </svg>
    </div>
  )
}

function ElevationTerminal({ consoleBanner }: { consoleBanner: string }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 2200)
    return () => window.clearInterval(id)
  }, [])

  const liveLine = `[12:${String(40 + (tick % 3)).padStart(2, '0')}:${String(2 + (tick % 50)).padStart(2, '0')}] tile_batch flushed · checksum=a3f9e2 · latency ${(18 + (tick % 7)).toFixed(1)}ms`

  return (
    <motion.div
      className="flex h-full min-h-[300px] flex-col rounded-3xl border border-toxic/25 bg-[#020705] p-5 font-mono text-[11px] text-toxic shadow-[0_0_60px_-16px_rgba(54,255,151,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:min-h-[360px] sm:p-6 sm:text-xs"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <p className="mb-3 border-b border-white/10 pb-2.5 text-[9px] font-semibold uppercase leading-snug tracking-[0.18em] text-toxic/95">
        {consoleBanner}
      </p>
      <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3 text-white/50">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-toxic/80" />
        <span className="ml-2 text-[10px] uppercase tracking-wider">elevation_intel — live</span>
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        {baseLogs.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="break-words text-toxic/85"
          >
            {line}
          </motion.p>
        ))}
        <motion.p
          key={tick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-balance text-emerald-300/90"
        >
          {liveLine}
        </motion.p>
        <span className="inline-block h-4 w-2 animate-pulse bg-toxic align-middle shadow-[0_0_12px_#36ff97]" />
      </div>
    </motion.div>
  )
}

export function IntelligenceSection() {
  const m = useScrollMotionProps()
  const { t } = useLocale()
  const [open, setOpen] = useState<string>('gemini')

  const items: IntelligenceItem[] = useMemo(
    () => [
      { id: 'gemini', title: t('int.gemini.t'), description: t('int.gemini.d') },
      { id: 'maps', title: t('int.maps.t'), description: t('int.maps.d') },
      { id: 'elevation', title: t('int.elev.t'), description: t('int.elev.d') },
      { id: 'analytics', title: t('int.analytics.t'), description: t('int.analytics.d') },
    ],
    [t]
  )

  return (
    <section id="intelligence" className="scroll-mt-28 section-y px-4 sm:px-8 lg:px-12">
      <motion.div className="mx-auto max-w-[88rem]" {...m}>
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between lg:gap-16">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-toxic sm:text-sm">
              {t('int.kicker')}
            </p>
            <h2
              className="heading-eco-neon font-heading mt-6 max-w-2xl text-5xl font-extrabold tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl dark:text-white"
              style={{ fontWeight: 800 }}
            >
              {t('int.title')}
            </h2>
            <p className="text-muted-eco mt-8 max-w-xl text-lg leading-relaxed lg:text-xl">
              {t('int.lead')}
            </p>
          </div>
          <a
            href="https://ai.google.dev/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-fit shrink-0 items-center rounded-full border border-black/15 bg-white/80 px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-[0_0_32px_-12px_rgba(54,255,151,0.35)] backdrop-blur-md transition hover:border-toxic/50 hover:text-toxic dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
          >
            {t('int.docs')}
          </a>
        </div>

        <div className="mt-20 grid gap-12 lg:mt-24 lg:grid-cols-2 lg:gap-16">
          <div className="glass-card divide-y divide-black/10 overflow-hidden rounded-3xl dark:divide-white/10">
            {items.map((item) => {
              const isOpen = open === item.id
              return (
                <div key={item.id} className="px-5 sm:px-8">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? '' : item.id)}
                    className="flex w-full items-center justify-between py-6 text-left lg:py-7"
                  >
                    <span className="font-heading text-lg font-bold text-zinc-950 sm:text-xl dark:text-white">
                      {item.title}
                    </span>
                    <span className={`text-toxic transition ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-muted-eco pb-6 text-base leading-relaxed sm:pb-8">
                          {item.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-black/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.92)_0%,rgba(244,252,248,0.9)_100%)] p-6 shadow-[0_0_100px_-24px_rgba(54,255,151,0.35)] dark:border-white/12 dark:bg-[linear-gradient(145deg,rgba(8,12,10,0.94)_0%,rgba(5,10,8,0.92)_100%)] dark:shadow-[0_0_100px_-24px_rgba(54,255,151,0.5)] sm:p-10">
              <GeminiSignalVisual />
            </div>
            <div className="mt-6 lg:absolute lg:bottom-[-1rem] lg:right-[-1rem] lg:mt-0 lg:w-[min(100%,400px)]">
              <ElevationTerminal consoleBanner={t('int.consoleBanner')} />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
