import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import type { TranslationKey } from '../../i18n/translations'
import type { ThemePreference } from '../../types/profile'
import type { LocaleCode } from '../../types/profile'

type VehicleType = 'petrol' | 'diesel' | 'hybrid' | 'electric'

interface SettingsVaultProps {
  open: boolean
  locale: LocaleCode
  preference: ThemePreference
  vehicle: VehicleType
  currentCharge: number
  user: unknown
  onClose: () => void
  onSetPreference: (mode: ThemePreference) => void
  onSetLocale: (locale: LocaleCode) => void
  onSetVehicle: (vehicle: VehicleType) => void
  onSetCharge: (level: number) => void
  onSignOut: () => void
  t: (key: TranslationKey) => string
}

function SegmentedOption({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-200 ${
        active
          ? 'bg-toxic text-onyx shadow-[0_8px_18px_-10px_rgba(54,255,151,0.9)]'
          : 'text-zinc-700 hover:bg-black/[0.06] hover:text-zinc-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function SettingCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-3">
        <h3 className="font-heading text-sm font-bold text-zinc-900 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-600 dark:text-white/50">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

const segmentWrap =
  'grid gap-1 rounded-xl border border-black/10 bg-black/[0.04] p-1 dark:border-white/10 dark:bg-white/[0.04]'

export function SettingsVault({
  open,
  locale,
  preference,
  vehicle,
  currentCharge = 85,
  user,
  onClose,
  onSetPreference,
  onSetLocale,
  onSetVehicle,
  onSetCharge,
  onSignOut,
  t,
}: SettingsVaultProps) {
  const isArabic = locale === 'ar'
  const panelRef = useRef<HTMLElement>(null)
  const isEv = vehicle === 'electric'
  const levelLabel = isEv ? (isArabic ? 'شحن البطارية' : 'Battery charge') : isArabic ? 'مستوى الوقود' : 'Fuel level'

  useEffect(() => {
    if (!open) return
    const prevBodyOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // Move focus into the dialog so keyboard users land inside it
    panelRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevBodyOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
    }
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  // Rendered in a portal: the navbar has backdrop-filter, which would otherwise turn this
  // `fixed` overlay into one that is sized/positioned relative to the 63px header.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[260] overscroll-none bg-black/55"
          onClick={onClose}
        >
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={isArabic ? 'الإعدادات' : 'Settings'}
            tabIndex={-1}
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute end-3 top-3 flex max-h-[calc(100svh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[26rem] flex-col rounded-3xl border border-black/10 bg-white/97 p-5 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.6)] outline-none backdrop-blur-xl dark:border-white/12 dark:bg-[#0a0f0d]/97 sm:end-5 sm:top-5 sm:max-h-[calc(100svh-2.5rem)]"
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-extrabold text-zinc-950 dark:text-white">
                  {isArabic ? 'الإعدادات' : 'Settings'}
                </h2>
                <p className="mt-1 text-xs text-zinc-600 dark:text-white/55">
                  {isArabic ? 'تُحفظ التغييرات تلقائياً.' : 'Changes are saved automatically.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={isArabic ? 'إغلاق' : 'Close'}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 text-zinc-700 transition hover:border-toxic/50 hover:text-toxic dark:border-white/15 dark:text-white/70"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain">
              <SettingCard
                title={t('vehicle.title')}
                subtitle={isArabic ? 'يؤثر على حسابات الوقود والتكلفة والانبعاثات.' : 'Used for fuel, cost and CO₂ calculations.'}
              >
                <div className={`${segmentWrap} grid-cols-2 sm:grid-cols-4`}>
                  {(
                    [
                      { id: 'petrol', label: t('vehicle.petrol') },
                      { id: 'diesel', label: t('vehicle.diesel') },
                      { id: 'hybrid', label: t('vehicle.hybrid') },
                      { id: 'electric', label: t('vehicle.electric') },
                    ] as const
                  ).map((v) => (
                    <SegmentedOption key={v.id} active={vehicle === v.id} onClick={() => onSetVehicle(v.id)}>
                      {v.label}
                    </SegmentedOption>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="settings-level" className="text-xs font-semibold text-zinc-700 dark:text-white/65">
                      {levelLabel}
                    </label>
                    <span className={`text-xs font-bold tabular-nums ${currentCharge < 20 ? 'text-red-500' : 'text-toxic'}`}>
                      {currentCharge}%
                    </span>
                  </div>
                  <input
                    id="settings-level"
                    type="range"
                    min={0}
                    max={100}
                    value={currentCharge}
                    onChange={(e) => onSetCharge(parseInt(e.target.value, 10))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-toxic"
                    style={{
                      background: `linear-gradient(90deg, #36FF97 ${currentCharge}%, rgba(127,127,127,0.25) ${currentCharge}%)`,
                    }}
                  />
                </div>
              </SettingCard>

              <SettingCard
                title={t('nav.theme')}
                subtitle={isArabic ? 'مظهر التطبيق.' : 'Appearance of the app.'}
              >
                <div className={`${segmentWrap} grid-cols-3`}>
                  {(['dark', 'light', 'system'] as const).map((mode) => (
                    <SegmentedOption key={mode} active={preference === mode} onClick={() => onSetPreference(mode)}>
                      {mode === 'dark' ? (isArabic ? 'داكن' : 'Dark') : mode === 'light' ? (isArabic ? 'فاتح' : 'Light') : isArabic ? 'النظام' : 'System'}
                    </SegmentedOption>
                  ))}
                </div>
              </SettingCard>

              <SettingCard title={t('nav.lang')} subtitle={isArabic ? 'لغة الواجهة.' : 'Interface language.'}>
                <div className={`${segmentWrap} grid-cols-2`}>
                  <SegmentedOption active={locale === 'en'} onClick={() => onSetLocale('en')}>
                    English
                  </SegmentedOption>
                  <SegmentedOption active={locale === 'ar'} onClick={() => onSetLocale('ar')}>
                    العربية
                  </SegmentedOption>
                </div>
              </SettingCard>
            </div>

            <div className="mt-4">
              {user ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full rounded-xl border border-red-400/40 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-500/10 dark:text-red-400"
                >
                  {t('nav.signOut')}
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={onClose}
                  className="block w-full rounded-xl bg-toxic px-4 py-3 text-center text-sm font-extrabold text-onyx transition hover:bg-white"
                >
                  {t('nav.signIn')}
                </Link>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
