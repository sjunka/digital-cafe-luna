import { gsap } from 'gsap'
import { useEffect, useRef, useState } from 'react'
import { DECISIONES, DEMOS, ESCENAS, ESLABONES, META, RESTRICCIONES, type Decision } from './content'
import { playStep, reduced, resetMotion } from './panel/motion'
import { Panel } from './panel/Panel'
import { spotAt, stateAt, stepStart } from './panel/scenes'
import { ADAPT_VACIO } from './panel/state'
import { Icon } from './ui/Icon'

// Guía de estudio: cada decisión con su escena del tablero en 20 s, una viñeta por paso.
const DUR = 20
const nombreLink = Object.fromEntries(ESLABONES.map(l => [l.id, l.nombre]))
const mmss = (t: number) => `0:${String(Math.floor(t)).padStart(2, '0')}`

export function Demos() {
  return (
    <>
      <header className="nameplate">
        <h1>
          <span className="np-case">{META.caso}</span>
          <span className="np-doc">Guía de estudio · las 5 decisiones en 20 s</span>
        </h1>
        <p className="np-thesis">
          Cada demo recorre la escena de una decisión en el tablero: restricción, decisión, mecanismo, consecuencia y trade-off. Al lado, la cadena completa y las preguntas probables del profesor.
        </p>
        <nav className="np-actions" aria-label="Decisiones">
          {DECISIONES.map(d => (
            <a key={d.id} className="key" href={`#${d.id}`}>
              {d.id}
            </a>
          ))}
          <a className="key wide" href="../">
            Tablero completo <Icon n="arrow" />
          </a>
          <a className="key wide" href="../brief.pdf">
            <Icon n="pdf" /> Brief
          </a>
        </nav>
      </header>
      <main>
        {DECISIONES.map(d => (
          <Demo key={d.id} d={d} />
        ))}
      </main>
    </>
  )
}

function Demo({ d }: { d: Decision }) {
  const escena = ESCENAS.find(e => e.id === d.escena)!
  const { vinetas, preguntas } = DEMOS[d.id]
  const n = escena.pasos.length
  const slot = DUR / n

  const svgRef = useRef<SVGSVGElement>(null)
  const boxRef = useRef<HTMLElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef<HTMLSpanElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const [panel, setPanel] = useState(() => stateAt(d.escena, n - 1))
  const [chap, setChap] = useState(-1)
  const [playing, setPlaying] = useState(false)

  // Una timeline maestra de 20 s: cada paso ocupa su tramo y, si su animación es más larga, se acelera.
  const build = () => {
    const svg = svgRef.current!
    const m = gsap.timeline({
      paused: true,
      onUpdate: () => {
        const t = m.time()
        if (barRef.current) barRef.current.style.width = `${(t / DUR) * 100}%`
        if (timeRef.current) timeRef.current.textContent = mmss(t)
        setChap(Math.min(n - 1, Math.floor(t / slot)))
      },
      onComplete: () => setPlaying(false),
    })
    for (let i = 0; i < n; i++) {
      const at = i * slot
      m.call(() => entrar(i), undefined, at)
      if (reduced()) continue
      const step = playStep(svg, d.escena, i, stepStart(d.escena, i), setPanel)
      const libre = slot - 0.7
      if (step.duration() > libre) step.timeScale(step.duration() / libre)
      m.add(step, at + 0.05)
    }
    m.to({}, { duration: 0.001 }, DUR - 0.001)
    return m
  }

  const entrar = (i: number) => {
    resetMotion(svgRef.current)
    setPanel(reduced() ? stateAt(d.escena, i) : stepStart(d.escena, i))
    setChap(i)
  }

  const play = () => {
    window.dispatchEvent(new CustomEvent('demo-play', { detail: d.id }))
    tl.current ??= build()
    if (tl.current.progress() >= 1) seek(0)
    tl.current.play()
    setPlaying(true)
  }
  const pause = () => {
    tl.current?.pause()
    setPlaying(false)
  }
  const seek = (i: number) => {
    tl.current ??= build()
    tl.current.seek(i * slot, true)
    entrar(i)
    if (barRef.current) barRef.current.style.width = `${((i * slot) / DUR) * 100}%`
    if (timeRef.current) timeRef.current.textContent = mmss(i * slot)
  }
  const capitulo = (i: number) => {
    seek(i)
    play()
  }

  // Un solo demo suena a la vez, y se pausa al salir de pantalla.
  useEffect(() => {
    const otro = (e: Event) => (e as CustomEvent).detail !== d.id && pause()
    window.addEventListener('demo-play', otro)
    const io = new IntersectionObserver(([e]) => !e.isIntersecting && pause(), { threshold: 0.25 })
    if (boxRef.current) io.observe(boxRef.current)
    return () => {
      window.removeEventListener('demo-play', otro)
      io.disconnect()
      tl.current?.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const paso = chap >= 0 ? escena.pasos[chap] : null

  return (
    <section className="sec demo" id={d.id} aria-labelledby={`${d.id}-h`}>
      <h2 id={`${d.id}-h`} className="sec-h">
        <span className="sec-n">{d.id}</span>
        {d.titulo}
      </h2>
      <div className="demo-grid">
        <figure className="demo-player" ref={boxRef}>
          <div className="demo-screen">
            <Panel state={panel} variant="live" adapt={ADAPT_VACIO} svgRef={svgRef} hlBadges={[d.id]} spot={chap >= 0 ? spotAt(d.escena, chap) : null} />
            {!playing && chap < 0 && (
              <button className="demo-start" onClick={play} aria-label={`Reproducir demo de ${d.id}`}>
                <Icon n="play" /> Ver demo · 0:20
              </button>
            )}
          </div>
          <div className="demo-cap" aria-live="polite">
            <span className="demo-cap-n">{chap >= 0 ? `${chap + 1}/${n}` : `${n} pasos`}</span>
            {paso?.link && <span className="demo-cap-l">{nombreLink[paso.link]}</span>}
            <span className="demo-cap-t">{chap >= 0 ? vinetas[chap] : d.cadena.decision}</span>
          </div>
          <div className="demo-ctl">
            <button className="key" onClick={playing ? pause : play} aria-label={playing ? 'Pausar' : 'Reproducir'}>
              <Icon n={playing ? 'pause' : 'play'} />
            </button>
            <button className="key" onClick={() => capitulo(0)} aria-label="Desde el inicio">
              <Icon n="restart" />
            </button>
            <div className="demo-track">
              <div className="demo-fill" ref={barRef} />
              {escena.pasos.map((_, i) => (
                <button
                  key={i}
                  className={`demo-seg${i === chap ? ' now' : ''}`}
                  style={{ left: `${(i / n) * 100}%`, width: `${100 / n}%` }}
                  onClick={() => capitulo(i)}
                  aria-label={`Paso ${i + 1}: ${vinetas[i]}`}
                />
              ))}
            </div>
            <span className="demo-time">
              <span ref={timeRef}>0:00</span> / {mmss(DUR)}
            </span>
          </div>
          <ol className="demo-chapters">
            {vinetas.map((v, i) => (
              <li key={i} className={i === chap ? 'now' : i < chap ? 'done' : ''}>
                <button onClick={() => capitulo(i)}>
                  <span className="demo-ch-t">{mmss(i * slot)}</span>
                  <span className="demo-ch-l">{nombreLink[escena.pasos[i].link ?? '']}</span>
                  {v}
                </button>
              </li>
            ))}
          </ol>
        </figure>

        <div className="demo-side">
          <p className="demo-r">
            {d.restricciones.map(r => (
              <span key={r}>
                <b>{r}</b> {RESTRICCIONES.find(x => x.id === r)?.nombre}
              </span>
            ))}
          </p>
          <dl className="demo-chain">
            {ESLABONES.map(l => (
              <div key={l.id}>
                <dt>{l.nombre}</dt>
                <dd>{d.cadena[l.id]}</dd>
              </div>
            ))}
          </dl>
          <h3 className="demo-h">Descarté</h3>
          <ul className="struck">
            {d.descarte.map(x => (
              <li key={x.opcion}>
                <s>{x.opcion}</s>: {x.porque}
              </li>
            ))}
          </ul>
          <h3 className="demo-h">Evidencia</h3>
          <p>{d.evidencia}</p>
          <h3 className="demo-h">Si el profesor pregunta</h3>
          <div className="demo-qa">
            {preguntas.map(p => (
              <details key={p.q}>
                <summary>{p.q}</summary>
                <p>{p.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
