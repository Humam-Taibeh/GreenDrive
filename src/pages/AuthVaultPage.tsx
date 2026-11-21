import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { BrandLogo } from '../components/brand/BrandLogo'
import { useAuth } from '../contexts/AuthContext'
import { useLocale } from '../contexts/LocaleContext'
import { firebaseConfigured } from '../firebase/config'

type AuthMode = 'signin' | 'signup'
type VehicleChoice = 'petrol' | 'diesel' | 'hybrid' | 'electric'

const VEHICLES: { id: VehicleChoice; en: string; ar: string }[] = [
  { id: 'petrol', en: 'Petrol', ar: 'بنزين' },
  { id: 'diesel', en: 'Diesel', ar: 'ديزل' },
  { id: 'hybrid', en: 'Hybrid', ar: 'هجين' },
  { id: 'electric', en: 'Electric', ar: 'كهربائي' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.8 2.9l3 2.3c1.8-1.6 2.8-4 2.8-7 0-.7-.1-1.4-.2-2H12z" />
      <path fill="#34A853" d="M12 22c2.5 0 4.6-.8 6.2-2.2l-3-2.3c-.8.5-1.9.9-3.2.9-2.4 0-4.4-1.6-5.1-3.8l-3.1 2.4C5.4 20 8.5 22 12 22z" />
      <path fill="#4A90E2" d="M6.9 14.6c-.2-.5-.3-1.1-.3-1.6s.1-1.1.3-1.6L3.8 9C3.3 10 3 11 3 13s.3 3 1 4l2.9-2.4z" />
      <path fill="#FBBC05" d="M12 7.7c1.4 0 2.6.5 3.5 1.4l2.6-2.6C16.6 5 14.5 4 12 4 8.5 4 5.4 6 3.8 9l3.1 2.4c.7-2.2 2.7-3.7 5.1-3.7z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
      <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5V19c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 .9 1.5 2.4 1.1 2.9.9.1-.6.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-5A3.9 3.9 0 0 1 7 8.6c-.1-.3-.5-1.3.1-2.6 0 0 .8-.3 2.7 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .6 1.3.2 2.3.1 2.6a3.9 3.9 0 0 1 1 2.7c0 3.8-2.3 4.7-4.6 5 .4.3.7.9.7 1.8V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
    </svg>
  )
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
  hint?: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-white/70">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-toxic/70 focus:ring-2 focus:ring-toxic/25 dark:border-white/12 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/30"
      />
      {hint && <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-white/40">{hint}</p>}
    </div>
  )
}

function authErrorMessage(code: string | undefined, ar: boolean): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return ar ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Incorrect email or password.'
    case 'auth/email-already-in-use':
      return ar ? 'هذا البريد مسجّل مسبقاً. جرّب تسجيل الدخول.' : 'This email is already registered. Try signing in.'
    case 'auth/weak-password':
      return ar ? 'كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.' : 'Password is too weak. Use at least 6 characters.'
    case 'auth/too-many-requests':
      return ar ? 'محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.' : 'Too many attempts. Please wait a moment and try again.'
    case 'auth/network-request-failed':
      return ar ? 'تعذّر الاتصال بالشبكة. تحقق من الإنترنت.' : 'Network error. Check your connection and try again.'
    default:
      return ar ? 'تعذّر إكمال العملية. حاول مرة أخرى.' : 'Something went wrong. Please try again.'
  }
}

export function AuthVaultPage() {
  const { locale } = useLocale()
  const { user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail } = useAuth()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleChoice>('petrol')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isArabic = locale === 'ar'

  const unavailable = !firebaseConfigured
  const busy = loading || submitting

  const validate = (): string | null => {
    if (mode === 'signup' && !firstName.trim()) return isArabic ? 'أدخل اسمك الأول.' : 'Please enter your first name.'
    if (!EMAIL_RE.test(email.trim())) return isArabic ? 'أدخل بريداً إلكترونياً صحيحاً.' : 'Please enter a valid email address.'
    if (password.length < 6) return isArabic ? 'كلمة المرور يجب ألا تقل عن 6 أحرف.' : 'Password must be at least 6 characters.'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy || unavailable) return
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'signup') await signUpWithEmail(email.trim(), password, firstName.trim(), vehicleType)
      else await signInWithEmail(email.trim(), password)
    } catch (err) {
      setError(authErrorMessage((err as { code?: string })?.code, isArabic))
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    if (busy || unavailable) return
    setError(null)
    setSubmitting(true)
    try {
      await signInWithGoogle()
    } finally {
      setSubmitting(false)
    }
  }

  if (user) return <Navigate to="/" replace />

  const title = mode === 'signin' ? (isArabic ? 'مرحباً بعودتك' : 'Welcome back') : isArabic ? 'أنشئ حسابك' : 'Create your account'
  const subtitle =
    mode === 'signin'
      ? isArabic
        ? 'سجّل الدخول لحفظ مركباتك وتفضيلاتك ومساراتك.'
        : 'Sign in to keep your vehicle, preferences and saved places.'
      : isArabic
        ? 'ثوانٍ قليلة لتبدأ بتخطيط رحلات أنظف وأوفر.'
        : 'It takes a few seconds to start planning cleaner, cheaper trips.'

  const tabClass = (active: boolean) =>
    `rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
      active ? 'bg-toxic text-onyx shadow-[0_8px_20px_-10px_rgba(54,255,151,0.9)]' : 'text-zinc-700 hover:text-zinc-950 dark:text-white/70 dark:hover:text-white'
    }`

  return (
    <main
      className="relative mx-auto grid min-h-[100dvh] w-full max-w-[90rem] items-center gap-12 px-5 py-24 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:px-14"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <section className="hidden lg:block">
        <p className="font-mono text-sm font-semibold uppercase tracking-[0.28em] text-toxic">
          {isArabic ? 'ملاحة مستدامة' : 'Sustainable navigation'}
        </p>
        <h2
          className="hero-title-pop heading-eco-neon toxic-glow-text font-heading mt-8 text-[4.5rem] font-extrabold leading-[0.98] tracking-tight text-zinc-950 xl:text-[5.5rem] dark:text-white"
          style={{ fontWeight: 800 }}
        >
          {isArabic ? 'قُد أنظف. ادفع أقل.' : 'Drive greener. Spend less.'}
        </h2>
        <p className="mt-10 max-w-xl text-xl leading-relaxed text-zinc-800 dark:text-white/72">
          {isArabic
            ? 'قارن المسارات حسب الوقود والتكلفة والانبعاثات، مع أخذ تضاريس الطريق بعين الاعتبار.'
            : 'Compare routes by fuel, cost and CO₂ — with road elevation taken into account.'}
        </p>
        <ul className="mt-10 space-y-4 text-base font-medium text-zinc-800 dark:text-white/80">
          {(isArabic
            ? ['احفظ مركبتك وتفضيلاتك وأماكنك', 'ابدأ مباشرة كضيف بدون أي حساب', 'مجاني بالكامل']
            : ['Save your vehicle, preferences and places', 'Start instantly as a guest — no account', 'Free to use']
          ).map((line) => (
            <li key={line} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-toxic/50 bg-toxic/15 text-toxic">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
              {line}
            </li>
          ))}
        </ul>
      </section>

      <div
        className="glass-card relative mx-auto w-full max-w-lg rounded-[2rem] p-8 shadow-[0_40px_120px_-48px_rgba(54,255,151,0.6)] sm:p-11 lg:mx-0 lg:ms-auto"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <div className="mb-7 flex items-center justify-between gap-3">
          <BrandLogo wordmarkClassName="text-base sm:text-lg" />
          <Link
            to="/"
            className="text-xs font-medium text-zinc-600 transition hover:text-toxic dark:text-white/55"
          >
            {isArabic ? 'الرئيسية' : 'Home'}
          </Link>
        </div>

        <h1 className="font-heading text-3xl font-extrabold text-zinc-950 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/55">{subtitle}</p>

        <div
          role="tablist"
          className="mt-6 grid grid-cols-2 gap-1 rounded-2xl border border-black/10 bg-black/[0.04] p-1 dark:border-white/10 dark:bg-white/[0.04]"
        >
          <button type="button" role="tab" aria-selected={mode === 'signin'} onClick={() => { setMode('signin'); setError(null) }} className={tabClass(mode === 'signin')}>
            {isArabic ? 'تسجيل الدخول' : 'Sign in'}
          </button>
          <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => { setMode('signup'); setError(null) }} className={tabClass(mode === 'signup')}>
            {isArabic ? 'إنشاء حساب' : 'Sign up'}
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          {mode === 'signup' && (
            <>
              <Field id="auth-first-name" label={isArabic ? 'الاسم الأول' : 'First name'} type="text" value={firstName} onChange={setFirstName} autoComplete="given-name" />
              <fieldset>
                <legend className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-white/70">
                  {isArabic ? 'نوع المركبة' : 'Vehicle type'}
                </legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {VEHICLES.map((v) => {
                    const active = vehicleType === v.id
                    return (
                      <button
                        key={v.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setVehicleType(v.id)}
                        className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                          active
                            ? 'border-toxic/70 bg-toxic/15 text-zinc-950 dark:text-white'
                            : 'border-black/10 bg-white/50 text-zinc-600 hover:border-toxic/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60'
                        }`}
                      >
                        {isArabic ? v.ar : v.en}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            </>
          )}
          <Field id="auth-email" label={isArabic ? 'البريد الإلكتروني' : 'Email'} type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Field
            id="auth-password"
            label={isArabic ? 'كلمة المرور' : 'Password'}
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            hint={mode === 'signup' ? (isArabic ? '6 أحرف على الأقل' : 'At least 6 characters') : undefined}
          />

          {(error || unavailable) && (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-600 dark:text-red-300">
              {unavailable
                ? isArabic
                  ? 'خدمة تسجيل الدخول غير متاحة حالياً.'
                  : 'Sign-in is currently unavailable.'
                : error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || unavailable}
            className="btn-primary-toxic w-full rounded-xl bg-toxic py-3.5 text-sm font-extrabold text-onyx shadow-[0_0_26px_-8px_rgba(54,255,151,0.8)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? isArabic ? 'لحظة…' : 'Please wait…'
              : mode === 'signin'
                ? isArabic ? 'تسجيل الدخول' : 'Sign in'
                : isArabic ? 'إنشاء الحساب' : 'Create account'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-white/35">
          <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          {isArabic ? 'أو' : 'or'}
          <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={busy || unavailable}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:border-toxic/50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/12 dark:bg-white/[0.06] dark:text-white"
          >
            <GoogleIcon /> Google
          </button>
          <button
            type="button"
            disabled
            title={isArabic ? 'قريباً' : 'Coming soon'}
            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/40 px-4 py-3 text-sm font-semibold text-zinc-500 opacity-60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50"
          >
            <GitHubIcon /> GitHub
          </button>
        </div>

        <Link
          to="/map"
          className="mt-6 block w-full rounded-xl border border-toxic/40 bg-toxic/10 px-4 py-3 text-center text-sm font-bold text-toxic transition hover:bg-toxic/20"
        >
          {isArabic ? 'المتابعة كضيف — بدون حساب' : 'Continue as guest — no account needed'}
        </Link>

        <p dir="ltr" className="mt-7 text-center text-[11px] text-zinc-500 dark:text-white/35">© 2026 GreenDrive</p>
      </div>
    </main>
  )
}
