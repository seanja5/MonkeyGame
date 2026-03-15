import type { Player } from '../player/Player'
import type { BananaManager } from '../shop/BananaManager'
import type { WaveSpawner } from '../enemies/WaveSpawner'

export class HUD {
  private waveDisplay: HTMLElement
  private enemiesDisplay: HTMLElement
  private bananaCount: HTMLElement
  private classDisplay: HTMLElement
  private hpBar: HTMLElement
  private hpText: HTMLElement
  private abilityDisplay: HTMLElement
  private weaponDisplay: HTMLElement
  private hudRoot: HTMLElement

  constructor() {
    this.hudRoot = document.getElementById('hud')!
    this.waveDisplay = document.getElementById('wave-display')!
    this.enemiesDisplay = document.getElementById('enemies-remaining')!
    this.bananaCount = document.getElementById('banana-count')!
    this.classDisplay = document.getElementById('class-display')!
    this.hpBar = document.getElementById('hp-bar')!
    this.hpText = document.getElementById('hp-text')!
    this.abilityDisplay = document.getElementById('ability-display')!
    this.weaponDisplay = document.getElementById('weapon-display')!
  }

  show(): void { this.hudRoot.style.display = 'block' }
  hide(): void { this.hudRoot.style.display = 'none' }

  update(
    player: Player,
    bananaManager: BananaManager,
    waveSpawner: WaveSpawner,
    waveNumber: number
  ): void {
    // Wave info
    this.waveDisplay.textContent = `WAVE ${waveNumber}`
    const alive = waveSpawner.getAliveCount()
    const pending = waveSpawner.getRemainingSpawnCount()
    this.enemiesDisplay.textContent = `${alive + pending} enemies remaining`

    // Banana count
    this.bananaCount.textContent = String(bananaManager.bananas)

    // Class
    this.classDisplay.textContent = player.classDef.name.toUpperCase()

    // HP bar
    const hpPct = (player.hp / player.maxHp) * 100
    this.hpBar.style.width = `${hpPct}%`
    this.hpBar.style.background = hpPct > 50
      ? 'linear-gradient(90deg, #44ff44, #00aa00)'
      : hpPct > 25
        ? 'linear-gradient(90deg, #ffaa00, #ff6600)'
        : 'linear-gradient(90deg, #ff4444, #ff0000)'
    this.hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`

    // Ability
    if (player.abilityReady) {
      this.abilityDisplay.textContent = `[Q] ${player.classDef.abilityName} — READY`
      this.abilityDisplay.className = 'ready'
    } else {
      const cd = Math.ceil(player.abilityCooldownTimer)
      this.abilityDisplay.textContent = `[Q] ${player.classDef.abilityName} — ${cd}s`
      this.abilityDisplay.className = ''
    }

    // Weapon
    const w = player.currentWeapon
    let weaponText = w.def.name
    if (w.upgradeLevel > 0) weaponText += ` +${w.upgradeLevel}`
    if (player.isFrenzy) weaponText += ' 🔥'
    if (w.isPeelStormActive) weaponText += ' ⚡'
    this.weaponDisplay.textContent = weaponText
  }

  showWaveBanner(waveNumber: number, isBoss: boolean): void {
    const banner = document.getElementById('wave-banner')!
    const text = document.getElementById('wave-banner-text')!
    const sub = document.getElementById('wave-banner-sub')!
    text.textContent = `WAVE ${waveNumber}`
    sub.textContent = isBoss ? '⚠️ BOSS WAVE — DIRECTOR POUNCE INCOMING!' : 'CAPTURE FORCE INCOMING!'
    banner.style.display = 'block'
    setTimeout(() => { banner.style.display = 'none' }, 3000)
  }

  spawnDamageNumber(x: number, y: number, damage: number, isBanana = false): void {
    const div = document.createElement('div')
    div.className = isBanana ? 'damage-number banana-pickup' : 'damage-number'
    div.textContent = isBanana ? `+🍌${damage}` : `-${Math.ceil(damage)}`
    div.style.left = `${x}px`
    div.style.top = `${y}px`
    document.body.appendChild(div)
    setTimeout(() => div.remove(), 1000)
  }
}
