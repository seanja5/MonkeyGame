import { Group, AnimationClip } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js'
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js'

class ModelLoader {
  private loader = new GLTFLoader()
  private cache = new Map<string, GLTF>()

  async preload(paths: string[]): Promise<void> {
    await Promise.all(paths.map((p) => this.loadOne(p)))
  }

  private loadOne(path: string): Promise<void> {
    if (this.cache.has(path)) return Promise.resolve()
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => { this.cache.set(path, gltf); resolve() },
        undefined,
        (err) => reject(new Error(`Failed to load model: ${path} — ${err}`))
      )
    })
  }

  clone(path: string): { scene: Group; animations: AnimationClip[] } {
    const gltf = this.cache.get(path)
    if (!gltf) throw new Error(`Model not preloaded: ${path}`)
    // SkeletonUtils.clone properly rebinds skinned mesh bones
    const scene = skeletonClone(gltf.scene) as Group
    return { scene, animations: gltf.animations }
  }
}

export const modelLoader = new ModelLoader()
