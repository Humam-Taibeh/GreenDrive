/**
 * Route Preferences Panel — NEW FEATURE
 * Eco vs Time slider + Avoid traffic / Avoid hills toggles.
 * Integrated into route scoring logic via exported `RoutePrefs`.
 */
import { useId } from 'react'
import { useLocale } from '../../contexts/LocaleContext'

export interface RoutePrefs {
  /** 0 = pure time, 100 = pure eco */
  ecoWeight: number
  avoidTraffic: boolean
  avoidHills: boolean
}

interface Props {
  prefs: RoutePrefs
  onChange: (p: RoutePrefs) => void
  /** i18n labels — pass translated strings from parent */
  labels?: {
    title?: string
    ecoLabel?: string
    timeLabel?: string
    avoidTraffic?: string
    avoidHills?: string
  }
}

export function RoutePrefsPanel({ prefs, onChange }: Props) {
  const id = useId()
  const { t } = useLocale()
  const title = t('prefs.title')
  const ecoLabel = t('prefs.eco')
  const timeLabel = t('prefs.speed')
  const avoidTraffic = t('prefs.avoidTraffic')
  const avoidHills = t('prefs.avoidHills')

  return (
    <div className="space-y-4 rounded-xl border border-black/10 bg-white/60 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-toxic">
        {title}
      </p>

      {/* Eco vs Speed slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-white/60">
          <span>⚡ {timeLabel}</span>
          <span className="font-semibold text-zinc-900 dark:text-white">
            {prefs.ecoWeight}% {ecoLabel}
          </span>
          <span>🌱 {ecoLabel}</span>
        </div>
        <input
          id={`${id}-slider`}
          type="range"
          min={0}
          max={100}
          step={5}
          value={prefs.ecoWeight}
          onChange={(e) => onChange({ ...prefs, ecoWeight: Number(e.target.value) })}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-[#36ff97] dark:bg-zinc-700"
          aria-label={`Eco weight: ${prefs.ecoWeight}%`}
        />
      </div>

      {/* Toggle row */}
      <div className="flex gap-3">
        {[
          { key: 'avoidTraffic' as const, icon: '🚦', label: avoidTraffic },
          { key: 'avoidHills' as const, icon: '⛰️', label: avoidHills },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            id={`${id}-${key}`}
            type="button"
            role="switch"
            aria-checked={prefs[key]}
            onClick={() => onChange({ ...prefs, [key]: !prefs[key] })}
            className={[
              'flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all',
              prefs[key]
                ? 'border-toxic/50 bg-toxic/10 text-toxic'
                : 'border-black/10 bg-white/60 text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60',
            ].join(' ')}
          >
            <span aria-hidden>{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

