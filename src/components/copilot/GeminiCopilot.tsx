/**
 * Output by Antigravity IDE
 * Personalized Gemini copilot — Firebase profile context; RTL + locale-aware replies.
 */
import { useState, useRef, useEffect, useMemo } from 'react'
import { LazyMotion, domMax, m, AnimatePresence } from 'framer-motion'
import { sendGeminiMessage, type CopilotContext } from '../../services/gemini'
import type { ChatMessage } from '../../types'

import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useLocale } from '../../contexts/LocaleContext'
import { 
  computeTripEmissions, 
  calculateTrafficWaste, 
  projectYearlyImpact,
  type VehicleType 
} from '../../lib/vehicleProfiles'

function RobotIcon({ className = '' }: { className?: string }) {
  return (
    <m.span className={`relative inline-flex ${className}`} aria-hidden>
      <m.svg
        viewBox="0 0 32 32"
        className="h-7 w-7"
        fill="none"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <rect x="6" y="10" width="20" height="16" rx="4" fill="#0a0a0a" stroke="#36ff97" strokeWidth="1.5" />
        <circle cx="13" cy="17" r="2" fill="#36ff97" />
        <circle cx="19" cy="17" r="2" fill="#36ff97" />
        <path d="M12 22c1.2 1.2 6.8 1.2 8 0" stroke="#36ff97" strokeWidth="1.5" strokeLinecap="round" />
        <m.line
          x1="16"
          y1="6"
          x2="16"
          y2="10"
          stroke="#36ff97"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <circle cx="16" cy="5" r="2" fill="#36ff97" />
      </m.svg>
      <m.span
        className="absolute -end-0.5 -top-0.5 h-2 w-2 rounded-full bg-toxic shadow-[0_0_10px_#36ff97]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
    </m.span>
  )
}

export interface GeminiCopilotProps {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  selectedRoute?: RouteOption | null
  destination?: string | null
  hasActiveRoute?: boolean
  activeRouteData?: {
    type: string
    distance: string
    duration: string
  }
  isDark?: boolean
  briefing?: string | null
  metrics?: any
  currentCharge?: number
}

export function GeminiCopilot({ 
  isOpen: externalOpen, 
  onOpenChange, 
  selectedRoute, 
  destination,
  hasActiveRoute,
  activeRouteData,
  isDark: externalIsDark,
  briefing,
  metrics,
  currentCharge: externalCharge
}: GeminiCopilotProps) {
  const { profile, user } = useAuth()
  const { resolvedTheme } = useTheme()
  const { t, locale } = useLocale()
  const dark = externalIsDark !== undefined ? externalIsDark : resolvedTheme === 'dark'

  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen

  const setOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof val === 'function' ? val(open) : val
    if (onOpenChange) onOpenChange(next)
    else setInternalOpen(next)
  }

  const copilotCtx: CopilotContext = useMemo(
    () => ({
      firstName: profile?.firstName ?? user?.displayName?.split(' ')[0],
      vehicleType: profile?.vehicleType ?? 'Petrol',
      totalCo2SavedKg: profile?.totalCo2SavedKg,
      savedRoutesCount: profile?.savedRoutes?.length,
      locale: locale as CopilotLocale,
      destination,
      hasActiveRoute,
      activeRouteData,
      currentChargePercent: externalCharge ?? profile?.currentChargePercent ?? 85,
    }),
    [profile, user, locale, destination, hasActiveRoute, activeRouteData, externalCharge]
  )

  const welcomeText = useMemo(() => {
    const name = copilotCtx.firstName || 'Lead'
    const vt = copilotCtx.vehicleType || 'Petrol'
    const kg = (copilotCtx.totalCo2SavedKg ?? 0).toFixed(1)
    if (locale === 'ar') {
      if (copilotCtx.firstName)
        return `مرحباً ${name}! أنا مساعدك الشخصي لمركبة الـ ${vt}. لقد وفرت ${kg} كغ من CO₂ حتى الآن. اسألني عن أفضل مسار لمشوارك القادم.`
      return 'مرحباً — أنا مساعد الإيكو المخصص. سجّل الدخول بـ Google لأربط النصائح بمساراتك وتاريخ CO₂ في Firestore.'
    }
    if (copilotCtx.firstName)
      return `Welcome back, ${name}! As your ${vt} specialist, I'm tracking your progress (~${kg} kg CO₂ saved). Ready to optimize your next route for Jordan's terrain?`
    return `Hi — I'm your Personalized Eco Copilot. Sign in to tailor tips to your vehicle type and CO₂ history.`
  }, [copilotCtx, locale])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeMetrics, setActiveMetrics] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'w', role: 'assistant', text: '', at: 0 },
  ])
  const listRef = useRef<HTMLDivElement>(null)

  const displayMessages = useMemo(
    () => messages.map((m) => (m.id === 'w' ? { ...m, text: welcomeText } : m)),
    [messages, welcomeText]
  )

  // P2: Handle the consolidated briefing from parent
  useEffect(() => {
    if (briefing && !messages.some(m => m.text === briefing)) {
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', text: briefing, at: Date.now() }
      ])
    }
  }, [briefing])

  // Sync metrics for follow-up turns
  useEffect(() => {
    if (metrics) setActiveMetrics(metrics)
  }, [metrics])

  useEffect(() => {
    if (!open) return
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [displayMessages, open, loading])

  // Removed automated per-route useEffect (Decommissioned P2)

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text, at: Date.now() }
    const currentMessages = [...messages, userMsg]
    setMessages(currentMessages)
    setLoading(true)
    const reply = await sendGeminiMessage(text, {
      ...copilotCtx,
      copilotRouteMetrics: activeMetrics // ✅ Restore metrics for follow-up turns
    }, currentMessages)
    setLoading(false)
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: 'assistant', text: reply, at: Date.now() },
    ])
  }

  const ariaClose = locale === 'ar' ? 'إغلاق المساعد' : 'Close eco assistant'
  const ariaOpen = locale === 'ar' ? 'فتح المساعد' : 'Open eco assistant'

  return (
    <LazyMotion features={domMax} strict>
      <div className="pointer-events-none fixed bottom-28 end-4 z-[500] flex flex-col items-end sm:bottom-32 sm:end-6">
        <AnimatePresence>
          {open && (
            <m.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className={`pointer-events-auto mb-3 flex w-[min(100vw-2rem,420px)] flex-col overflow-hidden rounded-3xl border shadow-[0_0_80px_-20px_rgba(54,255,151,0.35)] backdrop-blur-[40px] backdrop-saturate-150 ${
              dark
                ? 'border-white/15 bg-[rgba(0,0,0,0.62)]'
                : 'border-black/10 bg-[rgba(255,255,255,0.88)]'
            }`}
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
          >
            <div
              className={`flex items-center justify-between gap-4 border-b px-4 py-4 sm:px-5 ${
                dark ? 'border-white/10' : 'border-black/10'
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <RobotIcon />
                <div className="min-w-0 text-start">
                  <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-zinc-950'}`}>{t('cop.title')}</p>
                  <p className={`truncate text-[10px] ${dark ? 'text-white/50' : 'text-zinc-950'}`}>
                    {t('cop.sub')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setOpen(false)}
                className={`rounded-lg border p-1.5 transition ${dark ? 'border-white/10 text-white/40 hover:text-white' : 'border-black/5 text-zinc-400 hover:text-zinc-900'}`}
              >
                <m.svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </m.svg>
              </button>
            </div>
            <div ref={listRef} className="max-h-72 space-y-3 overflow-y-auto px-4 py-3 text-sm scrollbar-none">
              {displayMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-xl px-3 py-2 text-start ${
                    msg.role === 'user'
                      ? `ms-12 bg-toxic/15 ${dark ? 'text-white' : 'text-zinc-950'}`
                      : `me-8 border bg-[rgba(255,255,255,0.06)] ${
                          dark
                            ? 'border-white/10 text-white/85'
                            : 'border-black/10 text-zinc-950'
                        }`
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {loading && <p className="text-xs text-toxic/80 ms-4">{t('cop.thinking')}</p>}
            </div>
            <div className={`flex gap-2 border-t p-3 overflow-hidden ${dark ? 'border-white/10' : 'border-black/10'}`}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder={t('cop.placeholder')}
                className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm focus:border-toxic/50 focus:outline-none ${
                  dark
                    ? 'border-white/10 bg-black/40 text-white placeholder:text-white/35'
                    : 'border-black/10 bg-white/90 text-zinc-950 placeholder:text-zinc-400'
                }`}
              />
              <button
                type="button"
                onClick={send}
                disabled={loading}
                className="rounded-xl bg-toxic px-4 py-2 text-sm font-bold text-onyx disabled:opacity-50"
                style={{ fontWeight: 800 }}
              >
                {t('cop.send')}
              </button>
            </div>
            </m.div>
          )}
        </AnimatePresence>

        <m.button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-toxic/40 bg-gradient-to-br from-[rgba(54,255,151,0.35)] to-[rgba(255,255,255,0.08)] text-toxic shadow-[0_0_32px_-4px_rgba(54,255,151,0.65)] backdrop-blur-md"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.97 }}
          aria-expanded={open}
          aria-label={open ? ariaClose : ariaOpen}
        >
          <RobotIcon className="scale-110" />
        </m.button>
      </div>
    </LazyMotion>
  )
}
