import { createClient } from '@supabase/supabase-js'
import ZAI from 'z-ai-web-dev-sdk'
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

async function searchAndUpload(query: string, filename: string): Promise<string | null> {
  try {
    console.log(`  Searching: ${query.substring(0, 50)}...`)
    const zai = await ZAI.create()
    const results = await zai.images.search(query, 1)
    if (!results || results.length === 0) {
      console.log(`    ⚠ No results`)
      return null
    }
    const imageUrl = results[0].url
    console.log(`    → Found: ${imageUrl.substring(0, 80)}`)
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    const { error } = await supabase.storage.from(BUCKET).upload(filename, buf, {
      contentType: 'image/webp',
      cacheControl: 'public,max-age=31536000,immutable',
      upsert: true,
    })
    if (error) throw new Error(`Upload ${filename}: ${error.message}`)
    const publicUrl = `${env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`
    console.log(`    ✓ Uploaded: ${publicUrl.substring(0, 80)}`)
    return publicUrl
  } catch (err) {
    console.error(`    ❌ ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

async function main() {
  console.log('🚀 Generating landing page images...')
  const images = [
    { name: 'landing-hero.webp', query: 'car soundproofing workshop jakarta mechanic installing door panel' },
    { name: 'landing-about.webp', query: 'car audio workshop interior modern professional jakarta' },
    { name: 'paket-gran-turismo-1-8mm.webp', query: 'car soundproofing butyl material sheet roll' },
    { name: 'paket-gran-turismo-2mm.webp', query: 'automotive sound deadener butyl aluminum foil roll' },
    { name: 'paket-infinity.webp', query: 'car soundproofing material premium black butyl' },
    { name: 'paket-rainbow-2mm.webp', query: 'car audio damping material black roll 2mm' },
    { name: 'paket-rainbow-3-5mm.webp', query: 'automotive sound deadening material thick butyl rubber' },
    { name: 'paket-rainbow-4mm.webp', query: 'car soundproofing material thick premium butyl' },
    { name: 'paket-silent-coat-2mm.webp', query: 'car sound deadener silent coat material black' },
  ]
  const results: Record<string, string | null> = {}
  for (const img of images) {
    console.log(`\n[${images.indexOf(img) + 1}/${images.length}] ${img.name}`)
    const url = await searchAndUpload(img.query, img.name)
    results[img.name] = url
    await new Promise(r => setTimeout(r, 2000))
  }
  console.log('\n=== Final URLs ===')
  for (const [name, url] of Object.entries(results)) {
    console.log(`${name}: ${url || 'FAILED'}`)
  }
  fs.writeFileSync('/home/z/my-project/src/scripts/landing-image-urls.json', JSON.stringify(results, null, 2))
  console.log('\n✅ URLs saved to src/scripts/landing-image-urls.json')
}
main().catch(e => { console.error('Fatal:', e); process.exit(1) })
