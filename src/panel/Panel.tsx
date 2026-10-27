import { gsap } from 'gsap'
import { useEffect, useId, useRef } from 'react'
import { ALARMAS, PIEZAS } from '../content'
import { ASG, BADGES, BLOCKS, CELDAS, CELDA_H, GHOSTS, MODS, PASOS_FIG, ROUTES, SLOT, SLOTS, TRACKS, ZONAS } from './geometry'
import type { Spot } from './scenes'
import type { Adapt, PanelState } from './state'
import { reduced } from './motion'

interface Props {
  state: PanelState
  variant: 'live' | 'print'
  adapt?: Adapt
  onTag?: (id: string) => void
  hl?: string[] // módulos resaltados por propagación (restricción o decisión elegida)
  hlBadges?: string[]
  svgRef?: React.Ref<SVGSVGElement>
  spot?: Spot | null // velo oscuro con huecos en lo que explica el paso
}

const PRINT_ROUTES = ['cli-cf', 'cf-alb', 'alb-a1', 'a1-rdsa', 'app-s3', 's3-lambda', 'lambda-logs']
const TAG_TXT = { mantener: 'Mantener', cambiar: 'Cambiar', quitar: 'Quitar' } as const
// Lo que queda dentro de us-east-1a: si la AZ cae, su cuerpo se raya y el rótulo sigue legible.
const ZONA_A = new Set(['alb', 'nat', 'rdsa', 'ec2a1', 'ec2a2', 'ec2a3'])
const H_LIVE = 740

export function Panel({ state, variant, adapt, onTag, hl = [], hlBadges = [], svgRef, spot }: Props) {
  const uid = useId().replace(/:/g, '')
  const live = variant === 'live'
  const focusOn = live && state.focus.length > 0
  const routes = live ? state.routes : PRINT_ROUTES
  const now = live ? state.now : PRINT_ROUTES
  const clickable = live && adapt?.on
  const hatch = `url(#hatch-${uid})`
  const caida = (id: string) => (state.failAz && ZONA_A.has(id) ? { fill: hatch } : undefined)

  // Baja saliencia para lo que no participa del paso; un módulo en falla nunca se atenúa.
  const cls = (id: string, base: string, lampId = id) => {
    const parts = [base]
    if (focusOn && !state.focus.includes(id) && state.lamps[lampId] !== 'fault') parts.push('dim')
    if (hl.includes(id)) parts.push('hl')
    if (clickable) parts.push('pick')
    return parts.join(' ')
  }

  const pick = (id: string) =>
    clickable
      ? {
          role: 'button',
          tabIndex: 0,
          'aria-label': `${id === 'asg' ? 'Auto Scaling Group' : MODS[id]?.t ?? id}: ${adapt?.tags[id] ? TAG_TXT[adapt.tags[id]] : 'sin marca'}`,
          onClick: () => onTag?.(id),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onTag?.(id)
            }
          },
        }
      : {}

  const sub = (id: string) => {
    if (id === 'rdsa') return state.primary === 'a' ? 'primaria' : 'caída'
    if (id === 'rdsb') return state.primary === 'a' ? 'copia síncrona' : 'primaria'
    return MODS[id].s
  }

  const routeCls = (id: string, base: string, lit: string[]) =>
    `${base}${lit.includes(id) ? (base === 'route-past' ? ' on' : ' now') : ''}${state.bad.includes(id) ? ' bad' : ''}${id === 'sync' ? ' sync' : ''}`

  return (
    <svg
      ref={svgRef}
      viewBox={live ? `0 0 1000 ${H_LIVE}` : '0 0 1000 646'}
      className={`panel panel-${variant}${state.failAz ? ' az-caida' : ''}`}
      role={live ? 'group' : 'img'}
      aria-label="Arquitectura de Digital Café Luna en us-east-1: CloudFront, ALB, Auto Scaling Group en dos zonas, RDS Multi-AZ y reportes por evento con Lambda"
    >
      <defs>
        <pattern id={`tiles-${uid}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" className="tile" />
          <path d="M20 0 V20 H0" className="seam" />
        </pattern>
        <pattern id={`hatch-${uid}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="10" height="10" className="hatch-bg" />
          <rect width="4" height="10" className="hatch-line" />
        </pattern>
      </defs>

      {/* En vivo el mosaico sigue más allá del viewBox: si el tablero se ajusta al alto de la ventana, los lados no quedan lisos. */}
      {live ? (
        <rect x={-1000} width={3000} height={H_LIVE} className="board" fill={`url(#tiles-${uid})`} />
      ) : (
        <rect width="1000" height="646" className="board" />
      )}

      {/* Zonas: región, VPC y una franja por AZ con su placa grabada */}
      <rect {...box(ZONAS.region)} className="zone region" />
      <Plate x={ZONAS.region.x} y={ZONAS.region.y} w={128} t="Región us-east-1" />
      <rect {...box(ZONAS.vpc)} className="zone vpc" />
      <Plate x={ZONAS.vpc.x} y={ZONAS.vpc.y} w={132} t="VPC 10.20.0.0/16" />
      {(['a', 'b'] as const).map(az => {
        const z = ZONAS[az]
        return (
          <g key={az} className={`az az-${az}`}>
            <rect {...box(z)} className="zone az-frame" />
            <rect x={z.x + 2} y={z.y} width="22" height={z.h} className={`plate az-plate${az === 'a' && state.failAz ? ' fault' : ''}`} />
            <text className="plate-t az-t" transform={`translate(${z.x + 17} ${z.y + z.h / 2}) rotate(-90)`} textAnchor="middle">
              {`us-east-1${az}`}
            </text>
            {CELDAS.map(c => (
              <g key={c.capa}>
                <rect x={c.x} y={z.cells} width={c.w} height={CELDA_H} className={`cell cell-${c.capa.toLowerCase()}`} />
                {/* En la columna de app el texto empieza después de la vía del ASG */}
                <text x={c.x + (c.capa === 'App' ? 18 : 7)} y={z.cells + 15} className="cell-t">{`${c.capa} ${az === 'a' ? c.ruta : c.rutaB}`}</text>
                <text x={c.x + (c.capa === 'App' ? 18 : 7)} y={z.cells + 29} className="cell-s">{az === 'a' ? c.a : c.b}</text>
              </g>
            ))}
          </g>
        )
      })}

      {/* AZ fuera de servicio: el rayado va debajo de vías y módulos, así los rótulos se leen completos */}
      <rect
        x={ZONAS.a.x + 26}
        y={ZONAS.a.y + 2}
        width={ZONAS.a.w - 28}
        height={ZONAS.a.h - 4}
        fill={hatch}
        className={`fail${state.failAz ? ' on' : ''}`}
      />

      {/* Vías fijas y rutas. Lo ya recorrido queda como hilo ámbar dentro de la vía; la ruta del paso lleva
          borde oscuro y núcleo ámbar grueso, y se dibuja detrás del paquete. */}
      {TRACKS.map((t, i) => (
        <path key={i} d={t.d} className={t.dash ? 'track dash' : 'track'} />
      ))}
      {Object.entries(ROUTES).map(([id, d]) => (
        <path key={id} d={d} data-route={id} pathLength={id === 'sync' ? undefined : 1} className={routeCls(id, 'route-past', routes)} />
      ))}
      {Object.entries(ROUTES).map(([id, d]) => (
        <path key={id} d={d} data-route={id} pathLength={1} className={routeCls(id, 'route-case', now)} />
      ))}
      {Object.entries(ROUTES).map(([id, d]) => (
        <path key={id} d={d} data-route={id} pathLength={id === 'sync' ? undefined : 1} className={routeCls(id, 'route', now)} />
      ))}

      {/* Paquetes: viajan sobre la ruta y desaparecen dentro de cada módulo que atraviesan */}
      <g className="packets">
        {Array.from({ length: 14 }, (_, i) => (
          <rect key={i} className="pkt" x="-6" y="-6" width="12" height="12" rx="2" opacity="0" />
        ))}
      </g>

      {/* Auto Scaling Group: marco y seis ranuras */}
      <g className={cls('asg', 'asg')} {...pick('asg')}>
        <rect {...box(ASG)} className="asg-frame" />
        <text x={ASG.x + 7} y={ASG.y + 13} className="asg-t">ASG · 2 a 6</text>
        {state.read.asg && (
          <text key={state.read.asg} x={ASG.x + ASG.w - 6} y={ASG.y + 13} textAnchor="end" className="read">
            {state.read.asg}
          </text>
        )}
        {adapt?.tags.asg && <TagMark x={ASG.x + 70} y={ASG.y + ASG.h - 8} tag={adapt.tags.asg} />}
      </g>
      {(['a', 'b'] as const).flatMap(az =>
        SLOTS[az].map((s, i) => {
          const on = i < state.ec2[az === 'a' ? 0 : 1]
          const lamp = state.lamps[s.id] ?? 'off'
          return (
            <g key={s.id} className={`${cls(focusOn && state.focus.includes('asg') ? 'asg' : s.id, 'slot', s.id)} ${on ? 'on' : 'off'}`}>
              <rect x={SLOT.x} y={s.y} width={SLOT.w} height={SLOT.h} rx="2" className="slot-body" style={on ? caida(s.id) : undefined} />
              <text x={SLOT.x + 8} y={s.y + 20} className="slot-t">{on ? 'EC2' : 'libre'}</text>
              <text x={SLOT.x + 40} y={s.y + 20} className="slot-s">{on && !state.read[s.id] ? 't3.small' : ''}</text>
              {on && state.read[s.id] && (
                <text key={state.read[s.id]} x={SLOT.x + SLOT.w - 18} y={s.y + 20} textAnchor="end" className="read">
                  {state.read[s.id]}
                </text>
              )}
              <circle cx={SLOT.x + SLOT.w - 9} cy={s.y + 15} r="5" className="lamp" data-l={on ? lamp : 'off'} />
            </g>
          )
        }),
      )}

      {/* Módulos */}
      {Object.entries(MODS).map(([id, m]) => {
        if (id === 'atacante' && !(live && state.attacker)) return null
        const lamp = state.lamps[id] ?? 'off'
        const small = m.w < 60
        const tall = id === 'alb' || id === 'albb'
        const read = state.read[id]
        return (
          <g key={id} className={`${cls(id, 'mod')}${m.ext ? ' ext' : ''} mod-${id}`} {...pick(id)}>
            <rect x={m.x} y={m.y} width={m.w} height={m.h} rx="3" className="mod-body" style={caida(id)} />
            {small || tall ? (
              <>
                <text x={m.x + m.w / 2} y={m.y + (small && !tall ? m.h / 2 + (m.s ? -2 : 5) : 22)} textAnchor="middle" className="mod-t">
                  {m.t}
                </text>
                {m.s && (
                  <text x={m.x + m.w / 2} y={m.y + (tall ? 38 : m.h / 2 + 12)} textAnchor="middle" className="mod-s">
                    {sub(id)}
                  </text>
                )}
              </>
            ) : (
              <>
                <text x={m.x + 8} y={m.y + 20} className="mod-t">{m.t}</text>
                {m.s && <text x={m.x + 8} y={m.y + 36} className="mod-s">{sub(id)}</text>}
              </>
            )}
            {!small && <circle cx={m.x + m.w - 11} cy={m.y + 12} r="5.5" className="lamp" data-l={lamp} />}
            {small && lamp !== 'off' && <circle cx={m.x + m.w - 6} cy={m.y + 6} r="4" className="lamp" data-l={lamp} />}
            {read && (
              <text
                key={read}
                x={small || tall ? m.x + m.w / 2 : m.x + m.w - 8}
                y={tall ? m.y + m.h / 2 + 4 : small ? m.y + m.h + 13 : m.y + m.h - 9}
                textAnchor={small || tall ? 'middle' : 'end'}
                className="read"
              >
                {read}
              </text>
            )}
            {/* La tarjeta cuelga del borde inferior: arriba taparía el CIDR de la subred */}
            {adapt?.tags[id] && <TagMark x={m.x + 4} y={m.y + m.h - 8} tag={adapt.tags[id]} />}
          </g>
        )
      })}

      {/* Piezas agregadas en modo adaptación */}
      {live &&
        adapt?.piezas.map(p => {
          const g = GHOSTS[p]
          const nombre = PIEZAS.find(x => x.id === p)?.corto ?? p
          return (
            <g key={p} className="ghost">
              <rect x={g.x} y={g.y} width={g.w} height={g.h} rx="3" className="ghost-body" />
              <text x={g.x + g.w / 2} y={g.y + g.h / 2 + 4} textAnchor="middle" className="ghost-t">
                {nombre}
              </text>
              <text x={g.x + g.w - 3} y={g.y + 10} textAnchor="end" className="ghost-plus">+</text>
            </g>
          )
        })}

      {/* Placas de decisión sobre los módulos */}
      {BADGES.map((b, i) => (
        <g key={i} className={`badge${(live && state.badges.includes(b.d)) || hlBadges.includes(b.d) ? ' on' : ''}`}>
          <rect x={b.x} y={b.y} width="22" height="14" rx="2" />
          <text x={b.x + 11} y={b.y + 10.5} textAnchor="middle">{b.d}</text>
        </g>
      ))}

      {/* Placa de la AZ fuera de servicio */}
      <g className={`fail${state.failAz ? ' on' : ''}`} aria-hidden={!state.failAz}>
        <rect x={548} y={ZONAS.a.y - 10} width="170" height="18" rx="2" className="fail-plate" />
        <text x={633} y={ZONAS.a.y + 3} textAnchor="middle" className="fail-t">AZ fuera de servicio</text>
      </g>

      {/* Tráfico rechazado */}
      {live &&
        state.blocks.map(id => {
          const b = BLOCKS[id]
          return (
            <g key={id} className="block">
              <rect x={b.x - 2} y={b.y - 11} width="5" height="22" className="block-bar" />
              <rect x={b.lx} y={b.ly} width={b.lw} height="18" rx="2" className="block-plate" />
              <text x={b.lx + b.lw / 2} y={b.ly + 13} textAnchor="middle" className="block-t">{b.t}</text>
            </g>
          )
        })}

      <Legend live={live} />

      {!live &&
        PASOS_FIG.map(p => (
          <g key={p.n} className="step-n">
            <circle cx={p.x} cy={p.y} r="9" />
            <text x={p.x} y={p.y + 4} textAnchor="middle">{p.n}</text>
          </g>
        ))}

      {live && <Instruments state={state} />}
      {live && spot && <Lightbox spot={spot} uid={uid} />}
    </svg>
  )
}

function box(z: { x: number; y: number; w: number; h: number }) {
  return { x: z.x, y: z.y, width: z.w, height: z.h }
}

function Plate({ x, y, w, t }: { x: number; y: number; w: number; t: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height="17" className="plate" />
      <text x={x + 7} y={y + 12.5} className="plate-t">{t}</text>
    </g>
  )
}

function TagMark({ x, y, tag }: { x: number; y: number; tag: keyof typeof TAG_TXT }) {
  return (
    <g className={`tagmark tag-${tag}`}>
      <rect x={x} y={y} width="66" height="16" rx="2" />
      <circle cx={x + 7} cy={y + 8} r="2.2" className="tag-hole" />
      <text x={x + 38} y={y + 12} textAnchor="middle">{TAG_TXT[tag]}</text>
    </g>
  )
}

// Columna izquierda, entre la pasarela y el atacante: ninguna ruta pasa por ahí.
// En papel las lámparas no se encienden y solo hay una ruta: la leyenda dice solo eso.
function Legend({ live }: { live: boolean }) {
  const x = 12
  const y = 194
  const rows: [string, string][] = live
    ? [
        ['ok', 'en servicio'],
        ['warn', 'cambiando'],
        ['fault', 'falla o bloqueo'],
        ['standby', 'en espera'],
      ]
    : []
  const r = y + 29 + rows.length * 14 // primera fila de rutas
  return (
    <g className="legend">
      <rect x={x} y={y} width="122" height="17" className="plate" />
      <text x={x + 7} y={y + 12.5} className="plate-t">Lectura</text>
      {rows.map(([l, t], i) => (
        <g key={l}>
          <circle cx={x + 7} cy={y + 29 + i * 14} r="5" className="lamp" data-l={l} />
          <text x={x + 18} y={y + 33 + i * 14} className="legend-t">{t}</text>
        </g>
      ))}
      <path d={`M${x} ${r} H${x + 14}`} pathLength={1} className="route-case now legend-route" />
      <path d={`M${x} ${r} H${x + 14}`} pathLength={1} className="route now legend-route" />
      <text x={x + 18} y={r + 4} className="legend-t">{live ? 'ruta del paso' : 'ruta de una compra'}</text>
      {live && (
        <>
          <path d={`M${x} ${r + 14} H${x + 14}`} className="track" />
          <path d={`M${x} ${r + 14} H${x + 14}`} pathLength={1} className="route-past on legend-route" />
          <text x={x + 18} y={r + 18} className="legend-t">ya recorrida</text>
        </>
      )}
      <rect x={x} y={r + (live ? 23 : 9)} width="16" height="11" rx="2" className="legend-badge" />
      <text x={x + 18} y={r + (live ? 32 : 18)} className="legend-t">decisión D1 a D5</text>
    </g>
  )
}

// Caja de un módulo, del ASG o de una ranura EC2.
function caja(id: string) {
  if (MODS[id]) return MODS[id]
  if (id === 'asg') return ASG
  const s = [...SLOTS.a, ...SLOTS.b].find(x => x.id === id)
  return s ? { x: SLOT.x, y: s.y, w: SLOT.w, h: SLOT.h } : null
}

// Lightbox: todo queda en penumbra salvo lo que el paso explica; los bordes del hueco se difuminan.
function Lightbox({ spot, uid }: { spot: Spot; uid: string }) {
  const P = 9
  return (
    <g className="lightbox" aria-hidden="true">
      <defs>
        <filter id={`soft-${uid}`} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <mask id={`spot-${uid}`} maskUnits="userSpaceOnUse" x={-1000} y={0} width={3000} height={H_LIVE}>
          <rect x={-1000} width={3000} height={H_LIVE} fill="#fff" />
          <g filter={`url(#soft-${uid})`}>
            {spot.mods.map(id => {
              const b = caja(id)
              return b && <rect key={id} x={b.x - P} y={b.y - P} width={b.w + 2 * P} height={b.h + 2 * P} rx="8" fill="#000" />
            })}
            {spot.routes.map(r => (
              <path key={r} d={ROUTES[r]} fill="none" stroke="#000" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {spot.inst && <rect x={4} y={640} width={992} height={H_LIVE - 640} fill="#000" />}
          </g>
        </mask>
      </defs>
      <rect x={-1000} width={3000} height={H_LIVE} className="lightbox-veil" mask={`url(#spot-${uid})`} />
    </g>
  )
}

function Instruments({ state }: { state: PanelState }) {
  const meters = [
    { k: 'EC2 en servicio · máx. 6', v: state.meters.ec2 },
    { k: 'CPU promedio %', v: state.meters.cpu },
    { k: 'Cache hit %', v: state.meters.hit },
    { k: 'USD por mes', v: state.meters.usd },
  ]
  return (
    <g className="instruments">
      {/* Lo que marcan medidores y anunciadores sale de los supuestos del Brief, no de una cuenta real */}
      <rect x={12} y={646} width="318" height="16" className="plate" />
      <text x={19} y={658} className="plate-t">Simulación · valores de los supuestos S1 a S5</text>
      {meters.map((m, i) => {
        const x = 12 + i * 122
        return (
          <g key={m.k}>
            <text x={x} y={682} className="meter-k">{m.k}</text>
            <rect x={x} y={688} width="112" height="42" rx="3" className="meter-win" />
            <text x={x + 104} y={720} textAnchor="end" className="meter-ghost">888</text>
            <Num x={x + 104} y={720} v={m.v} />
          </g>
        )
      })}
      {ALARMAS.map((a, i) => {
        const x = 500 + i * 82
        const on = state.alarms.includes(a.id)
        return (
          <g key={a.id} className={`ann${on ? ' on' : ''}`}>
            <rect x={x} y={672} width="76" height="58" rx="3" className="ann-win" />
            <text x={x + 38} y={697} textAnchor="middle" className="ann-t">{a.texto}</text>
            <text x={x + 38} y={715} textAnchor="middle" className="ann-a">{a.accion}</text>
          </g>
        )
      })}
    </g>
  )
}

// Medidor de siete segmentos: el número corre hacia su nuevo valor.
function Num({ x, y, v }: { x: number; y: number; v: number | null }) {
  const ref = useRef<SVGTextElement>(null)
  const last = useRef<number | null>(v)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const from = last.current
    last.current = v
    if (v === null || from === null || reduced()) {
      el.textContent = v === null ? '--' : String(v)
      return
    }
    const o = { n: from }
    const tw = gsap.to(o, { n: v, duration: 0.9, ease: 'power2.out', onUpdate: () => void (el.textContent = String(Math.round(o.n))) })
    return () => void tw.kill()
  }, [v])
  return (
    <text ref={ref} x={x} y={y} textAnchor="end" className="meter-v">
      {v === null ? '--' : v}
    </text>
  )
}
