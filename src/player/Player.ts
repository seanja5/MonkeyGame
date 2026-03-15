import {
  Group,
  Mesh,
  CylinderGeometry,
  SphereGeometry,
  MeshLambertMaterial,
  MeshStandardMaterial,
  Scene,
  Vector3,
  PerspectiveCamera,
  Color,
} from 'three'
import type { ClassDef } from '../types'
import { ClassId, WeaponId } from '../types'
import { Weapon } from '../weapons/Weapon'
import { ARENA_BOUNDARY, CLASS_DEFS } from '../constants'
import { clamp } from '../utils/MathUtils'
import { modelLoader } from '../loaders/ModelLoader'
import { MODELS } from '../loaders/models'

export class Player {
  readonly group: Group
  readonly mesh: Mesh   // kept as fallback reference
  private headMesh: Mesh
  private bodyMat: MeshLambertMaterial
  private headMat: MeshLambertMaterial

  classDef: ClassDef
  hp: number
  maxHp: number
  weapons: Weapon[] = []
  currentWeaponIdx = 0
  damageMult: number
  speed: number
  isAlive = true

  // Ability
  abilityCooldownTimer = 0
  abilityActiveTimer = 0
  abilityReady = true
  isInvisible = false
  isFrenzy = false
  speedMultiplier = 1

  // Visual
  private flashTimer = 0
  private fpsMode = false
  aimTarget = new Vector3()

  // Stats tracking
  totalKills = 0
  totalBananasCollected = 0

  constructor(scene: Scene, classId: ClassId) {
    this.classDef = CLASS_DEFS[classId]
    this.hp = this.classDef.hp
    this.maxHp = this.classDef.hp
    this.damageMult = this.classDef.damageMult
    this.speed = this.classDef.speed

    // Build group
    this.group = new Group()

    // Placeholder mesh (kept for type compatibility, hidden in FPS mode)
    this.bodyMat = new MeshLambertMaterial({ color: this.classDef.color })
    this.headMat = new MeshLambertMaterial({ color: this.classDef.color })
    this.mesh = new Mesh(new CylinderGeometry(0.01, 0.01, 0.01, 4), this.bodyMat)
    this.headMesh = new Mesh(new SphereGeometry(0.01, 4, 3), this.headMat)
    this.group.add(this.mesh)
    this.group.add(this.headMesh)

    // Load orc model, tint to class color
    const { scene: model } = modelLoader.clone(MODELS.PLAYER_ORC)
    const tint = new Color(this.classDef.color)
    model.traverse((child) => {
      child.castShadow = true
      child.receiveShadow = true
      // Tint all standard materials to the class color
      if ((child as any).isMesh) {
        const mat = (child as any).material
        if (mat && mat.color) {
          mat.color.lerp(tint, 0.55)
        }
      }
    })

    // Size variation per class
    const scaleMap: Partial<Record<ClassId, number>> = {
      [ClassId.GORILLA]: 2.0,
      [ClassId.PYGMY_MARMOSET]: 1.0,
      [ClassId.CHIMP]: 1.5,
      [ClassId.MANDRILL]: 1.6,
      [ClassId.SPIDER_MONKEY]: 1.4,
    }
    model.scale.setScalar(scaleMap[classId] ?? 1.5)
    this.group.add(model)

    scene.add(this.group)

    // Starter weapon
    this.weapons.push(new Weapon(this.classDef.starterWeapon))
  }

  get currentWeapon(): Weapon {
    return this.weapons[this.currentWeaponIdx]
  }

  get position(): Vector3 {
    return this.group.position
  }

  setFPSMode(fps: boolean): void {
    this.fpsMode = fps
    if (fps) this.group.visible = false
  }

  update(dt: number): void {
    if (!this.isAlive) return

    // Weapon cooldown
    this.currentWeapon.update(dt)

    // Ability timers
    if (this.abilityCooldownTimer > 0) {
      this.abilityCooldownTimer -= dt
      if (this.abilityCooldownTimer <= 0) {
        this.abilityCooldownTimer = 0
        this.abilityReady = true
      }
    }
    if (this.abilityActiveTimer > 0) {
      this.abilityActiveTimer -= dt
      if (this.abilityActiveTimer <= 0) {
        this.deactivateAbility()
      }
    }

    // Flash effect (affects material even when FPS-hidden)
    if (this.flashTimer > 0) {
      this.flashTimer -= dt
      const flash = Math.sin(this.flashTimer * 30) > 0
      this.bodyMat.color.setHex(flash ? 0xffffff : this.classDef.color)
      this.headMat.color.setHex(flash ? 0xffffff : this.classDef.color)
    } else {
      this.bodyMat.color.setHex(this.classDef.color)
      this.headMat.color.setHex(this.classDef.color)
    }

    // Invisible visual (third-person only)
    if (!this.fpsMode) {
      this.group.visible = !this.isInvisible || (Math.floor(Date.now() / 150) % 2 === 0)
    }
  }

  move(dx: number, dz: number, dt: number): void {
    if (!this.isAlive) return
    const spd = this.speed * this.speedMultiplier
    this.group.position.x += dx * spd * dt
    this.group.position.z += dz * spd * dt

    // Arena boundary clamp
    const pos = this.group.position
    const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z)
    if (dist > ARENA_BOUNDARY) {
      const scale = ARENA_BOUNDARY / dist
      pos.x *= scale
      pos.z *= scale
    }
  }

  takeDamage(amount: number): void {
    if (!this.isAlive || this.isInvisible) return
    this.hp = clamp(this.hp - amount, 0, this.maxHp)
    this.flashTimer = 0.3
    if (this.hp <= 0) this.die()
  }

  die(): void {
    this.isAlive = false
    this.group.visible = false
  }

  heal(amount: number): void {
    this.hp = clamp(this.hp + amount, 0, this.maxHp)
  }

  activateAbility(enemies: Array<{ position: Vector3; takeDamage: (d: number) => void; stunTimer: number }>): void {
    if (!this.abilityReady) return
    this.abilityReady = false
    this.abilityCooldownTimer = this.classDef.abilityCooldown

    switch (this.classDef.id) {
      case ClassId.CHIMP:
        this.isFrenzy = true
        this.abilityActiveTimer = this.classDef.abilityDuration
        break
      case ClassId.GORILLA: {
        // Slam: damage+stun nearby enemies
        const slamPos = this.group.position
        for (const enemy of enemies) {
          const dist = slamPos.distanceTo(enemy.position)
          if (dist < 8) {
            enemy.takeDamage(40)
            enemy.stunTimer = 2
          }
        }
        // Slam jump visual
        this.group.position.y = 1.5
        setTimeout(() => { this.group.position.y = 0 }, 300)
        break
      }
      case ClassId.PYGMY_MARMOSET:
        this.isInvisible = true
        this.speedMultiplier = 1.5
        this.abilityActiveTimer = this.classDef.abilityDuration
        break
      case ClassId.MANDRILL:
        // War Paint handled by setting marked flag on nearest enemy
        this.abilityActiveTimer = 0.1  // just a trigger
        break
      case ClassId.SPIDER_MONKEY: {
        // Canopy Swing: dash toward aimTarget (set from camera forward in Game.ts)
        const dir = this.aimTarget.clone().sub(this.group.position)
        dir.y = 0
        const dist = dir.length()
        if (dist > 0.1) {
          dir.normalize()
          const dashDist = Math.min(dist, 20)
          this.group.position.addScaledVector(dir, dashDist)
          const p = this.group.position
          const d2 = Math.sqrt(p.x * p.x + p.z * p.z)
          if (d2 > ARENA_BOUNDARY) { p.x *= ARENA_BOUNDARY / d2; p.z *= ARENA_BOUNDARY / d2 }
        }
        break
      }
    }
  }

  deactivateAbility(): void {
    this.isFrenzy = false
    this.isInvisible = false
    this.speedMultiplier = 1
  }

  addWeapon(weaponId: WeaponId): boolean {
    if (this.weapons.find((w) => w.def.id === weaponId)) return false
    this.weapons.push(new Weapon(weaponId))
    return true
  }

  hasWeapon(weaponId: WeaponId): boolean {
    return !!this.weapons.find((w) => w.def.id === weaponId)
  }

  getWeapon(weaponId: WeaponId): Weapon | undefined {
    return this.weapons.find((w) => w.def.id === weaponId)
  }

  switchWeapon(index: number): void {
    if (index >= 0 && index < this.weapons.length) {
      this.currentWeaponIdx = index
    }
  }

  getShootOrigin(): Vector3 {
    return this.group.position.clone().add(new Vector3(0, 1.5, 0))
  }

  getShootDirection(): Vector3 {
    const dir = this.aimTarget.clone().sub(this.getShootOrigin())
    dir.y = 0
    if (dir.lengthSq() < 0.001) return new Vector3(0, 0, -1)
    return dir.normalize()
  }

  getShootDirectionFPS(camera: PerspectiveCamera): Vector3 {
    return new Vector3(0, 0, -1).applyEuler(camera.rotation)
  }

  getShootOriginFPS(camera: PerspectiveCamera): Vector3 {
    return camera.position.clone()
  }

  getFireRateMultiplier(): number {
    return this.isFrenzy ? 2 : 1
  }
}
