import {
  Mesh,
  PlaneGeometry,
  MeshLambertMaterial,
  Scene,
  CircleGeometry,
  DoubleSide,
} from 'three'

export class Ground {
  private mesh: Mesh
  private dirtRing: Mesh

  constructor(scene: Scene) {
    // Main grass plane
    const geo = new PlaneGeometry(200, 200, 4, 4)
    const mat = new MeshLambertMaterial({ color: 0x3a6b2a })
    this.mesh = new Mesh(geo, mat)
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.receiveShadow = true
    scene.add(this.mesh)

    // Dirt battle ring in center
    const dirtGeo = new CircleGeometry(55, 32)
    const dirtMat = new MeshLambertMaterial({ color: 0x8b7355, side: DoubleSide })
    this.dirtRing = new Mesh(dirtGeo, dirtMat)
    this.dirtRing.rotation.x = -Math.PI / 2
    this.dirtRing.position.y = 0.01
    scene.add(this.dirtRing)
  }
}
