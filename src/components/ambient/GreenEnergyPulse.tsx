/** Output by Antigravity IDE — periodic “carbon-clean scan” radial bloom. */
export function GreenEnergyPulse({
  themeDark,
  reducedMotion,
}: {
  themeDark: boolean
  reducedMotion: boolean
}) {
  if (reducedMotion) return null

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden>
      <div
        className={`eco-pulse-ring absolute aspect-square w-[min(140vw,180vh)] rounded-full ${
          themeDark
            ? 'bg-[radial-gradient(circle,rgba(54,255,151,0.14)_0%,rgba(54,255,151,0.04)_35%,transparent_65%)]'
            : 'bg-[radial-gradient(circle,rgba(54,255,151,0.12)_0%,rgba(120,180,150,0.06)_40%,transparent_70%)]'
        }`}
      />
    </div>
  )
}
