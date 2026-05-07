/** Output by Antigravity IDE */
import { useMemo, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useScrollMotionProps } from '../../lib/motion'
import { useLocale } from '../../contexts/LocaleContext'

interface TeamMemberExtended {
  id: string
  name: string
  avatarUrl: string
  github?: string
  linkedin?: string
  university?: string
  role?: string
}

type UniversityKey = 'team.uni.zu' | 'team.uni.uj'
type TeamMemberSeed = Omit<TeamMemberExtended, 'university'> & { university?: UniversityKey }

const baseTeam: TeamMemberSeed[] = [
  {
    id: 'humam',
    name: 'Humam Taibeh',
    avatarUrl: '/avatars/humam-official.jpg',
    github: 'https://github.com/Humam-Taibeh',
    linkedin: 'https://www.linkedin.com/in/humam-taibeh/',
    university: 'team.uni.zu',
  },
  {
    id: 'heba',
    name: 'Heba Taibeh',
    avatarUrl: '/avatars/Heba.jpeg',
    github: 'https://github.com/HebaZakwan',
    linkedin: 'https://www.linkedin.com/in/heba-taibeh/',
    university: 'team.uni.uj',
  },
  {
    id: 'natalia',
    name: 'Natalia Alhijawi',
    avatarUrl: '/avatars/Natalia.jpg',
    github: 'https://github.com/silvercreeks14',
    linkedin: 'https://www.linkedin.com/in/natalia-alhijjawi-590438314/',
    university: 'team.uni.uj',
  },
]

export function TeamSection() {
  const m = useScrollMotionProps()
  const { t, locale } = useLocale()
  const sectionRef = useRef<HTMLElement | null>(null)
  const teamActive = useInView(sectionRef, { margin: '-40% 0px -40% 0px', amount: 0.2 })

  const team: TeamMemberExtended[] = useMemo(
    () =>
      baseTeam.map((m) => ({
        ...m,
        name:
          locale === 'ar'
            ? m.id === 'humam'
              ? 'همام طيبة'
              : m.id === 'heba'
                ? 'هبة طيبة'
                : 'نتاليا الحجاوي'
            : t(m.id === 'humam' ? 'team.n1' : m.id === 'heba' ? 'team.n2' : 'team.n3'),
        role:
          locale === 'ar' && m.id === 'humam'
            ? 'قائد الذكاء الاصطناعي'
            : t(m.id === 'humam' ? 'team.r1' : m.id === 'heba' ? 'team.r2' : 'team.r3'),
        university: m.university ? t(m.university) : undefined,
      })),
    [locale, t]
  )

  return (
    <section id="team" ref={sectionRef} className="scroll-mt-28 section-y px-4 sm:px-8 lg:px-12">
      <motion.div className="mx-auto max-w-[88rem]" {...m}>
        <div className="text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-toxic sm:text-sm">
            {t('team.kicker')}
          </p>
          <h2
            className="heading-eco-neon font-heading mt-6 text-5xl font-extrabold tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl dark:text-white"
            style={{ fontWeight: 800 }}
          >
            {t('team.title')}
          </h2>
          <p className="text-muted-eco mx-auto mt-8 max-w-2xl text-lg lg:text-xl">
            {t('team.lead')}
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3 lg:mt-20 lg:gap-10">
          {team.map((member, i) => (
            <motion.article
              key={member.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px', amount: 0.15 }}
              transition={{ delay: i * 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card flex flex-col rounded-3xl p-8 lg:p-10"
            >
              <img
                src={member.avatarUrl}
                alt={member.name}
                className={`h-28 w-28 rounded-2xl border border-toxic/55 object-cover object-center ring-1 ring-toxic/45 shadow-[0_0_0_1px_rgba(54,255,151,0.3),0_0_48px_-12px_rgba(54,255,151,0.46)] dark:border-toxic/65 dark:ring-toxic/55 ${member.id === 'humam' ? 'shadow-[0_0_0_1px_rgba(54,255,151,0.38),0_0_60px_-10px_rgba(54,255,151,0.66)]' : ''
                  }`}
                style={{ imageRendering: 'auto' }}
              />
              <motion.h3
                key={`name-${member.id}-${locale}`}
                initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="font-heading mt-8 text-2xl font-extrabold text-zinc-950 dark:text-white"
                style={{ fontWeight: 800 }}
              >
                {member.name}
              </motion.h3>
              <motion.p
                key={`role-${member.id}-${locale}`}
                initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                className="text-label-eco mt-2 text-xs font-semibold uppercase tracking-wider"
              >
                {member.role}
              </motion.p>
              {(['humam', 'heba', 'natalia'] as const).includes(member.id as 'humam' | 'heba' | 'natalia') && (
                <span
                  className={`mt-3 inline-flex w-fit rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition ${teamActive
                      ? 'border-toxic/70 text-toxic shadow-[0_0_22px_-6px_rgba(54,255,151,0.95)] [background-image:linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.04)),repeating-linear-gradient(115deg,rgba(255,255,255,0.09)_0px,rgba(255,255,255,0.09)_2px,rgba(255,255,255,0.02)_2px,rgba(255,255,255,0.02)_5px)]'
                      : 'border-white/20 text-white/70 [background-image:linear-gradient(135deg,rgba(255,255,255,0.15),rgba(255,255,255,0.03)),repeating-linear-gradient(115deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.08)_2px,rgba(255,255,255,0.01)_2px,rgba(255,255,255,0.01)_5px)]'
                    }`}
                >
                  {locale === 'ar' ? 'المؤسسون' : 'Founder'}
                </span>
              )}
              {member.university && (
                <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-white/40">
                  {member.university}
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                {member.github && (
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white/50 text-zinc-600 transition hover:border-toxic/50 hover:text-toxic dark:border-white/10 dark:bg-white/5 dark:text-white/60"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                )}
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white/50 text-zinc-600 transition hover:border-toxic/50 hover:text-toxic dark:border-white/10 dark:bg-white/5 dark:text-white/60"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
