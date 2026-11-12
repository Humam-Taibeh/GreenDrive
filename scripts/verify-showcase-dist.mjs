// Fails the showcase build if dist/ contains anything that should not be public:
//  - API-key-looking strings (Google "AIza…", OpenRouter "sk-or-…")
//  - code that talks to Google Maps, Gemini or OpenRouter
//  - the fake "live" console lines from the landing page
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = fileURLToPath(new URL('../dist', import.meta.url))
const TEXT = new Set(['.html', '.js', '.css', '.json', '.map', '.svg', '.txt', '.webmanifest'])

const RULES = [
  { name: 'Google API key (AIza…)', re: /AIza[0-9A-Za-z_-]{30,}/ },
  { name: 'OpenRouter key (sk-or-…)', re: /sk-or-[A-Za-z0-9_-]{10,}/ },
  { name: 'Google Maps endpoint', re: /maps\.googleapis\.com/ },
  { name: 'Gemini endpoint', re: /generativelanguage\.googleapis\.com/ },
  { name: 'OpenRouter endpoint', re: /openrouter\.ai/ },
  { name: 'Fake console line (fuel_model)', re: /fuel_model v=2\.4/ },
]

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else yield p
  }
}

let files = 0
const hits = []
for (const file of walk(DIST)) {
  if (!TEXT.has(extname(file))) continue
  files++
  const text = readFileSync(file, 'utf8')
  for (const r of RULES) if (r.re.test(text)) hits.push(`${r.name}  ←  ${file.slice(DIST.length + 1)}`)
}

if (hits.length) {
  console.error(`\n✖ showcase dist check FAILED (${hits.length} problem(s) in ${files} files):`)
  for (const h of hits) console.error('  - ' + h)
  process.exit(1)
}
console.log(`\n✔ showcase dist check passed: ${files} files scanned, no keys, no Maps/AI endpoints, no fake console lines.`)
