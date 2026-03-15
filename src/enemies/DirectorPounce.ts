import { Scene, Vector3 } from 'three'
import { Enemy } from './Enemy'
import { EnemyType } from '../types'
import { modelLoader } from '../loaders/ModelLoader'
import { MODELS } from '../loaders/models'

export type DirectorPhase = 1 | 2 | 3

export class DirectorPounce extends Enemy {
  readonly type = EnemyType.DIRECTOR_POUNCE
  readonly collisionRadius = 2.2
  readonly bananaDropMin = 60
  readonly bananaDropMax = 90

  phase: DirectorPhase = 1

  onMegaphoneBlast?: (pos: Vector3) => void
  onSummonReinforcements?: () => void
  onEnrage?: () => void

  private actionTimer = 0
  private zigzagDir = 1
  private zigzagTimer = 0

  constructor(scene: Scene) {
    super(scene)
    this.speed = 4.5

    const { scene: model, animations } = modelLoader.clone(MODELS.DIRECTOR)
    // Boss is large and imposing
    model.scale.setScalar(2.4)
    model.traverse((child) => { child.castShadow = true; child.receiveShadow = true })
    this.group.add(model)
    this.initAnimations(model, animations)
  }

  activate(position: Vector3, hp: number): void {
    super.activate(position, hp)
    this.phase = 1
    this.actionTimer = 3
    this.speed = 4.5
    this.zigzagDir = 1
    this.zigzagTimer = 0
  }

  protected onUpdate(dt: number, _playerPos: Vector3): void {
    const hpPct = this.hp / this.maxHp
    const newPhase: DirectorPhase = hpPct > 0.6 ? 1 : hpPct > 0.3 ? 2 : 3

    if (newPhase > this.phase) {
      this.phase = newPhase
      if (newPhase === 3) {
        this.speed = 7
        this.onEnrage?.()
        this.playAnim('sprint')
      }
    }

    this.actionTimer -= dt

    if (this.actionTimer <= 0) {
      if (this.phase === 1) {
        this.actionTimer = 4.0
        this.onMegaphoneBlast?.(this.group.position.clone())
        if (Math.random() < 0.5) this.onSummonReinforcements?.()
      } else if (this.phase === 2) {
        this.actionTimer = 2.5
        this.onMegaphoneBlast?.(this.group.position.clone())
      } else {
        this.actionTimer = 1.0
        this.zigzagDir *= -1
        this.onMegaphoneBlast?.(this.group.position.clone())
      }
    }

    // Phase 3 zigzag
    if (this.phase === 3) {
      this.zigzagTimer += dt * 3
      const zigzag = Math.sin(this.zigzagTimer) * this.zigzagDir
      this.group.position.x += zigzag * this.speed * dt * 0.4
    }
  }
}
