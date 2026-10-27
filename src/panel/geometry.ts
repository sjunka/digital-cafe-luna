// Geometría del tablero (viewBox 1000 de ancho). Capas en columnas y zonas de disponibilidad en filas:
// una compra se lee de izquierda a derecha y la caída de una AZ es una franja que se apaga.

export interface Mod {
  x: number
  y: number
  w: number
  h: number
  t: string // título grabado
  s?: string // subtítulo
  ext?: boolean // fuera de AWS (borde punteado)
  dec: string[] // decisiones que lo justifican
}

export const MODS: Record<string, Mod> = {
  clientes: { x: 12, y: 48, w: 120, h: 62, t: 'Clientes', s: 'web y móvil', ext: true, dec: [] },
  pasarela: { x: 12, y: 132, w: 120, h: 54, t: 'Pasarela', s: 'pago alojado', ext: true, dec: [] },
  atacante: { x: 12, y: 322, w: 120, h: 56, t: 'Atacante', s: '203.0.113.7', ext: true, dec: [] },
  dr: { x: 12, y: 430, w: 120, h: 64, t: 'us-east-2', s: 'backups y AMI', dec: ['D2'] },
  cloudfront: { x: 160, y: 48, w: 124, h: 62, t: 'CloudFront', s: 'borde · caché', dec: ['D1', 'D3'] },
  s3web: { x: 308, y: 48, w: 150, h: 62, t: 'S3 web', s: 'privado · OAC', dec: ['D1'] },
  igw: { x: 290, y: 326, w: 32, h: 32, t: 'IGW', dec: ['D3'] },
  alb: { x: 348, y: 192, w: 70, h: 128, t: 'ALB', s: '443 ← CF', dec: ['D2', 'D3'] },
  albb: { x: 348, y: 388, w: 70, h: 128, t: 'ALB', s: '443 ← CF', dec: ['D2', 'D3'] },
  nat: { x: 426, y: 192, w: 50, h: 46, t: 'NAT', dec: ['D3'] },
  rdsa: { x: 668, y: 192, w: 118, h: 70, t: 'RDS', s: 'PostgreSQL', dec: ['D2'] },
  rdsb: { x: 668, y: 388, w: 118, h: 70, t: 'RDS', s: 'PostgreSQL', dec: ['D2'] },
  gwe: { x: 786, y: 325, w: 44, h: 34, t: 'GW', dec: ['D3', 'D5'] },
  s3ped: { x: 840, y: 150, w: 142, h: 70, t: 'S3 pedidos', s: 'incoming/ reports/', dec: ['D5'] },
  lambda: { x: 840, y: 262, w: 142, h: 62, t: 'Lambda', s: 'reportes', dec: ['D5'] },
  logs: { x: 840, y: 366, w: 142, h: 56, t: 'CloudWatch Logs', s: 'una línea por id', dec: ['D4', 'D5'] },
  sns: { x: 840, y: 452, w: 142, h: 56, t: 'SNS', s: 'aviso al de turno', dec: ['D4'] },
  cfn: { x: 12, y: 566, w: 210, h: 70, t: 'CloudFormation', s: 'red · datos · app', dec: ['D4'] },
  cw: { x: 232, y: 566, w: 220, h: 70, t: 'CloudWatch', s: 'alarmas con acción', dec: ['D4'] },
  trail: { x: 462, y: 566, w: 170, h: 70, t: 'CloudTrail', s: 'quién cambió qué', dec: ['D3'] },
  iam: { x: 642, y: 566, w: 170, h: 70, t: 'IAM · KMS · ACM', s: 'roles sin llaves', dec: ['D3'] },
  budgets: { x: 822, y: 566, w: 166, h: 70, t: 'AWS Budgets', s: 'alerta al 80%', dec: ['D4'] },
}

// Ranuras del Auto Scaling Group: tres por AZ.
export const SLOTS = {
  a: [210, 246, 282].map((y, i) => ({ id: `ec2a${i + 1}`, y })),
  b: [400, 436, 472].map((y, i) => ({ id: `ec2b${i + 1}`, y })),
}
export const SLOT = { x: 508, w: 134, h: 30 }
export const ASG = { x: 492, y: 190, w: 156, h: 328, dec: ['D1', 'D2'] }

export const ZONAS = {
  region: { x: 294, y: 30, w: 696, h: 520 },
  vpc: { x: 306, y: 128, w: 500, h: 412 },
  a: { x: 312, y: 150, w: 488, h: 188, cells: 156 },
  b: { x: 312, y: 346, w: 488, h: 188, cells: 352 },
}

export const CELDAS = [
  { capa: 'Pública', x: 340, w: 140, a: '10.20.1.0/24', b: '10.20.2.0/24', ruta: '→ IGW', rutaB: '→ IGW' },
  { capa: 'App', x: 488, w: 164, a: '10.20.11.0/24', b: '10.20.12.0/24', ruta: '→ NAT', rutaB: '→ NAT 1a' },
  { capa: 'Datos', x: 660, w: 134, a: '10.20.21.0/24', b: '10.20.22.0/24', ruta: 'sin ruta', rutaB: 'sin ruta' },
]
export const CELDA_H = 176

// Vías fijas (negro). El webhook, la réplica y la copia entre regiones van punteadas.
export const TRACKS: { d: string; dash?: boolean }[] = [
  { d: 'M132 72 H160' },
  { d: 'M132 159 H146 V100 H160', dash: true },
  { d: 'M284 79 H308' },
  { d: 'M222 110 V342 H334' },
  { d: 'M334 256 V452' },
  { d: 'M334 256 H348' },
  { d: 'M334 452 H348' },
  { d: 'M418 256 H500' },
  { d: 'M418 452 H500' },
  { d: 'M500 225 V487' },
  ...[225, 261, 297, 415, 451, 487].map(y => ({ d: `M500 ${y} H508` })),
  { d: 'M492 215 H476' },
  { d: 'M648 225 H668' },
  { d: 'M648 415 H668' },
  { d: 'M770 262 V388', dash: true },
  { d: 'M642 234 H655 V342 H786' },
  { d: 'M830 342 H835 V185 H840' },
  { d: 'M905 220 V262' },
  { d: 'M935 262 V220' },
  { d: 'M905 324 V366' },
  { d: 'M342 566 V556 H915 V508' },
  { d: 'M786 440 H790 V544 H72 V494', dash: true },
]

// Rutas que se iluminan y por donde viajan los paquetes.
export const ROUTES: Record<string, string> = {
  'cli-cf': 'M132 72 H160',
  'pas-cf': 'M132 159 H146 V100 H160',
  'cf-s3web': 'M284 79 H308',
  'cf-alb': 'M222 110 V342 H334 V256 H348',
  'cf-albb': 'M222 110 V342 H334 V452 H348',
  'alb-a1': 'M418 256 H500 V225 H508',
  'alb-b1': 'M418 452 H500 V415 H508',
  'a1-rdsa': 'M642 225 H668',
  'b1-rdsb': 'M642 415 H668',
  sync: 'M770 262 V388',
  'app-s3': 'M642 234 H655 V342 H835 V185 H840', // sale de la EC2 que atendió el pedido
  's3-lambda': 'M905 220 V262',
  'lambda-s3': 'M935 262 V220',
  'lambda-logs': 'M905 324 V366',
  'cw-sns': 'M342 566 V556 H915 V508',
  'att-alb': 'M132 350 H334 V256 H340',
  'att-data': 'M132 372 H146 V520 H300',
  dr: 'M786 440 H790 V544 H72 V494',
}

// Donde se detiene el tráfico rechazado: barra roja sobre la vía y placa con el motivo.
export const BLOCKS: Record<string, { x: number; y: number; lx: number; ly: number; lw: number; t: string }> = {
  'sg-alb': { x: 342, y: 256, lx: 228, ly: 226, lw: 76, t: 'Timeout · SG' },
  'sin-ruta': { x: 302, y: 520, lx: 160, ly: 500, lw: 140, t: 'Sin ruta a la base' },
  'iam-s3': { x: 836, y: 185, lx: 840, ly: 128, lw: 142, t: 'AccessDenied · IAM' },
}

// Placas de decisión sobre los módulos.
export const BADGES: { d: string; x: number; y: number }[] = [
  { d: 'D1', x: 258, y: 29 },
  { d: 'D1', x: 598, y: 166 },
  { d: 'D2', x: 624, y: 166 },
  { d: 'D2', x: 766, y: 166 },
  { d: 'D3', x: 456, y: 166 },
  { d: 'D3', x: 762, y: 571 },
  { d: 'D4', x: 172, y: 571 },
  { d: 'D4', x: 402, y: 571 },
  { d: 'D5', x: 956, y: 236 },
]

// Números de una compra en la figura del Brief.
export const PASOS_FIG = [
  { n: 1, x: 146, y: 60 },
  { n: 2, x: 256, y: 326 },
  { n: 3, x: 655, y: 211 },
  { n: 4, x: 826, y: 250 },
]

// Piezas que el modo adaptación puede agregar (tabla de evolución del Brief).
export const GHOSTS: Record<string, { x: number; y: number; w: number; h: number; dec: string[] }> = {
  waf: { x: 200, y: 26, w: 52, h: 18, dec: ['D3'] },
  cache: { x: 668, y: 270, w: 96, h: 40, dec: ['D2'] },
  replica: { x: 668, y: 466, w: 96, h: 40, dec: ['D2'] },
  nat2: { x: 426, y: 388, w: 50, h: 46, dec: ['D3'] },
  fargate: { x: 520, y: 330, w: 116, h: 24, dec: ['D1'] },
  standby: { x: 12, y: 500, w: 54, h: 40, dec: ['D2'] },
}

// Módulos que mueve cada decisión (propagación: restricción → decisiones → módulos).
export function modsDe(decisiones: string[]): string[] {
  const ids = Object.entries(MODS)
    .filter(([, m]) => m.dec.some(d => decisiones.includes(d)))
    .map(([id]) => id)
  if (ASG.dec.some(d => decisiones.includes(d))) ids.push('asg')
  return ids
}
