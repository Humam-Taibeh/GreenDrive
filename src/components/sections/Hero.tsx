/**
 * Output by Antigravity IDE
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { m, useReducedMotion } from 'framer-motion'
import { useLocale } from '../../contexts/LocaleContext'
import { prefetchMapRoute } from '../../lib/prefetchMapRoute'
import { scrollToSectionByHash } from '../../lib/scrollToSection'

const ease = [0.16, 1, 0.3, 1] as const

export function Hero() {
  const { t } = useLocale()
  const reduce = useReducedMotion()
  const startPath = '/auth'

  const container = useMemo(
    () => ({
      hidden: {},
      visible: {
        transition: {
          staggerChildren: reduce ? 0 : 0.12,
          delayChildren: reduce ? 0 : 0.16,
        },
      },
    }),
    [reduce]
  )

  const item = useMemo(
    () => ({
      hidden: { opacity: 0, y: reduce ? 0 : 32 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: reduce ? 0.18 : 0.58, ease },
      },
    }),
    [reduce]
  )

  const scrollTech = () => {
    scrollToSectionByHash('#intelligence')
  }

  const layerStyle = { willChange: 'transform, opacity' as const, transform: 'translateZ(0)' }

  return (
    <section
      id="overview"
      className="snap-pillar-hero relative flex min-h-[calc(100svh-var(--nav-stack-h))] scroll-mt-[var(--nav-stack-h)] flex-col justify-center overflow-visible px-4 pb-24 pt-0 sm:px-8 sm:pb-32 lg:px-12 lg:pb-40"
    >
      <div
        style={{ paddingTop: 'var(--nav-stack-h)' }}
        className="relative mx-auto flex w-full max-w-[90rem] flex-1 flex-col justify-center"
      >
        <m.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="max-w-5xl"
          style={{ ...layerStyle, isolation: 'isolate' }}
        >
          <m.p
            variants={item}
            style={layerStyle}
            className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-toxic sm:text-sm"
          >
            {t('hero.kicker')}
          </m.p>
          <m.h1
            variants={item}
            className="hero-title-pop heading-eco-neon font-heading mt-6 text-[3.7rem] font-extrabold leading-[1] tracking-tight text-zinc-950 sm:mt-8 sm:text-[4.4rem] sm:leading-[0.96] lg:mt-10 lg:text-[5.35rem] xl:text-[6rem] toxic-glow-text dark:text-white"
            style={{ ...layerStyle, fontWeight: 800 }}
          >
            {t('hero.title')}
          </m.h1>
          <m.p
            variants={item}
            style={layerStyle}
            className="mt-10 max-w-2xl text-lg leading-relaxed text-zinc-800 sm:text-xl lg:mt-12 lg:text-2xl lg:leading-relaxed dark:text-white/72"
          >
            {t('hero.sub')}
          </m.p>
          <m.div
            variants={item}
            style={layerStyle}
            className="mt-14 flex flex-col gap-4 sm:mt-16 sm:flex-row sm:items-center lg:mt-20"
          >
            <div className="relative inline-flex rounded-full">
              <span className="absolute -inset-1 rounded-full bg-toxic/25 blur-xl" aria-hidden />
              <Link
                to={startPath}
                onMouseEnter={prefetchMapRoute}
                onFocus={prefetchMapRoute}
                className="btn-primary-toxic relative inline-flex items-center justify-center rounded-full bg-toxic px-10 py-4 text-base font-extrabold text-onyx shadow-[0_0_40px_-4px_rgba(54,255,151,0.75)] transition hover:bg-white hover:shadow-[0_0_48px_-4px_rgba(255,255,255,0.45)]"
              >
                {t('hero.ctaMap')}
              </Link>
            </div>
            <button
              type="button"
              onClick={scrollTech}
              className="inline-flex items-center justify-center rounded-full border border-black/20 bg-black/[0.03] px-10 py-4 text-base font-semibold text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md transition hover:border-toxic/60 hover:text-toxic dark:border-white/35 dark:bg-white/[0.03] dark:text-white"
            >
              {t('hero.ctaStack')}
            </button>
          </m.div>
        </m.div>
      </div>
    </section>
  )
}
