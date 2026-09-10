/**
 * Generate 1 landing image via AI, upload to Supabase Storage.
 * Usage: bun run src/scripts/gen-one-image.ts <name>
 * Example: bun run src/scripts/gen-one-image.ts landing-hero
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

const imageSpecs: Record<string, { prompt: string; size: string }> = {
  'landing-hero': {
    prompt: 'Professional automotive workshop scene in Jakarta, mechanic installing soundproofing butyl material on car door, warm cinematic lighting, premium, photorealistic, no text',
    size: '1024x576',
  },
  'landing-about': {
    prompt: 'Modern car audio workshop interior with cars being serviced, professional equipment, warm lighting, Jakarta, photorealistic, no text',
    size: '1024x768',
  },
  'paket-gran-turismo-1-8mm': {
    prompt: 'Product photo car soundproofing butyl material roll, black rubber with aluminum foil, studio lighting, no text',
    size: '1024x768',
  },
  'paket-gran-turismo-2mm': {
    prompt: 'Product photo thick automotive sound deadener butyl sheet silver aluminum, studio lighting, no text',
    size: '1024x768',
  },
  'paket-infinity': {
    prompt: 'Product photo premium car soundproofing black butyl rubber sheet, studio product shot, no text',
    size: '1024x768',
  },
  'paket-rainbow-2mm': {
    prompt: 'Product photo car audio damping black butyl rubber roll aluminum foil, studio lighting, no text',
    size: '1024x768',
  },
  'paket-rainbow-3-5mm': {
    prompt: 'Product photo thick automotive sound deadening black butyl silver backing, studio shot, no text',
    size: '1024x768',
  },
  'paket-rainbow-4mm': {
    prompt: 'Product photo premium thick car soundproofing black butyl aluminum foil, studio lighting, no text',
    size: '1024x768',
  },
  'paket-silent-coat-2mm': {
    prompt: 'Product photo European car sound deadener black butyl sheet, premium product photography, no text',
    size: '1024x768',
  },
}

async function main() {
  const name = process.argv[2]
  if (!name || !imageSpecs[name]) {
    console.error('Usage: bun run src/scripts/gen-one-image.ts <name>')
    console.error('Available:', Object.keys(imageSpecs).join(', '))
    process.exit(1)
  }

  const spec = imageSpecs[name]
  console.log(`Generating ${name}...`)
  
  const zai = await ZAI.create()
  const result = await zai.images.generations.create({
    prompt: spec.prompt,
    size: spec.size,
  })
  
  if (!result.data || result.data.length === 0) {
    console.error('No image data returned')
    process.exit(1)
  }
  
  const base64 = result.data[0].base64
  if (!base64) {
    console.error('No base64 in response')
    process.exit(1)
  }
  
  const buf = Buffer.from(base64, 'base64')
  console.log(`Image generated: ${buf.length} bytes`)
  
  const filename = `landing/${name}.webp`
  const { error } = await supabase.storage.from(BUCKET).upload(filename, buf, {
    contentType: 'image/webp',
    cacheControl: 'public,max-age=31536000,immutable',
    upsert: true,
  })
  
  if (error) {
    console.error('Upload failed:', error.message)
    process.exit(1)
  }
  
  const publicUrl = `${env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`
  console.log('SUCCESS:', publicUrl)
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
