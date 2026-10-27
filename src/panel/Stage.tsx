import { useCallback, useEffect, useRef, useState } from 'react'
import { DECISIONES, ESCENAS, ESLABONES, PIEZAS, RESTRICCIONES, type PiezaId } from '../content'
import { GHOSTS, MODS, modsDe } from './geometry'
import { playStep, reduced, resetMotion } from './motion'
import { Panel } from './Panel'
import { spotAt, stateAt, stepStart } from './scenes'
import { ADAPT_VACIO, type Adapt, type PanelState, type Tag } from './state'
import { Icon } from '../ui/Icon'

const IDS = ESCENAS.map(e => e.id)
const CICLO: (Tag | undefined)[] = [undefined, 'mantener', 'cambiar', 'quitar']
const nombre = (id: string) => (id === 'asg' ? 'Auto Scaling Group' : MODS[id]?.t ?? id)

function leerUrl() {
  const q = new URLSearchParams(window.location.search)
  const scene = IDS.indexOf(q.get('escena') ?? '')
  if (scene < 0) return null
  const max = ESCENAS[scene].pasos.length - 1
  const step = Math.min(max, Math.max(0, Number(q.get('paso') ?? 1) - 1))
  return { scene, step }
}

function escribirUrl(scene: number, step: number) {
  const q = new URLSearchParams(window.location.search)
  q.set('escena', IDS[scene])
  q.set('paso', String(step + 1))
  window.history.replaceState(null, '', `?${q}${window.location.hash}`)
}

const lectura = (t: string) => Math.min(8500, Math.max(3400, 1400 + t.length * 36))
const hora = (i: number) => `18:40:${String(7 + i * 9).padStart(2, '0')}`

export interface StageApi {
  play: (sceneId: string) => void
}

export function Stage({ apiRef }: { apiRef?: React.MutableRefObject<StageApi | null> }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const stageRef = useRef<HTMLElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const timer = useRef<number>(0)
  const autoRef = useRef(false)
  const posRef = useRef({ scene: 1, step: 0 })

  const [pos, setPos] = useState({ scene: 1, step: 0 })
  const [panel, setPanel] = useState<PanelState>(() => stateAt('compra', -1))
  const [auto, setAutoState] = useState(false)
  const [adapt, setAdapt] = useState<Adapt>(ADAPT_VACIO)
  const [hl, setHl] = useState<{ mods: string[]; badges: string[]; pin?: string }>({ mods: [], badges: [] })
  const [presenting, setPresenting] = useState(false)
  const [clock, setClock] = useState<{ t0: number | null; show: boolean }>({ t0: null, show: false })
  const [now, setNow] = useState(() => Date.now())
  const [help, setHelp] = useState(false)

  const setAuto = (v: boolean) => {
    autoRef.current = v
    setAutoState(v)
    if (!v) window.clearTimeout(timer.current)
  }

  const go = useCallback((scene: number, step: number, animate: boolean) => {
    tl.current?.kill()
    window.clearTimeout(timer.current)
    resetMotion(svgRef.current)
    posRef.current = { scene, step }
    setPos({ scene, step })
    escribirUrl(scene, step)
    const id = IDS[scene]
    if (!animate || reduced() || !svgRef.current) {
      setPanel(stateAt(id, step))
      if (autoRef.current) timer.current = window.setTimeout(() => avanzar(), lectura(ESCENAS[scene].pasos[step].texto))
      return
    }
    const from = stepStart(id, step)
    setPanel(from)
    tl.current = playStep(svgRef.current, id, step, from, setPanel)
    tl.current.eventCallback('onComplete', () => {
      if (autoRef.current) timer.current = window.setTimeout(() => avanzar(), lectura(ESCENAS[scene].pasos[step].texto))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Avance automático: se detiene al final de la escena.
  const avanzar = () => {
    const { scene, step } = posRef.current
    if (step < ESCENAS[scene].pasos.length - 1) go(scene, step + 1, true)
    else setAuto(false)
  }

  const next = () => {
    setAuto(false)
    const { scene, step } = posRef.current
    if (step < ESCENAS[scene].pasos.length - 1) go(scene, step + 1, true)
    else if (scene < IDS.length - 1) go(scene + 1, 0, true)
  }
  const prev = () => {
    setAuto(false)
    const { scene, step } = posRef.current
    if (step > 0) go(scene, step - 1, false)
    else if (scene > 0) go(scene - 1, ESCENAS[scene - 1].pasos.length - 1, false)
  }
  const escena = (i: number, play = true) => {
    setAuto(play)
    go(i, 0, true)
  }
  const toggleAuto = () => {
    if (autoRef.current) return setAuto(false)
    setAuto(true)
    const { scene, step } = posRef.current
    if (step >= ESCENAS[scene].pasos.length - 1) go(scene, 0, true)
    else go(scene, step + 1, true)
  }

  if (apiRef) apiRef.current = { play: (id: string) => escena(Math.max(0, IDS.indexOf(id))) }

  // Primera visita: la escena de una compra corre sola; con enlace directo se abre el paso pedido.
  useEffect(() => {
    const u = leerUrl()
    if (u) go(u.scene, u.step, false)
    else if (!reduced()) {
      const t = window.setTimeout(() => escena(1), 600)
      return () => window.clearTimeout(t)
    } else go(1, 0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => void tl.current?.kill(), [])

  useEffect(() => {
    const onFs = () => setPresenting(document.fullscreenElement === stageRef.current)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  useEffect(() => {
    if (!clock.show) return
    const i = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(i)
  }, [clock.show])

  const presentar = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void stageRef.current?.requestFullscreen?.()
  }

  // Entrar o salir de adaptación corta la animación en curso y deja el paso en su estado final.
  const toggleAdapt = () => {
    setAuto(false)
    tl.current?.kill()
    resetMotion(svgRef.current)
    const { scene, step } = posRef.current
    setPanel(stateAt(IDS[scene], step))
    setAdapt(a => ({ ...a, on: !a.on }))
  }

  const marcar = (id: string) =>
    setAdapt(a => {
      const sig = CICLO[(CICLO.indexOf(a.tags[id]) + 1) % CICLO.length]
      const tags = { ...a.tags }
      if (sig) tags[id] = sig
      else delete tags[id]
      return { ...a, tags }
    })

  const pieza = (p: PiezaId) =>
    setAdapt(a => ({ ...a, piezas: a.piezas.includes(p) ? a.piezas.filter(x => x !== p) : [...a.piezas, p] }))

  // Teclado y control remoto de presentación.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select')) {
        if (e.key === 'Escape') (t as HTMLInputElement).blur()
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key
      if (k === 'ArrowRight' || k === 'PageDown') next()
      else if (k === 'ArrowLeft' || k === 'PageUp') prev()
      else if (k === ' ' && t.closest('.stage, body') && !t.closest('button, a')) toggleAuto()
      else if (/^[1-7]$/.test(k)) escena(Number(k) - 1)
      else if (k === 'r' || k === 'R') go(posRef.current.scene, 0, true)
      else if (k === 'a' || k === 'A') toggleAdapt()
      else if (k === 'f' || k === 'F') presentar()
      else if (k === 't') setClock(c => ({ t0: c.t0 ?? Date.now(), show: !c.show }))
      else if (k === 'T') setClock({ t0: Date.now(), show: true })
      else if (k === '?') setHelp(h => !h)
      else if (k === 'Escape') {
        setHelp(false)
        if (adapt.on) toggleAdapt()
      } else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const sc = ESCENAS[pos.scene]
  const paso = sc.pasos[pos.step]
  const pasados = new Set(sc.pasos.slice(0, pos.step).map(p => p.link))
  const logs = sc.pasos.slice(0, pos.step + 1).map((p, i) => ({ h: hora(i), t: p.log })).slice(-4)
  const tocadas = [
    ...new Set([
      ...Object.entries(adapt.tags)
        .filter(([, t]) => t !== 'mantener')
        .flatMap(([id]) => (id === 'asg' ? ['D1', 'D2'] : MODS[id]?.dec ?? [])),
      ...adapt.piezas.flatMap(p => GHOSTS[p].dec),
    ]),
  ].sort()
  const porTag = (t: Tag) => Object.keys(adapt.tags).filter(id => adapt.tags[id] === t).map(nombre)
  const seg = clock.t0 ? Math.floor((now - clock.t0) / 1000) : 0
  const reloj = `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`

  const propagar = (decisiones: string[], pin?: string) => setHl({ mods: modsDe(decisiones), badges: decisiones, pin })
  const soltar = () => setHl(h => (h.pin ? h : { mods: [], badges: [] }))

  return (
    <section
      ref={stageRef}
      className={`stage${presenting ? ' presenting' : ''}${adapt.on ? ' adapting' : ''}`}
      aria-label="Tablero de la arquitectura"
      id="tablero"
    >
      <div className="stage-panel">
        <p className="swipe" aria-hidden="true">
          Desliza para ver el tablero completo
        </p>
        <Panel
          state={adapt.on ? stateAt('compra', -1) : panel}
          variant="live"
          adapt={adapt}
          onTag={marcar}
          hl={hl.mods}
          hlBadges={adapt.on ? tocadas : hl.badges}
          svgRef={svgRef}
          spot={adapt.on || hl.mods.length ? null : spotAt(IDS[pos.scene], pos.step)}
        />
      </div>

      <aside className="desk" aria-label="Pupitre de control">
        <div className="desk-head">
          <span className="desk-title">Escenas</span>
          {clock.show && (
            <span className={`clock${seg >= 600 ? ' over' : seg >= 480 ? ' near' : ''}`} aria-label={`Tiempo transcurrido ${reloj}`}>
              {reloj}
              <small> / 10:00</small>
            </span>
          )}
          <button className={`switch${adapt.on ? ' on' : ''}`} onClick={toggleAdapt} aria-pressed={adapt.on}>
            <span className="switch-knob" aria-hidden="true" />
            <span>{adapt.on ? 'Adaptación' : 'Operación'}</span>
          </button>
          <button className="key" onClick={presentar} aria-label={presenting ? 'Salir de pantalla completa' : 'Presentar en pantalla completa'}>
            <Icon n={presenting ? 'shrink' : 'expand'} />
          </button>
          <button className="key" onClick={() => setHelp(h => !h)} aria-label="Atajos de teclado" aria-expanded={help}>
            <Icon n="keys" />
          </button>
        </div>
        <div className="scenes">
          {ESCENAS.map((e, i) => (
            <button
              key={e.id}
              className={`push${i === pos.scene && !adapt.on ? ' lit' : ''}`}
              aria-pressed={i === pos.scene && !adapt.on}
              onClick={() => {
                if (adapt.on) toggleAdapt()
                escena(i)
              }}
            >
              <span className="push-k">{e.tecla}</span>
              <span className="push-t">
                {e.decision && <b>{e.decision}</b>}
                {e.titulo}
              </span>
            </button>
          ))}
        </div>

        {!adapt.on ? (
          <>
            <ol className={`chain${sc.decision || pos.scene === 0 ? '' : ' muted'}`} aria-label="Cadena de la decisión">
              {ESLABONES.map(l => (
                <li key={l.id} className={paso.link === l.id ? 'now' : pasados.has(l.id) ? 'done' : ''}>
                  <span className="chain-dot" />
                  <span className="chain-t">{l.nombre}</span>
                </li>
              ))}
            </ol>
            <p className="caption" aria-live="polite">
              {paso.texto}
            </p>
            <div className="transport">
              <span className="step-meta">
                Paso {pos.step + 1} de {sc.pasos.length}
              </span>
              <button className="key" onClick={prev} aria-label="Paso anterior">
                <Icon n="prev" />
              </button>
              <button className={`key${auto ? ' lit' : ''}`} onClick={toggleAuto} aria-label={auto ? 'Pausar' : 'Reproducir la escena'}>
                <Icon n={auto ? 'pause' : 'play'} />
              </button>
              <button className="key" onClick={next} aria-label="Paso siguiente">
                <Icon n="next" />
              </button>
              <button className="key" onClick={() => go(pos.scene, 0, true)} aria-label="Reiniciar la escena">
                <Icon n="restart" />
              </button>
            </div>
            <div className="reg">
              <p className="logger-k">Registrador · simulación con los supuestos S1 a S5</p>
              <ol className="logger" aria-label="Registro de eventos">
                {logs.map((l, i) => (
                  <li key={`${pos.scene}-${i}-${l.t}`} className={i === logs.length - 1 ? 'new' : ''}>
                    <time>{l.h}</time> {l.t}
                  </li>
                ))}
              </ol>
            </div>
          </>
        ) : (
          <div className="adapt">
            <label className="field">
              <span>Restricción nueva</span>
              <input
                value={adapt.restriccion}
                onChange={e => setAdapt(a => ({ ...a, restriccion: e.target.value }))}
                placeholder="La escribo cuando el profe la anuncie"
              />
            </label>
            <p className="hint">Toca un módulo para colgarle una tarjeta: Mantener, Cambiar, Quitar.</p>
            <div className="piezas" role="group" aria-label="Agregar piezas de la tabla de evolución">
              {PIEZAS.map(p => (
                <button key={p.id} className={`push small${adapt.piezas.includes(p.id) ? ' lit' : ''}`} aria-pressed={adapt.piezas.includes(p.id)} onClick={() => pieza(p.id)}>
                  <span className="push-t">
                    + {p.nombre} <small>{p.detalle}</small>
                  </span>
                </button>
              ))}
            </div>
            <dl className="resumen">
              {adapt.restriccion && (
                <>
                  <dt>Restricción</dt>
                  <dd>{adapt.restriccion}</dd>
                </>
              )}
              <dt>Mantengo</dt>
              <dd>{porTag('mantener').join(', ') || 'sin marcar'}</dd>
              <dt>Cambio</dt>
              <dd>{porTag('cambiar').join(', ') || 'sin marcar'}</dd>
              <dt>Quito</dt>
              <dd>{porTag('quitar').join(', ') || 'sin marcar'}</dd>
              <dt>Agrego</dt>
              <dd>{adapt.piezas.map(p => PIEZAS.find(x => x.id === p)?.nombre).join(', ') || 'nada'}</dd>
              <dt>Decisiones que toca</dt>
              <dd>{tocadas.join(', ') || 'ninguna'}</dd>
            </dl>
            <button className="key wide" onClick={() => setAdapt({ ...ADAPT_VACIO, on: true })}>
              Limpiar marcas
            </button>
          </div>
        )}

        <div className="links" role="group" aria-label="Qué toca cada restricción y cada decisión">
          {RESTRICCIONES.map(r => (
            <button
              key={r.id}
              className={`chip${hl.pin === r.id ? ' lit' : ''}`}
              title={`${r.nombre}: ${r.exige}`}
              onMouseEnter={() => propagar(r.decisiones)}
              onFocus={() => propagar(r.decisiones)}
              onMouseLeave={soltar}
              onBlur={soltar}
              onClick={() => (hl.pin === r.id ? setHl({ mods: [], badges: [] }) : propagar(r.decisiones, r.id))}
            >
              {r.id}
            </button>
          ))}
          <span className="links-sep" />
          {DECISIONES.map(d => (
            <button
              key={d.id}
              className={`chip d${hl.pin === d.id ? ' lit' : ''}`}
              title={d.titulo}
              onMouseEnter={() => propagar([d.id])}
              onFocus={() => propagar([d.id])}
              onMouseLeave={soltar}
              onBlur={soltar}
              onClick={() => (hl.pin === d.id ? setHl({ mods: [], badges: [] }) : propagar([d.id], d.id))}
            >
              {d.id}
            </button>
          ))}
        </div>

        {help && (
          <div className="help" role="dialog" aria-label="Atajos de teclado">
            <dl>
              <dt>→ ←</dt>
              <dd>paso siguiente y anterior (también el control remoto)</dd>
              <dt>Espacio</dt>
              <dd>reproducir o pausar la escena</dd>
              <dt>1 a 7</dt>
              <dd>ir a una escena</dd>
              <dt>R</dt>
              <dd>reiniciar la escena</dd>
              <dt>A</dt>
              <dd>modo adaptación</dd>
              <dt>F</dt>
              <dd>pantalla completa</dd>
              <dt>T</dt>
              <dd>reloj de 10 minutos; Mayús + T lo reinicia</dd>
            </dl>
          </div>
        )}
      </aside>
    </section>
  )
}
