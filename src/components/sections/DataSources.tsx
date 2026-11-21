/**
 * DataSources — states, in the UI, where every number comes from and how fresh it is.
 * Prices come from src/config/greenDriveConfig.ts (one file); when they get older than
 * PRICES_STALE_AFTER_DAYS the section says so instead of silently showing old numbers.
 */
import { motion } from 'framer-motion'
import { useScrollMotionProps } from '../../lib/motion'
import { useLocale } from '../../contexts/LocaleContext'
import {
  JORDAN_CONSTANTS,
  PRICES_EFFECTIVE_DATE,
  PRICES_STALE_AFTER_DAYS,
  priceAgeDays,
} from '../../config/greenDriveConfig'

interface Item {
  en: string
  ar: string
  valueEn: string
  valueAr: string
  srcEn: string
  srcAr: string
  href: string
}

const C = JORDAN_CONSTANTS

const ITEMS: Item[] = [
  {
    en: 'Fuel prices',
    ar: 'أسعار الوقود',
    valueEn: `90: ${C.PETROL90_PRICE_JOD.toFixed(3)} · 95: ${C.PETROL_PRICE_JOD.toFixed(3)} · Diesel: ${C.DIESEL_PRICE_JOD.toFixed(3)} JOD/L`,
    valueAr: `90: ${C.PETROL90_PRICE_JOD.toFixed(3)} · 95: ${C.PETROL_PRICE_JOD.toFixed(3)} · ديزل: ${C.DIESEL_PRICE_JOD.toFixed(3)} دينار/لتر`,
    srcEn: 'Jordan Fuel Pricing Committee (monthly decision)',
    srcAr: 'لجنة تسعير المشتقات النفطية الأردنية (قرار شهري)',
    href: 'https://petra.gov.jo/en/news/fuel-pricing-committee-adjusts-november-rates-maintains-diesel-and-kerosene-subsidies-amid-market-volatility',
  },
  {
    en: 'EV charging tariff',
    ar: 'تعرفة شحن السيارات الكهربائية',
    valueEn: `${C.EV_KWH_COST_JOD.toFixed(3)} JOD/kWh (off-peak ${C.EV_KWH_OFFPEAK_JOD.toFixed(3)}, peak ${C.EV_KWH_PEAK_JOD.toFixed(3)})`,
    valueAr: `${C.EV_KWH_COST_JOD.toFixed(3)} دينار/ك.و.س (خارج الذروة ${C.EV_KWH_OFFPEAK_JOD.toFixed(3)}، الذروة ${C.EV_KWH_PEAK_JOD.toFixed(3)})`,
    srcEn: 'EMRC time-of-use tariff',
    srcAr: 'هيئة تنظيم قطاع الطاقة والمعادن: تعرفة حسب الوقت',
    href: 'https://jordantimes.com/news/local/cabinet-approves-tariff-charging-electric-vehicles',
  },
  {
    en: 'CO₂ factors',
    ar: 'معاملات الانبعاثات',
    valueEn: `Petrol ${C.CO2_PETROL_INTENSITY_KG_L} · Diesel ${C.CO2_DIESEL_INTENSITY_KG_L} kg/L · Grid ${C.CO2_GRID_INTENSITY_KG_KWH} kg/kWh`,
    valueAr: `بنزين ${C.CO2_PETROL_INTENSITY_KG_L} · ديزل ${C.CO2_DIESEL_INTENSITY_KG_L} كغ/لتر · الشبكة ${C.CO2_GRID_INTENSITY_KG_KWH} كغ/ك.و.س`,
    srcEn: 'IPCC / UK DEFRA 2023, Jordan grid intensity',
    srcAr: 'IPCC / DEFRA 2023، كثافة شبكة الكهرباء الأردنية',
    href: 'https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting',
  },
  {
    en: 'Elevation & climb',
    ar: 'الارتفاع والتسلّق',
    valueEn: 'Measured along each route (~90 m terrain model), converted with W = m·g·h',
    valueAr: 'يُقاس على طول كل مسار (نموذج تضاريس ~90 م) ويُحوّل بالمعادلة W = m·g·h',
    srcEn: 'Open-Meteo Elevation API (Copernicus DEM)',
    srcAr: 'Open-Meteo Elevation API (نموذج Copernicus)',
    href: 'https://open-meteo.com/en/docs/elevation-api',
  },
  {
    en: 'Routes & places',
    ar: 'المسارات والأماكن',
    valueEn: 'Real driving alternatives on OpenStreetMap data, with no live traffic',
    valueAr: 'مسارات قيادة حقيقية على بيانات OpenStreetMap، بدون بيانات الازدحام المباشر',
    srcEn: 'OSRM · Photon · Nominatim · © OpenStreetMap contributors',
    srcAr: 'OSRM · Photon · Nominatim · © مساهمو OpenStreetMap',
    href: 'https://www.openstreetmap.org/copyright',
  },
]

export function DataSources() {
  const m = useScrollMotionProps()
  const { locale } = useLocale()
  const ar = locale === 'ar'
  const stale = priceAgeDays() > PRICES_STALE_AFTER_DAYS
  const when = new Date(PRICES_EFFECTIVE_DATE).toLocaleDateString(ar ? 'ar-JO-u-nu-latn' : 'en-GB', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <section id="sources" className="scroll-mt-28 section-y px-4 sm:px-8 lg:px-12">
      <motion.div className="mx-auto max-w-[88rem]" {...m}>
        <div className="max-w-3xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-toxic sm:text-sm">
            {ar ? 'المصادر والشفافية' : 'Sources & transparency'}
          </p>
          <h2
            className="heading-eco-neon font-heading mt-6 text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl dark:text-white"
            style={{ fontWeight: 800 }}
          >
            {ar ? 'كل رقم له مصدر' : 'Every number has a source'}
          </h2>
          <p className="text-muted-eco mt-6 max-w-2xl text-lg leading-relaxed lg:text-xl">
            {ar
              ? 'لا نستخدم بيانات تجريبية. الأسعار والمعاملات من جهات رسمية ومنشورات علمية، والمسارات والارتفاعات تُجلب مباشرة مع كل رحلة.'
              : 'No sample data. Prices and factors come from official bodies and published science; routes and elevation are fetched live for every trip.'}
          </p>
          <p
            className={`mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${
              stale
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                : 'border-toxic/40 bg-toxic/[0.08] text-emerald-700 dark:text-toxic'
            }`}
          >
            <span aria-hidden className={`h-2 w-2 rounded-full ${stale ? 'bg-amber-500' : 'bg-toxic'}`} />
            {stale
              ? ar
                ? `الأسعار بتاريخ ${when}، وقد تكون قديمة. راجع قرار اللجنة الأخير`
                : `Prices dated ${when}. They may be out of date; check the latest committee decision`
              : ar
                ? `الأسعار سارية: ${when}`
                : `Prices in effect: ${when}`}
          </p>
        </div>

        <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {ITEMS.map((it) => (
            <li key={it.en} className="glass-card rounded-3xl p-6 sm:p-7">
              <p className="text-sm font-semibold text-zinc-500 dark:text-white/50">{ar ? it.ar : it.en}</p>
              <p className="mt-2 text-base font-bold leading-snug text-zinc-950 dark:text-white">
                {ar ? it.valueAr : it.valueEn}
              </p>
              <a
                href={it.href}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm font-medium text-emerald-700 underline decoration-emerald-700/30 underline-offset-4 hover:decoration-current dark:text-toxic"
              >
                {ar ? it.srcAr : it.srcEn} ↗
              </a>
            </li>
          ))}
          <li className="glass-card rounded-3xl p-6 sm:p-7">
            <p className="text-sm font-semibold text-zinc-500 dark:text-white/50">
              {ar ? 'ما لا ندّعيه' : 'What we do not claim'}
            </p>
            <p className="mt-2 text-base font-bold leading-snug text-zinc-950 dark:text-white">
              {ar ? 'تقديرات وليست قياسات لسيارتك' : 'Estimates, not measurements of your car'}
            </p>
            <p className="text-muted-eco mt-3 text-sm leading-relaxed">
              {ar
                ? 'الاستهلاك من نموذج فيزيائي لسيارة وسطية، ولا يوجد ازدحام مباشر في المسارات المجانية.'
                : 'Consumption comes from a physics model of a typical car, and free routing has no live traffic.'}
            </p>
          </li>
        </ul>
      </motion.div>
    </section>
  )
}
