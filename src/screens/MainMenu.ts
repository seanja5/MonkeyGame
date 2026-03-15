export class MainMenu {
  private el: HTMLElement
  onPlay?: () => void

  constructor() {
    this.el = document.getElementById('screen-menu')!
    document.getElementById('btn-start')!.addEventListener('click', () => this.onPlay?.())
    document.getElementById('btn-howtoplay')!.addEventListener('click', () => this.showHowToPlay())
  }

  private showHowToPlay(): void {
    alert(
      '🍌 HOW TO PLAY\n\n' +
      'WASD — Move\n' +
      'Mouse — Aim\n' +
      'Left Click — Shoot\n' +
      'Q — Use Special Ability\n' +
      '1-5 — Switch Weapon\n\n' +
      'Defeat Capture Force enemies to earn 🍌 bananas.\n' +
      'Spend bananas at the Treehouse Shop between waves.\n' +
      'Survive all 10 waves to win!\n\n' +
      'Enemy Types:\n' +
      '• Net Goon — fires nets that slow you\n' +
      '• Cage Roller — charges at high speed\n' +
      '• Director Pounce — boss with 3 phases (waves 5, 10...)'
    )
  }

  show(): void { this.el.classList.add('active') }
  hide(): void { this.el.classList.remove('active') }
}
