import { describe, expect, it } from 'vitest'
import * as C from './content'
import { ASG, MODS, ROUTES, SLOT, SLOTS } from './panel/geometry'
import { SCRIPTS, stateAt } from './panel/scenes'
import { totales } from './ui/CostBars'

describe('contenido del Brief', () => {
  it('los totales salen de las filas: USD 173 y 292, con 85% fijo en el mes normal', () => {
    const t = totales()
    expect(t.normal.fijo + t.normal.variable).toBe(173)
    expect(t.campana.fijo + t.campana.variable).toBe(292)
    expect(Math.round((t.normal.fijo / 173) * 100)).toBe(85)
  })

  it('cada escena tiene un guion animado con el mismo número de pasos', () => {
    for (const e of C.ESCENAS) expect(SCRIPTS[e.id]?.steps.length, e.id).toBe(e.pasos.length)
  })

  it('cada demo tiene una viñeta por paso de la escena de su decisión', () => {
    for (const d of C.DECISIONES) {
      const e = C.ESCENAS.find(x => x.id === d.escena)
      expect(C.DEMOS[d.id]?.vinetas.length, d.id).toBe(e?.pasos.length)
      expect(C.DEMOS[d.id].preguntas.length, d.id).toBeGreaterThan(0)
    }
  })

  it('los guiones solo usan rutas y módulos que existen en el tablero', () => {
    const mods = new Set([...Object.keys(MODS), 'asg', 'ec2a1', 'ec2a2', 'ec2a3', 'ec2b1', 'ec2b2', 'ec2b3'])
    for (const [id, sc] of Object.entries(SCRIPTS))
      for (const beats of sc.steps)
        for (const b of beats) {
          for (const r of b.flow ?? []) expect(ROUTES[r], `${id}: ruta ${r}`).toBeDefined()
          for (const m of [...(b.patch?.focus ?? []), ...Object.keys(b.patch?.lamps ?? {})]) expect(mods.has(m), `${id}: módulo ${m}`).toBe(true)
        }
    expect(() => C.ESCENAS.forEach(e => stateAt(e.id, e.pasos.length - 1))).not.toThrow()
  })

  it('al terminar cada paso, todo módulo que toca una ruta del paso está encendido', () => {
    // Segmentos de una ruta ortogonal 'M x y H x V y …'.
    const segmentos = (d: string) => {
      const out: { x1: number; y1: number; x2: number; y2: number }[] = []
      let x = 0
      let y = 0
      for (const m of d.matchAll(/([MHV])(\d+(?:\.\d+)?)(?: (\d+(?:\.\d+)?))?/g)) {
        const a = Number(m[2])
        if (m[1] === 'M') {
          x = a
          y = Number(m[3])
          continue
        }
        const [nx, ny] = m[1] === 'H' ? [a, y] : [x, a]
        out.push({ x1: Math.min(x, nx), y1: Math.min(y, ny), x2: Math.max(x, nx), y2: Math.max(y, ny) })
        x = nx
        y = ny
      }
      return out
    }
    // Una EC2 cuenta como encendida si lo está el ASG.
    const cajas = [
      ...Object.entries(MODS).map(([id, m]) => ({ id, ...m, foco: [id] })),
      { id: 'asg', ...ASG, foco: ['asg'] },
      ...[...SLOTS.a, ...SLOTS.b].map(s => ({ id: s.id, x: SLOT.x, y: s.y, w: SLOT.w, h: SLOT.h, foco: [s.id, 'asg'] })),
    ]
    for (const e of C.ESCENAS)
      e.pasos.forEach((_, i) => {
        const s = stateAt(e.id, i)
        for (const r of s.now)
          for (const g of segmentos(ROUTES[r]))
            for (const c of cajas)
              if (g.x1 <= c.x + c.w && g.x2 >= c.x && g.y1 <= c.y + c.h && g.y2 >= c.y)
                expect(c.foco.some(f => s.focus.includes(f)), `${e.id} paso ${i + 1}: ${r} toca ${c.id}`).toBe(true)
      })
  })

  it('decisiones, restricciones y escenas se referencian entre sí', () => {
    const d = new Set(C.DECISIONES.map(x => x.id))
    expect(C.DECISIONES).toHaveLength(5)
    for (const r of C.RESTRICCIONES) for (const x of r.decisiones) expect(d.has(x)).toBe(true)
    for (const x of C.DECISIONES) expect(C.ESCENAS.some(e => e.id === x.escena)).toBe(true)
  })

  it('el texto no usa el signo de sección ni datos de cuenta', () => {
    const s = JSON.stringify(C)
    expect(s).not.toContain('§')
    expect(s).not.toMatch(/\b\d{12}\b/)
  })
})
