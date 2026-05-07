/** Output by Antigravity IDE — slim security & credits strip (performance-friendly scroll tail). */
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useScrollMotionProps } from '../../lib/motion'
import { useLocale } from '../../contexts/LocaleContext'
import { handleInPageNavClick } from '../../lib/scrollToSection'

export interface FxControlProps {
  disabled: boolean
  autoDisabled: boolean
  onToggle: () => void
}

export function Footer({ fxControl }: { fxControl?: FxControlProps }) {
  const m = useScrollMotionProps()
  const { t } = useLocale()

  const cols = useMemo(
    () => [
      [
        { label: t('foot.about'), href: '#overview' },
        { label: t('foot.features'), href: '#features' },
        { label: t('foot.impact'), href: '#impact' },
      ],
      [
        { label: t('foot.contact'), href: '#contact' },
        { label: t('foot.cases'), href: '#process' },
        { label: t('foot.terms'), href: '#intelligence' },
      ],
      [
        { label: t('foot.github'), href: 'https://github.com/' },
        { label: t('foot.insta'), href: 'https://instagram.com/' },
        { label: t('foot.linkedin'), href: 'https://linkedin.com/' },
      ],
    ],
    [t]
  )

  return (
    <footer
      id="contact"
      className="snap-none relative border-t border-black/10 bg-zinc-100/95 px-4 py-5 dark:border-white/10 dark:bg-onyx sm:px-8 sm:py-6 lg:px-12"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_10%_100%,rgba(54,255,151,0.1),transparent_50%)] opacity-90 dark:opacity-100" />
      <motion.div className="relative z-10 mx-auto max-w-6xl" {...m}>
        <div className="grid gap-4 border-b border-black/10 pb-3 dark:border-white/10 sm:gap-5 md:grid-cols-12 md:items-end md:pb-3">
          <div className="md:col-span-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-toxic">{t('foot.contact')}</h3>
            <p className="text-muted-eco text-[11px] sm:text-xs">{t('foot.line')}</p>
            <p
              className="font-heading mt-1 text-xl font-extrabold tracking-tight text-zinc-950 sm:text-2xl toxic-glow-text dark:text-white"
              style={{ fontWeight: 800 }}
            >
              GreenDrive
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-1 sm:grid-cols-3 md:col-span-7 md:justify-self-end">
            {cols.map((items, i) => (
              <ul key={i} className="flex flex-col gap-0.5 text-[11px] text-zinc-950 dark:text-white/75 sm:text-xs">
                {items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                      className="inline-block origin-start transition duration-200 hover:text-toxic"
                      onClick={(e) => {
                        if (!item.href.startsWith('#')) return
                        handleInPageNavClick(e, item.href)
                      }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 px-1 pt-3 sm:flex-row">
          <p className="text-label-eco text-center text-[10px] leading-relaxed sm:text-start sm:text-[11px]">
            {t('foot.legal')}
          </p>
          {fxControl && (
            <button
              type="button"
              onClick={fxControl.onToggle}
              className="rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-zinc-900 shadow-sm backdrop-blur-sm transition hover:border-toxic/50 hover:text-toxic dark:border-white/15 dark:bg-black/70 dark:text-white/85"
              title={fxControl.autoDisabled ? 'Antigravity IDE: auto-disabled due to low FPS' : 'Antigravity IDE: toggle visual effects'}
            >
              {fxControl.disabled ? 'Enable FX' : 'Disable FX'}
            </button>
          )}
        </div>
      </motion.div>
    </footer>
  )
}
