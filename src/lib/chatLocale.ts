/** Output by Antigravity IDE — infer reply language from UI locale + user message script. */
export type ReplyLocale = 'en' | 'ar'

function countScripts(text: string): { arabic: number; latin: number; total: number } {
  let arabic = 0
  let latin = 0
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp >= 0x0600 && cp <= 0x06ff) arabic++
    else if (cp >= 0x0750 && cp <= 0x077f) arabic++
    else if (cp >= 0x08a0 && cp <= 0x08ff) arabic++
    else if ((cp >= 0x41 && cp <= 0x5a) || (cp >= 0x61 && cp <= 0x7a)) latin++
  }
  return { arabic, latin, total: arabic + latin }
}

/**
 * Default: match site locale. Override: if user writes mainly Latin while site is Arabic → English;
 * mainly Arabic script while site is English → Arabic.
 */
export function resolveReplyLocale(siteLocale: ReplyLocale, userText: string): ReplyLocale {
  const { arabic, latin, total } = countScripts(userText.trim())
  if (total === 0) return siteLocale

  if (siteLocale === 'ar') {
    if (latin > 0 && arabic === 0) return 'en'
    if (latin >= arabic * 2) return 'en'
    return 'ar'
  }

  if (arabic > 0 && latin === 0) return 'ar'
  if (arabic >= latin * 2) return 'ar'
  return 'en'
}
