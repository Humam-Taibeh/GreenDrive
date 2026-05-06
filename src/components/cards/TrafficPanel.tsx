/**
 * TrafficPanel — fully i18n via useLocale + trafficModel AR labels.
 */
import { useMemo } from 'react'
import { getDepartureSlots } from '../../lib/trafficModel'
import type { DepartureSlot } from '../../lib/trafficModel'
import { getTrafficWindow } from '../../lib/trafficModel'
import { useLocale } from '../../contexts/LocaleContext'

const TIER_STYLES: Record<DepartureSlot['tier'], string> = {
  best: 'border-toxic/50 bg-toxic/8 dark:bg-toxic/6',
  ok: 'border-amber-400/40 bg-amber-400/5',
  avoid: 'border-red-400/40 bg-red-400/5',
}

interface Props {
  baseMinutes: number
  baseFuelL: number | null
  vehicle?: string
}

export function TrafficPanel({ baseMinutes, baseFuelL }: Props) {
  const { t, locale } = useLocale()
  const isAr = locale === 'ar'
  const now = useMemo(() => new Date(), [])
  const nowHour = now.getHours()
  const nowMinute = now.getMinutes()

  const slots = useMemo(
    () => getDepartureSlots(baseMinutes, baseFuelL ?? 0, nowHour, nowMinute),
    [baseMinutes, baseFuelL, nowHour, nowMinute],
  )

  const currentWindow = getTrafficWindow(nowHour)

  const TIER_BADGE: Record<DepartureSlot['tier'], { label: string; cls: string }> = {
    best: { label: t('traffic.best'), cls: 'bg-toxic/20 text-toxic' },
    ok:   { label: t('traffic.ok'),   cls: 'bg-amber-400/20 text-amber-400' },
    avoid:{ label: t('traffic.avoid'),cls: 'bg-red-400/20 text-red-400' },
  }

  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-toxic">
          🚦 {t('traffic.title')}
        </p>
        <span className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2 py-0.5 text-[10px] font-semibold dark:border-white/10 dark:bg-white/[0.05]">
          <span>{currentWindow.icon}</span>
          <span className="text-zinc-600 dark:text-white/60">
            {isAr ? currentWindow.labelAr : currentWindow.label}
          </span>
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-white/55">
        {isAr ? currentWindow.adviceAr : currentWindow.advice}
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {slots.map((slot, i) => {
          const badge = TIER_BADGE[slot.tier]
          return (
            <div key={i} className={`rounded-xl border p-3 transition-all ${TIER_STYLES[slot.tier]}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                    {isAr ? slot.labelAr ?? slot.label : slot.label}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-zinc-500 dark:text-white/40">
                    {slot.window.icon} {isAr ? slot.window.labelAr : slot.window.label}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                <span className="text-zinc-500 dark:text-white/40">{t('traffic.timeLabel')}</span>
                <span className="text-end font-mono font-semibold text-zinc-900 dark:text-white" dir="ltr">
                  {slot.adjustedMin} min
                  {slot.adjustedMin > baseMinutes && (
                    <span className="ml-1 text-red-400">+{slot.adjustedMin - baseMinutes}</span>
                  )}
                </span>
                <span className="text-zinc-500 dark:text-white/40">{t('traffic.fuelLabel')}</span>
                <span className="text-end font-mono font-semibold text-zinc-900 dark:text-white" dir="ltr">
                  {slot.adjustedFuelL.toFixed(2)} L
                  {baseFuelL !== null && slot.adjustedFuelL > baseFuelL && (
                    <span className="ml-1 text-red-400">+{(slot.adjustedFuelL - baseFuelL).toFixed(2)}</span>
                  )}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Traffic bar */}
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[9px] text-zinc-400 dark:text-white/30">
          <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
        </div>
        <div className="relative flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700/50">
          {[
            { w: 25,   color: '#36ff97', opacity: 0.5 },
            { w: 4,    color: '#fbbf24', opacity: 0.7 },
            { w: 12.5, color: '#ef4444', opacity: 0.85 },
            { w: 8,    color: '#fbbf24', opacity: 0.65 },
            { w: 8,    color: '#fbbf24', opacity: 0.7  },
            { w: 8,    color: '#36ff97', opacity: 0.55 },
            { w: 12.5, color: '#ef4444', opacity: 1    },
            { w: 12.5, color: '#fbbf24', opacity: 0.65 },
            { w: 8,    color: '#36ff97', opacity: 0.45 },
          ].map((seg, i) => (
            <div key={i} style={{ width: `${seg.w}%`, backgroundColor: seg.color, opacity: seg.opacity }} />
          ))}
          <div
            className="absolute top-0 h-full w-0.5 bg-white shadow-[0_0_4px_rgba(255,255,255,0.9)]"
            style={{ left: `${((nowHour * 60 + nowMinute) / 1440) * 100}%` }}
          />
        </div>
        <p className="mt-1 text-right text-[9px] text-zinc-400 dark:text-white/30" dir="ltr">
          ▲ Now ({String(nowHour).padStart(2, '0')}:{String(nowMinute).padStart(2, '0')})
        </p>
      </div>

      <p className="mt-2 text-[9px] text-zinc-400 dark:text-white/25">{t('traffic.footer')}</p>
    </div>
  )
}
