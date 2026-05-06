/**
 * Traffic time-of-day model — Jordan/Amman specific.
 *
 * Based on Amman rush hour patterns:
 *  - Morning peak: 07:30–09:30 (school + work rush)
 *  - Midday: 12:00–14:00 (moderate)
 *  - Afternoon peak: 16:00–18:30 (heaviest)
 *  - Evening: 19:00–22:00 (light)
 *  - Night/early: 22:00–06:00 (very light)
 *
 * Traffic multiplier affects:
 *  - Travel time (× multiplier)
 *  - Fuel consumption (stop-and-go adds ~15–35% vs free flow)
 *  - CO₂ (proportional to fuel)
 */

export interface TrafficWindow {
  /** 0–23 hour start (inclusive) */
  hourStart: number
  /** 0–23 hour end (exclusive) */
  hourEnd: number
  /** Display label */
  label: string
  labelAr: string
  /** 1.0 = free flow, 1.5 = heavy congestion */
  multiplier: number
  /** Emoji indicator */
  icon: string
  /** Short advice */
  advice: string
  adviceAr: string
}

export const AMMAN_TRAFFIC_WINDOWS: TrafficWindow[] = [
  {
    hourStart: 0,
    hourEnd: 6,
    label: 'Night — very light',
    labelAr: 'ليل — خفيف جداً',
    multiplier: 1.0,
    icon: '🌙',
    advice: 'Best time to travel. Roads almost empty.',
    adviceAr: 'أفضل وقت للسفر. الطرق شبه خالية.',
  },
  {
    hourStart: 6,
    hourEnd: 7,
    label: 'Early morning — light',
    labelAr: 'فجر — خفيف',
    multiplier: 1.1,
    icon: '🌅',
    advice: 'Light traffic. Good window before rush hour.',
    adviceAr: 'حركة خفيفة. نافذة جيدة قبل ساعة الذروة.',
  },
  {
    hourStart: 7,
    hourEnd: 10,
    label: 'Morning peak — heavy',
    labelAr: 'ذروة صباحية — كثيفة',
    multiplier: 1.55,
    icon: '🚦',
    advice: 'Heavy rush hour. Consider waiting until 10:00.',
    adviceAr: 'ذروة الصباح. انتظر حتى العاشرة إن أمكن.',
  },
  {
    hourStart: 10,
    hourEnd: 12,
    label: 'Mid-morning — moderate',
    labelAr: 'صباح متأخر — معتدل',
    multiplier: 1.2,
    icon: '🟡',
    advice: 'Moderate flow. Mostly clear on major routes.',
    adviceAr: 'تدفق معتدل. المسارات الرئيسية شبه سالكة.',
  },
  {
    hourStart: 12,
    hourEnd: 14,
    label: 'Midday — moderate',
    labelAr: 'ظهر — معتدل',
    multiplier: 1.25,
    icon: '☀️',
    advice: 'Moderate congestion near commercial areas.',
    adviceAr: 'ازدحام معتدل قرب المناطق التجارية.',
  },
  {
    hourStart: 14,
    hourEnd: 16,
    label: 'Early afternoon — light',
    labelAr: 'بعد الظهر المبكر — خفيف',
    multiplier: 1.15,
    icon: '🟢',
    advice: 'Good window. Traffic eases before afternoon peak.',
    adviceAr: 'نافذة جيدة قبل ذروة المساء.',
  },
  {
    hourStart: 16,
    hourEnd: 19,
    label: 'Afternoon peak — very heavy',
    labelAr: 'ذروة المساء — كثيفة جداً',
    multiplier: 1.65,
    icon: '🔴',
    advice: 'Worst congestion of the day. Wait if possible.',
    adviceAr: 'أشد الازدحام. انتظر إن أمكن.',
  },
  {
    hourStart: 19,
    hourEnd: 22,
    label: 'Evening — clearing',
    labelAr: 'مساء — يتحسن',
    multiplier: 1.2,
    icon: '🌆',
    advice: 'Traffic clearing. Most routes open by 20:30.',
    adviceAr: 'الطرق تنفتح تدريجياً بعد الثامنة والنصف.',
  },
  {
    hourStart: 22,
    hourEnd: 24,
    label: 'Late night — light',
    labelAr: 'ليل متأخر — خفيف',
    multiplier: 1.05,
    icon: '🌃',
    advice: 'Very light traffic. Good time to travel.',
    adviceAr: 'حركة خفيفة جداً. وقت مناسب للتنقل.',
  },
]

/** Get the traffic window for a given hour (0–23) */
export function getTrafficWindow(hour: number): TrafficWindow {
  return (
    AMMAN_TRAFFIC_WINDOWS.find((w) => hour >= w.hourStart && hour < w.hourEnd) ??
    AMMAN_TRAFFIC_WINDOWS[0]!
  )
}

/** Generate a "leave now vs wait" comparison for the next 3 slots */
export interface DepartureSlot {
  label: string
  labelAr: string
  hour: number
  minute: number
  window: TrafficWindow
  /** Adjusted travel time in minutes */
  adjustedMin: number
  /** Adjusted fuel in litres */
  adjustedFuelL: number
  /** Recommendation tier */
  tier: 'best' | 'ok' | 'avoid'
}

export function getDepartureSlots(
  baseMinutes: number,
  baseFuelL: number,
  nowHour: number,
  nowMinute: number,
): DepartureSlot[] {
  const slots: DepartureSlot[] = []
  const offsets = [0, 30, 60, 90] // leave now, +30, +60, +90 mins

  for (const offset of offsets) {
    const totalMin = nowHour * 60 + nowMinute + offset
    const slotHour = Math.floor(totalMin / 60) % 24
    const slotMinute = totalMin % 60
    const window = getTrafficWindow(slotHour)

    const adjustedMin = Math.round(baseMinutes * window.multiplier)
    // Stop-and-go adds ~20% extra fuel per 0.1 multiplier above 1.0
    const fuelFactor = 1 + (window.multiplier - 1) * 2.0
    const adjustedFuelL = Math.round(baseFuelL * fuelFactor * 100) / 100

    const label =
      offset === 0 ? 'Leave now' : `In ${offset} min (${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')})`
    const labelAr =
      offset === 0 ? 'انطلق الآن' : `بعد ${offset} دقيقة (${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')})`

    const tier: DepartureSlot['tier'] =
      window.multiplier <= 1.15 ? 'best' : window.multiplier <= 1.3 ? 'ok' : 'avoid'

    slots.push({ label, labelAr, hour: slotHour, minute: slotMinute, window, adjustedMin, adjustedFuelL, tier })
  }

  return slots
}
