import { Scene, Vector3 } from 'three'
import { Enemy } from './Enemy'
import { EnemyType } from '../types'
import { ARENA_BOUNDARY } from '../constants'
import { modelLoader } from '../loaders/ModelLoader'
import { MODELS } from '../loaders/models'

export class CageRoller extends Enemy {
  readonly type = EnemyType.CAGE_ROLLER
  readonly collisionRadius = 2.0
  readonly bananaDropMin = 18
  readonly bananaDropMax = 25

  attackDamage = 25
  chargeSpeed = 14
  chargeTimer = 0
  isCharging = false
  brakeTimer = 0

  constructor(scene: Scene) {
    super(scene)
    this.speed = 5.5

    const { scene: model, animations } = modelLoader.clone(MODELS.CAGE_ROLLER)
    // Heavier/larger armored character — scale up
    model.scale.setScalar(2.0)
    model.traverse((child) => { child.castShadow = true; child.receiveShadow = true })
    this.group.add(model)
    this.initAnimations(model, animations)
  }

  protected onUpdate(dt: number, _playerPos: Vector3): void {
    if (this.brakeTimer > 0) {
      this.brakeTimer -= dt
      this.playAnim('idle')
      return
    }

    if (this.isCharging) {
      this.chargeTimer -= dt
      this.playAnim('sprint')
      if (this.chargeTimer <= 0) {
        this.isCharging = false
        this.brakeTimer = 3.0
        this.speed = 5.5
      }
    } else {
      this.playAnim('walk')
      this.chargeTimer += dt
      if (this.chargeTimer >= 8) {
        this.chargeTimer = 1.5
        this.isCharging = true
        this.speed = this.chargeSpeed
      }
    }

    this.group.position.y = 0

    // Arena boundary
    const pos = this.group.position
    const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z)
    if (dist > ARENA_BOUNDARY - 1) {
      pos.x *= (ARENA_BOUNDARY - 1) / dist
      pos.z *= (ARENA_BOUNDARY - 1) / dist
    }
  }
}
