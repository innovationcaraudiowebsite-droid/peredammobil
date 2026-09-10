/**
 * Generate gambar AI untuk landing page (hero + about + 7 paket produk),
 * upload ke Supabase Storage bucket 'site-assets', return URLs.
 *
 * Setelah selesai, update komponen hero.tsx & packages.tsx untuk pakai URL baru.
 *
 * Cara pakai: bun run src/scripts/gen-landing-images.ts
 */

import ZAI from 'z-ai-web-dev-sdk'
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const envText = fs.readFileSync('/home/z/my-project/.env', 'utf-8')
const env: Record<string, string> = {}
envText.split('\n').forEach(line => {
  const m = /^([A-Z_][A-Z0-9_]*)\s*=\s*"?(.+?)"?\s*$/.exec(line.trim())
  if (m && !line.startsWith('#')) env[m[1]] = m[2].split(/\s+#/)[0]
})

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
})
const BUCKET = 'site-assets'

interface ImageSpec {
  name: string
  prompt: string
  size: string
}

const images: ImageSpec[] = [
  {
    name: 'landing-hero.webp',
    prompt: 'Professional automotive workshop scene in Jakarta, a mechanic in uniform installing soundproofing butyl material on a car door panel, modern workshop with tools and equipment, warm cinematic lighting, premium feel, depth of field, 16:9 aspect ratio, no text, no watermark, photorealistic',
    size: '1024x576',
  },
  {
    name: 'landing-about.webp',
    prompt: 'Modern car audio workshop interior with multiple cars being serviced, professional equipment, organized tools on wall, clean environment, warm lighting, Jakarta automotive workshop, photorealistic, no text, no watermark',
    size: '1024x768',
  },
  {
    name: 'paket-gran-turismo-1-8mm.webp',
    prompt: 'Product photo of car soundproofing butyl material roll, black butyl rubber with aluminum foil backing, professional automotive material, studio lighting on white background, premium product photography, no text, no watermark',
    size: '1024x768',
  },
  {
    name: 'paket-gran-turismo-2mm.webp',
    prompt: 'Product photo of thick automotive sound deadener butyl sheet with silver aluminum finish, rolled material for car soundproofing, professional studio lighting, clean background, no text, no watermark',
    size: '1024x768',
  },
  {
    name: 'paket-infinity.webp',
    prompt: 'Product photo of premium car soundproofing material, black butyl rubber sheet with texture, automotive damping material, studio product shot, no text, no watermark',
    size: '1024x768',
  },
  {
    name: 'paket-rainbow-2mm.webp',
    prompt: 'Product photo of car audio damping material, black butyl rubber roll with aluminum foil, 2mm thickness, automotive sound deadener, professional lighting, no text, no watermark',
    size: '1024x768',
  },
  {
    name: 'paket-rainbow-3-5mm.webp',
    prompt: 'Product photo of thick automotive sound deadening material, black butyl rubber with silver backing, 3.5mm thickness, premium car soundproofing, studio shot, no text, no watermark',
    size: '1024x768',
  },
  {
    name: 'paket-rainbow-4mm.webp',
    prompt: 'Product photo of premium thick car soundproofing material, black butyl rubber sheet with aluminum foil, 4mm thickness, high-end automotive damping, studio lighting, no text, no watermark',
    size: '1024x768',
  },
  {
    name: 'paket-silent-coat-2mm.webp',
    prompt: 'Product photo of European car sound deadener material, black butyl sheet with smooth finish, 2mm thickness, premium silent coat brand, professional product photography, no text, no watermark',
    size: '1024x768',
  },
]

async function generateAndUpload(spec: ImageSpec): Promise<string | null> {
  try {
    console.log(`  Generating: ${spec.name} (${spec.size})`)
    console.log(`  Prompt: ${spec.prompt.substring(0, 80)}...`)
    const zai = await ZAI.create()
    const result = await zai.images.generations.create({
      prompt: spec.prompt,
      size: spec.size,
    })
    if (!result.data || result.data.length === 0) {
      console.log(`    ⚠ No image data returned`)
      return null
    }
    const base64 = result.data[0].base64
    if (!base64) {
      console.log(`    ⚠ No base64 in response`)
      return null
    }
    const buf = Buffer.from(base64, 'base64')
    console.log(`    → Image generated: ${buf.length} bytes`)
    
    // Upload to Supabase Storage
    const filename = `landing/${spec.name}`
    const { error } = await supabase.storage.from(BUCKET).upload(filename, buf, {
      contentType: 'image/webp',
      cacheControl: 'public,max-age=31536000,immutable',
      upsert: true,
    })
    if (error) {
      console.error(`    ❌ Upload failed: ${error.message}`)
      return null
    }
    const publicUrl = `${env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`
    console.log(`    ✓ Uploaded: ${publicUrl.substring(0, 80)}`)
    return publicUrl
  } catch (err) {
    console.error(`    ❌ ${err instanceof Error ? err.message.substring(0, 150) : String(err)}`)
    return null
  }
}

async function main() {
  console.log('🚀 Generating landing page images via AI...')
  console.log(`   Total: ${images.length} images`)
  console.log('')
  
  const results: Record<string, string | null> = {}
  for (let i = 0; i < images.length; i++) {
    const spec = images[i]
    console.log(`\n[${i + 1}/${images.length}] ${spec.name}`)
    const url = await generateAndUpload(spec)
    results[spec.name] = url
    // Sleep to avoid rate limit
    if (i < images.length - 1) {
      console.log('    (sleeping 3s to avoid rate limit)')
      await new Promise(r => setTimeout(r, 3000))
    }
  }
  
  console.log('')
  console.log('=== Final URLs ===')
  for (const [name, url] of Object.entries(results)) {
    console.log(`${name}: ${url || 'FAILED'}`)
  }
  
  // Save URLs
  fs.writeFileSync(
    '/home/z/my-project/src/scripts/landing-image-urls.json',
    JSON.stringify(results, null, 2),
  )
  console.log('\n✅ URLs saved to src/scripts/landing-image-urls.json')
  console.log('   Update komponen hero.tsx & packages.tsx untuk pakai URL ini.')
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
