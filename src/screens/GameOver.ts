export class GameOver {
  private el: HTMLElement
  onRestart?: () => void

  constructor() {
    this.el = document.getElementById('screen-gameover')!
    document.getElementById('btn-restart')!.addEventListener('click', () => this.onRestart?.())
  }

  show(wavesSurvived: number, kills: number, bananas: number): void {
    document.getElementById('go-waves')!.textContent = String(wavesSurvived)
    document.getElementById('go-kills')!.textContent = String(kills)
    document.getElementById('go-bananas')!.textContent = String(bananas)
    this.el.classList.add('active')
  }

  hide(): void { this.el.classList.remove('active') }
}
