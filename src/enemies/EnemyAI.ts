import { Vector3 } from 'three'
import type { Enemy } from './Enemy'
import { flatDistance } from '../utils/MathUtils'

const SEPARATION_RADIUS = 3.5
const SEPARATION_WEIGHT = 0.7

export class EnemyAI {
  update(
    enemy: Enemy,
    target: Vector3,
    allEnemies: Enemy[],
    dt: number
  ): void {
    if (enemy.stunTimer > 0) return
    if (enemy.confusionTimer > 0) {
      // Confused: walk away from player
      const awayDir = enemy.position.clone().sub(target)
      awayDir.y = 0
      if (awayDir.lengthSq() < 0.001) awayDir.set(1, 0, 0)
      awayDir.normalize()
      enemy.group.position.addScaledVector(awayDir, enemy.speed * dt * 0.5)
      return
    }

    // Seek: move toward target
    const seekDir = target.clone().sub(enemy.position)
    seekDir.y = 0
    if (seekDir.lengthSq() > 0.001) seekDir.normalize()

    // Separation: push away from nearby enemies
    const separation = new Vector3()
    for (const other of allEnemies) {
      if (other === enemy || !other.isAlive) continue
      const dist = flatDistance(enemy.position, other.position)
      if (dist < SEPARATION_RADIUS && dist > 0.01) {
        const push = enemy.position.clone().sub(other.position)
        push.y = 0
        push.normalize().multiplyScalar((SEPARATION_RADIUS - dist) / SEPARATION_RADIUS)
        separation.add(push)
      }
    }

    // Combine
    const combined = seekDir.clone().add(separation.multiplyScalar(SEPARATION_WEIGHT))
    if (combined.lengthSq() > 0.001) combined.normalize()

    enemy.group.position.addScaledVector(combined, enemy.speed * dt)
    enemy.group.position.y = 0

    // Face movement direction
    if (combined.lengthSq() > 0.001) {
      enemy.group.rotation.y = Math.atan2(combined.x, combined.z)
    }
  }
}
