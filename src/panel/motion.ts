import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { SCRIPTS, applyBeat } from './scenes'
import type { PanelState } from './state'

gsap.registerPlugin(MotionPathPlugin)

// ?movimiento=reducido fuerza el modo sin movimiento (útil para capturas y para probarlo).
export function reduced(): boolean {
  if (typeof window === 'undefined') return true
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    new URLSearchParams(window.location.search).get('movimiento') === 'reducido'
  )
}

// Anima un paso: en cada tiempo los paquetes recorren sus vías y, al llegar, se publica el estado siguiente.
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
      const paths = b.flow
        .map(id => svg.querySelector<SVGPathElement>(`[data-route="${id}"]`))
        .filter((p): p is SVGPathElement => p !== null)
      const start = tl.duration()
      for (let k = 0; k < (b.burst ?? 1); k++) {
        const p = pkts[k % pkts.length]
        let t = start + k * 0.09
        tl.set(p, { opacity: 1, attr: { class: b.bad ? 'pkt bad' : 'pkt' } }, t)
        for (const path of paths) {
          const dur = gsap.utils.clamp(0.35, 1.3, path.getTotalLength() / 380)
          tl.to(p, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: dur, ease: 'power1.inOut' }, t)
          t += dur
        }
        tl.set(p, { opacity: 0 }, t)
      }
    }
    const target = applyBeat(s, b)
    tl.call(() => set(target))
    tl.to({}, { duration: b.pause ?? 0.4 })
    s = target
  }
  return tl
}

export function hidePackets(svg: SVGSVGElement | null) {
  if (svg) gsap.set(svg.querySelectorAll('.pkt'), { opacity: 0 })
}
