/**
 * ImpactEstimator — an interactive "what does my driving cost?" calculator.
 * Every number is computed live from the same model the route planner uses
 * (Jordan 2026 fuel prices / EMRC tariff, IPCC CO₂ factors). The user controls every input,
 * so nothing on this section is invented sample data.
 */
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useScrollMotionProps } from '../../lib/motion'
import { useLocale } from '../../contexts/LocaleContext'
import { computeTripEmissions } from '../../lib/vehicleProfiles'
import type { VehicleType } from '../../lib/vehicleProfiles'
import { DRIVING_EFFICIENCY } from '../../lib/useDirectionsRoutes'

const VEHICLES: { id: VehicleType; en: string; ar: string }[] = [
  { id: 'petrol', en: 'Petrol', ar: 'بنزين' },
  { id: 'diesel', en: 'Diesel', ar: 'ديزل' },
  { id: 'hybrid', en: 'Hybrid', ar: 'هجين' },
  { id: 'electric', en: 'Electric', ar: 'كهربائي' },
]

const WORK_DAYS = 250
const KG_CO2_PER_TREE_YEAR = 21

function Slider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-zinc-800 dark:text-white/80">
          {label}
        </label>
        <span className="text-lg font-extrabold tabular-nums text-zinc-950 dark:text-white" dir="ltr">
          {value}
          <span className="ms-1 text-xs font-medium text-zinc-500 dark:text-white/45">{unit}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-toxic"
        style={{ background: `linear-gradient(90deg, #36FF97 ${pct}%, rgba(127,127,127,0.28) ${pct}%)` }}
      />
    </div>
  )
}

function Stat({ label, value, unit, accent }: { label: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-xs font-medium text-zinc-500 dark:text-white/50">{label}</p>
      <p
        className={`mt-1.5 text-3xl font-extrabold tabular-nums tracking-tight sm:text-4xl ${accent ? 'text-emerald-600 dark:text-toxic' : 'text-zinc-950 dark:text-white'}`}
        dir="ltr"
      >
        {value}
        <span className="ms-1.5 text-sm font-semibold text-zinc-500 dark:text-white/45">{unit}</span>
      </p>
    </div>
  )
}

export function ImpactEstimator() {
  const m = useScrollMotionProps()
  const { locale } = useLocale()
  const ar = locale === 'ar'
  const [km, setKm] = useState(25)
  const [vehicle, setVehicle] = useState<VehicleType>('petrol')
  const [gain, setGain] = useState(8)

  const r = useMemo(() => {
    // Computed over the whole year at once so per-trip rounding never gets multiplied by 250.
    const year = computeTripEmissions(km * WORK_DAYS, 0, DRIVING_EFFICIENCY, vehicle)
    const k = gain / 100
    return {
      energy: vehicle === 'electric' ? parseFloat(year.label) : year.fuelLiters ?? 0,
      jod: year.costJOD,
      co2: year.co2Kg,
      trees: Math.round(year.co2Kg / KG_CO2_PER_TREE_YEAR),
      saveJod: year.costJOD * k,
      saveCo2: year.co2Kg * k,
    }
  }, [km, vehicle, gain])

  const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d })
  const isEv = vehicle === 'electric'

  return (
    <section id="impact" className="scroll-mt-28 section-y px-4 sm:px-8 lg:px-12">
      <motion.div className="mx-auto max-w-[88rem]" {...m}>
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-toxic sm:text-sm">
            {ar ? 'حاسبة الأثر' : 'Impact calculator'}
          </p>
          <h2
            className="heading-eco-neon font-heading mt-6 text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl dark:text-white"
            style={{ fontWeight: 800 }}
          >
            {ar ? 'كم تكلّفك قيادتك فعلاً؟' : 'What does your driving really cost?'}
          </h2>
          <p className="text-muted-eco mt-6 max-w-2xl text-lg leading-relaxed lg:text-xl">
            {ar
              ? 'غيّر المسافة ونوع المركبة وشاهد التكلفة والانبعاثات السنوية، محسوبة بأسعار الوقود الأردنية ومعاملات انبعاثات معتمدة.'
              : 'Adjust distance and vehicle to see your yearly cost and emissions, calculated with Jordanian fuel prices and published emission factors.'}
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:mt-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <div className="glass-card space-y-8 rounded-3xl p-6 sm:p-8">
            <Slider
              id="est-km"
              label={ar ? 'المسافة اليومية' : 'Daily driving distance'}
              value={km}
              min={2}
              max={150}
              unit="km"
              onChange={setKm}
            />
            <div>
              <p className="mb-2.5 text-sm font-semibold text-zinc-800 dark:text-white/80">{ar ? 'نوع المركبة' : 'Vehicle'}</p>
              <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-black/10 bg-black/[0.04] p-1.5 sm:grid-cols-4 dark:border-white/10 dark:bg-white/[0.04]">
                {VEHICLES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    aria-pressed={vehicle === v.id}
                    onClick={() => setVehicle(v.id)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      vehicle === v.id
                        ? 'bg-toxic text-onyx shadow-[0_8px_20px_-10px_rgba(54,255,151,0.9)]'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white'
                    }`}
                  >
                    {ar ? v.ar : v.en}
                  </button>
                ))}
              </div>
            </div>
            <Slider
              id="est-gain"
              label={ar ? 'تحسّن الكفاءة (قيادة سلسة واختيار مسار أفضل)' : 'Efficiency gain (smoother driving, better routes)'}
              value={gain}
              min={0}
              max={20}
              unit="%"
              onChange={setGain}
            />
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-white/40">
              {ar
                ? `الحساب على أساس ${WORK_DAYS} يوم عمل في السنة وأرض مستوية. نسبة التحسّن افتراض تحدده أنت، وليست وعداً.`
                : `Based on ${WORK_DAYS} working days a year on flat terrain. The efficiency gain is an assumption you control — not a promise.`}
            </p>
          </div>

          <div className="grid content-start gap-4 sm:grid-cols-2">
            <Stat label={ar ? 'التكلفة السنوية' : 'Yearly cost'} value={fmt(r.jod)} unit="JOD" />
            <Stat label={ar ? (isEv ? 'الطاقة السنوية' : 'الوقود السنوي') : isEv ? 'Yearly energy' : 'Yearly fuel'} value={fmt(r.energy)} unit={isEv ? 'kWh' : 'L'} />
            <Stat label={ar ? 'انبعاثات CO₂ السنوية' : 'Yearly CO₂'} value={fmt(r.co2)} unit="kg" />
            <Stat label={ar ? 'أشجار لامتصاصها' : 'Trees to absorb it'} value={fmt(r.trees)} unit={ar ? 'شجرة' : 'trees'} />
            <div className="rounded-2xl border border-toxic/40 bg-toxic/[0.08] p-5 sm:col-span-2">
              <p className="text-sm font-bold text-emerald-700 dark:text-toxic">
                {ar ? `مع تحسّن ${gain}% في الكفاءة، توفّر سنوياً:` : `With a ${gain}% efficiency gain you would save each year:`}
              </p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-zinc-950 sm:text-3xl dark:text-white" dir="ltr">
                {fmt(r.saveJod)} JOD <span className="mx-1 text-zinc-400">·</span> {fmt(r.saveCo2)} kg CO₂
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
