/** Start loading the /map route chunk as soon as the user shows intent (hover/focus). */
let mapChunk: Promise<unknown> | null = null

export function prefetchMapRoute(): void {
  if (!mapChunk) {
    mapChunk = import('../pages/MapViewPage')
  }
}
