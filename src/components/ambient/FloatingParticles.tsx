/** Output by Antigravity IDE — autonomous living field: zen flocking loop (no pointer coupling). */
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { AMBIENT_CYCLE_SEC } from '../../lib/ambientCycle'

/** Fewer DOM writes per frame — flocking math unchanged, density slightly lower */
const COUNT = 38
const TWO_PI = Math.PI * 2
const CYCLE_OMEGA = TWO_PI / AMBIENT_CYCLE_SEC

type Seed = {
  id: number
  baseX: number
  baseY: number
  size: number
  group: number
  phase: number
  wobbleA: number
  wobbleB: number
}

function useViewportSize() {
  const ref = useRef({ w: 1200, h: 800 })
  useEffect(() => {
    const r = () => {
      ref.current = { w: window.innerWidth, h: window.innerHeight }
    }
    r()
    window.addEventListener('resize', r, { passive: true })
    return () => window.removeEventListener('resize', r)
  }, [])
  return ref
}

export function FloatingParticles({
  themeDark,
  reducedMotion,
}: {
  themeDark: boolean
  reducedMotion: boolean
}) {
  const sizeRef = useViewportSize()
  const elRef = useRef<Array<HTMLSpanElement | null>>([])

  const seeds = useMemo<Seed[]>(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        id: i,
        baseX: (((i * 47 + 13) % 100) + (i % 7) * 0.25) / 100,
        baseY: (((i * 61 + 29) % 100) + (i % 5) * 0.28) / 100,
        size: 1.6 + (i % 5) * 0.55,
        group: i % 8,
        phase: (i * 0.6180339887) % TWO_PI,
        wobbleA: 0.65 + (i % 7) * 0.09,
        wobbleB: 0.5 + (i % 5) * 0.11,
      })),
    []
  )

  const frame = useCallback(
    (tSec: number) => {
      const { w, h } = sizeRef.current
      const breathe = Math.sin(tSec * CYCLE_OMEGA)
      const cluster = 0.14 + 0.12 * (breathe * 0.5 + 0.5)

      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i]
        const el = elRef.current[i]
        if (!el) continue

        const baseX = s.baseX * w
        const baseY = s.baseY * h

        const gx =
          w * (0.5 + 0.22 * Math.sin(tSec * 0.16 + s.group * 0.72 + s.phase * 0.08))
        const gy =
          h * (0.5 + 0.18 * Math.cos(tSec * 0.14 + s.group * 0.61 + s.phase * 0.06))

        const pullX = (gx - baseX) * cluster
        const pullY = (gy - baseY) * cluster

        const wx = Math.sin(tSec * s.wobbleA * 0.78 + s.phase) * 8
        const wy = Math.cos(tSec * s.wobbleB * 0.74 + s.phase * 1.4) * 6.5

        const px = baseX + pullX + wx
        const py = baseY + pullY + wy

        const half = s.size / 2
        el.style.transform = `translate3d(${px - half}px, ${py - half}px, 0)`
      }
    },
    [seeds, sizeRef]
  )

  useEffect(() => {
    if (reducedMotion) return
    let id = 0
    const loop = (now: number) => {
      frame(now / 1000)
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [frame, reducedMotion])

  const particleClass = themeDark
    ? 'bg-[rgba(54,255,151,0.62)] shadow-[0_0_14px_rgba(54,255,151,0.42)]'
    : 'bg-[rgba(54,255,151,0.5)] shadow-[0_0_12px_rgba(54,255,151,0.35)]'

  if (reducedMotion) {
    return (
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        {seeds.map((p) => (
          <span
            key={p.id}
            className={`absolute rounded-full ${particleClass}`}
            style={{
              left: `${p.baseX * 100}%`,
              top: `${p.baseY * 100}%`,
              width: p.size,
              height: p.size,
              opacity: 0.42,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {seeds.map((p, i) => (
        <span
          key={p.id}
          ref={(el) => {
            elRef.current[i] = el
          }}
          className={`absolute left-0 top-0 rounded-full will-change-transform ${particleClass}`}
          style={{
            width: p.size,
            height: p.size,
            transform: 'translate3d(0, 0, 0)',
          }}
        />
      ))}
    </div>
  )
}
