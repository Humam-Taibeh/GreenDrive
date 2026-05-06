import { useReducedMotion } from 'framer-motion'
import type { Variants } from 'framer-motion'

/** Full-bleed reveal for section roots */
export function useScrollMotionProps() {
  const reduce = useReducedMotion()
  return {
    initial: reduce ? false : { opacity: 0, y: 40 },
    whileInView: reduce ? undefined : { opacity: 1, y: 0 },
    /* Trigger slightly before the section is centered so scroll + reveal don’t feel out of sync */
    viewport: { once: true, margin: '-10% 0px -12% 0px', amount: 0.15 },
    transition: { duration: 0.58, ease: [0.16, 1, 0.3, 1] as const },
  }
}

/** Staggered children inside a section */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.14, delayChildren: 0.06 },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
}

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}
