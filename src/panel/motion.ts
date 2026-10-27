import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { SCRIPTS, applyBeat } from './scenes'
import { apply, type PanelState, type Patch } from './state'

gsap.registerPlugin(MotionPathPlugin)

// ?movimiento=reducido fuerza el modo sin movimiento (útil para capturas y para probarlo).
export function reduced(): boolean {
  if (typeof window === 'undefined') return true
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    new URLSearchParams(window.location.search).get('movimiento') === 'reducido'
  )
}

const HOP = 0.14 // pausa dentro de un módulo antes de salir por la vía siguiente
const EASE = 'power1.inOut'
const ANTES = ['focus', 'badges', 'attacker'] as const // se aplican cuando el paquete sale, no cuando llega

// Anima un paso: en cada tiempo los paquetes recorren sus vías, la ruta se enciende detrás del primero y,
// al llegar, se publica el estado siguiente. `from` es stepStart: ninguna ruta es aún del paso.
export function playStep(
  svg: SVGSVGElement,
  scene: string,
  step: number,
  from: PanelState,
  set: (s: PanelState) => void,
): gsap.core.Timeline {
  const pkts = Array.from(svg.querySelectorAll<SVGRectElement>('.pkt'))
  const tl = gsap.timeline()
  let s = from
  for (const b of SCRIPTS[scene].steps[step]) {
    if (b.flow) {
      // Lo que el paquete va a recorrer se enciende antes de que salga; lámparas y lecturas cambian al llegar.
      const pre: Patch = Object.fromEntries(ANTES.filter(k => b.patch?.[k] !== undefined).map(k => [k, b.patch![k]]))
      if (Object.keys(pre).length) {
        s = apply(s, pre)
        const st = s
        tl.call(() => set(st))
      }
      const start = tl.duration()
      for (let k = 0; k < (b.burst ?? 1); k++) {
        const p = pkts[k % pkts.length]
        let t = start + k * 0.09
        tl.set(p, { attr: { class: b.bad ? 'pkt bad' : 'pkt' } }, t)
        b.flow.forEach((id, i) => {
          const path = svg.querySelector<SVGPathElement>(`path.route[data-route="${id}"]`)
          if (!path) return
          if (i > 0) t += HOP
          const dur = gsap.utils.clamp(0.35, 1.3, path.getTotalLength() / 380)
          // El primer paquete dibuja la vía gruesa detrás de sí, aunque ya estuviera recorrida en otro paso.
          if (k === 0 && !s.now.includes(id)) trail(tl, svg, id, dur, t)
          tl.set(p, { opacity: 1 }, t)
          tl.to(p, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: dur, ease: EASE }, t)
          t += dur
          tl.set(p, { opacity: 0 }, t)
        })
      }
    }
    const target = applyBeat(s, b)
    tl.call(() => set(target))
    tl.to({}, { duration: b.pause ?? 0.4 })
    s = target
  }
  return tl
}

// La ruta y su borde se dibujan al paso del paquete; la réplica síncrona, que es punteada, aparece.
function trail(tl: gsap.core.Timeline, svg: SVGSVGElement, id: string, dur: number, t: number) {
  for (const el of svg.querySelectorAll<SVGPathElement>(`.route-case[data-route="${id}"], .route[data-route="${id}"]`)) {
    const fade = el.classList.contains('route') && el.classList.contains('sync')
    tl.set(el, { transition: 'none', opacity: fade ? 0 : 1 }, t)
    tl.fromTo(
      el,
      fade ? { opacity: 0 } : { strokeDashoffset: 1 },
      { ...(fade ? { opacity: 1 } : { strokeDashoffset: 0 }), duration: dur, ease: EASE, immediateRender: false },
      t,
    )
  }
}

// Al cambiar de paso: esconde los paquetes y devuelve cada ruta a lo que diga su clase.
export function resetMotion(svg: SVGSVGElement | null) {
  if (!svg) return
  gsap.set(svg.querySelectorAll('.pkt'), { opacity: 0 })
  gsap.set(svg.querySelectorAll('[data-route]'), { clearProps: 'strokeDashoffset,opacity,transition' })
}
