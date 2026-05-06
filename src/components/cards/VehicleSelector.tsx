/**
 * VehicleSelector — fully i18n via useLocale.
 */
import { useId } from 'react'
import type { VehicleType } from '../../lib/vehicleProfiles'
import { VEHICLE_PROFILES } from '../../lib/vehicleProfiles'
import { useLocale } from '../../contexts/LocaleContext'

const ICONS: Record<VehicleType, string> = {
  petrol: '⛽',
  diesel: '🔧',
  hybrid: '🔋',
  electric: '⚡',
}

interface Props {
  value: VehicleType
  onChange: (v: VehicleType) => void
  label?: string
}

export function VehicleSelector({ value, onChange }: Props) {
  const id = useId()
  const { t } = useLocale()
  const types = Object.keys(VEHICLE_PROFILES) as VehicleType[]

  const labelMap: Record<VehicleType, string> = {
    petrol: t('vehicle.petrol'),
    diesel: t('vehicle.diesel'),
    hybrid: t('vehicle.hybrid'),
    electric: t('vehicle.electric'),
  }

  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-toxic">
        {t('vehicle.title')}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={t('vehicle.title')}>
        {types.map((type) => {
          const profile = VEHICLE_PROFILES[type]
          const selected = value === type
          return (
            <button
              key={type}
              id={`${id}-${type}`}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(type)}
              className={[
                'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-all duration-200',
                selected
                  ? 'border-toxic/70 bg-toxic/10 shadow-[0_0_18px_-6px_rgba(54,255,151,0.5)]'
                  : 'border-black/10 bg-white/60 hover:border-black/20 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/20',
              ].join(' ')}
            >
              <span className="text-xl leading-none" aria-hidden>{ICONS[type]}</span>
              <span className={`text-xs font-semibold ${selected ? 'text-toxic' : 'text-zinc-700 dark:text-white/70'}`}>
                {labelMap[type]}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-white/40" dir="ltr">
                {type === 'electric'
                  ? `${profile.kWhPerKm} kWh/km`
                  : `${profile.baseLPer100km} L/100km`}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
