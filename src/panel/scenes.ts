import { NORMAL, apply, type PanelState, type Patch } from './state'

// Un paso es una lista de tiempos: un paquete recorre `flow` y al llegar se aplica `patch`.
export interface Beat {
  flow?: string[]
  bad?: boolean
  burst?: number
  patch?: Patch
  pause?: number
}

interface Script {
  base: Patch
  steps: Beat[][]
}

const EN_SERVICIO = { ec2a1: 'ok', ec2b1: 'ok' } as const

export const SCRIPTS: Record<string, Script> = {
  problema: {
    base: {},
    steps: [
      [{ patch: { focus: [], badges: [] } }],
      [{ patch: { focus: ['rdsa', 'rdsb', 'iam', 'trail'], badges: ['D2', 'D3'], lamps: { rdsa: 'ok', rdsb: 'standby' } } }],
      [{ patch: { focus: ['clientes', 'cloudfront', 'asg', 'lambda'], badges: ['D1', 'D5'], lamps: { cloudfront: 'ok', ...EN_SERVICIO } } }],
      [{ patch: { focus: ['alb', 'albb', 'asg', 'rdsa', 'rdsb'], badges: ['D2'], lamps: { alb: 'ok', albb: 'ok' } } }],
      [{ patch: { focus: ['cfn', 'cw', 'sns', 'lambda', 'nat', 'budgets', 'cloudfront'], badges: ['D1', 'D2', 'D3', 'D4', 'D5'] } }],
      [{ patch: { focus: ['s3ped', 'lambda'], badges: ['D5'], lamps: { s3ped: 'ok', lambda: 'ok' } } }],
    ],
  },

  compra: {
    base: {},
    steps: [
      [{ flow: ['cli-cf'], patch: { focus: ['clientes', 'cloudfront'], lamps: { cloudfront: 'ok' }, read: { cloudfront: 'HIT' }, badges: ['D1'] } }],
      [{ flow: ['cf-alb'], patch: { focus: ['cloudfront', 'igw', 'alb'], lamps: { alb: 'ok' }, read: { alb: '/api' }, badges: ['D3'] } }],
      [
        { flow: ['alb-a1'], patch: { focus: ['alb', 'asg', 'rdsa', 'rdsb'], lamps: { ec2a1: 'ok' } } },
        { flow: ['a1-rdsa'], patch: { lamps: { rdsa: 'ok' }, read: { rdsa: 'COMMIT' } } },
        { flow: ['sync'], patch: { lamps: { rdsb: 'standby' }, read: { rdsb: 'COPIA' }, badges: ['D2'] } },
      ],
      [
        { flow: ['pas-cf', 'cf-alb', 'alb-a1'], patch: { focus: ['pasarela', 'cloudfront', 'igw', 'alb', 'asg'], read: { ec2a1: 'PAGO OK' } } },
        { flow: ['app-s3'], patch: { focus: ['pasarela', 'cloudfront', 'igw', 'alb', 'asg', 'gwe', 's3ped'], lamps: { s3ped: 'ok' }, read: { s3ped: 'incoming/1042' } } },
      ],
      [
        { flow: ['s3-lambda'], patch: { focus: ['s3ped', 'lambda', 'logs'], lamps: { lambda: 'ok' }, badges: ['D5'] } },
        { flow: ['lambda-s3'], patch: { read: { s3ped: 'reports/1042' } } },
        { flow: ['lambda-logs'], patch: { lamps: { logs: 'ok' }, read: { logs: 'id 1042' } } },
      ],
    ],
  },

  campana: {
    base: { lamps: { ...EN_SERVICIO } },
    steps: [
      [{ burst: 8, flow: ['cli-cf'], patch: { focus: ['clientes', 'cloudfront'], lamps: { clientes: 'warn' }, read: { clientes: '×10' } } }],
      [{ patch: { focus: ['cloudfront', 'asg'], badges: ['D1'] } }],
      [
        { patch: { focus: ['asg'], ec2: [2, 2], lamps: { ec2a2: 'warn', ec2b2: 'warn' }, read: { ec2a2: 'arranca', ec2b2: 'arranca', asg: 'mínimo 4' }, meters: { ec2: 4 } } },
        { pause: 0.9, patch: { lamps: { ec2a2: 'ok', ec2b2: 'ok' }, read: { ec2a2: '', ec2b2: '' } } },
      ],
      [
        { burst: 10, flow: ['cli-cf'], patch: { focus: ['clientes', 'cloudfront', 'igw', 'alb', 'asg'], lamps: { cloudfront: 'ok' }, read: { cloudfront: 'HIT 90%' }, meters: { hit: 90 } } },
        { flow: ['cf-alb', 'alb-a1'], patch: { meters: { cpu: 68 }, alarms: ['cpu'], read: { asg: 'CPU 68%' } } },
        { pause: 0.5, patch: { ec2: [3, 3], lamps: { ec2a3: 'warn', ec2b3: 'warn' }, read: { ec2a3: 'arranca', ec2b3: 'arranca', asg: '6 de 6' }, meters: { ec2: 6, usd: 292 } } },
        { pause: 0.9, patch: { lamps: { ec2a3: 'ok', ec2b3: 'ok' }, read: { ec2a3: '', ec2b3: '' }, meters: { cpu: 48 } } },
      ],
      [
        { patch: { focus: ['asg', 'clientes', 'cloudfront'], alarms: [], read: { cloudfront: '', clientes: '', asg: 'fin de campaña' }, lamps: { clientes: 'off' }, meters: { hit: null } } },
        { pause: 0.8, patch: { ec2: [1, 1], read: { asg: 'mínimo 2' }, meters: { ec2: 2, cpu: 35, usd: 173 } } },
      ],
      [
        { patch: { focus: ['asg', 'alb', 'sns', 'cw'], ec2: [3, 3], lamps: { ec2a2: 'ok', ec2a3: 'ok', ec2b2: 'ok', ec2b3: 'ok' }, read: { asg: 'techo 6 de 6' }, meters: { ec2: 6, cpu: 95, usd: 292 } } },
        { flow: ['cw-sns'], patch: { alarms: ['cpu', 'p95'], lamps: { sns: 'warn', cw: 'warn' }, read: { sns: 'aviso p95' } } },
      ],
    ],
  },

  'falla-az': {
    base: { lamps: { ...EN_SERVICIO, rdsa: 'ok', rdsb: 'standby', alb: 'ok', albb: 'ok', nat: 'ok' } },
    steps: [
      [{ patch: { focus: ['rdsa', 'rdsb', 'asg', 'alb', 'albb'] } }],
      [{ patch: { focus: ['alb', 'albb', 'asg', 'rdsa', 'rdsb'], badges: ['D2'] } }],
      [
        { patch: { failAz: true, focus: ['alb', 'albb', 'asg'], lamps: { ec2a1: 'fault', rdsa: 'fault', nat: 'fault', alb: 'fault' }, read: { ec2a1: 'falla', rdsa: 'FALLA' } } },
        { pause: 0.5, patch: { alarms: ['targets'] } },
        { flow: ['cf-albb', 'alb-b1'], patch: { focus: ['cloudfront', 'igw', 'alb', 'albb', 'asg'], read: { albb: 'todo a 1b' } } },
      ],
      [
        { patch: { focus: ['rdsa', 'rdsb'], alarms: ['targets', 'failover'], lamps: { rdsb: 'warn' }, read: { rdsb: 'promoviendo' } } },
        { pause: 1, patch: { primary: 'b', lamps: { rdsb: 'ok' }, read: { rdsb: 'endpoint igual' } } },
        { patch: { focus: ['asg', 'rdsb'], ec2: [1, 2], lamps: { ec2b2: 'warn' }, read: { ec2b2: 'arranca' } } },
        { pause: 0.9, patch: { lamps: { ec2b2: 'ok' }, read: { ec2b2: '' } } },
      ],
      [{ flow: ['cf-albb', 'alb-b1', 'b1-rdsb'], patch: { focus: ['cloudfront', 'igw', 'albb', 'asg', 'rdsb'], alarms: [], read: { rdsb: 'RPO 0' } } }],
      [{ patch: { focus: ['nat', 'rdsb'], read: { nat: 'sin salida', rdsb: '+USD 26/mes' } } }],
    ],
  },

  intruso: {
    base: { lamps: { alb: 'ok' } },
    steps: [
      [{ patch: { attacker: true, focus: ['atacante', 'alb', 'rdsa', 'rdsb', 's3ped'] } }],
      [{ flow: ['cli-cf', 'cf-alb'], patch: { attacker: true, focus: ['clientes', 'cloudfront', 'igw', 'alb'], badges: ['D3'], read: { alb: 'solo CF' } } }],
      [{ flow: ['att-alb'], bad: true, patch: { attacker: true, blocks: ['sg-alb'], focus: ['atacante', 'alb', 'igw'] } }],
      [{ flow: ['att-data'], bad: true, patch: { attacker: true, blocks: ['sg-alb', 'sin-ruta'], focus: ['atacante', 'rdsa', 'rdsb'] } }],
      [{ flow: ['app-s3'], patch: { attacker: true, blocks: ['sg-alb', 'sin-ruta', 'iam-s3'], focus: ['asg', 'gwe', 's3ped', 'iam'], lamps: { s3ped: 'fault', ec2a1: 'ok' }, read: { s3ped: 'DeleteObject' } } }],
      [{ patch: { attacker: true, focus: ['trail', 'iam', 'alb', 'rdsa', 's3ped'], lamps: { trail: 'ok' }, read: { trail: 'PutRolePolicy' } } }],
    ],
  },

  operacion: {
    base: {},
    steps: [
      [{ patch: { focus: ['cfn', 'cw', 'sns'] } }],
      [{ patch: { focus: ['cfn', 'cw'], badges: ['D4'] } }],
      [
        { patch: { focus: ['cfn'], lamps: { cfn: 'warn' }, read: { cfn: 'change set' } } },
        { pause: 0.8, patch: { lamps: { cfn: 'ok' }, read: { cfn: 'reemplazos 0' } } },
        { pause: 0.8, patch: { read: { cfn: 'prueba creada' } } },
        { pause: 0.8, patch: { read: { cfn: 'prueba borrada' } } },
      ],
      [
        { patch: { focus: ['alb', 'asg', 'cw', 'sns'], alarms: ['errores'], lamps: { cw: 'warn', alb: 'warn' } } },
        { flow: ['cw-sns'], patch: { lamps: { sns: 'ok' }, read: { sns: 'turno avisado' } } },
      ],
      [{ patch: { focus: ['cfn', 'trail'], alarms: [], lamps: { cw: 'off', alb: 'off', sns: 'off', cfn: 'ok', trail: 'ok' }, read: { cfn: 'UPDATE_COMPLETE', trail: 'auditado', sns: '' } } }],
      [{ patch: { focus: ['cfn', 'asg'], alarms: ['drift'], lamps: { cfn: 'warn' }, read: { cfn: 'drift en sg-app' } } }],
    ],
  },

  evento: {
    base: { lamps: { ec2a1: 'ok' } },
    steps: [
      [{ patch: { focus: ['lambda', 's3ped', 'asg'] } }],
      [{ patch: { focus: ['s3ped', 'lambda', 'logs'], badges: ['D5'] } }],
      [
        { flow: ['app-s3'], patch: { focus: ['asg', 'gwe', 's3ped', 'lambda'], lamps: { s3ped: 'ok' }, read: { s3ped: 'incoming/1042' } } },
        { flow: ['s3-lambda'], patch: { lamps: { lambda: 'warn' }, read: { lambda: 'invocada' } } },
      ],
      [
        { flow: ['lambda-s3'], patch: { focus: ['lambda', 's3ped', 'logs'], lamps: { lambda: 'ok' }, read: { s3ped: 'reports/1042', lambda: '' } } },
        { flow: ['lambda-logs'], patch: { lamps: { logs: 'ok' }, read: { logs: 'id 1042' } } },
      ],
      [
        { flow: ['s3-lambda'], patch: { read: { lambda: 'repetido' } } },
        { flow: ['lambda-s3'], patch: { read: { s3ped: '1 reporte', lambda: '' } } },
      ],
      [
        // Solo queda encendida la escritura: la vía S3 → Lambda se apaga porque esta vez no hay invocación.
        { flow: ['app-s3'], patch: { focus: ['asg', 'gwe', 's3ped', 'lambda'], routes: ['app-s3'], read: { s3ped: 'incoming/1042.txt' } } },
        { pause: 0.6, patch: { lamps: { lambda: 'off' }, read: { lambda: 'sin invocar' } } },
      ],
    ],
  },
}

const uniq = (xs: string[]) => [...new Set(xs)]

export function applyBeat(s: PanelState, b: Beat): PanelState {
  const next = b.patch ? apply(s, b.patch) : s
  if (!b.flow) return next
  return { ...next, routes: b.patch?.routes ? next.routes : uniq([...next.routes, ...b.flow]), now: uniq([...next.now, ...b.flow]) }
}

const flows = (beats: Beat[]) => uniq(beats.flatMap(b => b.flow ?? []))

// Estado al empezar el paso: nada es todavía del paso (cada ruta se dibuja cuando el paquete la recorre)
// y las rutas rechazadas ya están marcadas, para que se dibujen en rojo desde el primer tramo.
export function stepStart(scene: string, step: number): PanelState {
  const sc = SCRIPTS[scene]
  let s = apply(NORMAL, sc.base)
  for (let i = 0; i < step; i++) for (const b of sc.steps[i]) s = applyBeat(s, b)
  const beats = sc.steps[step] ?? []
  return { ...s, now: [], bad: uniq([...s.bad, ...flows(beats.filter(b => b.bad))]) }
}

// Estado del panel al terminar el paso `step` (o antes de empezar si step = -1).
export function stateAt(scene: string, step: number): PanelState {
  let s = stepStart(scene, step)
  for (const b of SCRIPTS[scene].steps[step] ?? []) s = applyBeat(s, b)
  return s
}

// Lo que queda iluminado bajo el velo del paso: módulos en foco o que cambian, las rutas del paso y los
// instrumentos si sus valores cambian. Sin nada que mostrar no hay velo.
export interface Spot {
  mods: string[]
  routes: string[]
  inst: boolean
}

export function spotAt(scene: string, step: number): Spot | null {
  const beats = SCRIPTS[scene]?.steps[step]
  if (!beats) return null
  const mods = uniq([
    ...stateAt(scene, step).focus,
    ...beats.flatMap(b => [...(b.patch?.focus ?? []), ...Object.keys(b.patch?.lamps ?? {}), ...Object.keys(b.patch?.read ?? {})]),
  ])
  const routes = uniq(beats.flatMap(b => b.flow ?? []))
  const inst = beats.some(b => b.patch?.meters || b.patch?.alarms)
  return mods.length || routes.length ? { mods, routes, inst } : null
}
