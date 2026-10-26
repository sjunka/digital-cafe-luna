// Imprime dist/index.html?vista=brief a public/brief.pdf con Chrome y exige exactamente 2 páginas.
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const html = join(root, 'dist/index.html')
const out = join(root, 'public/brief.pdf')
if (!existsSync(html)) throw new Error('Falta dist/index.html: corre npm run build primero')

execFileSync(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  '--virtual-time-budget=8000',
  `--print-to-pdf=${out}`,
  `file://${html}?vista=brief`,
], { stdio: 'ignore' })

const pages = (readFileSync(out, 'latin1').match(/\/Type\s*\/Page(?!s)/g) ?? []).length
copyFileSync(out, join(root, 'dist/brief.pdf'))
if (pages !== 2) {
  console.error(`pdf: el Brief salió con ${pages} páginas; el máximo es 2`)
  process.exit(1)
}
console.log('pdf: public/brief.pdf con 2 páginas (copiado a dist/)')
