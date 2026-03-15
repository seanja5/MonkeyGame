import {
  Mesh,
  SphereGeometry,
  MeshStandardMaterial,
  Vector3,
  Scene,
} from 'three'

export class Projectile {
  mesh: Mesh
  velocity = new Vector3()
  active = false
  lifetime = 0
  maxLifetime = 3
  damage = 0
  aoeRadius = 0
  aoeDamage = 0
  isGrenadeArc = false
  pierce = false
  hitEnemies = new Set<object>()
  ownerId = ''  // to avoid self-hit

  private velY = 0
  private gravity = 0

  constructor() {
    const geo = new SphereGeometry(0.3, 6, 5)
    const mat = new MeshStandardMaterial({ color: 0xffe000, emissive: 0xffe000, emissiveIntensity: 0.6 })
    this.mesh = new Mesh(geo, mat)
    this.mesh.visible = false
    this.mesh.castShadow = false
  }

  activate(
    scene: Scene,
    position: Vector3,
    direction: Vector3,
    speed: number,
    damage: number,
    color: number,
    size: number,
    maxLifetime: number,
    isArc = false,
    aoeRadius = 0,
    aoeDamage = 0,
    pierce = false
  ): void {
    this.active = true
    this.lifetime = 0
    this.maxLifetime = maxLifetime
    this.damage = damage
    this.aoeRadius = aoeRadius
    this.aoeDamage = aoeDamage
    this.isGrenadeArc = isArc
    this.pierce = pierce
    this.hitEnemies.clear()
    this.velY = 0
    this.gravity = 0

    this.mesh.visible = true
    this.mesh.position.copy(position)
    ;(this.mesh.material as MeshStandardMaterial).color.setHex(color)
    ;(this.mesh.material as MeshStandardMaterial).emissive.setHex(color)
    this.mesh.scale.setScalar(size / 0.3)

    if (isArc) {
      this.velocity.copy(direction).multiplyScalar(speed)
      this.velY = 8
      this.gravity = 18
    } else {
      this.velocity.copy(direction).multiplyScalar(speed)
    }

    if (!this.mesh.parent) scene.add(this.mesh)
  }

  deactivate(): void {
    this.active = false
    this.mesh.visible = false
    this.mesh.position.set(0, -100, 0)
    this.hitEnemies.clear()
  }

  update(dt: number): boolean {
    if (!this.active) return false

    this.lifetime += dt

    if (this.isGrenadeArc) {
      this.velY -= this.gravity * dt
      this.mesh.position.x += this.velocity.x * dt
      this.mesh.position.y += this.velY * dt
      this.mesh.position.z += this.velocity.z * dt

      if (this.mesh.position.y <= 0) {
        this.mesh.position.y = 0
        return true // explode
      }
    } else {
      this.mesh.position.addScaledVector(this.velocity, dt)
    }

    if (this.lifetime >= this.maxLifetime) return true

    return false // still active
  }
}
