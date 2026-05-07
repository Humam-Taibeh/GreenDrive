import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { BrandLogo } from '../components/brand/BrandLogo'
import { useAuth } from '../contexts/AuthContext'
import { useLocale } from '../contexts/LocaleContext'
import { firebaseConfigured } from '../firebase/config'

type AuthMode = 'signin' | 'signup'

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

export function AuthVaultPage() {
  const { t, locale } = useLocale()
  const { user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail } = useAuth()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [vehicleType, setVehicleType] = useState('petrol')
  const isArabic = locale === 'ar'

  const isBusy = loading || !firebaseConfigured
  const title = isArabic ? 'الدخول إلى النظام البيئي' : 'Access the Ecosystem'
  const subtitle = isArabic ? 'أهلاً بك مجدداً، أيها القائد.' : 'Welcome back, Lead.'
  
  // ... helper and corporateNote logic ...

  const handleSubmit = async () => {
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, firstName, vehicleType)
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err) {
      console.error(err)
      alert('Authentication failed. Check your credentials.')
    }
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="relative mx-auto flex min-h-[100dvh] min-h-svh w-full items-center justify-center overflow-visible px-4 py-24 sm:px-6">
      <div
        className="group relative w-full max-w-3xl overflow-hidden rounded-[1.9rem] border border-toxic/45 bg-white/6 p-7 font-mono shadow-[0_22px_120px_-48px_rgba(54,255,151,0.95)] backdrop-blur-[34px] transition-shadow duration-300 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:content-[''] before:[background-image:repeating-linear-gradient(to_bottom,rgba(54,255,151,0.16)_0px,rgba(54,255,151,0.16)_1px,transparent_2px,transparent_4px)] before:opacity-78 before:mix-blend-screen before:animate-[auth-scanline-sweep_0.72s_linear_infinite] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] after:bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.02)_0px,rgba(255,255,255,0.02)_1px,transparent_2px,transparent_3px)] focus-within:vault-hv-pulse dark:bg-black/35 sm:p-10"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <div className="pointer-events-none absolute inset-[1px] rounded-[calc(1.9rem-1px)] border border-white/15 dark:border-white/10" />
        <div className="relative">
          <div className="mb-8 flex items-center justify-between gap-3">
            <BrandLogo wordmarkClassName="text-base sm:text-lg" />
            <span className="rounded-full border border-toxic/35 bg-toxic/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-toxic">
              Vault Access
            </span>
          </div>

          <h1 className="font-heading text-3xl font-black text-zinc-950 dark:text-white sm:text-4xl">{title}</h1>
          
          <div className="mt-6 grid grid-cols-2 rounded-2xl border border-white/15 bg-black/10 p-1.5 dark:bg-white/5">
            <button type="button" onClick={() => setMode('signin')} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${mode === 'signin' ? 'bg-toxic text-onyx' : 'text-zinc-800 dark:text-white/75'}`}>
              {isArabic ? 'تسجيل الدخول' : 'Sign in'}
            </button>
            <button type="button" onClick={() => setMode('signup')} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${mode === 'signup' ? 'bg-toxic text-onyx' : 'text-zinc-800 dark:text-white/75'}`}>
              {isArabic ? 'إنشاء حساب' : 'Sign up'}
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {mode === 'signup' && (
              <>
                <label className="relative block">
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} type="text" placeholder=" " className="peer auth-neon-input w-full border-b border-toxic/45 bg-transparent px-1 pt-5 pb-2.5 text-sm outline-none dark:text-white" />
                  <span className="pointer-events-none absolute start-1 top-1 text-xs font-semibold text-zinc-600 transition-all dark:text-white/55 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-toxic">
                    {isArabic ? 'الاسم الأول' : 'First Name'}
                  </span>
                </label>
                <div className="relative block">
                  <span className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-toxic/70">
                    {isArabic ? 'تخصيص نمط المركبة' : 'Deploy Vehicle Profile'}
                  </span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(['petrol', 'diesel', 'hybrid', 'electric'] as const).map((v) => {
                      const active = vehicleType === v
                      const label = v.charAt(0).toUpperCase() + v.slice(1)
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setVehicleType(v)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all duration-300 ${
                            active
                              ? 'border-toxic/70 bg-toxic/15 shadow-[0_0_15px_-5px_rgba(54,255,151,0.5)]'
                              : 'border-white/10 bg-white/5 hover:border-white/20'
                          }`}
                        >
                          <span className="text-lg">
                            {v === 'petrol' ? '⛽' : v === 'diesel' ? '🔧' : v === 'hybrid' ? '🔋' : '⚡'}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-toxic' : 'text-white/50'}`}>
                            {v === 'electric' ? 'EV' : label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
            <label className="relative block">
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder=" " className="peer auth-neon-input w-full border-b border-toxic/45 bg-transparent px-1 pt-5 pb-2.5 text-sm outline-none dark:text-white" />
              <span className="pointer-events-none absolute start-1 top-1 text-xs font-semibold text-zinc-600 transition-all dark:text-white/55 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-toxic">
                {isArabic ? 'البريد الإلكتروني' : 'Email'}
              </span>
            </label>
            <label className="relative block">
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder=" " className="peer auth-neon-input w-full border-b border-toxic/45 bg-transparent px-1 pt-5 pb-2.5 text-sm outline-none dark:text-white" />
              <span className="pointer-events-none absolute start-1 top-1 text-xs font-semibold text-zinc-600 transition-all dark:text-white/55 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-toxic">
                {isArabic ? 'كلمة المرور' : 'Password'}
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isBusy}
            className="btn-primary-toxic mt-6 w-full rounded-xl bg-toxic py-3.5 text-sm font-extrabold text-onyx shadow-[0_0_26px_-8px_rgba(54,255,151,0.8)]"
          >
            {mode === 'signin' ? (isArabic ? 'الدخول الآمن' : 'Secure Sign In') : (isArabic ? 'إنشاء حساب آمن' : 'Secure Sign Up')}
          </button>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={() => void signInWithGoogle()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur-xl">
              <GoogleIcon /> Google
            </button>
            <button disabled className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white opacity-50">
              <GitHubIcon /> GitHub
            </button>
          </div>
          <div className="mt-6 flex items-center justify-between text-xs text-zinc-600 dark:text-white/55">
            <Link to="/" className="transition hover:text-toxic">
              {isArabic ? 'العودة إلى الواجهة الرئيسية' : 'Back to landing'}
            </Link>
            <span>{t('foot.legal')}</span>
          </div>
        </div>
      </div>
    </main>
  )
}
