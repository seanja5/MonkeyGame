import {
  Scene,
  Mesh,
  SphereGeometry,
  MeshStandardMaterial,
  Vector3,
} from 'three'
import { Pool } from '../utils/Pool'
import { flatSpheresOverlap } from '../utils/CollisionUtils'
import { BANANA_COLLECT_RADIUS, BANANA_LIFETIME } from '../constants'

interface BananaDrop {
  mesh: Mesh
  lifetime: number
  amount: number
  active: boolean
}

export class BananaManager {
  bananas = 0
  totalCollected = 0

  private drops: BananaDrop[] = []
  private pool: Pool<BananaDrop>
  private scene: Scene

  constructor(scene: Scene) {
    this.scene = scene

    const geo = new SphereGeometry(0.35, 6, 5)
    const mat = new MeshStandardMaterial({ color: 0xFFD700, emissive: 0xcc8800, emissiveIntensity: 0.4 })

    this.pool = new Pool<BananaDrop>(
      () => {
        const m = new Mesh(geo, mat.clone())
        m.visible = false
        scene.add(m)
        return { mesh: m, lifetime: 0, amount: 0, active: false }
      },
      (d) => {
        d.mesh.visible = false
        d.active = false
      },
      50
    )
  }

  drop(position: Vector3, amount: number): void {
    // Scatter 1–3 coins
    const coinCount = Math.min(3, Math.max(1, Math.floor(amount / 5)))
    const amountPerCoin = Math.floor(amount / coinCount)

    for (let i = 0; i < coinCount; i++) {
      const drop = this.pool.get()
      drop.active = true
      drop.lifetime = 0
      drop.amount = i === 0 ? amount - amountPerCoin * (coinCount - 1) : amountPerCoin
      drop.mesh.position.set(
        position.x + (Math.random() - 0.5) * 3,
        0.4,
        position.z + (Math.random() - 0.5) * 3
      )
      drop.mesh.visible = true
      drop.mesh.scale.setScalar(0.8 + Math.random() * 0.5)
      this.drops.push(drop)
    }
  }

  update(dt: number, playerPos: Vector3): number {
    let collected = 0
    const toReturn: BananaDrop[] = []

    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i]
      if (!drop.active) { this.drops.splice(i, 1); continue }

      drop.lifetime += dt

      // Spin animation
      drop.mesh.rotation.y += dt * 2

      // Lifetime auto-collect (magnet)
      const shouldAutoCollect = drop.lifetime > BANANA_LIFETIME

      if (
        shouldAutoCollect ||
        flatSpheresOverlap(playerPos, BANANA_COLLECT_RADIUS, drop.mesh.position, 0.35)
      ) {
        collected += drop.amount
        this.bananas += drop.amount
        this.totalCollected += drop.amount
        this.drops.splice(i, 1)
        toReturn.push(drop)
      }
    }

    for (const d of toReturn) this.pool.release(d)
    return collected
  }

  spend(amount: number): boolean {
    if (this.bananas < amount) return false
    this.bananas -= amount
    return true
  }

  clearDrops(): void {
    for (const d of this.drops) this.pool.release(d)
    this.drops = []
  }

  reset(): void {
    this.clearDrops()
    this.bananas = 0
    this.totalCollected = 0
  }
}
