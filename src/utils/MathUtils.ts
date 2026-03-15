import { Vector3 } from 'three'

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1))
}

export function randomAngle(): number {
  return Math.random() * Math.PI * 2
}

export function angleToVec3(angle: number, radius = 1): Vector3 {
  return new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
}

export function vec3Lerp(a: Vector3, b: Vector3, t: number): Vector3 {
  return a.clone().lerp(b, t)
}

export function flatDistance(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dz * dz)
}
