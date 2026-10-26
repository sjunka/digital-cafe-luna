// Iconos de los botones del pupitre: trazo de 2 px, esquinas rectas como las teclas de un panel.
const P: Record<string, string> = {
  prev: 'M14 5 L7 10 L14 15 Z M5 5 V15',
  next: 'M6 5 L13 10 L6 15 Z M15 5 V15',
  play: 'M7 4.5 L15.5 10 L7 15.5 Z',
  pause: 'M6.5 5 V15 M13.5 5 V15',
  restart: 'M5 10 a5 5 0 1 0 1.6 -3.7 M5 4.5 V8 H8.5',
  expand: 'M4 8 V4 H8 M12 4 H16 V8 M16 12 V16 H12 M8 16 H4 V12',
  shrink: 'M8 4 V8 H4 M16 8 H12 V4 M12 16 V12 H16 M4 12 H8 V16',
  keys: 'M3 6 H17 V14 H3 Z M6 9 H6.5 M9.5 9 H10 M13 9 H13.5 M7 11.5 H13',
  pdf: 'M5 3 H12 L15 6 V17 H5 Z M12 3 V6 H15 M8 10 H12 M8 13 H12',
  arrow: 'M4 10 H15 M11 6 L15 10 L11 14',
}

export function Icon({ n }: { n: keyof typeof P | string }) {
  const fill = n === 'play' || n === 'prev' || n === 'next'
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" className="icon">
      <path d={P[n]} fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" strokeLinecap="square" />
    </svg>
  )
}
