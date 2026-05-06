/**
 * Output by Antigravity IDE
 * AI-Leaf mark + GreenDrive wordmark — stroke draw on mount, periodic pulse glow.
 */
import { useId } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AMBIENT_CYCLE_SEC, ECO_PULSE_SEC } from '../../lib/ambientCycle'
import { scrollToSectionByHash } from '../../lib/scrollToSection'

const PIN_D =
  'M16 2.5C10.5 2.5 6 7 6 12.5C6 18 11 24.5 16 30.5C21 24.5 26 18 26 12.5C26 7 21.5 2.5 16 2.5Z'
const WAVE_D =
  'M11 12.5C11 12.5 13 9.5 16 12.5C19 15.5 21 12.5 21 12.5'
const CORE_D =
  'M16 9.5C16 9.5 13 12.5 16 15.5C19 12.5 16 9.5 16 9.5'

export function BrandLogo({
  to = '/',
  className = '',
  wordmarkClassName = '',
}: {
  to?: string
  className?: string
  wordmarkClassName?: string
}) {
  const gid = useId().replace(/:/g, '')
  const location = useLocation()
  const navigate = useNavigate()

  const scrollToHero = () => {
    scrollToSectionByHash('#hero-zone', { block: 'start' })
  }

  return (
    <Link
      to={to}
      className={`group flex items-center gap-2.5 sm:gap-3 ${className}`}
      aria-label="GreenDrive home"
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        if (location.pathname === '/') {
          e.preventDefault()
          scrollToHero()
          return
        }
        e.preventDefault()
        navigate('/', { state: { scrollToHero: true } })
      }}
    >
      <motion.span
        className="relative flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10"
        aria-hidden
      >
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-xl bg-toxic/25 blur-md"
          animate={{
            opacity: [0.35, 0.85, 0.35],
            scale: [0.92, 1.08, 0.92],
          }}
          transition={{ duration: ECO_PULSE_SEC, repeat: Infinity, ease: 'easeInOut' }}
        />
        <svg
          viewBox="0 0 32 32"
          className="relative h-full w-full drop-shadow-[0_0_10px_rgba(54,255,151,0.4)]"
          fill="none"
        >
          <defs>
            <linearGradient id={`${gid}-lg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#36ff97" />
              <stop offset="100%" stopColor="#0d7a4a" />
            </linearGradient>
          </defs>
          <motion.path
            d={PIN_D}
            stroke={`url(#${gid}-lg)`}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 1.35, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.35 },
            }}
          />
          <motion.path
            d={WAVE_D}
            stroke={`url(#${gid}-lg)`}
            strokeWidth={1.2}
            strokeLinecap="round"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: [0.4, 1, 0.4], pathLength: 1 }}
            transition={{
              opacity: { duration: ECO_PULSE_SEC, repeat: Infinity, ease: 'easeInOut' },
              pathLength: { duration: 1.5, delay: 0.5 },
            }}
          />
          <motion.path
            d={CORE_D}
            fill={`url(#${gid}-lg)`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
            transition={{
              duration: ECO_PULSE_SEC,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <circle cx="16" cy="12.5" r="1.5" fill="#36ff97" />
        </svg>
      </motion.span>
      <motion.span
        className={`font-heading text-lg font-extrabold tracking-[-0.04em] text-zinc-950 sm:text-xl dark:text-white ${wordmarkClassName}`}
        style={{ fontWeight: 800 }}
        animate={{
          textShadow: [
            '0 0 18px rgba(54,255,151,0.12)',
            '0 0 32px rgba(54,255,151,0.38)',
            '0 0 18px rgba(54,255,151,0.12)',
          ],
        }}
        transition={{ duration: AMBIENT_CYCLE_SEC, repeat: Infinity, ease: 'easeInOut' }}
      >
        GreenDrive
      </motion.span>
    </Link>
  )
}
