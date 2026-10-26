import { useId, useState } from 'react'
import { COSTO_FILAS } from '../content'

// Costo fijo y variable por mes, sumado desde las filas de la tabla (no se teclean totales).
export function totales() {
  const suma = (k: 'normal' | 'campana', i: 0 | 1) => COSTO_FILAS.reduce((s, f) => s + f[k][i], 0)
  return {
    normal: { fijo: suma('normal', 0), variable: suma('normal', 1) },
    campana: { fijo: suma('campana', 0), variable: suma('campana', 1) },
  }
}

const MAX = 300

export function CostBars({ print = false }: { print?: boolean }) {
  // En el PDF la figura ocupa media columna: barras más cortas para que el texto no quede diminuto.
  const W = print ? 300 : 520
  const X0 = print ? 96 : 116
  const t = totales()
  const hatch = `cb-hatch-${useId().replace(/:/g, '')}`
  const filas = [
    { k: 'Mes normal', ...t.normal },
    { k: 'Con campaña', ...t.campana },
  ]
  const [tip, setTip] = useState<{ x: number; y: number; txt: string } | null>(null)
  const px = (v: number) => (v / MAX) * W

  return (
    <figure className="costbars">
      <div className="cb-legend" aria-hidden="true">
        <span><i className="sw fijo" /> Fijo: corre aunque no haya ventas</span>
        <span><i className="sw var" /> Variable: crece con el tráfico</span>
      </div>
      <div className="cb-wrap">
        <svg viewBox={`0 0 ${X0 + W + 70} ${print ? 86 : 112}`} role="img" aria-label={`Costo mensual: normal USD ${t.normal.fijo + t.normal.variable} (fijo ${t.normal.fijo}, variable ${t.normal.variable}); con campaña USD ${t.campana.fijo + t.campana.variable} (fijo ${t.campana.fijo}, variable ${t.campana.variable}).`}>
          <defs>
            <pattern id={hatch} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" className="cb-hatch-bg" />
              <rect width="2.5" height="6" className="cb-hatch-line" />
            </pattern>
          </defs>
          {[0, 100, 200, 300].map(v => (
            <g key={v} className="cb-grid">
              <line x1={X0 + px(v)} x2={X0 + px(v)} y1={6} y2={print ? 68 : 92} />
              <text x={X0 + px(v)} y={print ? 81 : 106} textAnchor="middle">{v}</text>
            </g>
          ))}
          {filas.map((f, i) => {
            const y = print ? 10 + i * 30 : 18 + i * 40
            const h = print ? 20 : 22
            const total = f.fijo + f.variable
            const segs = [
              { c: 'fijo', v: f.fijo, x: X0, w: px(f.fijo) - 1 },
              { c: 'var', v: f.variable, x: X0 + px(f.fijo) + 1, w: px(f.variable) - 1 },
            ]
            return (
              <g key={f.k}>
                <text x={X0 - 10} y={y + h / 2 + 4} textAnchor="end" className="cb-k">{f.k}</text>
                {segs.map(s => {
                  const nombre = s.c === 'fijo' ? 'Fijo' : 'Variable'
                  const txt = `${f.k} · ${nombre}: USD ${s.v} (${Math.round((s.v / total) * 100)}%)`
                  const show = (e: React.PointerEvent | React.FocusEvent) => {
                    const r = (e.currentTarget as SVGElement).getBoundingClientRect()
                    const host = (e.currentTarget as SVGElement).closest('.cb-wrap')!.getBoundingClientRect()
                    setTip({ x: r.left - host.left + r.width / 2, y: r.top - host.top, txt })
                  }
                  return (
                    <g key={s.c}>
                      <path d={bar(s.x, y, s.w, h, s.c === 'var')} className={`cb-seg ${s.c}`} fill={s.c === 'var' ? `url(#${hatch})` : undefined} />
                      {!print && (
                        <rect
                          x={s.x}
                          y={y - 6}
                          width={Math.max(s.w, 18)}
                          height={34}
                          className="cb-hit"
                          tabIndex={0}
                          aria-label={txt}
                          onPointerEnter={show}
                          onFocus={show}
                          onPointerLeave={() => setTip(null)}
                          onBlur={() => setTip(null)}
                        />
                      )}
                      {s.c === 'fijo' && (
                        <text x={s.x + 8} y={y + h / 2 + 4} className="cb-in">{s.v}</text>
                      )}
                    </g>
                  )
                })}
                <text x={X0 + px(total) + 8} y={y + h / 2 + 4} className="cb-total">USD {total}</text>
              </g>
            )
          })}
        </svg>
        {tip && (
          <div className="cb-tip" style={{ left: tip.x, top: tip.y }} role="status">
            {tip.txt}
          </div>
        )}
      </div>
    </figure>
  )
}

// Barra con el extremo de datos redondeado (4 px) y la base recta.
function bar(x: number, y: number, w: number, h: number, round: boolean) {
  if (!round) return `M${x} ${y} H${x + w} V${y + h} H${x} Z`
  const r = Math.min(4, w / 2)
  return `M${x} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x} Z`
}
