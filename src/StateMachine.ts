import { GameState } from './types'

type StateHandler = {
  onEnter?: () => void
  onExit?: () => void
  update?: (dt: number) => void
}

export class StateMachine {
  private state: GameState = GameState.MAIN_MENU
  private handlers: Map<GameState, StateHandler> = new Map()

  register(state: GameState, handler: StateHandler): void {
    this.handlers.set(state, handler)
  }

  get current(): GameState {
    return this.state
  }

  is(state: GameState): boolean {
    return this.state === state
  }

  transition(next: GameState): void {
    const currentHandler = this.handlers.get(this.state)
    currentHandler?.onExit?.()

    this.state = next

    const nextHandler = this.handlers.get(next)
    nextHandler?.onEnter?.()
  }

  update(dt: number): void {
    const handler = this.handlers.get(this.state)
    handler?.update?.(dt)
  }
}
