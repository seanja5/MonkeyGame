import { Vector3 } from 'three'

export function spheresOverlap(
  posA: Vector3,
  rA: number,
  posB: Vector3,
  rB: number
): boolean {
  const dx = posA.x - posB.x
  const dy = posA.y - posB.y
  const dz = posA.z - posB.z
  const distSq = dx * dx + dy * dy + dz * dz
  const minDist = rA + rB
  return distSq < minDist * minDist
}

export function flatSpheresOverlap(
  posA: Vector3,
  rA: number,
  posB: Vector3,
  rB: number
): boolean {
  const dx = posA.x - posB.x
  const dz = posA.z - posB.z
  const distSq = dx * dx + dz * dz
  const minDist = rA + rB
  return distSq < minDist * minDist
}
