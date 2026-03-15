import { Scene } from 'three'
import { randomInRange, randomAngle, angleToVec3 } from '../utils/MathUtils'
import { modelLoader } from '../loaders/ModelLoader'
import { ROCK_VARIANTS } from '../loaders/models'

export function spawnRocks(scene: Scene, count = 12): void {
  for (let i = 0; i < count; i++) {
    const variant = ROCK_VARIANTS[i % ROCK_VARIANTS.length]
    const { scene: model } = modelLoader.clone(variant)

    const scale = randomInRange(1.2, 2.8)
    model.scale.set(
      scale * randomInRange(0.7, 1.3),
      scale * randomInRange(0.5, 1.0),
      scale * randomInRange(0.7, 1.3),
    )
    model.rotation.y = randomAngle()

    model.traverse((child) => {
      child.castShadow = true
      child.receiveShadow = true
    })

    const angle  = randomAngle()
    const radius = randomInRange(18, 44)
    const pos    = angleToVec3(angle, radius)
    model.position.set(pos.x, 0, pos.z)
    scene.add(model)
  }
}
