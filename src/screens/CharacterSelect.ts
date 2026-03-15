import { ClassId } from '../types'
import { CLASS_DEFS } from '../constants'

export class CharacterSelect {
  private el: HTMLElement
  private selectedClass: ClassId = ClassId.CHIMP
  onConfirm?: (classId: ClassId) => void
  onBack?: () => void

  constructor() {
    this.el = document.getElementById('screen-charselect')!
    this.buildCards()

    document.getElementById('btn-confirm-class')!.addEventListener('click', () => {
      this.onConfirm?.(this.selectedClass)
    })
    document.getElementById('btn-back-to-menu')!.addEventListener('click', () => {
      this.onBack?.()
    })
  }

  private buildCards(): void {
    const container = document.getElementById('class-cards')!
    container.innerHTML = ''

    for (const def of Object.values(CLASS_DEFS)) {
      const card = document.createElement('div')
      card.className = 'class-card' + (def.id === ClassId.CHIMP ? ' selected' : '')
      card.dataset.classId = def.id

      // Color avatar
      const hexColor = '#' + def.color.toString(16).padStart(6, '0')
      card.innerHTML = `
        <div class="class-avatar" style="background:${hexColor}">${def.emoji}</div>
        <div class="class-name">${def.name}</div>
        <div class="class-tagline">"${def.tagline}"</div>
        <div class="class-stats">
          HP: <span>${def.hp}</span><br>
          Speed: <span>${def.speed}/13</span><br>
          Damage: <span>${(def.damageMult * 100).toFixed(0)}%</span><br>
          Starter: <span style="font-size:11px">${this.getWeaponName(def.starterWeapon)}</span>
        </div>
        <div class="class-ability">
          ⚡ ${def.abilityName}<br>
          <span style="color:#ccc;font-weight:normal">${def.abilityDesc}</span>
        </div>
      `

      card.addEventListener('click', () => this.selectClass(def.id))
      container.appendChild(card)
    }
  }

  private getWeaponName(weaponId: string): string {
    const names: Record<string, string> = {
      NANNER_POP: 'Nanner Pop',
      BANANA_BLASTER: 'Banana Blaster',
      PEEL_SPREADER: 'Peel Spreader',
      TROPICANNON: 'Tropicannon',
      SPLITPEEL_SMG: 'Splitpeel SMG',
    }
    return names[weaponId] ?? weaponId
  }

  private selectClass(classId: ClassId): void {
    this.selectedClass = classId
    document.querySelectorAll('.class-card').forEach((card) => {
      const el = card as HTMLElement
      el.classList.toggle('selected', el.dataset.classId === classId)
    })
  }

  show(): void { this.el.classList.add('active') }
  hide(): void { this.el.classList.remove('active') }
}
