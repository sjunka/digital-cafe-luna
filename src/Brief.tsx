import { Fragment } from 'react'
import {
  ALCANCE,
  COSTO_CONSUMO,
  COSTO_DRIVERS,
  COSTO_FUENTE,
  COSTO_PALANCAS,
  DECISIONES,
  ESLABONES,
  EVOLUCION,
  FIGURA,
  FLUJO,
  META,
  NO_AHORA,
  PRIORIDAD,
  PROBLEMA,
  RESILIENCIA,
  RESTRICCIONES,
  SUPUESTOS,
  TRADEOFFS,
} from './content'
import { Panel } from './panel/Panel'
import { NORMAL } from './panel/state'
import { CostBars } from './ui/CostBars'

// El documento que se entrega: máximo 2 páginas carta, las cinco secciones en el orden que pide el curso.
export function Brief() {
  return (
    <article className="brief">
      <header className="b-head">
        <h1>
          <span className="b-case">{META.caso}</span>
          <span className="b-doc">{META.documento}</span>
        </h1>
        <p className="b-meta">
          {META.autor}
          <br />
          {META.curso} · {META.universidad}
          <br />
          {META.fecha}
        </p>
      </header>
      <p className="b-thesis">
        {META.tesis} Lo estático sale del borde, la API escala en dos AZ con un techo, los pedidos viven en una base Multi-AZ, todo se opera como código y lo intermitente corre por evento. Cuesta USD 173 en un mes normal y 292 con campaña.
      </p>

      <section className="b-sec b-first">
        <h2>
          <span>1</span>Problema y restricciones
        </h2>
        <div className="b-cols">
          <div>
            <p>{PROBLEMA}</p>
            <p>
              <b>Prioridad.</b> {PRIORIDAD}
            </p>
            <p>
              <b>Alcance.</b> {ALCANCE}
            </p>
          </div>
          <table className="b-table">
            <thead>
              <tr>
                <th>Restricción del caso</th>
                <th>Qué exige a la arquitectura</th>
                <th>Decisión</th>
              </tr>
            </thead>
            <tbody>
              {RESTRICCIONES.map(r => (
                <tr key={r.id}>
                  <th>
                    <span className="b-rid">{r.id}</span> {r.nombre}
                  </th>
                  <td>{r.exige}</td>
                  <td className="nowrap">{r.decisiones.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="b-sec">
        <h2>
          <span>2</span>Arquitectura
        </h2>
        <figure className="b-fig">
          <Panel state={NORMAL} variant="print" />
          <figcaption>
            <p>
              <b>Figura 1.</b> {FIGURA} La línea ámbar es la ruta de una compra.
            </p>
            <ol className="b-flow">
              {FLUJO.map((f, i) => (
                <li key={i}>
                  <span>{i + 1}</span>
                  {f}
                </li>
              ))}
            </ol>
          </figcaption>
        </figure>
      </section>

      <section className="b-sec b-page">
        <h2>
          <span>3</span>Decisiones
        </h2>
        <div className="b-decs">
          {DECISIONES.map(d => (
            <div key={d.id} className="b-dec">
              <h3>
                <span className="b-did">{d.id}</span>
                {d.titulo}
                <span className="b-r">{d.restricciones.join(' · ')}</span>
              </h3>
              <p className="b-chain">
                {ESLABONES.map((l, i) => (
                  <Fragment key={l.id}>
                    {i > 0 && <span className="b-arrow"> → </span>}
                    <b className="b-l">{l.nombre}:</b> {d.cadena[l.id]}
                  </Fragment>
                ))}
              </p>
              <p className="b-ev">
                <b>Descarté</b>{' '}
                {d.descarte.map((x, i) => (
                  <Fragment key={x.opcion}>
                    {i > 0 && ' y '}
                    <s>{x.opcion}</s>
                  </Fragment>
                ))}
                . <b>Evidencia</b> {d.evidencia}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="b-sec">
        <h2>
          <span>4</span>Trade-offs, riesgos y supuestos
        </h2>
        <table className="b-table b-trade">
          <thead>
            <tr>
              <th />
              <th>Gano</th>
              <th>Sacrifico</th>
              <th>Riesgo que permanece</th>
              <th>Lo detecto con</th>
            </tr>
          </thead>
          <tbody>
            {TRADEOFFS.map(r => (
              <tr key={r.d}>
                <th>{r.d}</th>
                <td>{r.gano}</td>
                <td>{r.sacrifico}</td>
                <td>{r.riesgo}</td>
                <td>{r.senal}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="b-res">
          <b>Resiliencia por escenario.</b>{' '}
          {RESILIENCIA.map((r, i) => (
            <Fragment key={r.falla}>
              {i > 0 && ' · '}
              {r.falla}: {r.objetivo}
            </Fragment>
          ))}
          .
        </p>
        <ol className="b-sup">
          {SUPUESTOS.map((s, i) => (
            <li key={i}>
              <b>S{i + 1}.</b> {s.texto} <i>Se valida {s.valida}.</i>
            </li>
          ))}
        </ol>
      </section>

      <section className="b-sec">
        <h2>
          <span>5</span>Costo y evolución
        </h2>
        <div className="b-cols b-cost">
          <div>
            <CostBars print />
            <p className="b-drivers">
              {COSTO_DRIVERS.join(' ')} {COSTO_PALANCAS}
            </p>
            <p className="b-small">
              {COSTO_FUENTE} {COSTO_CONSUMO.join(' ')}
            </p>
          </div>
          <div>
            <table className="b-table">
              <thead>
                <tr>
                  <th>Cuándo</th>
                  <th>Qué</th>
                  <th>Señal que lo dispara</th>
                </tr>
              </thead>
              <tbody>
                {EVOLUCION.map(e => (
                  <tr key={e.que}>
                    <th>{e.cuando}</th>
                    <td>{e.que}</td>
                    <td>{e.senal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="b-small">{NO_AHORA}</p>
          </div>
        </div>
      </section>
    </article>
  )
}
