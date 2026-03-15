const CHARS = '/models/characters'
const ENV   = '/models/environment'

export const MODELS = {
  // Player
  PLAYER_ORC:  `${CHARS}/character-orc.glb`,

  // Enemies
  NET_GOON:    `${CHARS}/character-j.glb`,
  CAGE_ROLLER: `${CHARS}/character-h.glb`,
  DIRECTOR:    `${CHARS}/character-p.glb`,

  // Palm trees (3 variants for variety)
  PALM_TALL:  `${ENV}/tree_palmDetailedTall.glb`,
  PALM_SHORT: `${ENV}/tree_palmDetailedShort.glb`,
  PALM_BEND:  `${ENV}/tree_palmBend.glb`,

  // Rocks (mix of large + tall)
  ROCK_LARGE_A: `${ENV}/rock_largeA.glb`,
  ROCK_LARGE_B: `${ENV}/rock_largeB.glb`,
  ROCK_LARGE_C: `${ENV}/rock_largeC.glb`,
  ROCK_TALL_A:  `${ENV}/rock_tallA.glb`,
  ROCK_TALL_B:  `${ENV}/rock_tallB.glb`,
  ROCK_TALL_C:  `${ENV}/rock_tallC.glb`,
} as const

export type ModelKey = keyof typeof MODELS

export const ALL_MODELS: string[] = Object.values(MODELS)

export const PALM_VARIANTS = [MODELS.PALM_TALL, MODELS.PALM_SHORT, MODELS.PALM_BEND] as const
export const ROCK_VARIANTS  = [
  MODELS.ROCK_LARGE_A, MODELS.ROCK_LARGE_B, MODELS.ROCK_LARGE_C,
  MODELS.ROCK_TALL_A,  MODELS.ROCK_TALL_B,  MODELS.ROCK_TALL_C,
] as const
