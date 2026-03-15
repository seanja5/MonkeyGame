import {
  Scene,
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  Fog,
  PointLight,
} from 'three'
import { Ground } from './Ground'
import { spawnPalmTrees } from './PalmTree'
import { spawnRocks } from './Rock'
import { Treehouse } from './Treehouse'

export class Arena {
  readonly treehouse: Treehouse

  constructor(scene: Scene) {
    // Lighting
    const ambient = new AmbientLight(0xffffff, 0.55)
    scene.add(ambient)

    // Main sun — warm directional
    const sun = new DirectionalLight(0xfff5cc, 1.4)
    sun.position.set(30, 60, 20)
    sun.castShadow = true
    sun.shadow.mapSize.width  = 2048
    sun.shadow.mapSize.height = 2048
    sun.shadow.camera.near   = 0.5
    sun.shadow.camera.far    = 250
    sun.shadow.camera.left   = -90
    sun.shadow.camera.right  = 90
    sun.shadow.camera.top    = 90
    sun.shadow.camera.bottom = -90
    sun.shadow.bias = -0.001
    scene.add(sun)

    // Soft fill from opposite side
    const fill = new DirectionalLight(0xaad4ff, 0.4)
    fill.position.set(-20, 30, -10)
    scene.add(fill)

    // Sky/ground bounce
    const hemi = new HemisphereLight(0x87ceeb, 0x3a6e2f, 0.5)
    scene.add(hemi)

    // Subtle warm glow at arena center (helps characters pop)
    const centerGlow = new PointLight(0xffe8a0, 0.6, 80)
    centerGlow.position.set(0, 8, 0)
    scene.add(centerGlow)

    // Atmosphere
    scene.fog = new Fog(0x87ceeb, 90, 170)

    // Geometry (all models preloaded by this point)
    new Ground(scene)
    spawnPalmTrees(scene, 16)
    spawnRocks(scene, 12)
    this.treehouse = new Treehouse(scene)
  }

  update(dt: number): void {
    this.treehouse.update(dt)
  }
}
