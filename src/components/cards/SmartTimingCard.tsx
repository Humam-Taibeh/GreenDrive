/**
 * SmartTimingCard — "🧠 Smart Timing Insight" UI card.
 * Displays the best departure window from predictiveTiming engine.
 * Non-intrusive: single card, collapses to a one-liner when optimal = now.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { getBestDepartureTime } from '../../lib/predictiveTiming'
import type { RouteSnapshot, TimingSimResult } from '../../lib/predictiveTiming'
import type { VehicleType } from '../../lib/vehicleProfiles'
import { useLocale } from '../../contexts/LocaleContext'

// ─── Sparkline mini-chart ─────────────────────────────────────────────────────

function Sparkline({ sims }: { sims: TimingSimResult[] }) {
  const co2Values = sims.map((s) => s.co2Kg)
  const min = Math.min(...co2Values)
  const max = Math.max(...co2Values)
  const range = max - min || 0.01

  const W = 180
  const H = 36
  const points = sims.map((s, i) => {
    const x = (i / (sims.length - 1)) * (W - 8) + 4
    const y = H - 4 - ((s.co2Kg - min) / range) * (H - 8)
    return `${x},${y}`
  })
  const polyline = points.join(' ')

  // Find index of best (lowest co2)
  const bestIdx = co2Values.indexOf(min)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      {/* baseline */}
      <line x1="4" y1={H - 4} x2={W - 4} y2={H - 4} stroke="currentColor" strokeOpacity={0.12} strokeWidth={1} />
      {/* line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="#36ff97"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={0.8}
      />
      {/* dots */}
      {sims.map((_s, i) => {
        const [x, y] = (points[i] ?? '0,0').split(',').map(Number)
        const isBest = i === bestIdx
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={isBest ? 4 : 2.5}
            fill={isBest ? '#36ff97' : '#36ff97'}
            fillOpacity={isBest ? 1 : 0.45}
            stroke={isBest ? '#fff' : 'none'}
            strokeWidth={isBest ? 1.5 : 0}
          />
        )
      })}
      {/* x-axis labels */}
      {sims.map((s, i) => {
        const x = (i / (sims.length - 1)) * (W - 8) + 4
        return (
          <text
            key={i}
            x={x}
            y={H + 0}
            textAnchor="middle"
            fontSize={7}
            fill="currentColor"
            fillOpacity={0.4}
          >
            {s.offsetMin === 0 ? 'Now' : `+${s.offsetMin}`}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Sim row ──────────────────────────────────────────────────────────────────

function SimRow({ sim, isBest, isNow, colFuel, colEnergy }: {
  sim: TimingSimResult; isBest: boolean; isNow: boolean
  colEnergy: string; colFuel: string
}) {
  const timeStr = `${String(sim.departureHour).padStart(2, '0')}:${String(sim.departureMinute).padStart(2, '0')}`
  return (
    <div
      className={[
        'grid grid-cols-[56px_1fr_1fr_1fr] items-center gap-x-2 rounded-lg px-2 py-1.5 text-[10px] transition-all',
        isBest
          ? 'bg-toxic/10 ring-1 ring-toxic/40'
          : 'bg-transparent hover:bg-white/5',
      ].join(' ')}
    >
      {/* Label */}
      <div>
        <span className={`font-mono font-semibold ${isBest ? 'text-toxic' : 'text-zinc-500 dark:text-white/45'}`}>
          {isNow ? 'Now' : `+${sim.offsetMin}m`}
        </span>
        <br />
        <span className="text-[9px] text-zinc-400 dark:text-white/25">{timeStr}</span>
      </div>

      {/* Time */}
      <div className="text-center">
        <span className="font-mono font-semibold text-zinc-800 dark:text-white">{sim.adjustedTimeMin}</span>
        <span className="ml-0.5 text-zinc-400 dark:text-white/35">min</span>
      </div>

      {/* Fuel/kWh */}
      <div className="text-center">
        {sim.fuelL !== null ? (
          <><span className="font-mono font-semibold text-zinc-800 dark:text-white">{sim.fuelL}</span>
            <span className="ml-0.5 text-zinc-400 dark:text-white/35"> {colFuel}</span></>
        ) : (
          <><span className="font-mono font-semibold text-zinc-800 dark:text-white">{sim.kWhConsumed}</span>
            <span className="ml-0.5 text-zinc-400 dark:text-white/35"> {colEnergy}</span></>
        )}
      </div>

      {/* CO₂ */}
      <div className="text-center">
        <span className={`font-mono font-semibold ${isBest ? 'text-toxic' : 'text-zinc-800 dark:text-white'}`}>
          {sim.co2Kg}
        </span>
        <span className="ml-0.5 text-zinc-400 dark:text-white/35">kg</span>
        {isBest && <span className="ml-1 text-[8px] font-bold text-toxic">✓</span>}
      </div>
    </div>
  )
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface Props {
  route: RouteSnapshot
  vehicle: VehicleType
  /** Call with debounced deps — parent controls when to recompute */
  triggerKey?: string
}

export function SmartTimingCard({ route, vehicle }: Props) {
  const { t } = useLocale()
  const now = useMemo(() => new Date(), [])
  const nowHour = now.getHours()
  const nowMinute = now.getMinutes()
  const [expanded, setExpanded] = useState(false)

  const result = useMemo(
    () => getBestDepartureTime(route, vehicle, nowHour, nowMinute),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [route.distanceKm, route.durationMin, route.ascentM, route.efficiency, vehicle, nowHour, nowMinute],
  )

  // Auto-collapse when route/vehicle changes
  const prevKey = useRef('')
  const key = `${route.distanceKm}-${route.ascentM}-${vehicle}`
  useEffect(() => {
    if (prevKey.current && prevKey.current !== key) setExpanded(false)
    prevKey.current = key
  }, [key])

  const { bestSim, allSims, co2SavingPercent, fuelSavingPercent, kWhSavingPercent, timeImpactLabel, summary, leaveNow } = result

  const savingLabel = vehicle === 'electric'
    ? kWhSavingPercent > 0 ? `${kWhSavingPercent}% ${t('timing.energy')} · ${co2SavingPercent}% CO₂` : null
    : co2SavingPercent > 0 ? `${co2SavingPercent}% CO₂ · ${fuelSavingPercent}% ${t('timing.fuel')}` : null

  const tierColor = leaveNow
    ? 'border-toxic/40 bg-toxic/6'
    : co2SavingPercent >= 10
    ? 'border-toxic/30 bg-toxic/5'
    : 'border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.04]'

  return (
    <div className={`rounded-2xl border p-4 backdrop-blur-md transition-all ${tierColor}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-toxic">
            🧠 {t('timing.title')}
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug text-zinc-900 dark:text-white">
            {leaveNow ? t('timing.leaveNow') : t('timing.leaveIn').replace('{n}', String(bestSim.offsetMin))}
          </p>
        </div>
        {savingLabel && (
          <span className="shrink-0 rounded-full bg-toxic/15 px-2.5 py-1 text-[10px] font-bold text-toxic ring-1 ring-toxic/30">
            −{savingLabel.split('·')[0].trim()}
          </span>
        )}
      </div>

      {/* Summary sentence */}
      <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-white/60">{summary}</p>

      {/* Time impact pill */}
      {!leaveNow && (
        <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
          <span className="rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-zinc-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/55">
            ⏱ Travel time: <span className="font-semibold">{timeImpactLabel}</span>
          </span>
          {vehicle === 'electric' && bestSim.gridCO2Factor !== null && (
            <span className="rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-zinc-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/55">
              ⚡ Grid: <span className="font-semibold">{bestSim.gridCO2Factor} kg/kWh</span>
            </span>
          )}
          <span className="rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-zinc-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/55">
            🚦 Traffic: <span className="font-semibold">×{bestSim.trafficMultiplier.toFixed(2)}</span>
          </span>
        </div>
      )}

      {/* Sparkline */}
      <div className="mt-3 text-zinc-400 dark:text-white/30">
        <Sparkline sims={allSims} />
        <p className="mt-0.5 text-center text-[9px]">CO₂ (kg) · departure offset</p>
      </div>

      {/* Expand/collapse detail table */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex w-full items-center justify-between text-[10px] font-semibold text-zinc-400 transition hover:text-toxic dark:text-white/35 dark:hover:text-toxic"
      >
        <span>{expanded ? t('timing.hideDetails') : t('timing.showAll')}</span>
        <svg
          className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 space-y-0.5">
          {/* Table header */}
          <div className="grid grid-cols-[56px_1fr_1fr_1fr] gap-x-2 px-2 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-white/25">
            <span>{t('timing.depart')}</span>
            <span className="text-center">{t('timing.time')}</span>
            <span className="text-center">{vehicle === 'electric' ? t('timing.energy') : t('timing.fuel')}</span>
            <span className="text-center">{t('timing.co2')}</span>
          </div>
          {allSims.map((sim, i) => (
            <SimRow
              key={sim.offsetMin}
              sim={sim}
              isBest={sim.offsetMin === bestSim.offsetMin}
              isNow={i === 0}
              colEnergy={t('timing.energy')}
              colFuel={t('timing.fuel')}
            />
          ))}
        </div>
      )}

      <p className="mt-3 text-[9px] text-zinc-400 dark:text-white/25">
        {t('timing.footer')}{vehicle === 'electric' ? ' · Jordan NEPCO solar grid' : ''}
      </p>
    </div>
  )
}
