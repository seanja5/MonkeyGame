import { Scene, Vector3 } from 'three'
import type { Enemy } from './Enemy'
import { NetGoon } from './NetGoon'
import { CageRoller } from './CageRoller'
import { DirectorPounce } from './DirectorPounce'
import { EnemyType } from '../types'
import type { WaveDef, SpawnEntry } from '../types'
import { SPAWN_ANGLES, SPAWN_RADIUS, getWaveDef, getEnemyHpScale } from '../constants'
import { randomInRange, angleToVec3 } from '../utils/MathUtils'

const POOL_SIZE = { netGoon: 20, cageRoller: 8, director: 2 }

export class WaveSpawner {
  readonly enemies: Enemy[] = []
  private scene: Scene

  private netGoonPool: NetGoon[] = []
  private cageRollerPool: CageRoller[] = []
  private directorPool: DirectorPounce[] = []

  private pendingSpawns: Array<{ type: EnemyType; delay: number }> = []
  private spawnTimer = 0
  private spawnIntervalBase = 0.6
  private currentWave = 0
  private hpScale = 1
  private spawnAngleIndex = 0

  onEnemyDied?: (enemy: Enemy) => void
  onWaveCleared?: () => void
  onMegaphoneBlast?: (pos: Vector3) => void
  onSummonReinforcements?: () => void
  onEnrage?: () => void

  constructor(scene: Scene) {
    this.scene = scene
    // Pre-allocate pools
    for (let i = 0; i < POOL_SIZE.netGoon; i++) this.netGoonPool.push(new NetGoon(scene))
    for (let i = 0; i < POOL_SIZE.cageRoller; i++) this.cageRollerPool.push(new CageRoller(scene))
    for (let i = 0; i < POOL_SIZE.director; i++) this.directorPool.push(new DirectorPounce(scene))

    // Wire up all NetGoon attack callbacks
    for (const ng of this.netGoonPool) {
      ng.onAttack = (_pos, _dir) => { /* handled via attack range in Game */ }
    }
    // Wire up Director callbacks
    for (const d of this.directorPool) {
      d.onMegaphoneBlast = (pos) => this.onMegaphoneBlast?.(pos)
      d.onSummonReinforcements = () => this.onSummonReinforcements?.()
      d.onEnrage = () => this.onEnrage?.()
    }
  }

  startWave(waveNumber: number): void {
    this.currentWave = waveNumber
    this.hpScale = getEnemyHpScale(waveNumber)
    const def = getWaveDef(waveNumber)

    // Deactivate all existing enemies
    for (const e of this.enemies) e.deactivate()
    this.enemies.length = 0

    // Build pending spawn queue
    this.pendingSpawns = []
    for (const entry of def.spawns) {
      for (let i = 0; i < entry.count; i++) {
        this.pendingSpawns.push({
          type: entry.type,
          delay: entry.delay + i * (this.spawnIntervalBase + waveNumber * 0.02),
        })
      }
    }
    // Sort by delay
    this.pendingSpawns.sort((a, b) => a.delay - b.delay)
    this.spawnTimer = 0
  }

  update(dt: number): void {
    this.spawnTimer += dt

    // Spawn pending enemies
    while (this.pendingSpawns.length > 0 && this.spawnTimer >= this.pendingSpawns[0].delay) {
      const entry = this.pendingSpawns.shift()!
      this.spawnEnemy(entry.type)
    }

    // Update all active enemies (done by Game.ts)
    // Check if wave is cleared (only after at least one enemy has been spawned)
    if (
      this.currentWave > 0 &&
      this.pendingSpawns.length === 0 &&
      this.enemies.length > 0 &&
      this.enemies.every((e) => !e.isAlive)
    ) {
      const waveJustCleared = this.currentWave
      this.currentWave = 0  // prevent double-fire
      this.onWaveCleared?.()
      void waveJustCleared
    }
  }

  private spawnEnemy(type: EnemyType): void {
    const spawnAngle = SPAWN_ANGLES[this.spawnAngleIndex % SPAWN_ANGLES.length]
    this.spawnAngleIndex++
    const jitter = randomInRange(-0.25, 0.25)
    const pos = angleToVec3(spawnAngle + jitter, SPAWN_RADIUS)
    // Random jitter for position spread
    pos.x += randomInRange(-2, 2)
    pos.z += randomInRange(-2, 2)

    let enemy: Enemy | null = null

    switch (type) {
      case EnemyType.NET_GOON: {
        const ng = this.netGoonPool.find((e) => !e.isAlive)
        if (ng) { ng.activate(pos, Math.round(50 * this.hpScale)); enemy = ng }
        break
      }
      case EnemyType.CAGE_ROLLER: {
        const cr = this.cageRollerPool.find((e) => !e.isAlive)
        if (cr) { cr.activate(pos, Math.round(120 * this.hpScale)); enemy = cr }
        break
      }
      case EnemyType.DIRECTOR_POUNCE: {
        const dp = this.directorPool.find((e) => !e.isAlive)
        if (dp) { dp.activate(pos, Math.round(350 * this.hpScale)); enemy = dp }
        break
      }
    }

    if (enemy) this.enemies.push(enemy)
  }

  getAliveCount(): number {
    return this.enemies.filter((e) => e.isAlive).length
  }

  getRemainingSpawnCount(): number {
    return this.pendingSpawns.length
  }

  removeDeadEnemies(): Enemy[] {
    const justDied: Enemy[] = []
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]
      if (!e.isAlive && e.group.visible === false) {
        // Already deactivated by takeDamage/die
        // Check if we need to fire the callback
      }
    }
    return justDied
  }
}
