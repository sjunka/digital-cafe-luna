import { useRef } from 'react'
import {
  ALCANCE,
  COSTO_CONSUMO,
  COSTO_DRIVERS,
  COSTO_FILAS,
  COSTO_FUENTE,
  COSTO_PALANCAS,
  DECISIONES,
  ESLABONES,
  EVIDENCIA,
  EVOLUCION,
  FIGURA,
  FLUJO,
  META,
  NO_AHORA,
  NO_CUBREN,
  PRIORIDAD,
  PROBLEMA,
  PRUEBAS,
  RESILIENCIA,
  RESTRICCIONES,
  SUPUESTOS,
  TRADEOFFS,
} from './content'
import { reduced } from './panel/motion'
import { Stage, type StageApi } from './panel/Stage'
import { CostBars, totales } from './ui/CostBars'
import { Icon } from './ui/Icon'

export function App() {
  const api = useRef<StageApi | null>(null)
  const ver = (escena: string) => {
    document.getElementById('tablero')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' })
    api.current?.play(escena)
  }
  const t = totales()

  return (
    <>
      <a className="skip" href="#problema">
        Saltar al Brief
      </a>
      <header className="nameplate">
        <h1>
          <span className="np-case">{META.caso}</span>
          <span className="np-doc">{META.documento}</span>
        </h1>
        <p className="np-thesis">{META.tesis}</p>
        <p className="np-meta">
          {META.autor} · {META.curso} · {META.universidad} · {META.fecha}
        </p>
        <nav className="np-actions" aria-label="Documento">
          <a className="key wide" href={META.pdf} download="Brief-DigitalCafeLuna-SergioJunca.pdf">
            <Icon n="pdf" /> Brief en PDF, 2 páginas
          </a>
          <a className="key wide" href="#decisiones">
            Las 5 decisiones
          </a>
        </nav>
      </header>

      <main>
        <Stage apiRef={api} />
        <p className="fig-cap">
          <b>Figura 1.</b> {FIGURA} Cada escena sigue la cadena restricción, decisión, mecanismo, consecuencia y trade-off.
        </p>

        <Section n={1} id="problema" titulo="Problema y restricciones">
          <div className="two">
            <div className="prose">
              <p className="lead">{PROBLEMA}</p>
              <p>
                <b>Prioridad.</b> {PRIORIDAD}
              </p>
              <p>
                <b>Alcance.</b> {ALCANCE}
              </p>
            </div>
            <div className="scroll-x">
            <table className="grid-table restr">
              <caption className="sr">Restricciones del caso y lo que exigen</caption>
              <thead>
                <tr>
                  <th scope="col">Restricción del caso</th>
                  <th scope="col">Qué exige a la arquitectura</th>
                  <th scope="col">Decisión</th>
                </tr>
              </thead>
              <tbody>
                {RESTRICCIONES.map(r => (
                  <tr key={r.id}>
                    <th scope="row">
                      <span className="rid">{r.id}</span> {r.nombre}
                    </th>
                    <td>{r.exige}</td>
                    <td className="nowrap">{r.decisiones.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </Section>

        <Section n={2} id="arquitectura" titulo="Arquitectura">
          <ol className="flow">
            {FLUJO.map((f, i) => (
              <li key={i}>
                <span className="flow-n">{i + 1}</span>
                {f}
              </li>
            ))}
          </ol>
          <p className="note">
            La VPC usa el CIDR 10.20.0.0/16 del Lab 01: deja espacio para crecer y no se solapa con redes conocidas. Pública o privada lo decide la route table de cada subnet (Lab 04).
          </p>
        </Section>

        <Section n={3} id="decisiones" titulo="Decisiones">
          <div className="records">
            {DECISIONES.map(d => (
              <article key={d.id} className="rec" id={d.id}>
                <header className="rec-h">
                  <span className="rec-id">{d.id}</span>
                  <h3>{d.titulo}</h3>
                  <span className="rec-r" aria-label="Restricciones">
                    {d.restricciones.join(' · ')}
                  </span>
                </header>
                <ol className="rec-chain">
                  {ESLABONES.map(l => (
                    <li key={l.id}>
                      <span className="rec-l">{l.nombre}</span>
                      <p>{d.cadena[l.id]}</p>
                    </li>
                  ))}
                </ol>
                <div className="rec-foot">
                  <div>
                    <h4>Descarté</h4>
                    <ul className="struck">
                      {d.descarte.map(x => (
                        <li key={x.opcion}>
                          <s>{x.opcion}</s>: {x.porque}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>Evidencia</h4>
                    <p>{d.evidencia}</p>
                  </div>
                  <button className="key wide" onClick={() => ver(d.escena)}>
                    Ver {d.id} en el tablero <Icon n="arrow" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section n={4} id="tradeoffs" titulo="Trade-offs, riesgos y supuestos">
          <div className="scroll-x">
            <table className="grid-table">
              <caption className="sr">Qué gano, qué sacrifico y qué riesgo permanece en cada decisión</caption>
              <thead>
                <tr>
                  <th scope="col">Decisión</th>
                  <th scope="col">Gano</th>
                  <th scope="col">Sacrifico</th>
                  <th scope="col">Riesgo que permanece</th>
                  <th scope="col">Lo detecto con</th>
                </tr>
              </thead>
              <tbody>
                {TRADEOFFS.map(r => (
                  <tr key={r.d}>
                    <th scope="row">{r.d}</th>
                    <td>{r.gano}</td>
                    <td>{r.sacrifico}</td>
                    <td>{r.riesgo}</td>
                    <td>{r.senal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="two">
            <div>
              <h3 className="sub">Resiliencia por escenario</h3>
              <div className="scroll-x">
              <table className="grid-table">
                <caption className="sr">Qué pasa ante cada falla y con qué RTO y RPO</caption>
                <thead>
                  <tr>
                    <th scope="col">Falla</th>
                    <th scope="col">Qué pasa</th>
                    <th scope="col">RTO · RPO</th>
                  </tr>
                </thead>
                <tbody>
                  {RESILIENCIA.map(r => (
                    <tr key={r.falla}>
                      <th scope="row">{r.falla}</th>
                      <td>{r.efecto}</td>
                      <td className="nowrap">{r.objetivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            <div>
              <h3 className="sub">Supuestos y cómo los valido</h3>
              <ol className="assume">
                {SUPUESTOS.map((s, i) => (
                  <li key={i}>
                    <b>S{i + 1}.</b> {s.texto} <span className="val">Se valida {s.valida}.</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Section>

        <Section n={5} id="costo" titulo="Costo y evolución">
          <div className="two">
            <div>
              <div className="dpm-row">
                <div className="dpm">
                  <span className="dpm-k">Mes normal</span>
                  <span className="dpm-v">
                    <small>USD</small> {t.normal.fijo + t.normal.variable}
                  </span>
                </div>
                <div className="dpm">
                  <span className="dpm-k">Mes con campaña</span>
                  <span className="dpm-v">
                    <small>USD</small> {t.campana.fijo + t.campana.variable}
                  </span>
                </div>
              </div>
              <CostBars />
              <ul className="drivers">
                {COSTO_DRIVERS.map(d => (
                  <li key={d}>{d}</li>
                ))}
                <li>{COSTO_PALANCAS}</li>
              </ul>
            </div>
            <div className="scroll-x">
              <table className="grid-table num">
                <caption className="sr">Costo por componente en USD al mes</caption>
                <thead>
                  <tr>
                    <th scope="col">Componente</th>
                    <th scope="col">Normal</th>
                    <th scope="col">Campaña</th>
                  </tr>
                </thead>
                <tbody>
                  {COSTO_FILAS.map(f => (
                    <tr key={f.componente}>
                      <th scope="row">
                        {f.componente}
                        <small>{f.precio}</small>
                      </th>
                      <td>{f.normal[0] + f.normal[1]}</td>
                      <td>{f.campana[0] + f.campana[1]}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Total</th>
                    <td>{t.normal.fijo + t.normal.variable}</td>
                    <td>{t.campana.fijo + t.campana.variable}</td>
                  </tr>
                </tfoot>
              </table>
              <p className="note">
                {COSTO_FUENTE} {COSTO_CONSUMO.join(' ')}
              </p>
            </div>
          </div>
          <h3 className="sub">Qué hago ahora y qué dejo para después</h3>
          <div className="scroll-x">
            <table className="grid-table evo">
              <caption className="sr">Evolución de la arquitectura y la señal que dispara cada cambio</caption>
              <thead>
                <tr>
                  <th scope="col">Cuándo</th>
                  <th scope="col">Qué</th>
                  <th scope="col">Señal que lo dispara</th>
                </tr>
              </thead>
              <tbody>
                {EVOLUCION.map(e => (
                  <tr key={e.que} className={e.cuando === 'Ahora' ? 'now' : ''}>
                    <th scope="row">{e.cuando}</th>
                    <td>{e.que}</td>
                    <td>{e.senal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">{NO_AHORA}</p>
        </Section>

        <Section id="evidencia" titulo="Evidencia y cómo demostraría que funciona">
          <div className="two wide-right">
            <div>
              <h3 className="sub">Lo que comprobé en mi cuenta, Labs 01 a 07</h3>
              <ul className="labs">
                {EVIDENCIA.map(e => (
                  <li key={e.lab}>
                    <span className="lab-k">{e.lab}</span>
                    <span>{e.comprobe}</span>
                    <span className="lab-d">{e.sustenta}</span>
                  </li>
                ))}
              </ul>
              <p className="note">{NO_CUBREN}</p>
            </div>
            <div>
              <h3 className="sub">Pruebas</h3>
              <ol className="tests">
                {PRUEBAS.map(p => (
                  <li key={p.prueba}>
                    <b>{p.prueba}.</b> {p.esperado}. <span className="lab-d">{p.valida}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Section>
      </main>

      <footer className="foot">
        <p>
          {META.autor} · {META.curso} · {META.universidad}. Digital Café Luna es el caso del curso, no una empresa real. Costos de la AWS Price List API, octubre de 2026.
        </p>
        <p>
          <a href={META.repo}>Código del sitio y del Brief</a> · <a href={META.pdf}>Brief en PDF</a>
        </p>
      </footer>
    </>
  )
}

function Section({ n, id, titulo, children }: { n?: number; id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="sec" id={id} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="sec-h">
        {n && <span className="sec-n">{n}</span>}
        {titulo}
      </h2>
      {children}
    </section>
  )
}
