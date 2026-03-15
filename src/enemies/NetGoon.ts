import { Scene, Vector3 } from 'three'
import { Enemy } from './Enemy'
import { EnemyType } from '../types'
import { flatDistance } from '../utils/MathUtils'
import { modelLoader } from '../loaders/ModelLoader'
import { MODELS } from '../loaders/models'

export class NetGoon extends Enemy {
  readonly type = EnemyType.NET_GOON
  readonly collisionRadius = 1.2
  readonly bananaDropMin = 5
  readonly bananaDropMax = 8

  attackDamage = 10
  attackRange = 9
  attackCooldownDuration = 2.5

  onAttack?: (pos: Vector3, dir: Vector3) => void

  constructor(scene: Scene) {
    super(scene)
    this.speed = 6.0

    const { scene: model, animations } = modelLoader.clone(MODELS.NET_GOON)
    model.scale.setScalar(1.5)
    model.traverse((child) => { child.castShadow = true; child.receiveShadow = true })
    this.group.add(model)
    this.initAnimations(model, animations)
  }

  protected onUpdate(dt: number, playerPos: Vector3): void {
    const dist = flatDistance(this.group.position, playerPos)
    if (dist < this.attackRange && this.attackCooldown <= 0) {
      this.attackCooldown = this.attackCooldownDuration
      this.playAnim('attack-melee-right', false)
      if (this.onAttack) {
        const dir = playerPos.clone().sub(this.group.position)
        dir.y = 0
        dir.normalize()
        this.onAttack(this.group.position.clone(), dir)
      }
    }
    // Slight bobbing when walking
    this.group.position.y = Math.sin(Date.now() * 0.003 + this.group.position.x) * 0.04
  }
}
