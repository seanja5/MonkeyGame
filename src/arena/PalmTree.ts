import { Scene } from 'three'
import { ARENA_RADIUS } from '../constants'
import { randomInRange, randomAngle, angleToVec3 } from '../utils/MathUtils'
import { modelLoader } from '../loaders/ModelLoader'
import { PALM_VARIANTS } from '../loaders/models'

export function spawnPalmTrees(scene: Scene, count = 16): void {
  const ringRadius = ARENA_RADIUS - 3

  for (let i = 0; i < count; i++) {
    const angle  = (i / count) * Math.PI * 2 + randomInRange(-0.25, 0.25)
    const radius = ringRadius + randomInRange(-5, 4)
    const variant = PALM_VARIANTS[i % PALM_VARIANTS.length]

    const { scene: model } = modelLoader.clone(variant)

    const scale = randomInRange(3.5, 5.5)
    model.scale.setScalar(scale)
    model.rotation.y = randomAngle()
    model.rotation.z = randomInRange(-0.08, 0.08)

    model.traverse((child) => {
      child.castShadow = true
      child.receiveShadow = true
    })

    const pos = angleToVec3(angle, radius)
    model.position.set(pos.x, 0, pos.z)
    scene.add(model)
  }
}
