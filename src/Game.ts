import {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  Color,
  Vector3,
} from 'three'
import { GameState, ClassId, WeaponId, EnemyType } from './types'
import { StateMachine } from './StateMachine'
import { Arena } from './arena/Arena'
import { Player } from './player/Player'
import { PlayerController } from './player/PlayerController'
import { Viewmodel } from './player/Viewmodel'
import { ProjectileManager } from './weapons/ProjectileManager'
import { WaveSpawner } from './enemies/WaveSpawner'
import { BananaManager } from './shop/BananaManager'
import { Shop } from './shop/Shop'
import { HUD } from './hud/HUD'
import { MainMenu } from './screens/MainMenu'
import { CharacterSelect } from './screens/CharacterSelect'
import { ShopScreen } from './screens/ShopScreen'
import { GameOver } from './screens/GameOver'
import { CameraController } from './camera/CameraController'
import { AudioManager } from './audio/AudioManager'
import { flatSpheresOverlap } from './utils/CollisionUtils'
import { DT_CAP, WAVE_CLEAR_DURATION, WAVE_COUNTDOWN_DURATION, getWaveDef } from './constants'
import type { Enemy } from './enemies/Enemy'
import { modelLoader } from './loaders/ModelLoader'
import { ALL_MODELS } from './loaders/models'

export class Game {
  private renderer: WebGLRenderer
  private scene: Scene
  private camera: PerspectiveCamera
  private sm: StateMachine

  private arena!: Arena
  private player!: Player
  private controller: PlayerController
  private viewmodel!: Viewmodel
  private projectileManager!: ProjectileManager
  private waveSpawner!: WaveSpawner
  private bananaManager!: BananaManager
  private shop!: Shop
  private cameraController!: CameraController
  audio: AudioManager

  // Screens
  private mainMenu: MainMenu
  private characterSelect: CharacterSelect
  private shopScreen: ShopScreen
  private gameOver: GameOver
  private hud!: HUD

  // Pointer lock UI
  private lockOverlay: HTMLDivElement

  // Wave state
  private waveNumber = 0
  private waveStateDuration = 0
  private killCount = 0
  private enemiesKilledSet = new WeakSet<Enemy>()

  // Net goon slow debuff
  private playerSlowTimer = 0

  constructor() {
    // Renderer
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
    this.renderer = new WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.autoClear = false  // manual clear for dual-pass viewmodel

    // Scene
    this.scene = new Scene()
    this.scene.background = new Color(0x87ceeb)

    // Camera
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500)

    // Audio
    this.audio = new AudioManager()

    // Input
    this.controller = new PlayerController()

    // Screens
    this.mainMenu = new MainMenu()
    this.characterSelect = new CharacterSelect()
    this.shopScreen = new ShopScreen()
    this.gameOver = new GameOver()

    // Pointer lock overlay
    this.lockOverlay = document.createElement('div')
    this.lockOverlay.id = 'lock-overlay'
    Object.assign(this.lockOverlay.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.65)',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '14px',
      padding: '8px 20px',
      borderRadius: '6px',
      pointerEvents: 'none',
      display: 'none',
      zIndex: '100',
    })
    this.lockOverlay.textContent = 'CLICK to capture mouse • ESC to release'
    document.body.appendChild(this.lockOverlay)

    // State machine
    this.sm = new StateMachine()
    this.registerStates()

    // Window resize
    window.addEventListener('resize', () => this.onResize())

    // Wire up screen navigation
    this.mainMenu.onPlay = () => this.sm.transition(GameState.CHARACTER_SELECT)
    this.characterSelect.onBack = () => this.sm.transition(GameState.MAIN_MENU)
    this.characterSelect.onConfirm = (classId) => this.startGame(classId)
    this.shopScreen.onContinue = () => this.sm.transition(GameState.WAVE_COUNTDOWN)
    this.gameOver.onRestart = () => this.sm.transition(GameState.MAIN_MENU)
  }

  private registerStates(): void {
    const { sm } = this

    sm.register(GameState.MAIN_MENU, {
      onEnter: () => {
        this.mainMenu.show()
        this.characterSelect.hide()
        this.gameOver.hide()
        this.lockOverlay.style.display = 'none'
      },
      onExit: () => this.mainMenu.hide(),
    })

    sm.register(GameState.CHARACTER_SELECT, {
      onEnter: () => this.characterSelect.show(),
      onExit: () => this.characterSelect.hide(),
    })

    sm.register(GameState.ARENA_INIT, {
      onEnter: () => {
        this.hud?.show()
        this.waveNumber = 0
        this.sm.transition(GameState.WAVE_COUNTDOWN)
      },
    })

    sm.register(GameState.WAVE_COUNTDOWN, {
      onEnter: () => {
        this.waveNumber++
        this.waveStateDuration = WAVE_COUNTDOWN_DURATION
        const def = getWaveDef(this.waveNumber)
        this.hud?.showWaveBanner(this.waveNumber, def.bossWave)
        if (def.bossWave) this.audio.play('boss_warning')
        else this.audio.play('wave_start')
        this.lockOverlay.style.display = 'block'
      },
      update: (dt) => {
        this.waveStateDuration -= dt
        if (this.waveStateDuration <= 0) {
          this.sm.transition(GameState.WAVE_ACTIVE)
        }
      },
    })

    sm.register(GameState.WAVE_ACTIVE, {
      onEnter: () => {
        this.waveSpawner.startWave(this.waveNumber)
        this.playerSlowTimer = 0
        this.lockOverlay.style.display = this.controller.pointerLocked ? 'none' : 'block'
      },
      update: (dt) => this.updateWaveActive(dt),
    })

    sm.register(GameState.WAVE_CLEAR, {
      onEnter: () => {
        this.waveStateDuration = WAVE_CLEAR_DURATION
        this.audio.play('wave_clear')
        this.arena.treehouse.setShopActive(true)
      },
      update: (dt) => {
        this.waveStateDuration -= dt
        if (this.waveStateDuration <= 0) {
          this.sm.transition(GameState.SHOP_PHASE)
        }
      },
    })

    sm.register(GameState.SHOP_PHASE, {
      onEnter: () => {
        this.shopScreen.open(this.shop, this.bananaManager)
        this.lockOverlay.style.display = 'none'
      },
      onExit: () => {
        this.shopScreen.close()
        this.arena.treehouse.setShopActive(false)
        this.lockOverlay.style.display = 'block'
      },
      update: (dt) => {
        this.shopScreen.update(dt)
      },
    })

    sm.register(GameState.GAME_OVER, {
      onEnter: () => {
        this.hud.hide()
        this.audio.play('player_die')
        this.gameOver.show(
          this.waveNumber,
          this.killCount,
          this.bananaManager.totalCollected
        )
        this.lockOverlay.style.display = 'none'
        // Release pointer lock
        if (document.pointerLockElement) document.exitPointerLock()
      },
    })
  }

  private startGame(classId: ClassId): void {
    // Init audio on first user gesture
    this.audio.init()
    this.audio.resume()

    // Clear old state
    if (this.player) {
      this.scene.remove(this.player.group)
    }

    // Build scene
    if (!this.arena) {
      this.arena = new Arena(this.scene)
    }
    if (!this.projectileManager) {
      this.projectileManager = new ProjectileManager(this.scene)
    }
    if (!this.bananaManager) {
      this.bananaManager = new BananaManager(this.scene)
    } else {
      this.bananaManager.reset()
    }
    if (!this.waveSpawner) {
      this.waveSpawner = new WaveSpawner(this.scene)
      this.waveSpawner.onWaveCleared = () => {
        if (this.sm.is(GameState.WAVE_ACTIVE)) {
          this.sm.transition(GameState.WAVE_CLEAR)
        }
      }
      this.waveSpawner.onMegaphoneBlast = (pos) => {
        this.doMegaphoneBlast(pos)
      }
      this.waveSpawner.onSummonReinforcements = () => {
        // Spawn 3 extra Net Goons by pushing to the pending queue via startWave re-entry
        // Simple approach: directly activate 3 net goons from the pool
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2
          const pos = new Vector3(Math.sin(angle) * 54, 0, Math.cos(angle) * 54)
          const ng = (this.waveSpawner as any).netGoonPool?.find((e: Enemy) => !e.isAlive)
          if (ng) {
            ng.activate(pos, Math.round(50 * (this.waveNumber * 0.15 + 1)))
            this.waveSpawner.enemies.push(ng)
          }
        }
      }
    }

    // Explosion callback
    this.projectileManager.onExplosion = (pos, radius, damage) => {
      for (const enemy of this.waveSpawner.enemies) {
        if (!enemy.isAlive) continue
        if (flatSpheresOverlap(pos, radius, enemy.position, enemy.collisionRadius)) {
          enemy.takeDamage(damage)
          if (!enemy.isAlive) this.onEnemyKilled(enemy)
        }
      }
    }

    // Player
    this.player = new Player(this.scene, classId)
    this.player.setFPSMode(true)

    // Camera
    this.cameraController = new CameraController(this.camera)

    // Viewmodel
    this.viewmodel = new Viewmodel()

    // Shop
    this.shop = new Shop(this.player, this.bananaManager, this.audio)

    // HUD
    if (!this.hud) this.hud = new HUD()

    // Reset stats
    this.killCount = 0
    this.waveNumber = 0

    this.sm.transition(GameState.ARENA_INIT)
    this.audio.startJungleAmbient()
  }

  private updateWaveActive(dt: number): void {
    if (!this.player?.isAlive) return

    // Show/hide pointer lock hint
    this.lockOverlay.style.display = this.controller.pointerLocked ? 'none' : 'block'

    // FPS mouse look — apply deltas to camera
    const { yaw, pitch } = this.controller.consumeMouseDeltas()
    this.cameraController.update(this.player.position, yaw, pitch)

    // Camera-relative WASD movement
    const move = this.controller.getMovementVector()
    const camYaw = this.cameraController.getYaw()
    const worldX = move.z * Math.sin(camYaw) + move.x * Math.cos(camYaw)
    const worldZ = move.z * Math.cos(camYaw) - move.x * Math.sin(camYaw)

    // Slow debuff from net goon
    if (this.playerSlowTimer > 0) {
      this.playerSlowTimer -= dt
      this.player.speedMultiplier = this.playerSlowTimer > 0 ? 0.6 : 1
    }

    this.player.move(worldX, worldZ, dt)
    this.player.update(dt)

    // Ability
    if (this.controller.consumeAbility()) {
      // Set aimTarget from camera forward for Spider Monkey dash
      const fwd = new Vector3(0, 0, -1).applyEuler(this.camera.rotation)
      fwd.y = 0
      fwd.normalize()
      this.player.aimTarget.copy(this.player.position).addScaledVector(fwd, 20)

      this.player.activateAbility(
        this.waveSpawner.enemies.filter((e) => e.isAlive) as any[]
      )
      this.audio.play('ability_use')

      // Mandrill War Paint: mark nearest enemy
      if (this.player.classDef.id === ClassId.MANDRILL) {
        let nearest: Enemy | null = null
        let nearestDist = Infinity
        for (const e of this.waveSpawner.enemies) {
          if (!e.isAlive) continue
          const d = this.player.position.distanceTo(e.position)
          if (d < nearestDist) { nearestDist = d; nearest = e }
        }
        if (nearest) {
          nearest.isMarked = true
          nearest.markedTimer = 8
        }
      }
    }

    // Weapon switching
    const switchIdx = this.controller.getWeaponSwitchIndex()
    if (switchIdx !== null) this.player.switchWeapon(switchIdx)

    // Shooting — FPS direction from camera
    if (this.controller.isShooting) {
      const weapon = this.player.currentWeapon
      const frenzyMult = this.player.getFireRateMultiplier()
      if (weapon.cooldownTimer <= 0) {
        this.projectileManager.fire(
          this.player.getShootOriginFPS(this.camera),
          this.player.getShootDirectionFPS(this.camera),
          weapon,
          this.player.damageMult,
          this.player.classDef.dualWield ?? false
        )
        weapon.cooldownTimer = weapon.fireCooldown / frenzyMult
        this.playSoundForWeapon(weapon.def.id)
      }
    }

    // Wave spawner update
    this.waveSpawner.update(dt)

    // Enemy updates
    const aliveEnemies = this.waveSpawner.enemies.filter((e) => e.isAlive)
    for (const enemy of aliveEnemies) {
      enemy.update(dt, this.player.position, aliveEnemies)

      // Enemy attacks player
      const dist = enemy.position.distanceTo(this.player.position)
      const attackRange = this.getEnemyAttackRange(enemy)
      if (dist < attackRange && (enemy as any).attackCooldown <= 0) {
        const dmg = this.getEnemyAttackDamage(enemy)
        this.player.takeDamage(dmg)
        ;(enemy as any).attackCooldown = this.getEnemyAttackCooldown(enemy)
        this.audio.play('player_damage')

        // Net Goon slow effect
        if (enemy.type === EnemyType.NET_GOON) {
          this.playerSlowTimer = 2.5
        }
      }
    }

    // Projectile updates + hit detection
    const { hits } = this.projectileManager.update(dt, this.waveSpawner.enemies)
    for (const { enemy, damage } of hits) {
      const wasAlive = enemy.isAlive
      enemy.takeDamage(damage)
      this.player.currentWeapon.onHit()
      this.audio.play('enemy_hit', 0.6)
      if (wasAlive && !enemy.isAlive && !this.enemiesKilledSet.has(enemy)) {
        this.enemiesKilledSet.add(enemy)
        this.onEnemyKilled(enemy)
      }
    }

    // Banana pickup
    const collected = this.bananaManager.update(dt, this.player.position)
    if (collected > 0) {
      this.audio.play('banana_pickup', 0.7)
      this.player.totalBananasCollected += collected
    }

    // Arena
    this.arena.update(dt)

    // HUD
    this.hud.update(this.player, this.bananaManager, this.waveSpawner, this.waveNumber)

    // Check game over
    if (!this.player.isAlive) {
      this.sm.transition(GameState.GAME_OVER)
    }
  }

  private onEnemyKilled(enemy: Enemy): void {
    this.killCount++
    const bananas = enemy.getBananaDropAmount()
    this.bananaManager.drop(enemy.position, bananas)
    this.audio.play(
      enemy.type === EnemyType.DIRECTOR_POUNCE
        ? 'enemy_die_boss'
        : enemy.type === EnemyType.CAGE_ROLLER
          ? 'enemy_die_roller'
          : 'enemy_die_small',
      0.8
    )
  }

  private doMegaphoneBlast(pos: Vector3): void {
    const dist = this.player.position.distanceTo(pos)
    if (dist < 12) {
      this.player.takeDamage(20)
      this.playerSlowTimer = 1.5
    }
  }

  private getEnemyAttackRange(enemy: Enemy): number {
    switch (enemy.type) {
      case EnemyType.NET_GOON: return 3.5
      case EnemyType.CAGE_ROLLER: return 3.0
      case EnemyType.DIRECTOR_POUNCE: return 3.5
    }
  }

  private getEnemyAttackDamage(enemy: Enemy): number {
    switch (enemy.type) {
      case EnemyType.NET_GOON: return 10
      case EnemyType.CAGE_ROLLER: return 25
      case EnemyType.DIRECTOR_POUNCE: return 20
    }
  }

  private getEnemyAttackCooldown(enemy: Enemy): number {
    switch (enemy.type) {
      case EnemyType.NET_GOON: return 2.0
      case EnemyType.CAGE_ROLLER: return 1.5
      case EnemyType.DIRECTOR_POUNCE: return 1.8
    }
  }

  private playSoundForWeapon(id: WeaponId): void {
    switch (id) {
      case WeaponId.NANNER_POP: this.audio.play('shoot_pistol', 0.6); break
      case WeaponId.BANANA_BLASTER: this.audio.play('shoot_pistol', 0.7); break
      case WeaponId.PEEL_SPREADER: this.audio.play('shoot_shotgun', 0.8); break
      case WeaponId.TROPICANNON: this.audio.play('shoot_burst', 0.7); break
      case WeaponId.SPLITPEEL_SMG: this.audio.play('shoot_smg', 0.4); break
      case WeaponId.CAVENDISH_RIFLE: this.audio.play('shoot_sniper', 0.8); break
      case WeaponId.BUNCH_LAUNCHER: this.audio.play('shoot_grenade', 0.8); break
      case WeaponId.PLANTAIN_OBLITERATOR: this.audio.play('shoot_plasma', 0.9); break
    }
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  start(): void {
    this.loop(0)
    this.preloadAssets()
  }

  private async preloadAssets(): Promise<void> {
    const bar  = document.getElementById('loading-bar') as HTMLElement
    const text = document.getElementById('loading-text') as HTMLElement
    const loadingScreen = document.getElementById('screen-loading') as HTMLElement

    let loaded = 0
    const total = ALL_MODELS.length

    // Load models one by one so we can show progress
    for (const path of ALL_MODELS) {
      try {
        await modelLoader.preload([path])
      } catch (e) {
        console.warn(`Could not load model: ${path}`, e)
      }
      loaded++
      const pct = Math.round((loaded / total) * 100)
      if (bar)  bar.style.width  = `${pct}%`
      if (text) text.textContent = `Loading assets… ${pct}%`
    }

    // Hide loading screen and start
    loadingScreen?.classList.add('hidden')
    this.sm.transition(GameState.MAIN_MENU)
  }

  private lastTime = 0
  private loop = (timestamp: number): void => {
    requestAnimationFrame(this.loop)
    const dt = Math.min((timestamp - this.lastTime) / 1000, DT_CAP)
    this.lastTime = timestamp

    this.sm.update(dt)

    // Dual-pass render: world + viewmodel overlay
    this.renderer.clear()
    this.renderer.render(this.scene, this.camera)

    if (this.viewmodel && this.sm.is(GameState.WAVE_ACTIVE)) {
      this.viewmodel.update(this.camera)
      this.renderer.clearDepth()
      this.renderer.render(this.viewmodel.scene, this.camera)
    }
  }
}
