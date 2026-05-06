import { useEffect, useRef, useState } from 'react'

/**
 * Scroll-spy via IntersectionObserver. Updates are rAF-batched to avoid React work mid-scroll.
 */
export function useLandingNavSpy(sectionHashes: readonly string[]) {
  const [activeHash, setActiveHash] = useState<string>(() => sectionHashes[0] ?? '#hero-zone')
  const rafRef = useRef(0)
  const pendingRef = useRef<string | null>(null)

  useEffect(() => {
    const elements = sectionHashes
      .map((h) => document.getElementById(h.replace(/^#/, '')))
      .filter((el): el is HTMLElement => el != null)

    if (elements.length === 0) return

    const marginFrac = 0.36
    let obs: IntersectionObserver | null = null

    const flush = () => {
      rafRef.current = 0
      const next = pendingRef.current
      if (next != null) setActiveHash(next)
      pendingRef.current = null
    }

    const schedule = (hash: string) => {
      pendingRef.current = hash
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(flush)
    }

    const setup = () => {
      obs?.disconnect()
      const band = Math.round(window.innerHeight * marginFrac)
      const rootMargin = `-${band}px 0px -${band}px 0px`

      obs = new IntersectionObserver(
        (entries) => {
          const candidates = entries.filter((e) => e.isIntersecting)
          if (candidates.length === 0) return
          const best = candidates.reduce((a, b) =>
            b.intersectionRatio > a.intersectionRatio ? b : a
          )
          const id = best.target.id
          if (id) schedule(`#${id}`)
        },
        {
          root: null,
          rootMargin,
          /* Fewer steps → fewer callbacks per frame */
          threshold: [0, 0.25, 0.5, 0.75, 1],
        }
      )

      elements.forEach((el) => obs!.observe(el))
    }

    setup()
    window.addEventListener('resize', setup, { passive: true })

    return () => {
      obs?.disconnect()
      window.removeEventListener('resize', setup)
      cancelAnimationFrame(rafRef.current)
    }
  }, [sectionHashes])

  return activeHash
}
