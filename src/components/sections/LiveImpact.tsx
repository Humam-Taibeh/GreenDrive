/** Output by Antigravity IDE */
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { useScrollMotionProps } from '../../lib/motion'
import { useTheme } from '../../contexts/ThemeContext'
import { useLocale } from '../../contexts/LocaleContext'
import { useAuth } from '../../contexts/AuthContext'
import { firebaseConfigured } from '../../firebase/config'
import type { ImpactTrip } from '../../types'

const chartData = [
  { t: 'Mon', kg: 2.1 },
  { t: 'Tue', kg: 2.4 },
  { t: 'Wed', kg: 2.8 },
  { t: 'Thu', kg: 3.2 },
  { t: 'Fri', kg: 3.6 },
  { t: 'Sat', kg: 3.9 },
  { t: 'Sun', kg: 4.2 },
]

function TripIcon({ type }: { type: ImpactTrip['icon'] }) {
  const wrap =
    'flex h-11 w-11 items-center justify-center rounded-2xl border border-black/12 bg-white/70 text-zinc-900 shadow-[0_0_24px_-10px_rgba(54,255,151,0.25)] backdrop-blur-md dark:border-white/12 dark:bg-[rgba(255,255,255,0.05)] dark:text-white'
  if (type === 'star')
    return (
      <span className={wrap} aria-hidden>
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 17.8 5.7 21l2.3-7-6-4.6h7.6L12 2z" />
        </svg>
      </span>
    )
  if (type === 'plus')
    return (
      <span className={wrap} aria-hidden>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M12 5v14M5 12h14" />
        </svg>
      </span>
    )
  return (
    <span className={wrap} aria-hidden>
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M4 10c3 0 3-4 8-4s5 4 8 4-3 4-8 4-5-4-8-4z" />
      </svg>
    </span>
  )
}

export function LiveImpact() {
  const m = useScrollMotionProps()
  const { resolvedTheme } = useTheme()
  const { t } = useLocale()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const chartDark = resolvedTheme === 'dark'
  const startPath = firebaseConfigured && !user ? '/auth' : '/map'

  const trips: ImpactTrip[] = useMemo(
    () => [
      {
        id: '1',
        title: t('imp.trip1.title'),
        description: t('imp.trip1.desc'),
        badge: t('imp.trip1.badge'),
        posted: `${t('imp.posted')} · May 3, 2026`,
        icon: 'star',
      },
      {
        id: '2',
        title: t('imp.trip2.title'),
        description: t('imp.trip2.desc'),
        posted: `${t('imp.posted')} · Dec 20, 2024`,
        icon: 'plus',
      },
      {
        id: '3',
        title: t('imp.trip3.title'),
        description: t('imp.trip3.desc'),
        posted: `${t('imp.posted')} · Dec 30, 2024`,
        icon: 'waves',
      },
    ],
    [t]
  )

  return (
    <section id="impact" className="scroll-mt-28 section-y px-4 sm:px-8 lg:px-12">
      <motion.div className="mx-auto max-w-7xl" {...m}>
        <div className="text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-toxic sm:text-sm">
            {t('imp.kicker')}
          </p>
          <h2
            className="heading-eco-neon font-heading mt-6 text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl dark:text-white"
            style={{ fontWeight: 800 }}
          >
            {t('imp.title')}
          </h2>
          <p className="text-muted-eco mx-auto mt-8 max-w-2xl text-lg lg:text-xl">
            {t('imp.lead')}
          </p>
        </div>

        <motion.div
          className="glass-card mt-16 rounded-3xl p-6 sm:mt-20 sm:p-10"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px', amount: 0.2 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-toxic sm:text-xs">
                {t('imp.chartKicker')}
              </p>
              <p
                className="font-heading mt-2 text-2xl font-extrabold text-zinc-950 sm:text-3xl dark:text-white"
                style={{ fontWeight: 800 }}
              >
                {t('imp.chartTitle')}
              </p>
            </div>
            <p className="text-label-eco text-sm">{t('imp.chartSub')}</p>
          </div>
          <div className="mt-8 h-48 w-full min-w-0 sm:h-56" style={{ minHeight: '192px' }}>
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    stroke={chartDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="t"
                    stroke={chartDark ? '#ffffff33' : '#00000033'}
                    tick={{ fill: chartDark ? '#ffffff88' : '#52525b', fontSize: 11 }}
                  />
                  <YAxis
                    stroke={chartDark ? '#ffffff33' : '#00000033'}
                    tick={{ fill: chartDark ? '#ffffff88' : '#52525b', fontSize: 11 }}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      background: chartDark ? '#0a0a0a' : '#fafafa',
                      border: chartDark
                        ? '1px solid rgba(255,255,255,0.1)'
                        : '1px solid rgba(0,0,0,0.08)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: chartDark ? '#fff' : '#18181b' }}
                    formatter={(v) => (v != null ? [`${v} kg`, t('imp.co2Saved')] : ['', ''])}
                  />
                  <Line
                    type="monotone"
                    dataKey="kg"
                    stroke="#36ff97"
                    strokeWidth={3}
                    dot={{ fill: '#36ff97', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#b8ffe0' }}
                    isAnimationActive
                    animationDuration={1400}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-toxic/5 rounded-xl animate-pulse" />
            )}
          </div>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-3 lg:mt-20 lg:gap-10">
          {trips.map((trip, i) => {
            const isZuj = trip.id === '1'
            return (
              <motion.article
                key={trip.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className={`glass-card flex flex-col rounded-3xl border p-8 ${
                  isZuj
                    ? 'border-toxic/45 shadow-[0_0_56px_-12px_rgba(54,255,151,0.45)]'
                    : 'border-black/10 dark:border-white/12'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <TripIcon type={trip.icon} />
                  {trip.badge && (
                    <span className="rounded-full border border-black/10 bg-white/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-toxic/90 dark:border-white/10 dark:bg-black/40">
                      {trip.badge}
                    </span>
                  )}
                </div>
                <h3
                  className="font-heading mt-6 text-xl font-extrabold text-zinc-950 dark:text-white"
                  style={{ fontWeight: 800 }}
                >
                  {trip.title}
                </h3>
                <p className="text-muted-eco mt-2 text-base dark:text-white/82">{trip.description}</p>
                {isZuj && <p className="mt-2 text-xs font-medium text-toxic/90">{t('imp.trip1.note')}</p>}
                <Link to={startPath} className="mt-4 text-sm font-medium text-zinc-900 hover:text-toxic dark:text-white">
                  {t('imp.view')}
                </Link>
                <div className="text-label-eco mt-4 border-t border-black/10 pt-4 text-xs dark:border-white/10">
                  {trip.posted}
                </div>
              </motion.article>
            )
          })}
        </div>
      </motion.div>
    </section>
  )
}
