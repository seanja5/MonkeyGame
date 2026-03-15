import type { WeaponDef } from '../types'
import { WEAPON_DEFS } from '../constants'
import { WeaponId } from '../types'

export class Weapon {
  readonly def: WeaponDef
  upgradeLevel = 0
  cooldownTimer = 0
  pierceShotCounter = 0  // for Banana Blaster pierce mechanic
  consecutiveHits = 0    // for SMG Peel Storm
  peelStormTimer = 0

  // Derived stats (upgraded)
  get damage(): number {
    let d = this.def.damageBase
    for (let i = 0; i < this.upgradeLevel && i < this.def.upgrades.length; i++) {
      d += this.def.upgrades[i].damageBonus ?? 0
    }
    return d
  }

  get fireRate(): number {
    let fr = this.def.fireRate
    for (let i = 0; i < this.upgradeLevel && i < this.def.upgrades.length; i++) {
      fr += this.def.upgrades[i].fireRateBonus ?? 0
    }
    return fr
  }

  get fireCooldown(): number {
    return 1 / this.fireRate
  }

  get aoeRadius(): number {
    let r = this.def.aoeRadius ?? 0
    for (let i = 0; i < this.upgradeLevel && i < this.def.upgrades.length; i++) {
      r += this.def.upgrades[i].aoeRadiusBonus ?? 0
    }
    return r
  }

  get canAffordUpgrade(): boolean {
    return this.upgradeLevel < this.def.upgrades.length
  }

  get nextUpgradeCost(): number {
    if (!this.canAffordUpgrade) return Infinity
    return this.def.upgrades[this.upgradeLevel].cost
  }

  get nextUpgradeName(): string {
    if (!this.canAffordUpgrade) return 'MAX'
    return this.def.upgrades[this.upgradeLevel].name
  }

  get isPeelStormActive(): boolean {
    return this.def.id === WeaponId.SPLITPEEL_SMG && this.peelStormTimer > 0
  }

  constructor(defOrId: WeaponDef | WeaponId) {
    if (typeof defOrId === 'string') {
      this.def = WEAPON_DEFS[defOrId]
    } else {
      this.def = defOrId
    }
  }

  update(dt: number): void {
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt
    if (this.peelStormTimer > 0) this.peelStormTimer -= dt
  }

  canFire(): boolean {
    return this.cooldownTimer <= 0
  }

  resetCooldown(): void {
    this.cooldownTimer = this.fireCooldown
  }

  onHit(): void {
    if (this.def.id === WeaponId.SPLITPEEL_SMG) {
      this.consecutiveHits++
      const threshold = this.upgradeLevel >= 1 ? 15 : 20
      if (this.consecutiveHits >= threshold) {
        this.consecutiveHits = 0
        this.peelStormTimer = this.upgradeLevel >= 2 ? 8 : 5
      }
    }
    if (this.def.id === WeaponId.BANANA_BLASTER) {
      this.pierceShotCounter++
    }
  }

  onMiss(): void {
    if (this.def.id === WeaponId.SPLITPEEL_SMG) {
      this.consecutiveHits = 0
    }
  }

  isPierceShot(): boolean {
    if (this.def.id !== WeaponId.BANANA_BLASTER) return false
    const threshold = this.upgradeLevel >= 1 ? 3 : 5
    return this.pierceShotCounter % threshold === 0 && this.pierceShotCounter > 0
  }

  getEffectiveDamage(damageMult: number): number {
    let dmg = this.damage * damageMult
    if (this.isPeelStormActive) dmg *= 1.5
    return dmg
  }

  upgrade(): boolean {
    if (!this.canAffordUpgrade) return false
    this.upgradeLevel++
    return true
  }
}
