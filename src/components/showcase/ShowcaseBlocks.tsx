/**
 * UI blocks used only in showcase mode (see src/config/showcase.ts).
 * No data, no network: static, honest placeholders.
 */
import { Link } from 'react-router-dom'
import { useLocale } from '../../contexts/LocaleContext'
import { SHOWCASE_COPY } from '../../config/showcase'

/**
 * Replaces /map. Both languages are always visible together, so the message
 * does not depend on the language switch (this page has no navbar).
 */
export function ShowcaseNoticePage() {
  const en = SHOWCASE_COPY.en
  const ar = SHOWCASE_COPY.ar
  return (
    <main className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 py-16">
      <section
        role="status"
        className="glass-card w-full max-w-2xl rounded-3xl border border-toxic/40 p-8 text-center shadow-[0_0_56px_-12px_rgba(54,255,151,0.45)] sm:p-12"
      >
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-toxic">
          {en.badge}
        </p>
        <p
          lang="en"
          dir="ltr"
          className="mt-6 text-lg leading-relaxed text-zinc-900 sm:text-xl dark:text-white"
        >
          {en.notice}
        </p>
        <p
          lang="ar"
          dir="rtl"
          className="mt-6 text-lg leading-loose text-zinc-900 sm:text-xl dark:text-white"
        >
          {ar.notice}
        </p>
        <Link
          to="/"
          className="mt-10 inline-flex items-center justify-center rounded-full bg-toxic px-8 py-3 text-sm font-extrabold text-onyx transition hover:bg-white"
        >
          {en.back} · {ar.back}
        </Link>
      </section>
    </main>
  )
}

/** Small status line shown under the hero buttons (follows the language switch). */
export function ShowcasePill() {
  const { locale } = useLocale()
  const c = SHOWCASE_COPY[locale]
  return (
    <p
      role="note"
      className="mt-6 max-w-2xl rounded-2xl border border-toxic/35 bg-toxic/[0.06] px-4 py-3 text-sm leading-relaxed text-zinc-800 dark:text-white/80"
    >
      <span className="me-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-toxic">
        {c.badge}
      </span>
      {c.notice}
    </p>
  )
}

/** Replaces the "Live impact" section (sample CO₂ chart + example trips were invented data). */
export function ImpactShowcase() {
  const { locale } = useLocale()
  const c = SHOWCASE_COPY[locale]
  return (
    <section id="impact" className="scroll-mt-28 section-y px-4 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-toxic sm:text-sm">
          {c.impactKicker}
        </p>
        <h2
          className="heading-eco-neon font-heading mt-6 text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl dark:text-white"
          style={{ fontWeight: 800 }}
        >
          {c.impactTitle}
        </h2>
        <p className="text-muted-eco mx-auto mt-8 max-w-2xl text-lg lg:text-xl">{c.impactBody}</p>
      </div>
    </section>
  )
}

/** Replaces the fake "elevation_intel — live" terminal (it printed invented fuel/score lines). */
export function TerminalShowcase() {
  const { locale } = useLocale()
  const c = SHOWCASE_COPY[locale]
  return (
    <div className="flex h-full min-h-[200px] items-center bg-[#020705] p-6 font-mono text-xs leading-relaxed text-toxic/90 sm:p-8">
      <p role="note">{c.terminalNote}</p>
    </div>
  )
}
