/** Output by Antigravity IDE — fast section jumps with offset-aware smooth scroll. */

import type { MouseEvent } from 'react'

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function scrollPaddingTopPx(): number {
  const raw = getComputedStyle(document.documentElement).scrollPaddingTop
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : 0
}

export function scrollToSectionByHash(
  hash: string,
  opts?: { block?: ScrollLogicalPosition }
): void {
  if (!hash.startsWith('#')) return
  const el = document.querySelector<HTMLElement>(hash)
  if (!el) return

  const pad = scrollPaddingTopPx()
  const rect = el.getBoundingClientRect()
  const elTopDoc = rect.top + window.scrollY
  const block = opts?.block ?? (hash === '#hero-zone' ? 'start' : 'start')
  let targetY = block === 'center' ? elTopDoc - window.innerHeight * 0.16 : elTopDoc - pad
  if (hash === '#hero-zone') targetY = 0

  const vh = window.innerHeight
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh)
  targetY = Math.max(0, Math.min(maxScroll, targetY))

  window.scrollTo({
    top: targetY,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  })
}

export function handleInPageNavClick(e: MouseEvent<HTMLAnchorElement>, href: string): void {
  if (!href.startsWith('#')) return
  const el = document.querySelector(href)
  if (!el) return
  e.preventDefault()
  scrollToSectionByHash(href)
}
