/**
 * Route copilot — hardcoded chat responses from live route metrics (no external API).
 */
import { resolveReplyLocale } from '../lib/chatLocale'

export type CopilotLocale = 'en' | 'ar'

/** Metrics from the currently selected route vs fastest (same basis as MapView physics). */
export interface CopilotRouteMetrics {
  fuelSavedLiters: number
  ascentM: number
  estJodSaved: number
  selectedRouteId: string
}

export interface CopilotContext {
  firstName?: string | null
  vehicleType?: string | null
  totalCo2SavedKg?: number
  savedRoutesCount?: number
  locale?: CopilotLocale
  activeRouteHudLine?: string | null
  destination?: string | null
  hasActiveRoute?: boolean
  activeRouteData?: {
    type: string
    distance: string
    duration: string
  }
  currentChargePercent?: number
  /** When set, chat replies use `buildHardcodedRouteChatReply` (live telemetry). */
  copilotRouteMetrics?: CopilotRouteMetrics & { distanceKm: number }
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  at: number
}

export interface NavigationIntent {
  action: 'navigate'
  destinationQuery: string
}

export interface AnalysisIntent {
  action: 'analysis'
  question: string
}

export interface PhysicsIntent {
  action: 'physics'
  question: string
}

export type CopilotIntent = NavigationIntent | AnalysisIntent | PhysicsIntent

export interface RoutePhysicsPayload {
  routeLabel: string
  distanceKm: number
  durationMin: number
  fuelLiters: number | null
  co2Kg: number
  ascentM: number
  locale?: CopilotLocale
}

export function extractNavigationIntent(userText: string): NavigationIntent | null {
  const trimmed = userText.trim()
  if (!trimmed) return null

  const patterns = [
    /(?:i want to go to|go to|navigate to|take me to|drive to|head to)\s+(.+)$/i,
    /(?:وديني|خذني|روح|اروح|أريد الذهاب إلى|ابحث عن|ودّني إلى)\s+(.+)$/i,
  ]

  for (const p of patterns) {
    const m = trimmed.match(p)
    const q = m?.[1]?.trim()
    if (q && q.length > 1) return { action: 'navigate', destinationQuery: q }
  }
  return null
}

export function extractAnalysisIntent(userText: string): AnalysisIntent | null {
  const text = userText.trim()
  if (!text) return null
  const q = text.toLowerCase()
  const hits =
    q.includes('why route') ||
    q.includes('which route') ||
    q.includes('better route') ||
    q.includes('compare route') ||
    q.includes('why is route') ||
    q.includes('ليش') ||
    q.includes('اي مسار') ||
    q.includes('قارن')
  return hits ? { action: 'analysis', question: text } : null
}

export function extractPhysicsIntent(userText: string): PhysicsIntent | null {
  const text = userText.trim()
  if (!text) return null
  const q = text.toLowerCase()
  const hits =
    q.includes('fuel') ||
    q.includes('co2') ||
    q.includes('incline') ||
    q.includes('elevation') ||
    q.includes('ascent') ||
    q.includes('physics') ||
    q.includes('طاقة') ||
    q.includes('وقود') ||
    q.includes('انبعاث') ||
    q.includes('انحدار') ||
    q.includes('ارتفاع')
  return hits ? { action: 'physics', question: text } : null
}

export function classifyCopilotIntent(userText: string): CopilotIntent | null {
  return (
    extractNavigationIntent(userText) ??
    extractPhysicsIntent(userText) ??
    extractAnalysisIntent(userText)
  )
}

export function buildCopilotGreeting(ctx?: CopilotContext): string {
  const line = ctx?.activeRouteHudLine?.trim()
  if (line) return line
  if (ctx?.locale === 'ar') {
    return 'قناة الأوامر · مرتبطة ببيانات المسار الحية (Directions + فيزياء التضاريس).'
  }
  return 'Command channel · live route telemetry (Directions + terrain physics) when analyzed.'
}

export function buildNavigationLockInMessage(resolvedLabel: string, rawQuery: string, locale: CopilotLocale): string {
  const bundle = `${rawQuery} ${resolvedLabel}`.toLowerCase()
  const terrainEn =
    /irbid|إربد|jarash|jerash|جرش/.test(bundle)
      ? 'Watch the Jerash–Ajlun grade work against you on fuel—eco vs fastest will split on climb minutes.'
      : /amman|عمّان|عمان|abdoun|عبدون|sweileh|صويلح|7th|seventh|الدوار|circle/.test(bundle)
        ? 'Amman weave: Sweileh-type grades and 7th Circle delay minutes will show up in duration and implicit mgh work—compare routes on the numbers.'
        : 'Live Directions + elevation model are spinning now—next reply should cite distance, time, fuel or CO₂ from the cards.'

  const terrainAr =
    /irbid|إربد|jarash|jerash|جرش/.test(bundle)
      ? 'منحدرات أريحا–جرش ترفع عمل الـ mgh على المحرك—قارن المسارات على الأرقام الفعلية للصعود والزمن.'
      : /amman|عمّان|عمان|abdoun|عبدون|sweileh|صويلح|7th|seventh|الدوار/.test(bundle)
        ? 'في عمّان: ميل صويلح وازدحام الدواوير (مثل السابع) يظهران في الزمن والطاقة—اربط الشرح بالأرقام لا بالشعارات.'
        : 'جاري ربط Directions مع نموذج الارتفاع—أي رد لاحق يجب أن يستند إلى كم، دقيقة، لتر أو غرام CO₂.'

  if (locale === 'ar') {
    return `تثبيت الوجهة: ${resolvedLabel}. ${terrainAr}`
  }
  return `Locking in ${resolvedLabel}. ${terrainEn}`
}

export function buildRoutePhysicsPrompt(p: RoutePhysicsPayload): string {
  const fuelText = p.fuelLiters === null ? 'EV energy profile (regen on descents where model applies)' : `${p.fuelLiters.toFixed(2)} L fuel`
  const co2g = Math.round(p.co2Kg * 1000)
  if (p.locale === 'ar') {
    return [
      `أنت متخصص فيزياء الطاقة للمسارات. المسار: "${p.routeLabel}".`,
      `حقائق فقط من المحرك: ${p.distanceKm.toFixed(1)} كم، ${p.durationMin} د، ${fuelText}، ${co2g} غ CO₂، صعود إجمالي ${Math.round(p.ascentM)} م.`,
      'اربط الشرح بـ mgh على الصعود وتوفير الطاقة/الفرملة التعاونية على الهبوط حيث ينطبق.',
      'اذكر حركة عمّان فقط إن وافقت الأرقام (مثلاً زيادة زمن يوحي ازدحاماً). ممنوع جمل ترحيب أو نصائح عامة بدون أرقام.',
      'ردّك سطران كحد أقصى، ويجب أن يحتوياً على رقمين على الأقل من القائمة أعلاه.',
    ].join('\n')
  }
  return [
    `You are an energy & physics routing specialist. Route: "${p.routeLabel}".`,
    `Hard facts from telemetry: ${p.distanceKm.toFixed(1)} km, ${p.durationMin} min, ${fuelText}, ${co2g} g CO₂, total ascent ${Math.round(p.ascentM)} m.`,
    'Tie explanation to mgh penalty on climbs and regen/braking recovery on descents for EV/hybrid where relevant.',
    'Use Amman/Jordan geography labels (e.g. Sweileh grades, 7th Circle delay) only if consistent with the numbers (e.g. duration implying congestion). No welcome fluff or generic eco slogans.',
    'Max two sentences; cite at least two distinct numbers from the list above.',
  ].join('\n')
}

import { JORDAN_CONSTANTS } from '../config/greenDriveConfig'

/**
 * Demo / offline chat line from selected-route metrics (no LLM).
 */
export function buildHardcodedRouteChatReply(
  m: CopilotRouteMetrics & { distanceKm: number },
  firstName?: string | null,
  vehicleType?: string | null,
  locale: CopilotLocale = 'en',
): string {
  const name = firstName?.trim() || 'Lead'
  const fuel = m.fuelSavedLiters.toFixed(2)
  const jod = m.estJodSaved.toFixed(2)
  const vt = vehicleType || 'Petrol'
  const isEV = vt.toLowerCase().includes('electric') || vt.toLowerCase().includes('ev')
  const isDiesel = vt.toLowerCase().includes('diesel')
  
  const price = isEV 
    ? JORDAN_CONSTANTS.EV_KWH_COST_JOD 
    : isDiesel 
      ? JORDAN_CONSTANTS.DIESEL_PRICE_JOD 
      : JORDAN_CONSTANTS.PETROL_PRICE_JOD
  const priceStr = price.toFixed(2)
  const unit = isEV ? 'kWh' : 'L'
  const priceUnit = isEV ? 'kWh' : 'L'

  // Priority: Short Trip Logic (< 2.5km)
  const SHORT_TRIP_THRESHOLD_KM = 2.5
  if (m.distanceKm < SHORT_TRIP_THRESHOLD_KM) {
    if (locale === 'ar') {
      return `أهلاً ${name}! المسافة قصيرة جداً (${m.distanceKm} كم). المشي أو ركوب الدراجة هو الخيار الأكثر استدامة وصحة لوجهتك بدلاً من استخدام السيارة.`
    }
    return `Hello ${name}! Since the trip is only ${m.distanceKm}km, walking or cycling is the most eco-friendly and healthy choice for this destination instead of driving.`
  }

  if (m.fuelSavedLiters > 0) {
    if (locale === 'ar') {
      return `أهلاً ${name}! بالنسبة لسيارتك (${vt})، هذا المسار أوفر ${isEV ? 'للطاقة' : 'للأميال'} لأنه يتجنب تلال بارتفاع ${m.ascentM}م. بناءً على سعر ${isEV ? 'الكهرباء' : 'الوقود'} في الأردن (${priceStr} دينار/${priceUnit})، ستوفر ${fuel}${unit} (~${jod} دينار).`
    }
    return `Welcome ${name}! For your ${vt} vehicle, this route is Eco-Friendly because it avoids the ${m.ascentM}m hills. Based on Jordan's ${isEV ? 'electricity' : 'fuel'} price (${priceStr} JOD/${priceUnit}), you'll save ${fuel}${unit} (~${jod} JOD).`
  }

  if (m.selectedRouteId === 'fast') {
    if (locale === 'ar') {
      return `هذا هو المسار الأسرع لوجهتك يا ${name}. مثالي لجدولك المزدحم.`
    }
    return `This is the quickest path to your destination, ${name}. Perfect for a tight schedule.`
  }

  if (locale === 'ar') {
    return `${name} — هذا الخيار يوازن بين التكلفة والزمن لسيارتك الـ ${vt}.`
  }
  return `${name}, this route balances cost and time for your ${vt} vehicle.`
}

function fallbackNoRouteReply(userText: string, ctx?: CopilotContext): string {
  const siteLocale: CopilotLocale = ctx?.locale ?? 'en'
  const replyLocale = resolveReplyLocale(siteLocale, userText)
  if (replyLocale === 'ar') {
    return 'حمام — حدّد A وB على الخريطة ثم «تحليل» لأظهر لك رسالة مبنية على الوقود والصعود الحقيقيين.'
  }
  return 'Humam — set A and B on the map, tap Analyze, then ask again. I’ll reply with live fuel and hill numbers from your selected route.'
}

/**
 * sendGeminiMessage — processes user input via live Google Gemini API.
 */
export async function sendGeminiMessage(
  userText: string, 
  ctx?: CopilotContext,
  history: ChatMessage[] = []
): Promise<string> {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim()
  const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY?.trim()
  const isAr = ctx?.locale === 'ar'

  // Prefer Direct Gemini if valid, else fallback to OpenRouter
  const useOpenRouter = !geminiKey || geminiKey.includes('DUMMY') || !geminiKey.startsWith('AIza')
  const apiKey = useOpenRouter ? openRouterKey : geminiKey
  const model = useOpenRouter 
    ? (import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.0-flash-lite-preview-09-2025:free')
    : (import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash')
  
  if (!apiKey) {
    console.error('[AI Core] No valid API Key (Gemini or OpenRouter) found in .env')
    return isAr ? 'خطأ: مفتاح AI مفقود. يرجى ضبط الإعدادات.' : 'Tactical error: AI Core Key missing. Check environment configuration.'
  }

  const endpoint = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const name = ctx?.firstName || 'Lead'
  const vt = ctx?.vehicleType || 'Petrol'
  const charge = ctx?.currentChargePercent ?? 85
  const dest = ctx?.destination || 'your destination'
  
  const distText = ctx?.activeRouteData?.distance || '0 km'
  const distNum = parseFloat(distText.replace(/[^0-9.]/g, ''))
  const SHORT_TRIP_THRESHOLD_KM = 2.5
  const isShortTrip = distNum > 0 && distNum <= SHORT_TRIP_THRESHOLD_KM
  const shortTripDirective = isShortTrip 
    ? `CRITICAL CONTEXT: This route is exceptionally short (${distText}). Before calculating vehicle emissions, you MUST proactively recommend walking, cycling, or using a micro-mobility scooter. Frame this as the ultimate zero-emission tactical choice, then optionally provide the car metrics as a fallback.`
    : ''

  const precomputedJod    = ctx?.copilotRouteMetrics?.estJodSaved?.toFixed(2) ?? null
  const rawFuel           = ctx?.copilotRouteMetrics?.fuelSavedLiters ?? 0
  // ✅ P2: Only inject if the value is a real non-zero number — prevents "0.00 kWh" contradiction
  const precomputedFuel   = rawFuel > 0 ? rawFuel.toFixed(2) : null
  const precomputedAscent = ctx?.copilotRouteMetrics?.ascentM ?? null
  // Dynamic unit from vehicle type — never the literal phrase 'L or kWh'
  const fuelUnit = (ctx?.vehicleType?.toLowerCase() === 'electric') ? 'kWh' : 'L'

  const systemInstruction = `
You are the GreenDrive Tactical Eco-Navigator for Jordan.
USER PROFILE: Name=${name}, Vehicle=${vt}, Current Energy/Charge=${charge}%.

=== ⚠️ CRITICAL DIRECTIVE — MANDATORY — DO NOT IGNORE ===
CRITICAL DIRECTIVE: You are provided the exact fuel cost of ${precomputedJod ?? '—'} JOD.
DO NOT perform any multiplication or math yourself.
You MUST output this exact JOD string verbatim: "${precomputedJod ?? 'N/A'} JOD"
${precomputedFuel ? `Exact fuel/energy consumed this trip: ${precomputedFuel} ${fuelUnit}. Use this number verbatim.` : ''}
${precomputedAscent ? `Exact ascent: ${precomputedAscent}m elevation gain.` : ''}

ANTI-CONTRADICTION RULE: The user message contains the authoritative physics data.
If this system block and the user message give different numbers, the USER MESSAGE wins.
Never append a second "0.00" value. Output each metric ONCE.

UNIT DIRECTIVE (ABSOLUTE RULE):
Vehicle: ${vt} → unit: ${fuelUnit}. NEVER output "L or kWh". Use ONLY "${fuelUnit}".
=========================================================

JORDAN OFFICIAL PRICES — May 2026 (✅ LOCKED):
- Petrol 90: 1.000 JOD/L  | CO2: 2.31 kg/L
- Petrol 95: 1.310 JOD/L  | CO2: 2.31 kg/L  [hybrid]
- Diesel:    0.790 JOD/L  | CO2: 2.68 kg/L
- EV Grid:   0.118 JOD/kWh| CO2: 0.61 kg/kWh

ACTIVE ROUTE: ${ctx?.hasActiveRoute ? `${dest} — ${ctx.activeRouteData?.distance}, ${ctx.activeRouteData?.duration}` : 'None'}.
${shortTripDirective}

RESPONSE RULES:
1. Quote the precomputed JOD/fuel values — never recalculate. Output each number once.
2. Be concise (2-4 sentences). Data-driven. Use unit: ${fuelUnit}.
3. Reference Amman terrain (Sweileh, Abdoun hills) when ascent data is present.
4. Complete every sentence. Never cut off mid-thought.
  `.trim()


  // Format history for Gemini (excluding the initial welcome message if it's empty)
  const contents = history
    .filter(m => m.text && m.id !== 'w')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }))

  // Add the current message
  contents.push({
    role: 'user',
    parts: [{ text: userText }]
  })

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (useOpenRouter) {
      headers['Authorization'] = `Bearer ${apiKey}`
      headers['HTTP-Referer'] = 'https://greendrive.jo' // Required by OpenRouter
    }

    const body = useOpenRouter 
      ? JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemInstruction },
            ...contents.map(c => ({ 
              role: c.role === 'model' ? 'assistant' : c.role, 
              content: c.parts[0].text 
            }))
          ],
          temperature: 0.7,
          max_tokens: 600,
        })
      : JSON.stringify({
          contents,
          system_instruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[AI Core HTTP Error] Status: ${response.status}, Details: ${errorText}`)
      throw new Error(`AI Core Error: ${response.status}`)
    }

    const data = await response.json()
    const reply = useOpenRouter 
      ? data.choices?.[0]?.message?.content
      : data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (reply) return reply
    throw new Error('AI Core returned an empty response.')
  } catch (err: any) {
    console.error('[AI Core Tactical Interruption]', {
      message: err.message,
      provider: useOpenRouter ? 'OpenRouter' : 'Gemini',
      endpoint
    })
    return isAr ? 'عذراً، واجهت مشكلة في الاتصال بالنظام الذكي. يرجى المحاولة مرة أخرى.' : `Tactical error: Connection to AI core interrupted (${err.message}). Please retry.`
  }
}
