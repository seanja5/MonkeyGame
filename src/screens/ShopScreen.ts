import type { Shop } from '../shop/Shop'
import type { BananaManager } from '../shop/BananaManager'
import { WeaponId } from '../types'
import { SHOP_DURATION } from '../constants'

export class ShopScreen {
  private el: HTMLElement
  private balanceEl: HTMLElement
  private weaponsEl: HTMLElement
  private upgradesEl: HTMLElement
  private consumablesEl: HTMLElement
  private countdownEl: HTMLElement
  private timerBarEl: HTMLElement

  private timer = 0
  private shop!: Shop
  private bananaManager!: BananaManager
  onContinue?: () => void

  constructor() {
    this.el = document.getElementById('screen-shop')!
    this.balanceEl = document.getElementById('shop-balance')!
    this.weaponsEl = document.getElementById('shop-weapons')!
    this.upgradesEl = document.getElementById('shop-upgrades')!
    this.consumablesEl = document.getElementById('shop-consumables')!
    this.countdownEl = document.getElementById('shop-countdown')!
    this.timerBarEl = document.getElementById('shop-timer-bar')!

    document.getElementById('btn-continue-wave')!.addEventListener('click', () => {
      this.onContinue?.()
    })
  }

  open(shop: Shop, bananaManager: BananaManager): void {
    this.shop = shop
    this.bananaManager = bananaManager
    this.timer = SHOP_DURATION
    this.refresh()
    this.el.classList.add('active')
  }

  close(): void {
    this.el.classList.remove('active')
  }

  update(dt: number): void {
    if (!this.el.classList.contains('active')) return
    this.timer -= dt
    if (this.timer <= 0) {
      this.timer = 0
      this.onContinue?.()
      return
    }
    this.countdownEl.textContent = String(Math.ceil(this.timer))
    this.timerBarEl.style.width = `${(this.timer / SHOP_DURATION) * 100}%`
    this.balanceEl.textContent = String(this.bananaManager.bananas)
  }

  private refresh(): void {
    this.balanceEl.textContent = String(this.bananaManager.bananas)
    this.renderWeapons()
    this.renderUpgrades()
    this.renderConsumables()
  }

  private renderWeapons(): void {
    const forSale = this.shop.getWeaponsForSale()
    this.weaponsEl.innerHTML = ''

    if (forSale.length === 0) {
      this.weaponsEl.innerHTML = '<div style="color:#888;font-size:14px;">All weapons acquired!</div>'
      return
    }

    for (const def of forSale) {
      const canAfford = this.bananaManager.bananas >= def.cost
      const item = document.createElement('div')
      item.className = 'shop-item' + (canAfford ? '' : ' cant-afford')
      item.innerHTML = `
        <div class="item-icon">${def.icon}</div>
        <div class="item-info">
          <div class="item-name">${def.name}</div>
          <div class="item-desc">${def.description}</div>
        </div>
        <div class="item-cost">🍌 ${def.cost}</div>
      `
      if (canAfford) {
        item.addEventListener('click', () => {
          if (this.shop.buyWeapon(def.id)) this.refresh()
        })
      }
      this.weaponsEl.appendChild(item)
    }
  }

  private renderUpgrades(): void {
    const upgrades = this.shop.getUpgradesAvailable()
    this.upgradesEl.innerHTML = ''

    if (upgrades.length === 0) {
      this.upgradesEl.innerHTML = '<div style="color:#888;font-size:14px;">No upgrades available.</div>'
      return
    }

    for (const upg of upgrades) {
      const canAfford = this.bananaManager.bananas >= upg.cost
      const item = document.createElement('div')
      item.className = 'shop-item' + (canAfford ? '' : ' cant-afford')
      item.innerHTML = `
        <div class="item-icon">⬆️</div>
        <div class="item-info">
          <div class="item-name">${upg.weaponName} → ${upg.upgradeName}</div>
          <div class="item-desc">Upgrade level ${upg.upgradeLevel + 1}</div>
        </div>
        <div class="item-cost">🍌 ${upg.cost}</div>
      `
      if (canAfford) {
        item.addEventListener('click', () => {
          if (this.shop.upgradeWeapon(upg.weaponId)) this.refresh()
        })
      }
      this.upgradesEl.appendChild(item)
    }
  }

  private renderConsumables(): void {
    const consumables = this.shop.getConsumables()
    this.consumablesEl.innerHTML = ''

    for (const c of consumables) {
      const canAfford = this.bananaManager.bananas >= c.cost
      const item = document.createElement('div')
      item.className = 'shop-item' + (canAfford ? '' : ' cant-afford')
      item.innerHTML = `
        <div class="item-icon">${c.icon}</div>
        <div class="item-info">
          <div class="item-name">${c.name}</div>
          <div class="item-desc">${c.description}</div>
        </div>
        <div class="item-cost">🍌 ${c.cost}</div>
      `
      if (canAfford) {
        item.addEventListener('click', () => {
          if (this.shop.buyConsumable(c.id)) this.refresh()
        })
      }
      this.consumablesEl.appendChild(item)
    }
  }
}
