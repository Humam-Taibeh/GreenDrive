/** Output by Antigravity IDE — low-opacity contour mesh (mid-ground depth). */
import { useId } from 'react'

/** Refined forest green — sharpened light-mode contour readability. */
const FOREST_TOPO = '#0f5132'

export function TopographicVeins({
  themeDark,
  reducedMotion,
}: {
  themeDark: boolean
  reducedMotion: boolean
}) {
  const uid = useId().replace(/:/g, '')
  const pid = `topo-${uid}`
  const breathe = !reducedMotion ? (themeDark ? 'topo-breathe-dark' : 'topo-breathe-light') : ''

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <svg
        className={`topo-breathe-will h-[120%] w-full min-w-full ${breathe} ${
          reducedMotion ? (themeDark ? 'opacity-[0.08]' : 'opacity-[0.2]') : ''
        } ${themeDark ? 'text-[#36ff97]' : ''}`}
        style={
          themeDark
            ? undefined
            : {
                color: FOREST_TOPO,
              }
        }
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1200 800"
      >
        <defs>
          <pattern id={pid} width="200" height="200" patternUnits="userSpaceOnUse">
            <path
              d="M0 100 Q40 78 80 100 T160 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.72"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M0 130 Q55 152 110 130 T200 130"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.62"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M0 60 Q50 45 100 60 T200 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.56"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M0 170 Q70 188 140 170 T200 170"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.48"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M20 0 Q28 40 20 80 T20 200"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.42"
              opacity="0.85"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M100 0 Q92 50 100 100 T100 200"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.4"
              opacity="0.75"
              vectorEffect="non-scaling-stroke"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${pid})`} />
        {/* Neural-nature vein strokes */}
        <g fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.92" vectorEffect="non-scaling-stroke">
          <path d="M-20 420 C180 380 320 520 520 400 S820 280 1220 360" />
          <path d="M-40 200 C200 160 400 240 600 180 S900 100 1240 220" />
          <path d="M0 650 C250 600 450 720 700 640 S1000 560 1200 600" />
        </g>
      </svg>
    </div>
  )
}
