import type { Player } from '../player/Player'
import type { BananaManager } from './BananaManager'
import { WeaponId } from '../types'
import { WEAPON_DEFS } from '../constants'
import { getAllWeapons } from '../weapons/WeaponConfig'
import type { AudioManager } from '../audio/AudioManager'

interface ConsumableItem {
  id: string
  name: string
  icon: string
  description: string
  cost: number
}

const CONSUMABLES: ConsumableItem[] = [
  { id: 'heal', name: 'Heal Fruit', icon: '🍎', description: 'Restore 40% HP', cost: 60 },
  { id: 'speed', name: 'Adrenaline Banana', icon: '⚡', description: '2× speed for 10s', cost: 80 },
  { id: 'maxhp', name: 'Iron Skin', icon: '🛡️', description: '+20% max HP permanently', cost: 150 },
]

export class Shop {
  private player: Player
  private bananaManager: BananaManager
  private audio: AudioManager

  constructor(player: Player, bananaManager: BananaManager, audio: AudioManager) {
    this.player = player
    this.bananaManager = bananaManager
    this.audio = audio
  }

  buyWeapon(weaponId: WeaponId): boolean {
    const def = WEAPON_DEFS[weaponId]
    if (this.player.hasWeapon(weaponId)) return false
    if (!this.bananaManager.spend(def.cost)) {
      this.audio.play('shop_deny')
      return false
    }
    this.player.addWeapon(weaponId)
    this.audio.play('shop_buy')
    return true
  }

  upgradeWeapon(weaponId: WeaponId): boolean {
    const weapon = this.player.getWeapon(weaponId)
    if (!weapon) return false
    if (!weapon.canAffordUpgrade) return false
    const cost = weapon.nextUpgradeCost
    if (!this.bananaManager.spend(cost)) {
      this.audio.play('shop_deny')
      return false
    }
    weapon.upgrade()
    this.audio.play('upgrade_buy')
    return true
  }

  buyConsumable(id: string): boolean {
    const item = CONSUMABLES.find((c) => c.id === id)
    if (!item) return false
    if (!this.bananaManager.spend(item.cost)) {
      this.audio.play('shop_deny')
      return false
    }
    switch (id) {
      case 'heal':
        this.player.heal(Math.floor(this.player.maxHp * 0.4))
        break
      case 'speed':
        // Give a timed speed boost (handled by timer in Game)
        this.player.speedMultiplier = 2
        setTimeout(() => { this.player.speedMultiplier = 1 }, 10000)
        break
      case 'maxhp':
        this.player.maxHp = Math.floor(this.player.maxHp * 1.2)
        this.player.heal(Math.floor(this.player.maxHp * 0.1))
        break
    }
    this.audio.play('shop_buy')
    return true
  }

  getWeaponsForSale() {
    return getAllWeapons().filter((w) => !this.player.hasWeapon(w.id))
  }

  getUpgradesAvailable() {
    return this.player.weapons.filter((w) => w.canAffordUpgrade).map((w) => ({
      weaponId: w.def.id,
      weaponName: w.def.name,
      upgradeName: w.nextUpgradeName,
      cost: w.nextUpgradeCost,
      upgradeLevel: w.upgradeLevel,
    }))
  }

  getConsumables() {
    return CONSUMABLES
  }
}
