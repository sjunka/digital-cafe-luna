// Falla si algo publicable (src, public, dist) parece dato de una cuenta AWS: un número de 12 dígitos,
// una access key o un valor de LEAKS_FILE (p. ej. el .env.local de la app de labs, que no está en este repo).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const TEXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.css', '.html', '.svg', '.json', '.md', '.txt'])
const extra = process.env.LEAKS_FILE && existsSync(process.env.LEAKS_FILE)
  ? readFileSync(process.env.LEAKS_FILE, 'utf8').split('\n').map(l => l.match(/^\w+=(.+)$/)?.[1]?.trim()).filter(v => v && v.length >= 6)
  : []
const patterns = [/(?<![\w+/.])\d{12}(?![\w+/])/, /AKIA[0-9A-Z]{16}/, /\bi-0[0-9a-f]{8,}\b/, /\bsg-0[0-9a-f]{8,}\b/]

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* walk(p)
    else if (TEXT.has(extname(p))) yield p
  }
}

const hits = []
for (const d of ['src', 'public', 'dist', 'index.html', 'README.md'].map(d => join(root, d)).filter(existsSync)) {
  for (const f of statSync(d).isDirectory() ? walk(d) : [d]) {
    readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      const bad = extra.find(s => line.includes(s)) ?? patterns.map(re => line.match(re)?.[0]).find(Boolean)
      if (bad) hits.push(`${relative(root, f)}:${i + 1}: ${bad.slice(0, 40)}`)
    })
  }
}
if (hits.length) {
  console.error('check-leaks: posibles datos de cuenta en archivos publicables:\n' + hits.join('\n'))
  process.exit(1)
}
console.log(`check-leaks: sin datos de cuenta${extra.length ? ` (también revisé ${extra.length} valores de LEAKS_FILE)` : ''}`)
