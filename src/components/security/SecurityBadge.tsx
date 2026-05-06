/**
 * Output by Antigravity IDE
 * Enterprise security & privacy seals — TLS, GDPR posture, certified secure (Cyber Security domain).
 */
import { LazyMotion, domMax, m } from 'framer-motion'
import { useLocale } from '../../contexts/LocaleContext'

type SealTone = 'emerald' | 'slate' | 'violet'

function Seal({
  title,
  subtitle,
  tone,
  compact,
  icon,
  certificate,
  className = '',
}: {
  title: string
  subtitle: string
  tone: SealTone
  compact?: boolean
  icon: 'lock' | 'shield' | 'cert' | 'gdpr'
  /** Official certificate chrome for cyber specialist cards (high contrast, authority glow). */
  certificate?: boolean
  className?: string
}) {
  const ring =
    tone === 'emerald'
      ? 'from-toxic/40 via-white/30 to-cyan-300/30'
      : tone === 'violet'
        ? 'from-violet-400/50 via-toxic/25 to-white/20'
        : 'from-zinc-300/60 via-white/40 to-zinc-400/40'

  return (
    <LazyMotion features={domMax} strict>
      <m.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`relative inline-flex overflow-hidden rounded-2xl ${certificate ? 'seal-certificate-light' : ''} ${className}`}
      >
        <m.div
          className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-br opacity-95 ${ring}`}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: certificate ? 48 : 22, repeat: Infinity, ease: 'linear' }}
          aria-hidden
        />
        <div
          className={`seal-certificate-inner relative flex items-center gap-2.5 rounded-2xl border border-zinc-900/14 bg-white/95 px-3 py-2 backdrop-blur-xl dark:border-white/14 dark:bg-black/70 ${
            compact ? 'py-1.5' : 'sm:px-4 sm:py-2.5'
          }`}
          style={
            certificate
              ? undefined
              : {
                  boxShadow:
                    '0 0 0 0.5px rgba(54,255,151,0.22) inset, 0 0 0 1px rgba(27,67,50,0.08) inset, 0 12px 40px -18px rgba(0,0,0,0.12), 0 0 32px -10px rgba(54,255,151,0.25)',
                }
          }
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-toxic/25 to-white/90 ring-1 ring-toxic/50 dark:from-toxic/25 dark:to-white/5 dark:ring-toxic/40 ${
              certificate ? 'ring-2 ring-toxic/60 shadow-[0_0_16px_rgba(54,255,151,0.45)]' : ''
            }`}
          >
            {icon === 'lock' && <LockGlyph className="h-4 w-4 text-toxic" />}
            {icon === 'shield' && <ShieldGlyph className="h-4 w-4 text-toxic" />}
            {icon === 'cert' && <CertGlyph className="h-4 w-4 text-toxic" />}
            {icon === 'gdpr' && <GdprGlyph className="h-4 w-4 text-violet-600 dark:text-violet-300" />}
          </span>
          <div className="min-w-0 text-start leading-tight">
            <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.2em] text-zinc-800 dark:text-toxic/90">
              {subtitle}
            </p>
            <p
              className={`truncate font-heading font-extrabold tracking-tight text-zinc-950 dark:text-white ${
                compact ? 'text-[10px]' : 'text-[11px] sm:text-xs'
              }`}
              style={{ fontWeight: 800 }}
            >
              {title}
            </p>
          </div>
        </div>
      </m.div>
    </LazyMotion>
  )
}

function LockGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm-3 8V6a3 3 0 016 0v3H9z" />
    </svg>
  )
}

function ShieldGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  )
}

function CertGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" d="M12 3l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V7l7-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  )
}

function GdprGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M8 12h8M12 8v8" />
    </svg>
  )
}

export function SecurityBadge({
  className = '',
  compact,
  certificate,
}: {
  className?: string
  compact?: boolean
  certificate?: boolean
}) {
  const { t } = useLocale()
  return (
    <Seal
      title={t('seal.tls')}
      subtitle={t('seal.tlsSub')}
      tone="emerald"
      compact={compact}
      certificate={certificate}
      icon="lock"
      className={className}
    />
  )
}

export function PrivacyBadge({ className = '', compact }: { className?: string; compact?: boolean }) {
  const { t } = useLocale()
  return (
    <Seal
      title={t('seal.priv')}
      subtitle={t('seal.privSub')}
      tone="slate"
      compact={compact}
      icon="shield"
      className={className}
    />
  )
}

export function CertifiedSecureBadge({
  className = '',
  compact,
  certificate,
}: {
  className?: string
  compact?: boolean
  certificate?: boolean
}) {
  const { t } = useLocale()
  return (
    <Seal
      title={t('seal.cert')}
      subtitle={t('seal.certSub')}
      tone="emerald"
      compact={compact}
      certificate={certificate}
      icon="cert"
      className={className}
    />
  )
}

export function GdprSealBadge({ className = '', compact }: { className?: string; compact?: boolean }) {
  const { t } = useLocale()
  return (
    <Seal
      title={t('seal.gdpr')}
      subtitle={t('seal.gdprSub')}
      tone="violet"
      compact={compact}
      icon="gdpr"
      className={className}
    />
  )
}

export function SecurityStrip({
  className = '',
  variant = 'standard',
}: {
  className?: string
  variant?: 'standard' | 'enterprise'
}) {
  const wrap =
    variant === 'enterprise'
      ? 'flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 sm:justify-start'
      : 'flex flex-wrap items-center justify-center gap-2.5 sm:justify-end'

  if (variant === 'enterprise') {
    return (
      <div className={`${wrap} ${className}`}>
        <CertifiedSecureBadge compact />
        <SecurityBadge compact />
        <GdprSealBadge compact />
        <PrivacyBadge compact />
      </div>
    )
  }

  return (
    <div className={`${wrap} ${className}`}>
      <SecurityBadge compact />
      <PrivacyBadge compact />
    </div>
  )
}
