import type { Vector3 } from 'three'

export enum GameState {
  LOADING = 'LOADING',
  MAIN_MENU = 'MAIN_MENU',
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  ARENA_INIT = 'ARENA_INIT',
  WAVE_COUNTDOWN = 'WAVE_COUNTDOWN',
  WAVE_ACTIVE = 'WAVE_ACTIVE',
  WAVE_CLEAR = 'WAVE_CLEAR',
  SHOP_PHASE = 'SHOP_PHASE',
  GAME_OVER = 'GAME_OVER',
}

export enum EnemyType {
  NET_GOON = 'NET_GOON',
  CAGE_ROLLER = 'CAGE_ROLLER',
  DIRECTOR_POUNCE = 'DIRECTOR_POUNCE',
}

export enum WeaponId {
  NANNER_POP = 'NANNER_POP',
  BANANA_BLASTER = 'BANANA_BLASTER',
  PEEL_SPREADER = 'PEEL_SPREADER',
  TROPICANNON = 'TROPICANNON',
  SPLITPEEL_SMG = 'SPLITPEEL_SMG',
  CAVENDISH_RIFLE = 'CAVENDISH_RIFLE',
  BUNCH_LAUNCHER = 'BUNCH_LAUNCHER',
  PLANTAIN_OBLITERATOR = 'PLANTAIN_OBLITERATOR',
}

export enum ClassId {
  CHIMP = 'CHIMP',
  GORILLA = 'GORILLA',
  PYGMY_MARMOSET = 'PYGMY_MARMOSET',
  MANDRILL = 'MANDRILL',
  SPIDER_MONKEY = 'SPIDER_MONKEY',
}

export interface WeaponDef {
  id: WeaponId
  name: string
  rank: number
  icon: string
  damageBase: number
  fireRate: number        // shots per second
  range: number
  cost: number
  projectileSpeed: number
  projectileColor: number  // hex
  projectileSize: number
  pelletCount?: number    // shotgun spread
  burstCount?: number     // burst fire
  isGrenadeArc?: boolean  // lobbed arc
  dualWield?: boolean
  aoeDamage?: number
  aoeRadius?: number
  description: string
  upgrades: WeaponUpgrade[]
}

export interface WeaponUpgrade {
  name: string
  description: string
  cost: number
  damageBonus?: number
  fireRateBonus?: number
  aoeRadiusBonus?: number
}

export interface ClassDef {
  id: ClassId
  name: string
  emoji: string
  tagline: string
  color: number    // hex THREE color
  hp: number
  speed: number
  damageMult: number
  starterWeapon: WeaponId
  dualWield?: boolean
  abilityName: string
  abilityDesc: string
  abilityCooldown: number
  abilityDuration: number
  strengths: string
  weaknesses: string
}

export interface SpawnEntry {
  type: EnemyType
  count: number
  delay: number   // seconds from wave start before this group spawns
}

export interface WaveDef {
  waveNumber: number
  spawns: SpawnEntry[]
  bossWave: boolean
}

export interface PickupData {
  position: Vector3
  amount: number
}
