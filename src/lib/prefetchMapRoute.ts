/** Start loading the /map route chunk as soon as the user shows intent (hover/focus). */
let mapChunk: Promise<unknown> | null = null

export function prefetchMapRoute(): void {
  // Showcase mode has no map page to prefetch (and must not pull in Google Maps / AI code).
  // Literal `import.meta.env` comparison on purpose: it lets the bundler drop the import.
  if (import.meta.env.VITE_DEMO_MODE !== 'showcase' && !mapChunk) {
    mapChunk = import('../pages/MapViewPage')
  }
}
