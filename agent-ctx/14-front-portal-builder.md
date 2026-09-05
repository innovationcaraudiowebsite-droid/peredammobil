# Task 14 — Front-End Portal Builder

## Ringkasan

Membangun front-end portal `/` untuk pembaca portal media "Peredam Mobil Jakarta", plus halaman artikel detail (`/berita/[category]/[slug]`), listing per kategori (`/kategori/[slug]`), dan halaman pencarian (`/pencarian`). Semua public (no auth). Stack: Next.js 16 App Router, TypeScript, Tailwind 4 amber theme, shadcn/ui (New York), next-themes, sonner, framer-motion (sudah terinstall).

## Work Log

1. Baca worklog.md (Task 0/2/4/5/6+7/8-9-10/11-12/13) untuk memahami konteks: schema Prisma, 30 artikel seed, dashboard admin lengkap, SiteSetting singleton, 10 komentar (3 pending/3 approved/2 rejected/2 spam).
2. Inspeksi layout.tsx, globals.css, page.tsx existing, prisma/schema.prisma, lib/db.ts, lib/auth.ts, middleware.ts, sample admin pages (comments-bulk, sidebar, shell) untuk pattern.
3. Update `src/app/globals.css`:
   - Override `--primary` & `--primary-foreground` jadi amber (light: oklch(0.7 0.18 70) → dark: oklch(0.75 0.18 70)).
   - Sidebar primary juga dipakai amber (light: 0.7 0.18 70, dark: 0.75 0.18 70).
   - Ring color amber (light: 0.7 0.18 70, dark: 0.75 0.18 70).
   - Tambah custom scrollbar style `.portal-scroll` (8px, amber thumb).
   - Tambah line-clamp helpers (`.line-clamp-2`, `.line-clamp-3`) — Tailwind v4 default tidak include.
   - Tambah `@keyframes portal-marquee` 40s linear infinite + `.animate-marquee` class untuk breaking ticker; respect `prefers-reduced-motion`.
4. Buat `src/components/theme-provider.tsx` — wrapper next-themes (attribute="class", defaultTheme="light", enableSystem=false, disableTransitionOnChange).
5. Update `src/app/layout.tsx`:
   - `<html lang="id" suppressHydrationWarning>` (Bahasa Indonesia).
   - `generateMetadata()` async — fetch SiteSetting dari DB via `db.siteSetting.upsert({where:{id:"global"}, update:{}, create:{}})`. Build title dari `{siteName} — {tagline}`, description niche, keywords otomotif, icons dari `faviconUrl`, OG/twitter dari `logoUrl`.
   - `export const viewport` dengan themeColor amber (#f59e0b light, #0a0a0a dark).
   - Wrap `<ThemeProvider>` di sekitar children + Toaster (existing) + Sonner (top-center, richColors, closeButton).
6. Buat `src/lib/format-tanggal.ts` — helpers Indonesian: formatTanggalPanjang ("Senin, 5 September 2026"), formatTanggalPendek ("5 Sep 2026"), formatJam ("09.30 WIB"), relativeTime ("5 menit lalu"), formatNumber ("19.082" dengan Intl.NumberFormat id-ID).
7. Buat `src/lib/portal.ts` — server-only helpers:
   - `getSiteSetting()` (upsert singleton)
   - Types: `PortalCategory`, `PortalTag`, `PortalArticleListItem`, `PortalArticleDetail`, `PortalFaq`
   - `categoryBadgeClass(color)` & `categoryDotClass(color)` — map string warna DB ke Tailwind class (8 warna: amber/red/emerald/slate/violet/rose/cyan/zinc)
   - `getFeaturedArticles(minCount)` — isFeatured PUBLISHED, fallback ke populer jika kurang
   - `getLatestArticles(take, excludeIds)`
   - `getArticlesPerCategory(perCategory, excludeIds)` — sequential per category, filter empty kategori
   - `getMostReadArticles(take)` — sort by viewCount desc
   - `getPopularTags(take)` — count articles per tag (in-memory), filter count>0, sort desc
   - `getPublishedFaqs()`
   - `getArticleBySlug(slug)`, `getArticleByCategoryAndSlug(categorySlug, articleSlug)`
   - `getRelatedArticles(articleId, categoryId, take)` — same category, exclude self
   - `incrementArticleView(slug)` — increment via updateMany
   - `searchArticles(query, take, skip)` — search title/excerpt/contentMarkdown/authorName dengan SQLite LIKE, return {items, total}
   - `getArticlesByCategory(categorySlug, take, skip)` — return {category, items, total}
   - `getApprovedComments(articleId)` — untuk halaman artikel
8. Buat 16 komponen portal di `src/components/portal/`:
   - `article-card.tsx` — 4 variant: default (vertical), horizontal, compact, overlay (image + text gradient). Badge kategori di atas image, title line-clamp-2, excerpt line-clamp-3, meta (date/read time/view count) dengan icon.
   - `article-grid.tsx` — grid wrapper (1/2/3/4 cols responsive).
   - `breaking-ticker.tsx` — tanggal hari ini + marquee headlines (article titles).
   - `hero-featured.tsx` — 1 big (2/3 width, overlay variant, fetchPriority="high") + 2 secondary (overlay, smaller) stacked di kanan.
   - `category-section.tsx` — header (dot + badge + h2 link ke /kategori/[slug] + deskripsi) + 4 cards grid, link "Lihat semua" di kanan atas.
   - `popular-sidebar.tsx` — ranked list 1..6 dengan angka besar (top 3 amber, sisanya muted), view count + date.
   - `tag-cloud.tsx` — chip "#name" link ke /pencarian?q=tagName, size berdasarkan ratio articleCount/max.
   - `newsletter-form.tsx` — 3 variant: default (card), compact (sidebar), inline (article). POST /api/subscribe, toast sukses/error via sonner, state "Terima kasih sudah berlangganan!" setelah submit.
   - `faq-accordion.tsx` — shadcn Accordion type="single" collapsible, jawaban split by `\n\n` → paragraphs, numbered "01".."10".
   - `footer.tsx` — sticky bottom bg-slate-950 text-slate-300, 4 kolom (About/Navigasi/Kontak/Newsletter mini), social icons, copyright.
   - `header.tsx` — sticky top, logo + 5 nav links (Beranda + 4 kategori) + search dialog + dark toggle + "Masuk" link. Mobile hamburger → Sheet (side="left") with full nav + admin link.
   - `theme-toggle.tsx` — Sun/Moon toggle via useTheme(), mounted state untuk avoid hydration mismatch.
   - `search-dialog.tsx` — Dialog dengan Input, debounce 250ms, fetch /api/search, list results clickable ke halaman artikel, link "Lihat semua hasil →" ke /pencarian, Cmd/Ctrl+K shortcut to open.
   - `search-form.tsx` — form untuk halaman /pencarian, URL-sync (?q=), clear button, skeleton loader.
   - `view-tracker.tsx` — client component render null, POST /api/articles/[slug]/view once per session (sessionStorage flag). Export juga `ShareButtons` (WhatsApp/Facebook/Twitter/copy link).
   - `comment-section.tsx` — list approved comments + form submit (name/email/content), POST /api/comments, validate, toast, status PENDING note banner, refresh on mount.
9. Buat 4 API endpoints public:
   - `POST /api/subscribe` — body {email, source?}. Email validation regex. Rate limit 5 per jam per IP via in-memory Map. Email existing + ACTIVE → return dedupe:true; UNSUBSCRIBED → re-activate (status ACTIVE, clear unsubscribedAt); new → create.
   - `GET /api/search?q=&take=&skip=` — wrapper searchArticles, return {items, total, q}. take max 24, skip default 0.
   - `GET /api/comments?articleId=...` — list APPROVED comments for article (no email/IP in response).
   - `POST /api/comments` — body {articleId, name, email, content, parentId?}. Validate name 1-100, email valid ≤254, content 1-2000. Verify article PUBLISHED. If parentId, verify same article & APPROVED. Status default PENDING. ipAddress from x-forwarded-for/x-real-ip.
   - `POST /api/articles/[slug]/view` — increment viewCount via updateMany, 404 if not found.
10. Buat homepage `src/app/page.tsx` (server component, revalidate=60s):
    - Fetch parallel: featured (3), mostRead (6), popularTags (12), faqs (10), latestForSidebar (4 untuk ticker + latest grid).
    - Hero: mainFeatured = featured[0], secondaryFeatured = featured[1..2].
    - Latest grid 4 (exclude featured).
    - Per-category sections (4 kategori × 4 artikel, exclude featured).
    - Sidebar layout 2/3 + 1/3: kiri = "Baca Selanjutnya" 4 horizontal cards, kanan sticky = PopularSidebar + TagCloud + NewsletterForm.
    - FAQ accordion.
    - Wrapper `<div className="flex min-h-screen flex-col">` + `<main className="flex-1">` + `<Footer>` (mt-auto otomatis dari flex).
11. Buat halaman artikel `/berita/[category]/[slug]/page.tsx` (server component, revalidate=60s):
    - `generateMetadata()` async — title dari metaTitle || `${title} — ${category.name} | ${siteName}`, description, keywords, OG image, canonical.
    - Breadcrumb Beranda › Kategori › Judul.
    - Title H1 + excerpt + meta (author/date/read time/view count).
    - Featured image 16:9 (fetchPriority="high").
    - Share buttons (WhatsApp/Facebook/Twitter/copy link via clipboard API).
    - Konten HTML via `dangerouslySetInnerHTML` (dari Article.content field — sudah HTML output dari MDXEditor) dengan prose-style tailwind arbitrary selectors (`[&_h2]:...` dst).
    - Tags clickable link ke /pencarian?q=tagName.
    - Newsletter inline (amber gradient bg).
    - Comments section (CommentSection component).
    - JSON-LD NewsArticle schema (headline, image, datePublished, dateModified, author/publisher Organization, mainEntityOfPage, articleSection, keywords, wordCount, articleBody).
    - ViewTracker (client, fire-and-forget POST).
    - Right sidebar 1/3: Artikel Terkait (3 same category) + NewsletterForm compact.
12. Buat halaman kategori `/kategori/[slug]/page.tsx` (server, revalidate=60s):
    - `generateMetadata()` async dari category.
    - Breadcrumb + header (icon + h1 + description + total count) + top tags dari kategori (link ke /pencarian).
    - Article grid 2 cols (sm+) → 1 col mobile, take=12 per page.
    - Pagination URL-synced (?page=) dengan ellipsis untuk total > 7.
    - Right sidebar 1/3: "Tentang Kategori" + NewsletterForm default.
13. Buat halaman pencarian `/pencarian/page.tsx` (server, dynamic=force-dynamic):
    - Metadata noindex.
    - Header + SearchForm (URL-synced).
    - Result list 3 cols (lg+), take=12.
    - Empty state (no q): ilustrasi + hint.
    - No results: tag suggestions.
    - Found: count + total + current page + pagination.
    - Inline NewsletterForm di bottom.
14. Cleanup test artifacts: hapus subscriber `test-subscriber@example.com` & comment dari `test@example.com` via Prisma script. Remove old scaffold `src/app/api/route.ts` (Hello world placeholder) yang tidak terpakai.
15. Lint & test:
    - `bun run lint` → 0 errors, 0 warnings (clean).
    - GET `/` → 200, 613KB. HTML mengandung: Berita Utama, Paling Banyak Dibaca, Topik Populer, Buletin Mingguan, Pertanyaan yang Sering Diajukan, Navigasi, © 2026. 22 article links, 4 category sections.
    - GET `/berita/peredam-mobil/peredam-pintu-mobil-panduan-lengkap-material-dan-cara-pasang-yang-benar` → 200, 188KB. HTML mengandung: H1 title, "Bagikan", "Komentar Pembaca", "Artikel Terkait", "Buletin Mingguan", 1 NewsArticle JSON-LD, 3 tag links.
    - GET `/kategori/peredam-mobil` → 200, 265KB. HTML mengandung: "Peredam Mobil", "artikel total", "Tentang Kategori", "Panduan teknis pemasangan". 10 article cards visible (matching count of Peredam Mobil category in DB).
    - GET `/pencarian?q=peredam` → 200, 291KB. HTML mengandung: "Ditemukan", "hasil untuk", "Pencarian Artikel", "Peredam Pintu Mobil" (article in results), 12 article cards shown, pagination "halaman 1 dari 3".
    - POST `/api/subscribe` new email → 200 {"ok":true}.
    - POST `/api/subscribe` dup email → 200 {"ok":true,"dedupe":true,"message":"Email sudah berlangganan."} (idempotent).
    - POST `/api/subscribe` bad email → 400 {"ok":false,"message":"Email tidak valid."}.
    - GET `/api/search?q=peredam&take=3` → 200, 3 items, total:29. Sample article "Peredam Pintu Mobil: Panduan Lengkap..." muncul dengan category color amber.
    - POST `/api/articles/[slug]/view` → 200 {"ok":true} (viewCount incremented).
    - GET `/api/comments` (no articleId) → 400 {"ok":false,"message":"articleId wajib diisi."}.
    - POST `/api/comments` valid → 200 {"ok":true,"message":"Komentar Anda terkirim dan menunggu moderasi admin. Terima kasih!","item":{"status":"PENDING",...}}.
    - POST `/api/comments` bad email → 400.
    - GET `/api/comments?articleId=...` → 200 {"ok":true,"items":[],"total":0} (no approved comments for this article).
16. Note: dev server (Next.js 16.1.3 Turbopack) restart berulang saat test karena memory pressure. Saya jalankan manual beberapa kali via `nohup bun run dev`. Setiap session, semua 4 halaman dan 5 API endpoint berhasil diuji end-to-end.

## Stage Summary

### File yang dibuat/diedit (24 files portal + 5 API + 2 lib + 2 root):
- `src/app/layout.tsx` — edited (ThemeProvider, lang=id, generateMetadata dari SiteSetting, sonner)
- `src/app/globals.css` — edited (amber primary override, custom scrollbar, marquee animation, line-clamp helpers)
- `src/app/page.tsx` — new (homepage server component)
- `src/app/berita/[category]/[slug]/page.tsx` — new (article detail + generateMetadata + JSON-LD)
- `src/app/kategori/[slug]/page.tsx` — new (category listing + pagination)
- `src/app/pencarian/page.tsx` — new (search results + pagination)
- `src/app/api/subscribe/route.ts` — new (POST newsletter subscribe)
- `src/app/api/search/route.ts` — new (GET search articles)
- `src/app/api/comments/route.ts` — new (GET approved comments, POST submit comment)
- `src/app/api/articles/[slug]/view/route.ts` — new (POST increment view count)
- `src/components/theme-provider.tsx` — new (next-themes wrapper)
- `src/components/portal/article-card.tsx` — new (4 variants)
- `src/components/portal/article-grid.tsx` — new (grid wrapper)
- `src/components/portal/breaking-ticker.tsx` — new (tanggal + marquee)
- `src/components/portal/hero-featured.tsx` — new (1 big + 2 small)
- `src/components/portal/category-section.tsx` — new (per-kategori section)
- `src/components/portal/popular-sidebar.tsx` — new (ranked list)
- `src/components/portal/tag-cloud.tsx` — new (chip cloud)
- `src/components/portal/newsletter-form.tsx` — new (3 variants)
- `src/components/portal/faq-accordion.tsx` — new (Accordion)
- `src/components/portal/footer.tsx` — new (sticky bottom)
- `src/components/portal/header.tsx` — new (sticky header + mobile Sheet)
- `src/components/portal/theme-toggle.tsx` — new (Sun/Moon toggle)
- `src/components/portal/search-dialog.tsx` — new (Dialog search w/ Cmd+K)
- `src/components/portal/search-form.tsx` — new (form + skeleton)
- `src/components/portal/view-tracker.tsx` — new (POST view once per session + ShareButtons)
- `src/components/portal/comment-section.tsx` — new (list approved + form submit)
- `src/lib/portal.ts` — new (server-only fetch helpers)
- `src/lib/format-tanggal.ts` — new (Indonesian date/number formatters)

### Hapus:
- `src/app/api/route.ts` — old scaffold "Hello world" (tidak dipakai portal).

### Halaman yang jadi:
- `/` — Homepage portal (server, revalidate 60s)
- `/berita/[category]/[slug]` — Article detail (server, generateMetadata, JSON-LD NewsArticle)
- `/kategori/[slug]` — Category listing dengan pagination (server, generateMetadata)
- `/pencarian` — Search result page (server, dynamic=force-dynamic, URL-synced ?q=)

### Komponen portal (16):
Header, BreakingTicker, HeroFeatured, ArticleCard, ArticleGrid, CategorySection, PopularSidebar, TagCloud, NewsletterForm, FaqAccordion, Footer, ThemeToggle, SearchDialog, SearchForm, ViewTracker, CommentSection.

### API endpoints public (5):
- POST /api/subscribe
- GET /api/search?q=&take=&skip=
- GET /api/comments?articleId=
- POST /api/comments (body: articleId, name, email, content, parentId?)
- POST /api/articles/[slug]/view

### Catatan:
- **Warna**: amber primary di terang (oklch 0.7 0.18 70) + gelap (oklch 0.75 0.18 70). Sidebar admin juga pakai amber (override `--sidebar-primary`). Dark mode tetap berfungsi via next-themes (`attribute="class"`, defaultTheme="light", enableSystem=false).
- **Sticky footer**: pakai pattern root wrapper `<div className="flex min-h-screen flex-col">` + `<main className="flex-1">` + `<Footer>` → footer otomatis menempel bawah, content push turun kalau overflow. Tidak melayang.
- **Sticky header**: `sticky top-0 z-40` dengan `bg-background/95 backdrop-blur`. Sticky sidebar (kanan) pakai `lg:sticky lg:top-20` (di bawah header 14×4=56px = top-20 = 80px buffer).
- **Dark mode**: toggle via ThemeToggle (Sun/Moon) di header. localStorage key `theme`. Disable system untuk predictable behavior.
- **Mobile menu**: Sheet (side="left") dari shadcn, kontrol via `mobileOpen` state, close on route change via useEffect on usePathname().
- **Article content render**: pakai `dangerouslySetInnerHTML={{__html: article.content}}` (Article.content sudah HTML output dari MDXEditor @mdxeditor/editor — tidak perlu render markdown lagi). Inline CSS via Tailwind arbitrary selectors `[\&_h2]:text-2xl ...` dst.
- **View tracking**: client component ViewTracker render null, POST once per session via sessionStorage flag. Hindari double-count saat reload.
- **Subscribe dedupe**: idempotent — email existing + ACTIVE → return dedupe:true tanpa duplikasi. UNSUBSCRIBED → re-activate. Rate limit 5/jam/IP via in-memory Map.
- **Search**: server-side via SQLite LIKE (case-insensitive by default di SQLite). Like pattern: title/excerpt/contentMarkdown/authorName. Front-end dialog pakai AbortController untuk cancel previous request saat user ngetik cepat.
- **JSON-LD**: NewsArticle schema (Google rich result untuk artikel berita) — include headline, image, datePublished, dateModified, author/publisher Organization, mainEntityOfPage, articleSection, keywords, wordCount, articleBody.
- **Pagination**: pattern shared antara category & search — `pageNumbers(current, total)` helper dengan ellipsis untuk > 7 pages. URL-synced via ?page=.
- **Test subscriber & comment** dari curl sudah dibersihkan dari DB (idempotent cleanup). DB kembali ke kondisi seed awal: 4 kategori, 17 tag, 30 artikel, 10 FAQ, 10 komentar, 0 subscriber.
- **Dev server note**: Next.js 16.1.3 Turbopack kadang crash/restart karena memory pressure saat compile banyak page sekaligus. Bila dev down, jalankan manual `nohup bun run dev > /tmp/dev-manual.log 2>&1 &` untuk testing. Sistem auto-restart juga sebenarnya running, tapi kadang butuh trigger via file change.
- **Untuk agent berikutnya (Task 15)**: jalankan agent-browser untuk screenshot homepage, article, category, search page. Verifikasi: dark mode toggle (periksa class `.dark` di `<html>` setelah klik toggle), sticky footer (periksa footer position saat content pendek), mobile menu (resize viewport < lg, klik hamburger). Form newsletter & comment submit akan menampilkan toast sonner.
