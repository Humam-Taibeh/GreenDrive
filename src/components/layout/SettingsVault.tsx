import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { TranslationKey } from '../../i18n/translations'
import type { ThemePreference } from '../../types/profile'
import type { LocaleCode } from '../../types/profile'

type VehicleType = 'petrol' | 'hybrid' | 'electric'
type UnitType = 'metric' | 'imperial'

interface SettingsVaultProps {
  open: boolean
  locale: LocaleCode
  preference: ThemePreference
  simulationMode: boolean
  unitSystem: UnitType
  vehicle: VehicleType
  currentCharge: number
  user: unknown
  onClose: () => void
  onSetPreference: (mode: ThemePreference) => void
  onToggleSimulationMode: () => void
  onSetUnitSystem: (unit: UnitType) => void
  onSetLocale: (locale: LocaleCode) => void
  onSetVehicle: (vehicle: VehicleType) => void
  onSetCharge: (level: number) => void
  onSignOut: () => void
  t: (key: TranslationKey) => string
}

const itemMotion = {
  initial: { opacity: 0, y: 10 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.035 * i, type: 'spring' as const, stiffness: 360, damping: 34 },
  }),
}

function SegmentedOption({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 ${
        active
          ? 'bg-toxic text-onyx shadow-[0_8px_18px_-10px_rgba(54,255,151,0.9)]'
          : 'text-zinc-700 hover:bg-white/70 hover:text-zinc-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function TogglePill({ enabled, onClick }: { enabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-7 w-12 rounded-full transition-all duration-200 ${enabled ? 'bg-toxic/85 shadow-[0_8px_16px_-10px_rgba(54,255,151,0.9)]' : 'bg-zinc-400/45 dark:bg-white/20'}`}
      aria-pressed={enabled}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? 'right-1' : 'left-1'}`}
      />
    </button>
  )
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/20 bg-white/72 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-700 dark:bg-white/5 dark:text-white/65">
      {label}: <span className="text-toxic">{value}</span>
    </div>
  )
}

/** 
 * Tactical Custom Scrollbar Styles 
 */
const SCROLLBAR_STYLE = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(54, 255, 151, 0.2);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(54, 255, 151, 0.4);
  }
`

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = SCROLLBAR_STYLE
  document.head.appendChild(style)
}

function SettingCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-black/10 bg-white/72 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-toxic">{title}</p>
          {subtitle && <p className="mt-1 text-[11px] text-zinc-600 dark:text-white/50">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

export function SettingsVault({
  open,
  locale,
  preference,
  simulationMode,
  unitSystem,
  vehicle,
  currentCharge = 85,
  user,
  onClose,
  onSetPreference,
  onToggleSimulationMode,
  onSetUnitSystem,
  onSetLocale,
  onSetVehicle,
  onSetCharge,
  onSignOut,
  t,
}: SettingsVaultProps) {
  const isArabic = locale === 'ar'
  const title = isArabic ? 'نواة التحكم (Command Core)' : 'Command Core'
  const subtitle = isArabic ? 'ضبط تفضيلات المنصة بشكل احترافي' : 'Fine-tune platform preferences'
  const closeLabel = isArabic ? 'إغلاق' : 'Close'
  const simLabel = isArabic ? 'وضع المحاكاة' : 'Simulation Mode'
  const unitLabel = isArabic ? 'نظام الوحدات' : 'Unit System'

  useEffect(() => {
    if (!open) return

    const prevBodyOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyTouchAction = document.body.style.touchAction

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    return () => {
      document.body.style.overflow = prevBodyOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.touchAction = prevBodyTouchAction
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[260] overscroll-none bg-black/55 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: 28, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 28, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className={`absolute right-5 top-1/2 flex h-[calc(100%-2.5rem)] w-full max-w-[27rem] -translate-y-1/2 flex-col overflow-hidden rounded-[1.5rem] border border-toxic/30 bg-[linear-gradient(160deg,rgba(255,255,255,0.88),rgba(255,255,255,0.68))] p-5 backdrop-blur-[30px] shadow-[0_20px_65px_-35px_rgba(0,0,0,0.35),0_10px_34px_-24px_rgba(54,255,151,0.35)] dark:bg-[linear-gradient(165deg,rgba(8,12,11,0.88),rgba(8,12,11,0.78))]`}
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="pointer-events-none absolute inset-[1px] rounded-[calc(1.5rem-1px)] border border-white/25 dark:border-white/10" />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-heading text-lg font-extrabold text-zinc-900 dark:text-white">{title}</p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-white/55">{subtitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-white/25 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-toxic/45 hover:text-toxic dark:text-white/70"
              >
                {closeLabel}
              </button>
            </div>

            <div className="custom-scrollbar relative flex-1 space-y-3 overflow-y-auto pr-1">
              <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-white/20 bg-white/65 p-1.5 dark:bg-white/[0.03]">
                <StatBadge label="theme" value={preference} />
                <StatBadge label="units" value={unitSystem} />
                <StatBadge label="vehicle" value={vehicle} />
              </div>

              <motion.section
                custom={1}
                initial={itemMotion.initial}
                animate={itemMotion.animate(1)}
                className=""
              >
                <SettingCard title={t('vehicle.title')} subtitle={isArabic ? 'تحديد نمط المركبة ومستوى الطاقة' : 'Vehicle profile and energy level'}>
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-white/40">
                        {vehicle === 'electric' ? 'Battery Charge' : 'Fuel Level'}
                      </p>
                      <span className={`text-xs font-black font-mono ${currentCharge < 20 ? 'text-red-500 animate-pulse' : 'text-toxic'}`}>
                        {currentCharge}%
                      </span>
                    </div>
                    <div className="relative h-6 w-full flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={currentCharge}
                        onChange={(e) => onSetCharge(parseInt(e.target.value))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-toxic"
                        style={{
                          background: `linear-gradient(90deg, #36FF97 ${currentCharge}%, rgba(255,255,255,0.1) ${currentCharge}%)`
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-white/20 bg-black/5 p-1 dark:bg-white/5">
                    {(
                      [
                        { id: 'petrol', label: t('vehicle.petrol') },
                        { id: 'hybrid', label: t('vehicle.hybrid') },
                        { id: 'electric', label: t('vehicle.electric') },
                      ] as const
                    ).map((v) => (
                      <SegmentedOption key={v.id} active={vehicle === v.id} onClick={() => onSetVehicle(v.id)}>
                        {v.label}
                      </SegmentedOption>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        onSetVehicle(vehicle)
                        onSetCharge(currentCharge)
                        // Tactical feedback
                        const btn = document.getElementById('save-profile-btn')
                        if (btn) {
                          const originalText = btn.innerText
                          btn.innerText = isArabic ? '✓ تم المزامنة' : '✓ PROFILE SYNCED'
                          btn.classList.add('!bg-toxic', '!text-black')
                          setTimeout(() => {
                            btn.innerText = originalText
                            btn.classList.remove('!bg-toxic', '!text-black')
                          }, 2000)
                        }
                      }}
                      id="save-profile-btn"
                      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-toxic/35 bg-toxic/10 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-toxic transition-all hover:bg-toxic/20 active:scale-95"
                    >
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shimmer" />
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {isArabic ? 'تثبيت ومزامنة الملف' : 'Lock In & Sync Profile'}
                    </button>
                    
                    <div className="flex items-center justify-center gap-2 opacity-50">
                      <div className="h-1.5 w-1.5 rounded-full bg-toxic animate-pulse shadow-[0_0_8px_rgba(54,255,151,0.8)]" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 dark:text-white/40">
                        {isArabic ? 'بيانات الأردن محملة وموثقة' : 'Jordan-Market Physics Verified'}
                      </span>
                    </div>
                  </div>
                </SettingCard>
              </motion.section>

              <motion.section
                custom={2}
                initial={itemMotion.initial}
                animate={itemMotion.animate(2)}
                className=""
              >
                <SettingCard
                  title={t('nav.theme')}
                  subtitle={isArabic ? 'مظهر التطبيق ووضوح القراءة' : 'Application appearance and readability'}
                >
                  <div className="mb-2.5">
                    <StatBadge label="flux" value={`${preference === 'dark' ? 90 : preference === 'light' ? 55 : 75}`} />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-white/20 bg-black/[0.04] p-1 dark:bg-white/[0.03]">
                    {(['dark', 'light', 'system'] as const).map((mode) => (
                      <SegmentedOption key={mode} active={preference === mode} onClick={() => onSetPreference(mode)}>
                        {mode === 'dark' ? 'Dark' : mode === 'light' ? 'Light' : 'System'}
                      </SegmentedOption>
                    ))}
                  </div>
                </SettingCard>
              </motion.section>

              <motion.section
                custom={3}
                initial={itemMotion.initial}
                animate={itemMotion.animate(3)}
                className=""
              >
                <SettingCard
                  title={simLabel}
                  subtitle={isArabic ? 'تشغيل وضع التحليل التجريبي' : 'Enable experimental analysis mode'}
                >
                  <div className="mb-2.5">
                    <StatBadge label="torque" value={`${simulationMode ? 88 : 22}`} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-white/75">
                      {simulationMode ? 'Enabled' : 'Disabled'}
                    </span>
                    <TogglePill
                      enabled={simulationMode}
                      onClick={() => {
                        onToggleSimulationMode()
                      }}
                    />
                  </div>
                </SettingCard>
              </motion.section>

              <motion.section
                custom={4}
                initial={itemMotion.initial}
                animate={itemMotion.animate(4)}
                className=""
              >
                <SettingCard title={unitLabel} subtitle={isArabic ? 'الوحدات المعروضة داخل المنصة' : 'Displayed units across platform'}>
                  <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-white/20 bg-black/5 p-1 dark:bg-white/5">
                    <SegmentedOption active={unitSystem === 'metric'} onClick={() => onSetUnitSystem('metric')}>
                      Metric
                    </SegmentedOption>
                    <SegmentedOption active={unitSystem === 'imperial'} onClick={() => onSetUnitSystem('imperial')}>
                      Imperial
                    </SegmentedOption>
                  </div>
                </SettingCard>
              </motion.section>

              <motion.section
                custom={5}
                initial={itemMotion.initial}
                animate={itemMotion.animate(5)}
                className=""
              >
                <SettingCard title={t('nav.lang')} subtitle={isArabic ? 'تخصيص لغة الواجهة' : 'Control interface language'}>
                  <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-white/20 bg-black/[0.04] p-1 dark:bg-white/[0.03]">
                    <SegmentedOption active={locale === 'en'} onClick={() => onSetLocale('en')}>
                      EN
                    </SegmentedOption>
                    <SegmentedOption active={locale === 'ar'} onClick={() => onSetLocale('ar')}>
                      AR
                    </SegmentedOption>
                  </div>
                </SettingCard>
              </motion.section>

              <motion.div
                custom={6}
                initial={itemMotion.initial}
                animate={itemMotion.animate(6)}
                className=""
              >
                {user ? (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="w-full rounded-lg border border-red-400/45 bg-red-500/5 px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-red-400 transition hover:bg-red-500/10"
                  >
                    {t('nav.signOut')}
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={onClose}
                    className="block w-full rounded-lg border border-toxic/45 bg-toxic/12 px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.1em] text-toxic transition hover:bg-toxic/18"
                  >
                    {t('nav.signIn')}
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
