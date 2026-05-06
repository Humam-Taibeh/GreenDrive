/** Output by Antigravity IDE */
import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FeatureCard } from '../cards/FeatureCard'
import { useScrollMotionProps, staggerContainer, staggerItem } from '../../lib/motion'
import { useLocale } from '../../contexts/LocaleContext'
import type { FeatureCardData } from '../../types'

export function FeatureMatrix() {
  const m = useScrollMotionProps()
  const reduce = useReducedMotion()
  const { t } = useLocale()

  const features: FeatureCardData[] = useMemo(
    () => [
      {
        id: 'path',
        title: t('feat.path.title'),
        subtitle: t('feat.path.sub'),
        body: t('feat.path.body'),
        footerLeft: t('feat.path.foot'),
        score: 9,
        icon: 'pin',
      },
      {
        id: 'carbon',
        title: t('feat.carbon.title'),
        subtitle: t('feat.carbon.sub'),
        body: t('feat.carbon.body'),
        footerLeft: t('feat.carbon.foot'),
        score: 10,
        highlighted: true,
        icon: 'tree',
      },
      {
        id: 'cost',
        title: t('feat.cost.title'),
        subtitle: t('feat.cost.sub'),
        body: t('feat.cost.body'),
        footerLeft: t('feat.cost.foot'),
        score: 8,
        icon: 'fuel',
      },
    ],
    [t]
  )

  return (
    <section id="features" className="scroll-mt-28 section-y px-4 sm:px-8 lg:px-12">
      <motion.div className="mx-auto max-w-[88rem]" {...m}>
        <div className="mb-16 text-center md:mb-24">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-toxic sm:text-sm">
            {t('feat.cap')}
          </p>
          <h2
            className="heading-eco-neon font-heading mt-6 text-5xl font-extrabold tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl lg:leading-[1.04] dark:text-white"
            style={{ fontWeight: 800 }}
          >
            {t('feat.head')}
          </h2>
          <p className="text-muted-eco mx-auto mt-6 max-w-2xl text-lg lg:text-xl">
            {t('feat.lead')}
          </p>
        </div>
        {reduce ? (
          <div className="grid gap-8 md:grid-cols-3 lg:gap-10">
            {features.map((f) => (
              <FeatureCard key={f.id} data={f} />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid gap-8 md:grid-cols-3 lg:gap-10"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px', amount: 0.12 }}
          >
            {features.map((f) => (
              <motion.div key={f.id} variants={staggerItem}>
                <FeatureCard data={f} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}
