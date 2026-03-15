const MOUSE_SENSITIVITY = 0.002

export class PlayerController {
  keys: Record<string, boolean> = {}
  isShooting = false
  abilityPressed = false
  private _abilityConsumed = false

  // FPS mouse look
  private _yawDelta = 0
  private _pitchDelta = 0
  pointerLocked = false

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true
      if (e.code === 'KeyQ') this.abilityPressed = true
      for (let i = 1; i <= 9; i++) {
        if (e.code === `Digit${i}`) this.keys[`weapon${i}`] = true
      }
    })
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
    })
    window.addEventListener('mousemove', (e) => {
      if (!this.pointerLocked) return
      this._yawDelta += e.movementX * MOUSE_SENSITIVITY
      this._pitchDelta += e.movementY * MOUSE_SENSITIVITY
    })
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        if (!this.pointerLocked) {
          const canvas = document.getElementById('gameCanvas')
          canvas?.requestPointerLock()
        } else {
          this.isShooting = true
        }
      }
    })
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isShooting = false
    })
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement !== null
    })
  }

  consumeMouseDeltas(): { yaw: number; pitch: number } {
    const result = { yaw: this._yawDelta, pitch: this._pitchDelta }
    this._yawDelta = 0
    this._pitchDelta = 0
    return result
  }

  consumeAbility(): boolean {
    if (this.abilityPressed && !this._abilityConsumed) {
      this._abilityConsumed = true
      this.abilityPressed = false
      return true
    }
    return false
  }

  resetAbilityConsumed(): void {
    this._abilityConsumed = false
  }

  getWeaponSwitchIndex(): number | null {
    for (let i = 1; i <= 9; i++) {
      const key = `weapon${i}`
      if (this.keys[key]) {
        this.keys[key] = false
        return i - 1
      }
    }
    return null
  }

  getMovementVector(): { x: number; z: number } {
    let x = 0
    let z = 0
    if (this.keys['KeyW'] || this.keys['ArrowUp']) z -= 1
    if (this.keys['KeyS'] || this.keys['ArrowDown']) z += 1
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1
    if (x !== 0 && z !== 0) {
      x *= 0.707
      z *= 0.707
    }
    return { x, z }
  }
}
