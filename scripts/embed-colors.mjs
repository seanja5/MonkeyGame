/**
 * Patches character GLBs to replace missing external texture URIs with
 * embedded solid baseColorFactor colors, so they render correctly without
 * any external PNG files.
 */
import fs from 'fs'

const CHARS_DIR = 'public/models/characters'

const MODELS = [
  // player orc — warm tan
  { file: 'character-orc.glb', color: [0.76, 0.60, 0.42, 1.0] },
  // NetGoon (character-j) — olive green
  { file: 'character-j.glb',   color: [0.30, 0.55, 0.25, 1.0] },
  // CageRoller (character-h) — slate gray
  { file: 'character-h.glb',   color: [0.45, 0.45, 0.50, 1.0] },
  // DirectorPounce (character-p) — deep purple
  { file: 'character-p.glb',   color: [0.42, 0.10, 0.55, 1.0] },
]

for (const { file, color } of MODELS) {
  const filePath = `${CHARS_DIR}/${file}`
  const buf = fs.readFileSync(filePath)

  // ── Parse GLB header ──────────────────────────────────────────────
  // Bytes 0-3:  magic 'glTF'
  // Bytes 4-7:  version (2)
  // Bytes 8-11: total file length
  const chunk0Len  = buf.readUInt32LE(12)   // JSON chunk byte length
  // chunk0Type at bytes 16-19 (0x4E4F534A = 'JSON')

  // ── Read + patch JSON ─────────────────────────────────────────────
  const jsonStr = buf.slice(20, 20 + chunk0Len).toString('utf8')
  const gltf    = JSON.parse(jsonStr)

  // Replace external texture reference with a solid baseColorFactor
  for (const mat of gltf.materials ?? []) {
    if (mat.pbrMetallicRoughness) {
      mat.pbrMetallicRoughness.baseColorFactor = color
      delete mat.pbrMetallicRoughness.baseColorTexture
    }
    // Remove texture transform extension too (no texture to transform)
    if (mat.extensions) {
      delete mat.extensions.KHR_texture_transform
      if (Object.keys(mat.extensions).length === 0) delete mat.extensions
    }
  }

  // Drop unused texture/image/sampler entries from the JSON
  // (safe because the external PNGs were never in the BIN chunk anyway)
  delete gltf.textures
  delete gltf.images
  delete gltf.samplers

  // Remove KHR_texture_transform from extensionsUsed / extensionsRequired
  if (gltf.extensionsUsed) {
    gltf.extensionsUsed = gltf.extensionsUsed.filter(e => e !== 'KHR_texture_transform')
    if (gltf.extensionsUsed.length === 0) delete gltf.extensionsUsed
  }
  if (gltf.extensionsRequired) {
    gltf.extensionsRequired = gltf.extensionsRequired.filter(e => e !== 'KHR_texture_transform')
    if (gltf.extensionsRequired.length === 0) delete gltf.extensionsRequired
  }

  // ── Re-pack GLB ───────────────────────────────────────────────────
  // JSON chunk must be 4-byte aligned (pad with spaces)
  let newJsonStr = JSON.stringify(gltf)
  while (newJsonStr.length % 4 !== 0) newJsonStr += ' '
  const newJsonBuf = Buffer.from(newJsonStr, 'utf8')

  // BIN chunk starts right after the old JSON chunk (offset 20 + chunk0Len)
  const binChunk = buf.slice(20 + chunk0Len)

  const newTotal = 12 + 8 + newJsonBuf.length + binChunk.length
  const out = Buffer.alloc(newTotal)
  let off = 0

  out.writeUInt32LE(0x46546C67, off); off += 4  // 'glTF'
  out.writeUInt32LE(2,           off); off += 4  // version
  out.writeUInt32LE(newTotal,    off); off += 4  // total length

  out.writeUInt32LE(newJsonBuf.length, off); off += 4  // JSON chunk length
  out.writeUInt32LE(0x4E4F534A,        off); off += 4  // 'JSON'
  newJsonBuf.copy(out, off);                   off += newJsonBuf.length

  binChunk.copy(out, off)

  fs.writeFileSync(filePath, out)
  console.log(`✓ ${file}  →  color [${color.map(v => v.toFixed(2)).join(', ')}]`)
}

console.log('\nDone. Re-commit public/models/characters/ and redeploy.')
