import { Scene, Vector3 } from 'three'
import { Projectile } from './Projectile'
import type { Weapon } from './Weapon'
import type { Enemy } from '../enemies/Enemy'
import { flatSpheresOverlap } from '../utils/CollisionUtils'
import { ARENA_BOUNDARY } from '../constants'
import { WeaponId } from '../types'

const POOL_SIZE = 200

export class ProjectileManager {
  private pool: Projectile[] = []
  private active: Projectile[] = []
  private scene: Scene

  onExplosion?: (pos: Vector3, radius: number, damage: number) => void

  constructor(scene: Scene) {
    this.scene = scene
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = new Projectile()
      scene.add(p.mesh)
      this.pool.push(p)
    }
  }

  fire(
    origin: Vector3,
    direction: Vector3,
    weapon: Weapon,
    damageMult: number,
    dualWield = false
  ): void {
    const def = weapon.def
    const effectiveDamage = weapon.getEffectiveDamage(damageMult)
    const range = def.range
    const speed = def.projectileSpeed
    const maxLife = range / speed

    const isPierce = weapon.isPierceShot()
    const isFullPierce = def.id === WeaponId.BANANA_BLASTER && weapon.upgradeLevel >= 2 && isPierce

    if (def.pelletCount) {
      // Shotgun: fire N pellets in spread cone
      const pellets = weapon.upgradeLevel >= 1 ? 9 : def.pelletCount
      const spreadAngle = 0.45 // radians total spread
      for (let i = 0; i < pellets; i++) {
        const t = pellets === 1 ? 0 : i / (pellets - 1) - 0.5
        const spreadDir = direction.clone()
        spreadDir.x += t * spreadAngle
        spreadDir.normalize()
        this.spawnProjectile(origin, spreadDir, speed * 1.1, effectiveDamage, def.projectileColor, def.projectileSize, maxLife, false, 0, 0, false)
      }
    } else if (def.burstCount) {
      // Burst: schedule burst with small delays
      const burstCount = weapon.upgradeLevel >= 1 ? 4 : def.burstCount
      for (let i = 0; i < burstCount; i++) {
        setTimeout(() => {
          this.spawnProjectile(origin.clone(), direction.clone(), speed, effectiveDamage, def.projectileColor, def.projectileSize, maxLife, false, 0, 0, false)
        }, i * 80)
      }
    } else if (def.isGrenadeArc) {
      // Grenade
      this.spawnProjectile(origin, direction, speed, effectiveDamage, def.projectileColor, def.projectileSize, maxLife + 3, true, weapon.aoeRadius, weapon.def.aoeDamage ?? effectiveDamage, false)
      if (weapon.upgradeLevel >= 2) {
        // Triple Bunch
        const left = direction.clone()
        left.x += 0.3; left.normalize()
        const right = direction.clone()
        right.x -= 0.3; right.normalize()
        this.spawnProjectile(origin.clone(), left, speed * 0.9, effectiveDamage * 0.7, def.projectileColor, def.projectileSize * 0.8, maxLife + 3, true, weapon.aoeRadius * 0.7, (weapon.def.aoeDamage ?? effectiveDamage) * 0.7, false)
        this.spawnProjectile(origin.clone(), right, speed * 0.9, effectiveDamage * 0.7, def.projectileColor, def.projectileSize * 0.8, maxLife + 3, true, weapon.aoeRadius * 0.7, (weapon.def.aoeDamage ?? effectiveDamage) * 0.7, false)
      }
    } else {
      // Standard projectile
      this.spawnProjectile(origin, direction, speed, effectiveDamage, def.projectileColor, def.projectileSize, maxLife, false, 0, 0, isFullPierce || (isPierce && weapon.upgradeLevel >= 1))

      if (dualWield) {
        // Second pistol: slightly offset
        const spreadDir = direction.clone()
        spreadDir.x += 0.08
        spreadDir.normalize()
        this.spawnProjectile(origin.clone(), spreadDir, speed, effectiveDamage, def.projectileColor, def.projectileSize, maxLife, false, 0, 0, false)
      }
    }

    weapon.resetCooldown()
    // Increment pierce counter AFTER shot
    if (def.id === WeaponId.BANANA_BLASTER) {
      weapon.pierceShotCounter++
    }
  }

  private spawnProjectile(
    origin: Vector3,
    direction: Vector3,
    speed: number,
    damage: number,
    color: number,
    size: number,
    maxLife: number,
    isArc: boolean,
    aoeRadius: number,
    aoeDamage: number,
    pierce: boolean
  ): void {
    if (this.pool.length === 0) return
    const proj = this.pool.pop()!
    proj.activate(this.scene, origin, direction, speed, damage, color, size, maxLife, isArc, aoeRadius, aoeDamage, pierce)
    this.active.push(proj)
  }

  update(dt: number, enemies: Enemy[]): { hits: Array<{ enemy: Enemy; damage: number }> } {
    const hits: Array<{ enemy: Enemy; damage: number }> = []
    const toReturn: Projectile[] = []

    for (let i = this.active.length - 1; i >= 0; i--) {
      const proj = this.active[i]
      const expired = proj.update(dt)

      let hit = false

      // Check out-of-bounds
      const px = proj.mesh.position.x
      const pz = proj.mesh.position.z
      if (Math.sqrt(px * px + pz * pz) > ARENA_BOUNDARY + 10) {
        hit = true
      }

      if (!hit) {
        // Grenade AoE explode
        if (proj.isGrenadeArc && expired) {
          if (this.onExplosion && proj.aoeRadius > 0) {
            this.onExplosion(proj.mesh.position.clone(), proj.aoeRadius, proj.aoeDamage)
          }
          hit = true
        } else if (!proj.isGrenadeArc) {
          // Check enemy collisions
          for (const enemy of enemies) {
            if (!enemy.isAlive) continue
            if (proj.hitEnemies.has(enemy)) continue

            if (flatSpheresOverlap(proj.mesh.position, 0.4, enemy.position, enemy.collisionRadius)) {
              hits.push({ enemy, damage: proj.damage })
              proj.hitEnemies.add(enemy)

              if (!proj.pierce) {
                hit = true
                break
              }
            }
          }

          if (expired) hit = true
        }
      }

      if (hit) {
        this.active.splice(i, 1)
        proj.deactivate()
        toReturn.push(proj)
      }
    }

    for (const p of toReturn) this.pool.push(p)
    return { hits }
  }

  clear(): void {
    for (const p of [...this.active]) {
      p.deactivate()
      this.pool.push(p)
    }
    this.active = []
  }
}
