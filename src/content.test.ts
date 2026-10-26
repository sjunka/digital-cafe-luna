import { describe, expect, it } from 'vitest'
import * as C from './content'
import { MODS, ROUTES } from './panel/geometry'
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
