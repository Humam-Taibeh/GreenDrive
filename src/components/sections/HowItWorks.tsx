/** Output by Antigravity IDE */
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useScrollMotionProps, staggerContainer, staggerItem } from '../../lib/motion'
import { useLocale } from '../../contexts/LocaleContext'
import type { HowItWorksStep } from '../../types'
import { handleInPageNavClick } from '../../lib/scrollToSection'

const CONNECTOR_D =
  'M 32 28 C 38 65, 26 90, 32 120 C 38 150, 26 170, 32 200 C 38 230, 26 250, 32 280 C 38 298, 28 306, 32 318'

const nodeY = [28, 120, 200, 318]

export function HowItWorks() {
  const sectionMotion = useScrollMotionProps()
  const reduce = useReducedMotion()
  const { t } = useLocale()
  const [active, setActive] = useState(0)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  const steps: HowItWorksStep[] = useMemo(
    () => [
      { id: '1', title: t('how.s1.title'), description: t('how.s1.desc') },
      { id: '2', title: t('how.s2.title'), description: t('how.s2.desc') },
      { id: '3', title: t('how.s3.title'), description: t('how.s3.desc') },
      { id: '4', title: t('how.s4.title'), description: t('how.s4.desc') },
    ],
    [t]
  )

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return
          const idx = stepRefs.current.indexOf(en.target as HTMLDivElement)
          if (idx >= 0) setActive(idx)
        })
      },
      { root: null, rootMargin: '-38% 0px -42% 0px', threshold: 0 }
    )

    stepRefs.current.forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [steps])

  return (
    <section id="process" className="scroll-mt-28 section-y px-4 sm:px-8 lg:px-12">
      <motion.div className="mx-auto max-w-7xl" {...sectionMotion}>
        <div className="flex flex-col gap-16 lg:flex-row lg:items-start lg:justify-between lg:gap-24">
          <div className="max-w-xl lg:sticky lg:top-32">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-toxic sm:text-sm">
              {t('how.kicker')}
            </p>
            <h2
              className="heading-eco-neon font-heading mt-6 text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl lg:mt-8 lg:text-6xl lg:leading-[1.05] dark:text-white"
              style={{ fontWeight: 800 }}
            >
              {t('how.title')}
            </h2>
            <p className="text-muted-eco mt-8 text-lg leading-relaxed lg:text-xl">
              {t('how.lead')}
            </p>
            <a
              href="#intelligence"
              className="mt-10 inline-flex text-sm font-semibold text-toxic transition hover:text-zinc-950 dark:hover:text-white"
              onClick={(e) => handleInPageNavClick(e, '#intelligence')}
            >
              {t('how.more')}
            </a>
          </div>

          <div className="relative flex w-full max-w-2xl flex-1 flex-col gap-12 sm:flex-row sm:gap-12 lg:mt-0">
            {/* SVG spine — visible on all breakpoints; wider on desktop */}
            <div className="relative mx-auto flex w-[88px] shrink-0 justify-center sm:mx-0 sm:w-[100px]">
              <svg
                viewBox="0 0 64 360"
                className="h-[min(92vh,640px)] w-full overflow-visible sm:min-h-[520px]"
                preserveAspectRatio="xMidYMin meet"
                aria-hidden
              >
                <defs>
                  <linearGradient id="process-line-bold" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#36ff97" stopOpacity="0.5" />
                    <stop offset="35%" stopColor="#b8ffe0" stopOpacity="1" />
                    <stop offset="100%" stopColor="#36ff97" stopOpacity="0.45" />
                  </linearGradient>
                  <filter id="process-glow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Ghost track */}
                <path
                  d={CONNECTOR_D}
                  fill="none"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />

                {/* Draw-on primary */}
                <motion.path
                  d={CONNECTOR_D}
                  fill="none"
                  stroke="url(#process-line-bold)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  filter="url(#process-glow)"
                  initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                  whileInView={reduce ? undefined : { pathLength: 1 }}
                  viewport={{ once: true, amount: 0.2, margin: '0px 0px -10% 0px' }}
                  transition={{
                    duration: reduce ? 0 : 3.2,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />

                {/* Traveling dash — high visibility */}
                <motion.path
                  d={CONNECTOR_D}
                  fill="none"
                  stroke="#36ff97"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="10 18"
                  opacity={0.85}
                  animate={reduce ? undefined : { strokeDashoffset: [0, -280] }}
                  transition={reduce ? undefined : { duration: 10, repeat: Infinity, ease: 'linear' }}
                />

                {nodeY.map((cy, i) => (
                  <g key={i}>
                    <circle
                      cx="32"
                      cy={cy}
                      r={active === i ? 14 : 11}
                      fill={active === i ? '#36ff97' : '#050505'}
                      stroke={active === i ? '#eafff4' : 'rgba(255,255,255,0.28)'}
                      strokeWidth="2.5"
                      filter={active === i ? 'url(#process-glow)' : undefined}
                      className="transition-all duration-500"
                    />
                    <text
                      x="32"
                      y={cy + 5}
                      textAnchor="middle"
                      fill={active === i ? '#000000' : 'rgba(255,255,255,0.75)'}
                      fontSize="12"
                      fontWeight="800"
                      fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
                    >
                      {i + 1}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {reduce ? (
              <div className="flex min-w-0 flex-1 flex-col gap-8 lg:gap-10">
                {steps.map((s, i) => (
                  <div key={s.id} ref={(el) => { stepRefs.current[i] = el }}>
                    <motion.article
                      initial={false}
                      animate={{
                        opacity: active === i ? 1 : 0.38,
                        x: active === i ? 0 : 10,
                        scale: active === i ? 1 : 0.985,
                      }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="glass-card rounded-3xl p-8 lg:p-10"
                    >
                      <div className="flex items-center gap-4 sm:hidden">
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 text-sm font-extrabold ${
                            active === i
                              ? 'border-toxic bg-toxic text-onyx shadow-[0_0_28px_rgba(54,255,151,0.55)]'
                              : 'border-black/20 bg-white/70 text-zinc-950 dark:border-white/25 dark:bg-black/40 dark:text-white/75'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-toxic">
                          {t('how.step')} {String(i + 1).padStart(2, '0')}
                        </p>
                      </div>
                      <p className="hidden font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-toxic sm:block">
                        {t('how.step')} {String(i + 1).padStart(2, '0')}
                      </p>
                      <h3 className="font-heading mt-4 text-2xl font-extrabold text-zinc-950 sm:text-3xl dark:text-white">
                        {s.title}
                      </h3>
                      <p className="text-muted-eco mt-5 text-base leading-relaxed sm:text-lg">
                        {s.description}
                      </p>
                    </motion.article>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                className="flex min-w-0 flex-1 flex-col gap-8 lg:gap-10"
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px', amount: 0.15 }}
              >
                {steps.map((s, i) => (
                  <motion.div
                    key={s.id}
                    ref={(el) => { stepRefs.current[i] = el }}
                    variants={staggerItem}
                  >
                    <motion.article
                      initial={false}
                      animate={{
                        opacity: active === i ? 1 : 0.38,
                        x: active === i ? 0 : 10,
                        scale: active === i ? 1 : 0.985,
                      }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="glass-card rounded-3xl p-8 lg:p-10"
                    >
                      <div className="flex items-center gap-4 sm:hidden">
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 text-sm font-extrabold ${
                            active === i
                              ? 'border-toxic bg-toxic text-onyx shadow-[0_0_28px_rgba(54,255,151,0.55)]'
                              : 'border-black/20 bg-white/70 text-zinc-950 dark:border-white/25 dark:bg-black/40 dark:text-white/75'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-toxic">
                          {t('how.step')} {String(i + 1).padStart(2, '0')}
                        </p>
                      </div>
                      <p className="hidden font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-toxic sm:block">
                        {t('how.step')} {String(i + 1).padStart(2, '0')}
                      </p>
                      <h3 className="font-heading mt-4 text-2xl font-extrabold text-zinc-950 sm:text-3xl dark:text-white">
                        {s.title}
                      </h3>
                      <p className="text-muted-eco mt-5 text-base leading-relaxed sm:text-lg">
                        {s.description}
                      </p>
                    </motion.article>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
