import { PerspectiveCamera, Vector3 } from 'three'
import { clamp } from '../utils/MathUtils'

const EYE_HEIGHT = 2.6
const PITCH_MAX = Math.PI * 0.44   // ~79° up
const PITCH_MIN = -Math.PI * 0.44  // ~79° down

export class CameraController {
  private camera: PerspectiveCamera
  yaw = 0    // horizontal look angle (radians)
  pitch = 0  // vertical look angle (radians)

  constructor(camera: PerspectiveCamera) {
    this.camera = camera
    this.camera.rotation.order = 'YXZ'
  }

  update(playerPos: Vector3, yawDelta: number, pitchDelta: number): void {
    this.yaw -= yawDelta
    this.pitch = clamp(this.pitch - pitchDelta, PITCH_MIN, PITCH_MAX)

    this.camera.position.set(
      playerPos.x,
      playerPos.y + EYE_HEIGHT,
      playerPos.z
    )
    this.camera.rotation.set(this.pitch, this.yaw, 0)
  }

  getYaw(): number {
    return this.yaw
  }
}
