import { ClassId } from '../types'
import type { ClassDef } from '../types'
import { CLASS_DEFS } from '../constants'

export function getClassDef(id: ClassId): ClassDef {
  return CLASS_DEFS[id]
}

export function getAllClasses(): ClassDef[] {
  return Object.values(CLASS_DEFS)
}
