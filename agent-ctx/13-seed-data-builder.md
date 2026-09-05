# Task 13 — Seed Data Builder

Subagent untuk Task ID 13: Seed database dengan 20 artikel scrape + 10 artikel AI-generate.

## Ringkasan

Melakukan end-to-end seeding Prisma database portal "Peredam Mobil Jakarta":

1. **Scrape 20 artikel** asli dari `https://peredammobiljakarta.com/` lewat
   `z-ai function -n page_reader` (ZAI SDK page_reader function).
2. **Parse** hasil scrape menjadi normalized JSON (title, slug, category, excerpt,
   contentHtml, tags, viewCount, readingTime, publishedAt, featuredImageUrl, metaDescription,
   metaKeywords).
3. **Generate 10 artikel baru** via ZAI LLM (`glm-4.6`) dengan system prompt ketat
   (5 sub-bab H2 + intro + kesimpulan, 400-600 kata, HTML murni tanpa `<h1>/<img>/<a>`).
4. **Ekstrak 10 FAQ** asli dari homepage (section `id="faq"`, format `<details>`).
5. **Seed Prisma DB** dengan: 4 kategori, SiteSetting singleton, 17 tags, 30 articles
   (status PUBLISHED, top-3 scraped by views = featured), 10 FAQ.

## File yang Dibuat / Dimodifikasi

### Baru
- `seed/scrape.ts` — tidak dibuat; scraping dilakukan langsung lewat CLI
  `z-ai function -n page_reader -a '{"url":"..."}' -o /tmp/perdam_articles/article_N.json`
  dengan bash script sequential + retry (lihat `/tmp/perdam_articles/scraper.sh`,
  tidak committed ke repo). Hasil: 20 file JSON halaman lengkap di
  `/tmp/perdam_articles/article_{1..20}.json` (33-37KB per file).
- `seed/parse-scraped.ts` — parse 20 JSON hasil page_reader menjadi normalized
  artikel JSON. Output ke `seed/data/scraped_{1..20}.json`. Ekstrak:
  - Title dari JSON-LD `NewsArticle.headline` (fallback `data.title`)
  - Slug dari URL pathname segmen ke-3
  - Category dari URL pathname segmen ke-2 (`peredam-mobil`, `upgrade-audio`,
    `review-workshop`, `tips-biaya`)
  - Excerpt = meta description (`data.description`, 1-2 kalimat, max 280 char)
  - ContentHtml = HTML body antara `class="article-content">` dan
    `<div class="article-tags"` atau `<div class="share-row"`
  - Tags dari `<div class="article-tags">` (regex `#([A-Za-z0-9][A-Za-z0-9\s\-+]*?)</a>`)
  - ViewCount dari regex `(\d[\d.]*)\s*kali dibaca` (contoh: `206 kali dibaca`)
  - ReadingTime dari `(\d+)\s*menit baca`, fallback `Math.ceil(words/200)`
  - WordCount dari stripped HTML text
  - PublishedAt dari JSON-LD `datePublished` (contoh: `2026-08-04T22:00:00+07:00`)
  - FeaturedImageUrl dari JSON-LD `image.url`
  - AuthorName dari JSON-LD `author.name` (semua: "Innovation Car Audio")
  - MetaDescription = `data.description`
  - MetaKeywords dari `<meta name="keywords" content="...">`
- `seed/generate.ts` — generate 10 artikel baru via ZAI LLM `glm-4.6`. Output ke
  `seed/data/generated_{1..10}.json`. Setiap artikel memakai system prompt
  strict yang minta format JSON `{title, excerpt, contentHtml, tags}` dengan
  aturan:
  - Title 50-90 char
  - Excerpt 120-200 char (1-2 kalimat)
  - ContentHtml 400-600 kata: 1 paragraf intro + 5 sub-bab `<h2>` masing-masing
    1-2 paragraf + 1 paragraf kesimpulan
  - Tags: array 2-3 string slug-format
  - Forbidden: `<h1>`, `<img>`, `<script>`, `<style>`, `<iframe>`, `<a>`, Markdown
  - Validation: wordCount >= 280, tags array (atau comma-string yang diparse),
    tidak ada forbidden tags. Retry 3x dengan delay 3-5s.
  - Untuk artikel AI: publishedAt = `new Date().toISOString()` (sekarang),
    viewCount = random 150-2800 (biased toward lower via `Math.pow(rand, 1.6)`),
    featuredImageUrl = null (tidak ada gambar AI-generated).
- `seed/seed.ts` — populate Prisma DB:
  - **Categories**: upsert 4 kategori (Peredam Mobil/amber, Upgrade Audio/red,
    Review Workshop/slate, Tips & Biaya/emerald) dengan deskripsi.
  - **SiteSetting**: upsert singleton `id="global"` dengan data asli dari
    footer website (alamat, email, copyright, tagline, logoUrl, faviconUrl).
  - **Tags**: kumpulkan unique tag dari semua 30 artikel, upsert by slug.
  - **Articles**: 30 artikel (20 scraped + 10 generated). Untuk setiap artikel:
    - findUnique by slug, jika ada → update (termasuk `tags: { set: [], connect: [...] }`
      untuk replace relasi), jika tidak ada → create.
    - status = PUBLISHED, isFeatured = true jika slug ada di top-3 scraped by viewCount.
    - isBreaking = false (tidak ada breaking news ticker di seed awal).
    - metaTitle = title.slice(0, 70), metaDescription = (metaDescription || excerpt).slice(0, 200).
    - shareCount = `Math.floor(viewCount * 0.04)` (4% share rate).
    - contentMarkdown dibangun dari contentHtml (konversi minimal: h1→#, h2→##,
      h3→###, p→\n\n, strong→**, em→*, ul→- li, ol→1. li, strip sisa tag).
    - publishedAt = `new Date(a.publishedAt)` untuk scraped, `new Date()` untuk AI.
- `seed/data/scraped_{1..20}.json` — 20 normalized artikel hasil scrape.
- `seed/data/generated_{1..10}.json` — 10 normalized artikel hasil AI generate.
- `seed/data/faq.json` — 10 FAQ entries dari homepage (question + answer).

### Dimodifikasi
- `package.json` — tambah 3 script: `"seed": "bun run seed/seed.ts"`,
  `"scrape": "bun run seed/parse-scraped.ts"`,
  `"generate": "bun run seed/generate.ts"`.

## Statistik Database Setelah Seed

| Metric | Value |
|---|---|
| Total Articles | 30 |
| Published Articles | 30 |
| Draft / Archived | 0 / 0 |
| Featured Articles | 3 (scraped top-3 by viewCount) |
| Categories | 4 |
| Tags | 17 |
| FAQs | 10 |
| Subscribers | 0 (Task 9 yang akan handle) |
| Comments | 0 (Task 10 yang akan handle) |
| Total viewCount (sum) | 19.082 |

### Articles per Category
- `peredam-mobil` (amber): 10 articles (6 scraped + 4 generated)
- `upgrade-audio` (red): 7 articles (6 scraped + 1 generated)
- `review-workshop` (slate): 7 articles (4 scraped + 3 generated)
- `tips-biaya` (emerald): 6 articles (4 scraped + 2 generated)

### Featured (Top-3 scraped by viewCount)
1. **Sebaran Workshop Peredam Mobil di Jakarta dan Karakteristiknya** (960 views)
   — `sebaran-workshop-peredam-mobil-di-jakarta-dan-karakteristiknya`
2. **Checklist 10 Poin Sebelum Pasang Peredam Mobil** (927 views)
   — `checklist-10-poin-sebelum-pasang-peredam-mobil`
3. **Cara Menilai Workshop Peredam Mobil di Jakarta Sebelum Menyerahkan Kunci** (902 views)
   — `cara-menilai-workshop-peredam-mobil-di-jakarta-sebelum-menyerahkan-kunci`

### Top 5 Articles by viewCount (post-seed)
1. Material Peredam Mobil Import vs Lokal (2448 views, AI)
2. Garansi Workshop Peredam: Apa yang Sebenarnya Dicakup (1484 views, AI)
3. Peredam Mobil untuk EV: Apakah Beda? (1330 views, AI)
4. Pengaruh Peredam Mobil pada Nilai Jual Mobil Bekas (1065 views, AI)
5. Workshop Peredam Mobil Premium vs Ekonomis di Jakarta Selatan (983 views, AI)

## Detail Eksekusi

### Step 1: Scrape 20 Artikel Asli
- CLI: `z-ai function -n page_reader -a '{"url":"..."}' -o /tmp/perdam_articles/article_N.json`
- Percobaan parallel 5-at-a-time gagal dengan **HTTP 429** (rate limit). Switch
  ke sequential scraper dengan delay 4 detik antar request + retry 3x dengan
  delay 15 detik kalau 429. Hasil: semua 20 berhasil di-attempt 1 (no retries
  needed setelah switch ke sequential).
- Output: 20 file JSON 33-37KB di `/tmp/perdam_articles/` (tidak committed;
  regenerated on demand by running `z-ai function` again).

### Step 2: Parse Scraped JSON
- File: `seed/parse-scraped.ts` (executable via `bun run seed/parse-scraped.ts`)
- Ekstrak dari setiap JSON:
  - JSON-LD `NewsArticle` untuk title, author, datePublished, image, wordCount
  - `<div class="article-content">` ... `<div class="article-tags">` untuk body
  - `<div class="article-tags">` regex untuk tags (3 per artikel)
  - `<i class="bi bi-eye"></i> N kali dibaca` regex untuk viewCount
  - `<i class="bi bi-clock"></i> N menit baca` regex untuk readingTime
  - `<meta name="keywords" content="...">` regex untuk metaKeywords
- Hasil: 20 file `seed/data/scraped_NN.json` (3-5KB per file).
- Verifikasi: 20/20 parsed sukses. 0 duplicate slugs. Distribusi kategori sesuai.

### Step 3: Generate 10 Artikel AI
- File: `seed/generate.ts` (executable via `bun run seed/generate.ts`)
- ZAI SDK: `import ZAI from 'z-ai-web-dev-sdk'; const zai = await ZAI.create()`
- Model: `glm-4.6` (default ZAI chat model, no thinking)
- System prompt strict: JSON-only output, 5 sub-bab H2, 400-600 kata, HTML murni,
  forbidden tags list, tags slug-format.
- Retry 3x dengan delay 3-5s kalau: JSON parse error, validation error (word
  count < 280, tags not array/string, forbidden tags).
- Iterasi pertama (prompt kurang strict): word counts hanya 165-252. Setelah
  prompt diperkuat (5 sub-bab eksplisit, "WAJIB 400-600 kata, target 500"),
  word counts menjadi 285-471. Semua 10 sukses.
- Topik 10 artikel (sesuai task spec): Premium vs Ekonomis Workshop, Material
  Import vs Lokal, Resale Value, Road Test Kebisingan, EV Peredam, Budget 5
  Juta, Umur Material, Garansi Workshop, Bongkar Trim, Audio vs Peredam.

### Step 4: Ekstrak FAQ Homepage
- Scrape homepage `https://peredammobiljakarta.com/` via `z-ai function page_reader`.
- Extract section `<section id="faq">` ... `</section>`.
- Parse `<details class="faq-item">...<summary>Q</summary><div class="faq-answer"><p>A</p></div></details>`
- Hasil: 10 FAQ entries → `seed/data/faq.json`.
- FAQ entries (topik): Apa itu peredam mobil, Apakah benar-benar mengurangi
  kebisingan, Biaya di Jakarta, Bagian paling penting, Beda damper/absorber/barrier,
  Pengaruh ke audio, Berapa lama pengerjaan, Karat/jamur, Tambah bobot/Boros BBM,
  Memilih workshop terbaik.

### Step 5: Seed Prisma DB
- File: `seed/seed.ts` (executable via `bun run seed/seed.ts`)
- Idempotent: semua operasi pakai `upsert` (categories, SiteSetting, tags) atau
  findUnique+update/create (articles), deleteMany+create (FAQ).
- Wrap dalam `try/finally db.$disconnect()`.
- Output: 30 articles created (0 updated pada first run), 17 tags, 10 FAQs, 4
  categories, SiteSetting singleton.

## Verifikasi

- `bun run seed/seed.ts` sukses tanpa error.
- Database state:
  - 30 articles (all PUBLISHED, 0 draft, 0 archived)
  - 4 categories (10/7/7/6 article distribution)
  - 17 tags (semua connect ke articles via ArticleTag implicit junction)
  - 10 FAQs (semua published, order 1-10)
  - SiteSetting: id="global", siteName, tagline, contactEmail, contactAddress
    semua terisi
- `bun run lint` → no errors.
- Smoke test dashboard: login via curl, GET `/admin` with cookie → 200.
  Stat cards di HTML: Total Artikel=30, Published=30, Total Views=19.082,
  Subscribers=0. Tabel "Paling Banyak Dibaca" dan "Artikel Terbaru" berisi
  artikel nyata dari seed.

## Catatan

- **Featured articles** dipilih dari top-3 scraped (bukan AI) by viewCount
  untuk konsistensi: artikel asli dari website punya real-world view count
  yang lebih dapat dipercaya untuk "featured".
- **AI articles publishedAt** = `new Date()` (waktu seed run). Bisa di-override
  ke tanggal tersebar jika agent berikutnya butuh distribusi waktu yang lebih
  acak untuk chart "Artikel per Bulan".
- **Content quality AI** (285-471 kata) masih di bawah target ideal 500 kata,
  tapi struktur sudah konsisten (intro + 5 H2 + kesimpulan). Validation
  menerima >= 280 kata.
- **slugify** dipakai untuk tag → tag.slug dan article.slug. Tag dari AI
  yang sudah slug-format tetap di-slugify lagi untuk konsistensi (no-op).
- **JSON parse error** "Invalid escape character p" muncul beberapa kali di
  attempt 1 generate (LLM kadang keluarkan `\/` di dalam string). Retry
  attempt 2-3 selalu sukses.
- **ArticleVersion** tidak diisi di seed awal — Task 6 (article form) yang
  akan create snapshot pertama saat artikel pertama kali disave via form.
  Untuk seed, content versi pertama sudah ada di `Article.content` &
  `Article.contentMarkdown` langsung.
- **ArticleTag junction** otomatis di-manage Prisma via implicit m-n relation
  (`@relation("ArticleTags")` di schema). Di seed, pakai
  `tags: { connect: [{slug: 'butyl'}, ...] }` untuk attach tags ke article.
- **Catatan `Math.pow(Math.random(), 1.6)`** untuk viewCount AI: power > 1
  bias nilai kecil (lebih banyak artikel dengan view rendah, sedikit dengan
  view tinggi). Distribusi lebih realistis ketimbang uniform random.
