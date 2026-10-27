import type { AlarmaId, PiezaId } from '../content'

export type Lamp = 'off' | 'ok' | 'warn' | 'fault' | 'standby'

export interface Meters {
  ec2: number
  cpu: number | null
  hit: number | null
  usd: number
}

export interface PanelState {
  focus: string[] // módulos encendidos; vacío = nada atenuado
  lamps: Record<string, Lamp>
  read: Record<string, string> // lectura corta junto a la lámpara
  routes: string[] // rutas iluminadas
  now: string[] // rutas recorridas en este paso: se dibujan gruesas; las de pasos anteriores quedan como hilo
  bad: string[] // rutas iluminadas en rojo (tráfico rechazado)
  ec2: [number, number] // instancias en servicio en 1a y 1b
  failAz: boolean
  primary: 'a' | 'b'
  attacker: boolean
  blocks: string[]
  meters: Meters
  alarms: AlarmaId[]
  badges: string[] // decisiones resaltadas
}

export type Patch = Partial<Omit<PanelState, 'lamps' | 'read' | 'meters'>> & {
  lamps?: Record<string, Lamp>
  read?: Record<string, string>
  meters?: Partial<Meters>
}

export const NORMAL: PanelState = {
  focus: [],
  lamps: {},
  read: {},
  routes: [],
  now: [],
  bad: [],
  ec2: [1, 1],
  failAz: false,
  primary: 'a',
  attacker: false,
  blocks: [],
  meters: { ec2: 2, cpu: 35, hit: null, usd: 173 },
  alarms: [],
  badges: [],
}

export function apply(s: PanelState, p: Patch): PanelState {
  return {
    ...s,
    ...p,
    lamps: { ...s.lamps, ...p.lamps },
    read: { ...s.read, ...p.read },
    meters: { ...s.meters, ...p.meters },
  }
}

// Modo adaptación: tarjetas sobre módulos existentes y piezas de la tabla de evolución.
export type Tag = 'mantener' | 'cambiar' | 'quitar'

export interface Adapt {
  on: boolean
  restriccion: string
  tags: Record<string, Tag>
  piezas: PiezaId[]
}

export const ADAPT_VACIO: Adapt = { on: false, restriccion: '', tags: {}, piezas: [] }
