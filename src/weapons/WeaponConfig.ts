import { WeaponId } from '../types'
import type { WeaponDef } from '../types'
import { WEAPON_DEFS } from '../constants'

export function getWeaponDef(id: WeaponId): WeaponDef {
  return WEAPON_DEFS[id]
}

export function getAllWeapons(): WeaponDef[] {
  return Object.values(WEAPON_DEFS).sort((a, b) => a.rank - b.rank)
}
