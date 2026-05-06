import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, animate, useInView } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import type { FeatureCardData } from '../../types'

function CardIcon({ type }: { type: FeatureCardData['icon'] }) {
  const common = 'h-5 w-5 text-toxic'
  if (type === 'pin')
    return (
      <svg className={common} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
      </svg>
    )
  if (type === 'tree')
    return (
      <svg className={common} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l4 6h-3v3h-2V8H8l4-6zm-1 11h2v9h-2v-9z" />
      </svg>
    )
  return (
    <svg className={common} fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 10h16v2H4v-2zm2-4h12v2H6V6zm-2 8h16v2H4v-2zm2 4h12v2H6v-2z" />
    </svg>
  )
}

export function FeatureCard({ data }: { data: FeatureCardData }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const tiltRaf = useRef(0)
  const tiltPending = useRef({ px: 0, py: 0 })
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [displayScore, setDisplayScore] = useState(0)

  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 260, damping: 24 })
  const sry = useSpring(ry, { stiffness: 260, damping: 24 })

  const scoreTarget = data.score ?? 0

  useEffect(() => {
    if (!inView || scoreTarget <= 0) return
    const ctrl = animate(0, scoreTarget, {
      duration: reduce ? 0 : 1.25,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayScore(Math.round(v)),
    })
    return () => ctrl.stop()
  }, [inView, scoreTarget, reduce])

  useEffect(() => {
    return () => cancelAnimationFrame(tiltRaf.current)
  }, [])

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) return
    const b = ref.current.getBoundingClientRect()
    tiltPending.current = {
      px: (e.clientX - b.left) / b.width - 0.5,
      py: (e.clientY - b.top) / b.height - 0.5,
    }
    if (tiltRaf.current) return
    tiltRaf.current = requestAnimationFrame(() => {
      tiltRaf.current = 0
      const { px, py } = tiltPending.current
      ry.set(-px * 14)
      rx.set(py * 14)
    })
  }

  const onLeave = () => {
    cancelAnimationFrame(tiltRaf.current)
    tiltRaf.current = 0
    rx.set(0)
    ry.set(0)
  }

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX: reduce ? 0 : srx,
        rotateY: reduce ? 0 : sry,
        transformPerspective: 1200,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative h-full"
    >
      <motion.div
        className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-toxic/0 via-toxic/60 to-toxic/0 opacity-0 blur-[0.5px] transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      />
      <motion.div
        className={`glass-card relative h-full rounded-3xl border p-8 shadow-2xl lg:p-9 ${
          data.highlighted
            ? 'border-toxic/50 shadow-[0_0_80px_-16px_rgba(54,255,151,0.55),0_0_0_1px_rgba(54,255,151,0.25)_inset]'
            : 'border-black/10 dark:border-white/12'
        }`}
      >
      {data.highlighted && (
        <>
          <div className="pointer-events-none absolute -inset-px rounded-3xl bg-[radial-gradient(ellipse_at_50%_0%,rgba(54,255,151,0.35),transparent_55%)] opacity-90" />
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-toxic/20" />
        </>
      )}
      <div className="relative flex gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-gradient-to-br from-toxic/20 to-white/80 shadow-[0_0_24px_-8px_rgba(54,255,151,0.35)] dark:border-white/12 dark:from-toxic/15 dark:to-white/5 dark:shadow-[0_0_24px_-8px_rgba(54,255,151,0.4)]">
          <CardIcon type={data.icon} />
        </div>
        <div className="min-w-0">
          <h3 className="font-heading text-xl font-extrabold text-zinc-950 dark:text-white">{data.title}</h3>
          <p className="mt-1 text-sm font-medium text-toxic">{data.subtitle}</p>
        </div>
      </div>
      <p className="text-muted-eco relative mt-6 text-base leading-relaxed">{data.body}</p>
      <div className="relative mt-8 flex items-end justify-between gap-4 border-t border-black/10 pt-6 dark:border-white/10">
        <span className="text-label-eco text-xs font-medium uppercase tracking-wider">
          {data.footerLeft}
        </span>
        {data.score != null && (
          <div className="text-right">
            <span className="text-3xl font-bold tabular-nums text-zinc-950 dark:text-white">{displayScore}</span>
            <span className="text-3xl font-bold text-zinc-400 dark:text-white/40">/10</span>
            <p className="text-label-eco text-[10px] font-medium uppercase tracking-widest">
              Impact Score
            </p>
          </div>
        )}
      </div>
      </motion.div>
    </motion.div>
  )
}
