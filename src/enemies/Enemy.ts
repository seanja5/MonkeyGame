import {
  Group,
  Scene,
  Vector3,
  MeshLambertMaterial,
  AnimationMixer,
  AnimationAction,
  AnimationClip,
  LoopRepeat,
  LoopOnce,
} from 'three'
import { EnemyType } from '../types'
import { clamp } from '../utils/MathUtils'
import { EnemyAI } from './EnemyAI'

export abstract class Enemy {
  /** Main group — position is the enemy's world position */
  readonly group: Group
  protected bodyMat: MeshLambertMaterial
  protected scene: Scene

  abstract type: EnemyType
  abstract collisionRadius: number
  abstract bananaDropMin: number
  abstract bananaDropMax: number

  speed = 4
  hp = 50
  maxHp = 50
  isAlive = false
  isMarked = false
  markedTimer = 0
  stunTimer = 0
  confusionTimer = 0
  attackCooldown = 0

  protected ai = new EnemyAI()
  private flashTimer = 0
  private originalColor = 0xff0000

  // Animation
  protected mixer: AnimationMixer | null = null
  private animActions = new Map<string, AnimationAction>()
  private currentAction: AnimationAction | null = null

  constructor(scene: Scene) {
    this.scene = scene
    this.group = new Group()
    this.bodyMat = new MeshLambertMaterial({ color: 0xff0000 })
    scene.add(this.group)
  }

  get position(): Vector3 {
    return this.group.position
  }

  protected setColor(color: number): void {
    this.originalColor = color
    this.bodyMat.color.setHex(color)
  }

  protected initAnimations(model: Group, clips: AnimationClip[]): void {
    if (clips.length === 0) return
    this.mixer = new AnimationMixer(model)
    for (const clip of clips) {
      this.animActions.set(clip.name, this.mixer.clipAction(clip))
    }
  }

  protected playAnim(name: string, loop = true): void {
    const action = this.animActions.get(name)
    if (!action || action === this.currentAction) return
    this.currentAction?.fadeOut(0.15)
    action.reset().fadeIn(0.15)
    action.setLoop(loop ? LoopRepeat : LoopOnce, Infinity)
    if (!loop) action.clampWhenFinished = true
    action.play()
    this.currentAction = action
  }

  activate(position: Vector3, hp: number): void {
    this.hp = hp
    this.maxHp = hp
    this.isAlive = true
    this.stunTimer = 0
    this.confusionTimer = 0
    this.attackCooldown = 1.0  // prevent frame-1 attack on spawn
    this.flashTimer = 0
    this.isMarked = false
    this.group.position.copy(position)
    this.group.position.y = 0
    this.group.visible = true
    this.playAnim('walk')
  }

  deactivate(): void {
    this.isAlive = false
    this.group.visible = false
    this.group.position.set(0, -200, 0)
    this.currentAction = null
  }

  update(dt: number, playerPos: Vector3, allEnemies: Enemy[]): void {
    if (!this.isAlive) return

    // Timers
    if (this.stunTimer > 0) {
      this.stunTimer -= dt
      this.playAnim('idle')
    } else {
      this.playAnim('walk')
    }
    if (this.confusionTimer > 0) this.confusionTimer -= dt
    if (this.markedTimer > 0) {
      this.markedTimer -= dt
      if (this.markedTimer <= 0) this.isMarked = false
    }
    if (this.attackCooldown > 0) this.attackCooldown -= dt

    // Flash (visual only — overlay color on bodyMat)
    if (this.flashTimer > 0) {
      this.flashTimer -= dt
      const flash = Math.sin(this.flashTimer * 40) > 0
      this.bodyMat.color.setHex(flash ? 0xffffff : this.originalColor)
    } else {
      this.bodyMat.color.setHex(this.isMarked ? 0xff44ff : this.originalColor)
    }

    // AI movement
    this.ai.update(this, playerPos, allEnemies, dt)

    // Animation mixer
    this.mixer?.update(dt)

    // Subclass-specific update
    this.onUpdate(dt, playerPos)
  }

  protected abstract onUpdate(dt: number, playerPos: Vector3): void

  takeDamage(amount: number): void {
    if (!this.isAlive) return
    const actual = this.isMarked ? amount * 1.5 : amount
    this.hp = clamp(this.hp - actual, 0, this.maxHp)
    this.flashTimer = 0.2
    if (this.hp <= 0) this.die()
  }

  protected die(): void {
    this.isAlive = false
    this.playAnim('die', false)
    // Hide after die animation (~1s)
    setTimeout(() => {
      this.group.visible = false
    }, 1000)
  }

  getBananaDropAmount(): number {
    return this.bananaDropMin + Math.floor(Math.random() * (this.bananaDropMax - this.bananaDropMin + 1))
  }
}
