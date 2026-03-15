import {
  Group,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  ConeGeometry,
  MeshLambertMaterial,
  MeshStandardMaterial,
  PointLight,
  Scene,
  Vector3,
} from 'three'

export const TREEHOUSE_POSITION = new Vector3(0, 0, -48)

export class Treehouse {
  readonly group: Group
  private beacon: Mesh
  private beaconLight: PointLight
  private beaconTime = 0

  constructor(scene: Scene) {
    this.group = new Group()

    const woodMat = new MeshLambertMaterial({ color: 0xc8a96e })
    const darkWoodMat = new MeshLambertMaterial({ color: 0x8b4513 })

    // Platform
    const platform = new Mesh(new BoxGeometry(12, 1.2, 10), woodMat)
    platform.position.y = 4.6
    platform.castShadow = true
    platform.receiveShadow = true
    this.group.add(platform)

    // Stilts
    const stiltMat = new MeshLambertMaterial({ color: 0x7a5230 })
    const stiltPositions = [[-4, -3], [4, -3], [-4, 3], [4, 3]] as const
    for (const [x, z] of stiltPositions) {
      const stilt = new Mesh(new CylinderGeometry(0.35, 0.45, 4.2, 6), stiltMat)
      stilt.position.set(x, 2.1, z)
      this.group.add(stilt)
    }

    // Walls
    const wallMat = new MeshLambertMaterial({ color: 0xd4a870 })
    const wallData: Array<{ px: number; py: number; pz: number; sx: number; sy: number; sz: number }> = [
      { px: 0,    py: 7.2, pz: -3.8, sx: 12,  sy: 4.8, sz: 0.5 },
      { px: 0,    py: 7.2, pz:  4.8, sx: 12,  sy: 4.8, sz: 0.5 },
      { px: -5.8, py: 7.2, pz:  0.5, sx: 0.5, sy: 4.8, sz: 9.6 },
      { px:  5.8, py: 7.2, pz:  0.5, sx: 0.5, sy: 4.8, sz: 9.6 },
    ]
    for (const w of wallData) {
      const wall = new Mesh(new BoxGeometry(w.sx, w.sy, w.sz), wallMat)
      wall.position.set(w.px, w.py, w.pz)
      wall.castShadow = true
      this.group.add(wall)
    }

    // Roof
    const roof = new Mesh(new ConeGeometry(9, 5, 4), darkWoodMat)
    roof.position.y = 12.5
    roof.rotation.y = Math.PI / 4
    roof.castShadow = true
    this.group.add(roof)

    // Ramp
    const ramp = new Mesh(new BoxGeometry(3, 0.3, 6), woodMat)
    ramp.rotation.x = Math.PI / 8
    ramp.position.set(0, 2.2, 7.2)
    this.group.add(ramp)

    // Sign
    const sign = new Mesh(new BoxGeometry(5, 2, 0.3), woodMat)
    sign.position.set(0, 5.8, -4.1)
    this.group.add(sign)

    // Beacon sphere (glows during shop phase)
    const beaconMat = new MeshStandardMaterial({
      color: 0xFFD700,
      emissive: 0xFFD700,
      emissiveIntensity: 0,
    })
    this.beacon = new Mesh(new CylinderGeometry(0.4, 0.4, 14, 8), beaconMat)
    this.beacon.position.set(0, 6, 0)
    this.beacon.visible = false
    this.group.add(this.beacon)

    this.beaconLight = new PointLight(0xFFD700, 0, 20)
    this.beaconLight.position.set(0, 15, 0)
    this.group.add(this.beaconLight)

    this.group.position.copy(TREEHOUSE_POSITION)
    scene.add(this.group)
  }

  setShopActive(active: boolean): void {
    this.beacon.visible = active
  }

  update(dt: number): void {
    if (!this.beacon.visible) return
    this.beaconTime += dt * 2
    const pulse = 0.5 + 0.5 * Math.sin(this.beaconTime)
    ;(this.beacon.material as MeshStandardMaterial).emissiveIntensity = pulse * 1.5
    this.beaconLight.intensity = pulse * 2
  }
}
