// Procedural Web Audio API sound engine — no external audio files needed

type SoundKey =
  | 'shoot_pistol' | 'shoot_shotgun' | 'shoot_burst' | 'shoot_smg'
  | 'shoot_sniper' | 'shoot_grenade' | 'shoot_plasma' | 'shoot_plasma_charge'
  | 'enemy_hit' | 'enemy_die_small' | 'enemy_die_roller' | 'enemy_die_boss'
  | 'player_damage' | 'player_die'
  | 'banana_pickup' | 'wave_start' | 'wave_clear' | 'boss_warning'
  | 'shop_buy' | 'shop_deny' | 'upgrade_buy'
  | 'ability_use' | 'jump'

export class AudioManager {
  private ctx: AudioContext | null = null
  private masterGain!: GainNode
  private musicGain!: GainNode
  private sfxGain!: GainNode
  private ambientSource: OscillatorNode | null = null
  private musicNodes: AudioNode[] = []
  private enabled = true

  init(): void {
    try {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.7
      this.masterGain.connect(this.ctx.destination)

      this.musicGain = this.ctx.createGain()
      this.musicGain.gain.value = 0.3
      this.musicGain.connect(this.masterGain)

      this.sfxGain = this.ctx.createGain()
      this.sfxGain.gain.value = 0.8
      this.sfxGain.connect(this.masterGain)
    } catch {
      this.enabled = false
    }
  }

  resume(): void {
    this.ctx?.resume()
  }

  private get ac(): AudioContext {
    return this.ctx!
  }

  private playBuffer(buffer: AudioBuffer, gain = 1.0, destination?: AudioNode): AudioBufferSourceNode | null {
    if (!this.enabled || !this.ctx) return null
    const src = this.ac.createBufferSource()
    src.buffer = buffer
    const g = this.ac.createGain()
    g.gain.value = gain
    src.connect(g)
    g.connect(destination ?? this.sfxGain)
    src.start()
    return src
  }

  play(key: SoundKey, volume = 1.0): void {
    if (!this.enabled || !this.ctx) return
    const buf = this.generateSound(key)
    if (buf) this.playBuffer(buf, volume)
  }

  private generateSound(key: SoundKey): AudioBuffer | null {
    if (!this.ctx) return null
    const sr = this.ac.sampleRate

    switch (key) {
      case 'shoot_pistol': return this.makePop(sr, 0.2, 400, 30)
      case 'shoot_shotgun': return this.makeShotgun(sr)
      case 'shoot_burst': return this.makePop(sr, 0.15, 600, 25)
      case 'shoot_smg': return this.makePop(sr, 0.08, 550, 40)
      case 'shoot_sniper': return this.makeSniper(sr)
      case 'shoot_grenade': return this.makeGrenadeLaunch(sr)
      case 'shoot_plasma': return this.makePlasmaBoom(sr)
      case 'enemy_hit': return this.makeHit(sr)
      case 'enemy_die_small': return this.makeDieSmall(sr)
      case 'enemy_die_roller': return this.makeDieRoller(sr)
      case 'enemy_die_boss': return this.makeDieBoss(sr)
      case 'player_damage': return this.makePlayerHurt(sr)
      case 'player_die': return this.makePlayerDie(sr)
      case 'banana_pickup': return this.makeBananaPickup(sr)
      case 'wave_start': return this.makeWaveStart(sr)
      case 'wave_clear': return this.makeWaveClear(sr)
      case 'boss_warning': return this.makeBossWarning(sr)
      case 'shop_buy': return this.makeShopBuy(sr)
      case 'shop_deny': return this.makeShopDeny(sr)
      case 'upgrade_buy': return this.makeUpgradeBuy(sr)
      case 'ability_use': return this.makeAbility(sr)
      case 'jump': return this.makeJump(sr)
      default: return null
    }
  }

  private makePop(sr: number, dur: number, freq: number, decay: number): AudioBuffer {
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const env = Math.exp(-t * decay)
      d[i] = env * Math.sin(2 * Math.PI * freq * t) * 0.6
      d[i] += env * 0.3 * (Math.random() * 2 - 1) * Math.exp(-t * 60)
    }
    return buf
  }

  private makeShotgun(sr: number): AudioBuffer {
    const dur = 0.35
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const env = Math.exp(-t * 15)
      // low thump
      d[i] = env * Math.sin(2 * Math.PI * 150 * t) * 0.7
      // noise burst
      d[i] += env * 0.5 * (Math.random() * 2 - 1)
      // higher harmonics
      d[i] += env * 0.3 * Math.sin(2 * Math.PI * 400 * t)
    }
    return buf
  }

  private makeSniper(sr: number): AudioBuffer {
    const dur = 0.6
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const env = Math.exp(-t * 8)
      const freqSweep = 300 - t * 200
      d[i] = env * Math.sin(2 * Math.PI * freqSweep * t) * 0.8
      d[i] += Math.exp(-t * 30) * 0.4 * (Math.random() * 2 - 1)
    }
    return buf
  }

  private makeGrenadeLaunch(sr: number): AudioBuffer {
    const dur = 0.5
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      // boing
      const boingFreq = 200 + t * 300
      const env = Math.exp(-t * 10)
      d[i] = env * Math.sin(2 * Math.PI * boingFreq * t) * 0.6
    }
    return buf
  }

  private makePlasmaBoom(sr: number): AudioBuffer {
    const dur = 0.7
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const env = Math.exp(-t * 8)
      d[i] = env * Math.sin(2 * Math.PI * 80 * t) * 0.9
      d[i] += env * 0.5 * Math.sin(2 * Math.PI * 160 * t)
      d[i] += Math.exp(-t * 20) * 0.4 * (Math.random() * 2 - 1)
    }
    return buf
  }

  private makeHit(sr: number): AudioBuffer {
    const dur = 0.1
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      d[i] = Math.exp(-t * 50) * 0.6 * (Math.random() * 2 - 1)
    }
    return buf
  }

  private makeDieSmall(sr: number): AudioBuffer {
    const dur = 0.6
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const freq = 800 - t * 600
      d[i] = Math.exp(-t * 6) * Math.sin(2 * Math.PI * freq * t) * 0.5
    }
    return buf
  }

  private makeDieRoller(sr: number): AudioBuffer {
    const dur = 1.2
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      d[i] = Math.exp(-t * 4) * 0.5 * (Math.random() * 2 - 1)
      const clanks = [0.1, 0.2, 0.35, 0.5, 0.7]
      for (const c of clanks) {
        if (Math.abs(t - c) < 0.015) d[i] += 0.6 * (Math.random() * 2 - 1)
      }
    }
    return buf
  }

  private makeDieBoss(sr: number): AudioBuffer {
    const dur = 2.0
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const freq = 600 - t * 400
      d[i] = Math.exp(-t * 3) * Math.sin(2 * Math.PI * freq * t) * 0.6
      d[i] += Math.exp(-t * 5) * 0.2 * (Math.random() * 2 - 1)
    }
    return buf
  }

  private makePlayerHurt(sr: number): AudioBuffer {
    const dur = 0.25
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const freq = 500 - t * 300
      d[i] = Math.exp(-t * 18) * Math.sin(2 * Math.PI * freq * t) * 0.7
    }
    return buf
  }

  private makePlayerDie(sr: number): AudioBuffer {
    const dur = 1.5
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      // ascending then descending "waaah"
      let freq: number
      if (t < 0.3) freq = 300 + t * 600
      else freq = 480 - (t - 0.3) * 320
      d[i] = Math.exp(-t * 2) * Math.sin(2 * Math.PI * freq * t) * 0.7
    }
    return buf
  }

  private makeBananaPickup(sr: number): AudioBuffer {
    const dur = 0.2
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const freq = 800 + t * 400
      d[i] = Math.exp(-t * 20) * Math.sin(2 * Math.PI * freq * t) * 0.5
    }
    return buf
  }

  private makeWaveStart(sr: number): AudioBuffer {
    const dur = 1.5
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    const notes = [261, 329, 392, 523]
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const noteIdx = Math.min(Math.floor(t / 0.3), notes.length - 1)
      const freq = notes[noteIdx]
      const env = Math.exp(-((t % 0.3) * 12))
      d[i] = env * Math.sin(2 * Math.PI * freq * t) * 0.6
    }
    return buf
  }

  private makeWaveClear(sr: number): AudioBuffer {
    const dur = 1.5
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    const notes = [392, 494, 587, 784]
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const noteIdx = Math.min(Math.floor(t / 0.3), notes.length - 1)
      const freq = notes[noteIdx]
      const env = Math.exp(-((t % 0.3) * 10))
      d[i] = env * Math.sin(2 * Math.PI * freq * t) * 0.6
    }
    return buf
  }

  private makeBossWarning(sr: number): AudioBuffer {
    const dur = 2.0
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const freq = 80 + Math.sin(t * 6) * 30
      d[i] = Math.exp(-t * 1.5) * Math.sin(2 * Math.PI * freq * t) * 0.8
      d[i] += 0.2 * (Math.random() * 2 - 1) * Math.exp(-t * 3)
    }
    return buf
  }

  private makeShopBuy(sr: number): AudioBuffer {
    const dur = 0.4
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const freq = t < 0.2 ? 600 : 900
      d[i] = Math.exp(-t * 15) * Math.sin(2 * Math.PI * freq * t) * 0.5
    }
    return buf
  }

  private makeShopDeny(sr: number): AudioBuffer {
    const dur = 0.3
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const freq = 200 - t * 80
      d[i] = Math.exp(-t * 12) * Math.sin(2 * Math.PI * freq * t) * 0.6
    }
    return buf
  }

  private makeUpgradeBuy(sr: number): AudioBuffer {
    const dur = 0.6
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    const notes = [523, 659, 784, 1047]
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const noteIdx = Math.min(Math.floor(t / 0.15), notes.length - 1)
      d[i] = Math.exp(-((t % 0.15) * 20)) * Math.sin(2 * Math.PI * notes[noteIdx] * t) * 0.5
    }
    return buf
  }

  private makeAbility(sr: number): AudioBuffer {
    const dur = 0.4
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const freq = 300 + t * 700
      d[i] = Math.exp(-t * 8) * Math.sin(2 * Math.PI * freq * t) * 0.7
    }
    return buf
  }

  private makeJump(sr: number): AudioBuffer {
    const dur = 0.25
    const buf = this.ac.createBuffer(1, sr * dur, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const freq = 200 + t * 600
      d[i] = Math.exp(-t * 15) * Math.sin(2 * Math.PI * freq * t) * 0.5
    }
    return buf
  }

  startJungleAmbient(): void {
    if (!this.enabled || !this.ctx) return
    // Simple ambient: layered low oscillators
    this.stopAmbient()
    const osc = this.ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 60
    const filter = this.ac.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 300
    const g = this.ac.createGain()
    g.gain.value = 0.08
    osc.connect(filter)
    filter.connect(g)
    g.connect(this.musicGain)
    osc.start()
    this.ambientSource = osc
    this.musicNodes = [osc, filter, g]
  }

  stopAmbient(): void {
    try {
      this.ambientSource?.stop()
    } catch {/* already stopped */}
    this.ambientSource = null
  }

  stopAll(): void {
    this.stopAmbient()
    this.musicNodes.forEach((n) => {
      try { (n as OscillatorNode).stop?.() } catch {/* */}
    })
    this.musicNodes = []
  }
}
