import {
  Scene,
  Mesh,
  Group,
  CylinderGeometry,
  SphereGeometry,
  MeshLambertMaterial,
  Vector3,
  PerspectiveCamera,
} from 'three'

export class Viewmodel {
  readonly scene: Scene
  private group: Group

  constructor() {
    this.scene = new Scene()
    this.group = new Group()

    const yellowMat = new MeshLambertMaterial({ color: 0xffe000 })
    const brownMat  = new MeshLambertMaterial({ color: 0x8b6914 })

    // Main banana body — tapered cylinder angled like a held weapon
    const body = new Mesh(new CylinderGeometry(0.055, 0.09, 0.58, 8), yellowMat)
    body.rotation.z = Math.PI / 4.5  // tilt
    body.rotation.y = 0.3
    body.position.set(0, 0.04, 0)
    this.group.add(body)

    // Stem tip
    const tip = new Mesh(new SphereGeometry(0.05, 6, 5), brownMat)
    tip.position.set(-0.16, 0.24, 0.04)
    this.group.add(tip)

    // Bottom nub
    const nub = new Mesh(new SphereGeometry(0.045, 6, 5), brownMat)
    nub.position.set(0.1, -0.2, 0)
    this.group.add(nub)

    // Grip hand (dark cylinder below banana)
    const gripMat = new MeshLambertMaterial({ color: 0x3a2010 })
    const grip = new Mesh(new CylinderGeometry(0.07, 0.07, 0.22, 7), gripMat)
    grip.position.set(0.06, -0.3, 0)
    this.group.add(grip)

    this.scene.add(this.group)
  }

  update(camera: PerspectiveCamera): void {
    // Place group at fixed camera-space offset (right, down, forward)
    const offset = new Vector3(0.34, -0.28, -0.55)
    offset.applyQuaternion(camera.quaternion)
    this.group.position.copy(camera.position).add(offset)
    this.group.quaternion.copy(camera.quaternion)
  }
}
