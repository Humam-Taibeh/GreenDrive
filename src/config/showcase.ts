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
import type { TranslationKey } from '../i18n/translations'

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
  },
}

/** The repository is the only external link the showcase footer points to. */
export const SHOWCASE_REPO_URL = 'https://github.com/Humam-Taibeh/GreenDrive'

/**
 * Showcase-only wording. `LocaleContext.t()` looks here first, so every place that renders one of
 * these keys shows the honest text without touching the component. Rules for this copy: describe
 * what is planned/designed (never a working feature), no "live"/"real-time" claims, no
 * enterprise / investor / boardroom language, no invented numbers.
 */
export const SHOWCASE_TEXT: Record<ShowcaseLocale, Partial<Record<TranslationKey, string>>> = {
  en: {
    'hero.kicker': 'Sustainable navigation prototype',
    'hero.sub': "A route-optimization prototype for Amman's hilly terrain, currently under development.",

    'feat.lead': 'Glass-style interface modules designed for clarity. The capabilities below are planned and under development.',
    'feat.path.body': 'Planned: calculate routes from traffic and road-elevation data to help reduce fuel use.',
    'feat.carbon.body': 'Planned: estimate CO₂ for each trip so drivers can see the environmental impact of their choices.',
    'feat.cost.body': 'Planned: estimate fuel cost before departure and compare routes to find the cheapest option.',

    'how.kicker': 'The design',
    'how.title': 'How it is designed to work',
    'how.lead': 'The planned flow in four steps. It is still under development and does not run in this showcase.',
    'how.s1.desc': 'Planned: you enter an origin and a destination, and the app would request routes and terrain data from Google Maps.',
    'how.s2.desc': 'Designed: elevation and road data would feed a fuel model to favor the lowest-consumption route.',
    'how.s3.desc': 'Planned: a comparison view would show the Eco-Friendly, Fastest and Cheapest options with fuel and CO₂ estimates.',
    'how.s4.desc': 'Planned: each trip would add to a personal record of fuel and CO₂ savings.',

    'int.title': 'Planned technology stack.',
    'int.lead': 'GreenDrive is designed to use AI and mapping APIs for sustainable navigation. None of them are active in this showcase.',
    'int.gemini.t': 'Gemini AI integration (planned)',
    'int.gemini.d': 'Planned: Gemini would interpret driving context to suggest eco-driving tips. It is not active in this showcase.',
    'int.maps.t': 'Google Maps API (planned)',
    'int.maps.d': 'Planned: traffic-aware routes, distance matrices and Places search feeding the route optimizer.',
    'int.elev.t': 'Elevation intelligence (planned)',
    'int.elev.d': 'Planned: grade and ascent modeling to estimate fuel use, since a flatter detour can beat a shorter hill climb.',
    'int.analytics.t': 'Real-time analytics (planned)',
    'int.analytics.d': 'Planned: CO₂, fuel and time differences across route variants.',

    'team.lead': 'A team of three students from Al-Zaytoonah University and the University of Jordan, built at the Google Antigravity Hackathon.',
    'team.r1': 'Developer (built with AI coding tools)',
    'team.r2': 'Team member',
    'team.r3': 'Team member',

    'foot.legal': 'Google Antigravity Hackathon 2026',
  },
  ar: {
    'hero.kicker': 'نموذج أولي للملاحة المستدامة',
    'hero.sub': 'مشروع نموذجي لتحسين المسارات في تضاريس عمّان الجبلية، قيد التطوير.',

    'feat.lead': 'وحدات واجهة بتصميم زجاجي صُمّمت للوضوح. القدرات أدناه مخطّطة وقيد التطوير.',
    'feat.path.body': 'مخطّط: حساب المسارات اعتمادًا على بيانات الازدحام وارتفاع الطرق للمساعدة في تقليل استهلاك الوقود.',
    'feat.carbon.body': 'مخطّط: تقدير انبعاثات CO₂ لكل رحلة ليرى السائق الأثر البيئي لخياراته.',
    'feat.cost.body': 'مخطّط: تقدير تكلفة الوقود قبل الانطلاق ومقارنة المسارات لإيجاد الأرخص.',

    'how.kicker': 'التصميم',
    'how.title': 'كيف صُمّم ليعمل',
    'how.lead': 'التدفق المخطّط في أربع خطوات. لا يزال قيد التطوير ولا يعمل في هذا العرض.',
    'how.s1.desc': 'مخطّط: تُدخل نقطة الانطلاق والوجهة، وسيطلب التطبيق المسارات وبيانات التضاريس من خرائط Google.',
    'how.s2.desc': 'مصمَّم: ستغذّي بيانات الارتفاع والطريق نموذج وقود لاختيار المسار الأقل استهلاكًا.',
    'how.s3.desc': 'مخطّط: ستعرض شاشة مقارنة المسارات الأخضر والأسرع والأرخص مع تقديرات الوقود وCO₂.',
    'how.s4.desc': 'مخطّط: ستُضاف كل رحلة إلى سجل شخصي لوفورات الوقود وCO₂.',

    'int.title': 'البنية التقنية المخطّطة.',
    'int.lead': 'صُمّم GreenDrive لاستخدام الذكاء الاصطناعي وواجهات الخرائط لملاحة مستدامة. لا شيء منها مفعّل في هذا العرض.',
    'int.gemini.t': 'تكامل Gemini للذكاء الاصطناعي (مخطّط)',
    'int.gemini.d': 'مخطّط: سيفسّر Gemini سياق القيادة لاقتراح نصائح قيادة صديقة للبيئة. غير مفعّل في هذا العرض.',
    'int.maps.t': 'واجهة خرائط Google (مخطّط)',
    'int.maps.d': 'مخطّط: مسارات واعية بالازدحام ومصفوفات مسافات وبحث أماكن تغذّي محسّن المسارات.',
    'int.elev.t': 'ذكاء الارتفاع (مخطّط)',
    'int.elev.d': 'مخطّط: نمذجة الميل والصعود لتقدير استهلاك الوقود، فقد يتفوق التفاف مسطّح على طلعة أقصر.',
    'int.analytics.t': 'تحليلات لحظية (مخطّط)',
    'int.analytics.d': 'مخطّط: فروقات CO₂ والوقود والزمن بين بدائل المسار.',

    'team.lead': 'فريق من ثلاثة طلاب من جامعة الزيتونة الأردنية والجامعة الأردنية، بُني في هاكاثون Google Antigravity.',
    'team.r1': 'مطوّر (بُني بأدوات برمجة بالذكاء الاصطناعي)',
    'team.r2': 'عضو في الفريق',
    'team.r3': 'عضو في الفريق',

    'foot.legal': 'هاكاثون Google Antigravity 2026',
  },
}
