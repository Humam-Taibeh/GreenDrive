/**
 * Showcase mode — public design preview of GreenDrive.
 *
 * Enabled with VITE_DEMO_MODE=showcase (see `.env.showcase` / `npm run build:showcase`).
 * When on: Google Maps is never loaded, no AI provider (Gemini / OpenRouter) is called,
 * no route analysis runs, and nothing shows invented routes, ascent, fuel or CO₂ numbers.
 *
 * `DEMO_SHOWCASE` is a build-time constant, so the map / AI code paths that are gated on
 * it are removed from the production bundle.
 */
export const DEMO_SHOWCASE: boolean = import.meta.env.VITE_DEMO_MODE === 'showcase'

export type ShowcaseLocale = 'en' | 'ar'

export interface ShowcaseCopy {
  badge: string
  /** The single status sentence shown wherever the map / analysis would open. */
  notice: string
  back: string
  impactKicker: string
  impactTitle: string
  impactBody: string
  terminalNote: string
  /** Honest replacement for the marketing sub-headline in the hero. */
  heroSub: string
  /** "Gemini AI integration" is planned, not running, in the showcase. */
  geminiTitle: string
  geminiDesc: string
  /** Footer credit line — event name only, no feature claims. */
  footLegal: string
}

export const SHOWCASE_COPY: Record<ShowcaseLocale, ShowcaseCopy> = {
  en: {
    badge: 'Prototype · design showcase',
    notice:
      'Prototype: interactive route analysis (map, elevation and the AI Eco-Coach) is under development. This public page is a design showcase.',
    back: 'Back to home',
    impactKicker: 'Impact',
    impactTitle: 'Impact tracking is under development',
    impactBody:
      'The sample CO₂ chart and example trips were removed from this showcase because they were not real measurements. Nothing on this page reflects a real route.',
    terminalNote:
      'The simulated console is hidden in this showcase. No elevation, fuel or CO₂ model is running on this page.',
    heroSub: "A route-optimization prototype for Amman's hilly terrain, currently under development.",
    geminiTitle: 'Gemini AI integration (planned)',
    geminiDesc:
      'Planned: Gemini would interpret driving context to suggest eco-driving tips. It is not active in this showcase.',
    footLegal: 'Google Antigravity Hackathon 2026',
  },
  ar: {
    badge: 'نموذج أولي · عرض تصميمي',
    notice:
      'نموذج أولي: تحليل المسارات التفاعلي (الخريطة والارتفاع ومدرّب القيادة البيئي بالذكاء الاصطناعي) قيد التطوير. هذه الصفحة العامة عرض تصميمي فقط.',
    back: 'العودة إلى الصفحة الرئيسية',
    impactKicker: 'الأثر',
    impactTitle: 'تتبّع الأثر قيد التطوير',
    impactBody:
      'أُزيل الرسم البياني التجريبي لـ CO₂ والرحلات المثالية من هذا العرض لأنها ليست قياسات حقيقية. لا شيء في هذه الصفحة يعكس مسارًا فعليًا.',
    terminalNote:
      'أُخفيت وحدة المحاكاة في هذا العرض. لا يعمل أي نموذج ارتفاع أو وقود أو CO₂ في هذه الصفحة.',
    heroSub: 'مشروع نموذجي لتحسين المسارات في تضاريس عمّان الجبلية، قيد التطوير.',
    geminiTitle: 'تكامل Gemini للذكاء الاصطناعي (مخطّط)',
    geminiDesc:
      'مخطّط: سيفسّر Gemini سياق القيادة لاقتراح نصائح قيادة صديقة للبيئة. غير مفعّل في هذا العرض.',
    footLegal: 'هاكاثون Google Antigravity 2026',
  },
}
