import { ClassId, EnemyType, WeaponId } from './types'
import type { ClassDef, WaveDef, WeaponDef } from './types'

export const ARENA_RADIUS = 55
export const ARENA_BOUNDARY = 52
export const SPAWN_RADIUS = 54
export const CAMERA_OFFSET = { x: 0, y: 22, z: 18 }
export const PLAYER_COLLISION_RADIUS = 1.2
export const BANANA_COLLECT_RADIUS = 2.5
export const BANANA_LIFETIME = 18
export const SHOP_DURATION = 30
export const WAVE_CLEAR_DURATION = 2.5
export const WAVE_COUNTDOWN_DURATION = 3
export const MAX_ENEMIES = 40
export const DT_CAP = 0.05

// ── SPAWN POINTS (8 equally spaced around perimeter) ──
export const SPAWN_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315].map(
  (deg) => (deg * Math.PI) / 180
)

// ── WEAPON DEFINITIONS ──
export const WEAPON_DEFS: Record<WeaponId, WeaponDef> = {
  [WeaponId.NANNER_POP]: {
    id: WeaponId.NANNER_POP,
    name: 'Nanner Pop',
    rank: 1,
    icon: '🔫',
    damageBase: 12,
    fireRate: 4,
    range: 18,
    cost: 0,
    projectileSpeed: 28,
    projectileColor: 0xffe000,
    projectileSize: 0.25,
    description: 'Reliable starter pistol. Steady and accurate.',
    upgrades: [
      { name: 'Ripe Round', description: '+5 dmg, slight knockback', cost: 35, damageBonus: 5 },
      { name: 'Golden Nanner', description: '+5 dmg, leaves slip trail', cost: 70, damageBonus: 5 },
    ],
  },

  [WeaponId.BANANA_BLASTER]: {
    id: WeaponId.BANANA_BLASTER,
    name: 'Banana Blaster',
    rank: 2,
    icon: '🍌',
    damageBase: 20,
    fireRate: 2.5,
    range: 25,
    cost: 60,
    projectileSpeed: 32,
    projectileColor: 0xffc200,
    projectileSize: 0.3,
    description: 'Every 5th shot pierces through enemies.',
    upgrades: [
      { name: 'Early Pierce', description: 'Pierce every 3rd shot', cost: 90, damageBonus: 3 },
      { name: 'Full Pierce', description: 'Pierces ALL enemies in line', cost: 180, damageBonus: 5 },
    ],
  },

  [WeaponId.PEEL_SPREADER]: {
    id: WeaponId.PEEL_SPREADER,
    name: 'Peel Spreader',
    rank: 3,
    icon: '💥',
    damageBase: 14,
    fireRate: 1 / 1.4,
    range: 12,
    cost: 180,
    projectileSpeed: 24,
    projectileColor: 0xff8800,
    projectileSize: 0.2,
    pelletCount: 6,
    description: 'Shotgun. 6 pellets, massive close-range damage.',
    upgrades: [
      { name: 'More Peel', description: '9 pellets, wider spread', cost: 200, damageBonus: 2 },
      { name: 'Overripe', description: 'Burning pellets (DoT)', cost: 340, damageBonus: 4 },
    ],
  },

  [WeaponId.TROPICANNON]: {
    id: WeaponId.TROPICANNON,
    name: 'Tropicannon',
    rank: 4,
    icon: '❄️',
    damageBase: 25,
    fireRate: 1 / 0.9,
    range: 40,
    cost: 260,
    projectileSpeed: 38,
    projectileColor: 0x00ccff,
    projectileSize: 0.28,
    burstCount: 3,
    description: 'Burst rifle. 3-round burst, last shot slows enemy.',
    upgrades: [
      { name: 'Chill Burst', description: '4 rounds, all slow', cost: 300, damageBonus: 4 },
      { name: 'Arctic Burst', description: 'Slow spreads to nearby', cost: 450, damageBonus: 6 },
    ],
  },

  [WeaponId.SPLITPEEL_SMG]: {
    id: WeaponId.SPLITPEEL_SMG,
    name: 'Splitpeel SMG',
    rank: 5,
    icon: '🌀',
    damageBase: 18,
    fireRate: 10,
    range: 22,
    cost: 380,
    projectileSpeed: 30,
    projectileColor: 0x88ff44,
    projectileSize: 0.18,
    description: 'Rapid fire. 20 consec hits = Peel Storm (2x dmg).',
    upgrades: [
      { name: 'Quick Storm', description: 'Peel Storm at 15 hits', cost: 380, damageBonus: 2 },
      { name: 'Lasting Storm', description: 'Storm lasts 8s + speed boost', cost: 520, damageBonus: 3 },
    ],
  },

  [WeaponId.CAVENDISH_RIFLE]: {
    id: WeaponId.CAVENDISH_RIFLE,
    name: 'Cavendish Rifle',
    rank: 6,
    icon: '🎯',
    damageBase: 95,
    fireRate: 1 / 2.5,
    range: 80,
    cost: 550,
    projectileSpeed: 60,
    projectileColor: 0xffdd00,
    projectileSize: 0.22,
    description: 'Sniper. Massive damage, slow fire rate.',
    upgrades: [
      { name: 'Bruiser Round', description: '+40 dmg, stun on hit', cost: 480, damageBonus: 40 },
      { name: 'Shockwave Shot', description: 'Headshot stuns nearby enemies', cost: 650, damageBonus: 20 },
    ],
  },

  [WeaponId.BUNCH_LAUNCHER]: {
    id: WeaponId.BUNCH_LAUNCHER,
    name: 'Bunch Launcher',
    rank: 7,
    icon: '💣',
    damageBase: 80,
    fireRate: 1 / 2.0,
    range: 35,
    cost: 720,
    projectileSpeed: 18,
    projectileColor: 0xffcc00,
    projectileSize: 0.5,
    isGrenadeArc: true,
    aoeDamage: 80,
    aoeRadius: 5,
    description: 'Grenade launcher. AoE explosion, enemies slip on impact.',
    upgrades: [
      { name: 'Big Bunch', description: 'AoE radius +3m', cost: 600, aoeRadiusBonus: 3 },
      { name: 'Triple Bunch', description: 'Fires 3 grenades in spread', cost: 800, damageBonus: 20 },
    ],
  },

  [WeaponId.PLANTAIN_OBLITERATOR]: {
    id: WeaponId.PLANTAIN_OBLITERATOR,
    name: 'Plantain Obliterator',
    rank: 8,
    icon: '⚡',
    damageBase: 200,
    fireRate: 1 / 4.5,
    range: 50,
    cost: 1100,
    projectileSpeed: 22,
    projectileColor: 0x9944ff,
    projectileSize: 0.7,
    aoeDamage: 80,
    aoeRadius: 6,
    description: 'Plasma cannon. Massive AoE. Hit = 3s confusion.',
    upgrades: [
      { name: 'Quick Charge', description: 'Fire rate 1/3s', cost: 900, fireRateBonus: 0.33 },
      { name: 'Full Ripeness', description: 'Confusion spreads to nearby', cost: 1100, damageBonus: 50 },
    ],
  },
}

// ── CLASS DEFINITIONS ──
export const CLASS_DEFS: Record<ClassId, ClassDef> = {
  [ClassId.CHIMP]: {
    id: ClassId.CHIMP,
    name: 'Chimp',
    emoji: '🐒',
    tagline: 'Fast hands, faster instincts.',
    color: 0xc8a46e,
    hp: 100,
    speed: 8,
    damageMult: 1.0,
    starterWeapon: WeaponId.NANNER_POP,
    abilityName: 'Frenzy Mode',
    abilityDesc: '2× fire rate for 6s',
    abilityCooldown: 20,
    abilityDuration: 6,
    strengths: 'Balanced, works with any weapon',
    weaknesses: 'No special defensive tools',
  },
  [ClassId.GORILLA]: {
    id: ClassId.GORILLA,
    name: 'Gorilla',
    emoji: '🦍',
    tagline: 'They built cages. He builds walls.',
    color: 0x445544,
    hp: 175,
    speed: 4.5,
    damageMult: 1.2,
    starterWeapon: WeaponId.PEEL_SPREADER,
    abilityName: 'Silverback Slam',
    abilityDesc: 'Leap + 40 AoE, stun nearby, 18s CD',
    abilityCooldown: 18,
    abilityDuration: 0.3,
    strengths: 'Highest HP, big damage multiplier',
    weaknesses: 'Slowest movement, range struggles',
  },
  [ClassId.PYGMY_MARMOSET]: {
    id: ClassId.PYGMY_MARMOSET,
    name: 'Marmoset',
    emoji: '🐾',
    tagline: 'Tiny. Terrifying. Never sees her coming.',
    color: 0xdaa520,
    hp: 65,
    speed: 13,
    damageMult: 0.85,
    starterWeapon: WeaponId.NANNER_POP,
    dualWield: true,
    abilityName: 'Ghost Scurry',
    abilityDesc: 'Invisible + fast 4s, crit first shot, 15s CD',
    abilityCooldown: 15,
    abilityDuration: 4,
    strengths: 'Fastest, dual pistols, invisibility',
    weaknesses: 'Lowest HP, needs upgrades urgently',
  },
  [ClassId.MANDRILL]: {
    id: ClassId.MANDRILL,
    name: 'Mandrill',
    emoji: '🎨',
    tagline: 'The face of war. Every color means danger.',
    color: 0x9933cc,
    hp: 110,
    speed: 7,
    damageMult: 1.15,
    starterWeapon: WeaponId.NANNER_POP,
    abilityName: 'War Paint',
    abilityDesc: 'Mark enemy: +50% dmg taken for 8s, 12s CD',
    abilityCooldown: 12,
    abilityDuration: 8,
    strengths: 'Best single-target damage, short CD',
    weaknesses: 'No movement tools, medium stats',
  },
  [ClassId.SPIDER_MONKEY]: {
    id: ClassId.SPIDER_MONKEY,
    name: 'Spider Monkey',
    emoji: '🕸️',
    tagline: 'The jungle is 3D. Everyone else forgot.',
    color: 0x222244,
    hp: 85,
    speed: 11,
    damageMult: 0.95,
    starterWeapon: WeaponId.NANNER_POP,
    abilityName: 'Canopy Swing',
    abilityDesc: 'Grapple to surface OR pull+stun enemy, 10s CD',
    abilityCooldown: 10,
    abilityDuration: 0,
    strengths: 'Best mobility, grapple disrupts enemy formation',
    weaknesses: 'Low HP, requires precise play',
  },
}

// ── WAVE DEFINITIONS ──
function wave(
  n: number,
  boss: boolean,
  ...groups: Array<[EnemyType, number, number]>
): WaveDef {
  return {
    waveNumber: n,
    bossWave: boss,
    spawns: groups.map(([type, count, delay]) => ({ type, count, delay })),
  }
}

export const WAVE_DEFS: WaveDef[] = [
  wave(1, false, [EnemyType.NET_GOON, 6, 0]),
  wave(2, false, [EnemyType.NET_GOON, 9, 0]),
  wave(3, false, [EnemyType.NET_GOON, 8, 0], [EnemyType.CAGE_ROLLER, 1, 5]),
  wave(4, false, [EnemyType.NET_GOON, 9, 0], [EnemyType.CAGE_ROLLER, 2, 4]),
  wave(5, true,  [EnemyType.NET_GOON, 10, 0], [EnemyType.CAGE_ROLLER, 2, 3], [EnemyType.DIRECTOR_POUNCE, 1, 8]),
  wave(6, false, [EnemyType.NET_GOON, 12, 0], [EnemyType.CAGE_ROLLER, 2, 3]),
  wave(7, false, [EnemyType.NET_GOON, 12, 0], [EnemyType.CAGE_ROLLER, 3, 3]),
  wave(8, false, [EnemyType.NET_GOON, 14, 0], [EnemyType.CAGE_ROLLER, 3, 2]),
  wave(9, false, [EnemyType.NET_GOON, 14, 0], [EnemyType.CAGE_ROLLER, 4, 2]),
  wave(10, true, [EnemyType.NET_GOON, 16, 0], [EnemyType.CAGE_ROLLER, 4, 2], [EnemyType.DIRECTOR_POUNCE, 1, 6]),
]

// For wave > 10, generates repeating cycle
export function getWaveDef(waveNum: number): WaveDef {
  if (waveNum <= WAVE_DEFS.length) return WAVE_DEFS[waveNum - 1]
  // Endless mode: cycle with escalation
  const cycle = Math.floor((waveNum - 11) / 5) + 1
  const base = WAVE_DEFS[(waveNum - 1) % WAVE_DEFS.length]
  return {
    ...base,
    waveNumber: waveNum,
    spawns: base.spawns.map((s) => ({ ...s, count: Math.ceil(s.count * (1 + cycle * 0.3)) })),
  }
}

// Enemy stats scaling per wave
export function getEnemyHpScale(waveNum: number): number {
  return 1 + (waveNum - 1) * 0.15
}
