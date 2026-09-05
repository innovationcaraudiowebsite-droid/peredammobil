# Task 8+9+10 — Category / Tag / FAQ / Subscriber Builder

## Scope
Membangun 4 halaman admin (Category, Tag, FAQ, Subscriber management) + 11 API routes
+ 8 client components, semuanya menggunakan route group `(dashboard)` yang sudah
memberi `requireAdmin()` + sidebar + header.

## Files Created

### Admin Pages (Server Components — `src/app/admin/(dashboard)/`)
1. `categories/page.tsx` — `/admin/categories` list 4 kategori dari seed + 3 stat cards
   (Total Kategori, Artikel Terhubung, Kategori Kosong) + table + edit/delete action
2. `tags/page.tsx` — `/admin/tags` list 17 tag dari seed, server-side search via `?q=`
   + 3 stat cards (Total Tag, Total Artikel, Tag Kosong) + table + delete action
3. `faq/page.tsx` — `/admin/faq` list 10 FAQ dari seed diurut by order + 3 stat cards
   (Total FAQ, Published, Draft) + table dengan up/down reorder buttons + edit/delete
4. `subscribers/page.tsx` — `/admin/subscribers` list subscriber (saat ini 0) +
   amber info card + 2 stat cards (Total Active, Total Unsubscribed) + delegasi ke
   `SubscribersTable` client component untuk search/filter/bulk/export

### API Routes (`src/app/api/admin/`)
5. `categories/route.ts` — `POST` create (name wajib >=2, slug auto via `slugify`, color
   restricted ke 8 palette, order int default 0). Cek `name` unik + slug di-`ensureUniqueSlug`.
6. `categories/[id]/route.ts` — `PUT` partial update (validasi sama, slug auto-uniquify
   kecuali diri sendiri) + `DELETE` dengan **preflight check**: hitung
   `db.article.count({ where: { categoryId: id } })` — jika >0 return 409 dengan
   message "Tidak bisa hapus kategori yang masih dipakai X artikel. Pindahkan
   artikel ke kategori lain dulu." + `articleCount`.
7. `tags/route.ts` — `POST` create + `GET` list (dengan `?q=` filter, return
   `_count.articles`).
8. `tags/[id]/route.ts` — `DELETE` hapus tag. Karena Article-Tag adalah implicit
   m-n junction, Prisma auto-removes junction rows → return `disconnectedArticles`
   count di response.
9. `faq/route.ts` — `POST` create (question & answer wajib >=5 char). Order default
   = max+1. Also exposes `GET` list (returns id, question, answer, order,
   isPublished, timestamps).
10. `faq/[id]/route.ts` — `PUT` partial update + `DELETE`.
11. `faq/reorder/route.ts` — `POST` bulk reorder. Body `{ ids: string[] }`. Setiap
    FAQ di-update dengan `order: index+1`. IDs yang tidak ada di-skip (try/catch
    null).
12. `subscribers/[id]/unsubscribe/route.ts` — `POST` set `status: 'UNSUBSCRIBED'` +
    `unsubscribedAt: new Date()`. Idempotent.
13. `subscribers/[id]/route.ts` — `DELETE` permanen.
14. `subscribers/bulk/route.ts` — `POST` bulk `{ ids, action: 'unsubscribe'|'delete' }`.
    Unsubscribe hanya affect ACTIVE (where clause), delete langsung `deleteMany`.
    Return `affected` count.
15. `subscribers/export/route.ts` — `GET` return CSV. Query `?status=active|all`
    (default active). Kolom: `email, status, source, subscribedAt,
    unsubscribedAt`. Date format ISO 8601. CSV escape: wrap in quotes if contains
    comma/quote/newline, escape `"` → `""`. Header `Content-Disposition:
    attachment; filename="subscribers-{status}-{date}.csv"`. Take max 10000.

### Client Components (`src/components/admin/`)
16. `categories/category-dialog.tsx` — Dialog create/edit. Pattern: `<Dialog>` with
    trigger; ketika `open=true`, render `<CategoryForm>` (mounts fresh each open
    → no `useEffect` untuk reset state, menghindari lint error
    `react-hooks/set-state-in-effect`). Form fields: name, slug (auto dari name via
    `slugify`, editable manual), description (textarea max 280), color (Select 8
    options dengan color dot), order (number). Submit → POST/PUT → toast +
    `router.refresh()`. Exports `CategoryRow` interface.
17. `categories/category-delete-button.tsx` — AlertDialog confirm. Tombol disabled
    jika `articleCount > 0` (tooltip berisi alasan). Konfirmasi → DELETE API → toast.
18. `tags/tag-dialog.tsx` — Dialog create only (tidak ada edit untuk tag — tag
    cukup dibuat/hapus). Pattern sama dengan CategoryDialog (Form mount on open).
19. `tags/tag-actions.tsx` — Export `TagSearchBar` (URL-synced via `?q=`, debounced
    250ms) + `TagDeleteButton` (double-confirm jika `articleCount > 0` — step 1:
    warning "Tag ini dipakai X artikel. Hapus tetap akan disconnect tag dari
    artikel tersebut" → tombol "Lanjutkan" → step 2: confirm final "Konfirmasi
    akhir" → tombol "Ya, Hapus Permanen").
20. `faq/faq-dialog.tsx` — Dialog create/edit. Pattern sama. Fields: question
    (input wajib), answer (textarea 5 rows), order (number, default next), isPublished
    (Switch + label "Published" / "Draft (tersembunyi)"). Exports `FaqRow`
    interface.
21. `faq/faq-actions.tsx` — Export `FaqDeleteButton` (confirm dengan preview
    truncated question) + `FaqReorderButtons` (up/down arrow, disabled di first/
    last row) + `useFaqReorder` hook (return `move(faqId, ids, direction)` yang
    swap ID di array lalu POST ke `/api/admin/faq/reorder`).
22. `faq/faq-table.tsx` — Client wrapper untuk Table (menerima `rows: FaqRow[]`).
    Render row dengan # (idx+1), reorder buttons, question + answer (truncated 2
    lines), status Badge (Published/Draft), edit + delete actions. Pakai
    `useFaqReorder` hook untuk reordering.
23. `subscribers/subscribers-table.tsx` — Client component besar: search bar
    (URL-synced `?q=` debounced), filter status (Select: all/active/unsubscribed
    via `?status=`), bulk action bar (Unsubscribe Selected, Delete Selected dengan
    confirm AlertDialog), per-row Unsubscribe (untuk ACTIVE) + Delete. Stat
    cards Total Active & Total Unsubscribed. Empty state dengan Mail icon.
    Export CSV via `<a href="/api/admin/subscribers/export?status=...">` link.

## Architecture Decisions

### Route Group Compliance
Semua halaman admin baru ditulis di `src/app/admin/(dashboard)/{slug}/page.tsx`
sesuai panduan Task 5 — sehingga otomatis mendapat `requireAdmin()` + sidebar
+ header dari `app/admin/(dashboard)/layout.tsx`. Tidak ada file yang ditulis di
`src/app/admin/{slug}/page.tsx` (yang akan bypass auth).

### Client Component Pattern (no `setState` in `useEffect`)
Lint rule `react-hooks/set-state-in-effect` melarang `setState` langsung di body
effect. Untuk menghindari cascading renders, semua dialog pakai pattern:
- `<Dialog>` dengan trigger eksternal (open state di Dialog)
- Saat `open === true`, render `<XForm>` sebagai child component yang mounts
  fresh setiap kali dialog dibuka → initial state via `useState(mode === 'edit'
  && data ? data.field : default)` → tidak perlu reset effect
- Auto-slug: dikerjakan dalam handler `handleNameChange` (bukan effect) — cek
  `slugTouched` flag, jika belum pernah di-edit manual, set slug = slugify(name)

### Color Palette (Categories)
8 warna yang diizinkan: `amber, red, emerald, slate, zinc, violet, rose, cyan`.
Di-validasi server-side (`asColor()` helper). Di DB disimpan sebagai string
(case-insensitive lookup). UI badge render: dot kecil + label warna.

### Tag Delete — Auto-disconnect
Spesifikasi: "Jika tag masih dipakai artikel, tampilkan warning ... Hapus tetap
akan disconnect tag dari artikel tersebut."
Implementation:
- Tidak ada field di Tag schema untuk "soft delete". Karena Article-Tag adalah
  implicit m-n junction, Prisma otomatis menghapus junction row saat Tag
  di-delete → artikel tidak terhapus, hanya tidak lagi memiliki tag tsb.
- DELETE endpoint return `disconnectedArticles` count. Client menampilkan toast
  yang sesuai: "Tag X dihapus. Diputus dari Y artikel."
- Confirm modal 2 langkah jika `articleCount > 0`.

### Category Delete — Preflight Check
Spesifikasi: "Cek dulu apakah kategori masih dipakai artikel. Jika iya,
tampilkan error".
Implementation:
- DELETE endpoint hitung `db.article.count({ where: { categoryId: id } })` dulu.
- Jika > 0 → return 409 dengan `message` + `articleCount`. Tidak menghapus
  apapun.
- Client button `disabled` jika `articleCount > 0` + tooltip.

### FAQ Reorder — Swap Pattern
Spesifikasi: "drag to reorder opsional, atau pakai up/down button".
Implementation: pilih up/down button (lebih sederhana, lebih reliable). Pattern:
- Setiap row punya `ArrowUp` / `ArrowDown` button.
- Click → `useFaqReorder().move(faqId, ids, direction)`:
  1. Cari index FAQ di array `ids` (full list of FAQ IDs in current order)
  2. Swap dengan neighbor (idx ± 1)
  3. POST `/api/admin/faq/reorder` dengan array baru
  4. `router.refresh()` → server re-renders with new order
- Endpoint bulk: terima `{ ids: [...] }`, set `order = idx + 1` untuk setiap ID.

### Subscribers — No Create Form
Spesifikasi: "subscriber TIDAK punya form create (subscriber datang dari
front-end newsletter form). Cukup list + manage."
Implementation: tidak ada tombol "Subscriber Baru". Hanya list + Unsubscribe +
Delete + Export CSV + Bulk action. Front-end newsletter form akan dibuat oleh
agent front-end portal (Task 11).

### Search & Filter — Server-Side via URL Query
Pages use `searchParams: Promise<SearchParams>` (Next.js 16 pattern). Search
input via client component yang update URL `?q=` (debounced 250ms). Status
filter via `?status=`. Server reads query, builds Prisma `where`, fetches
data. Pattern ini memungkinkan shareable URL + back button.

## End-to-End Test Results
Tested manually via curl script:
- Login → 200 + cookie
- GET /admin/categories → 200, 153KB, all 4 categories visible (Peredam Mobil,
  Upgrade Audio, Review Workshop, Tips & Biaya) dengan slug, warna badge (amber/
  red/slate/emerald), article count (10/7/7/6)
- GET /admin/tags → 200, 206KB, 18 `<tr` matches (1 header + 17 tags), tag slugs
  alphabetically sorted: biaya-peredam, butyl, dsp, ev, foam-absorber, head-unit,
  jakarta-selatan, mass-loaded-vinyl, peredam-mobil, peredam-pintu, review-
  workshop, speaker-split, subwoofer, tips-biaya, uji-kebisingan, upgrade-audio,
  wheel-housing
- GET /admin/faq → 200, 156KB, 11 `<tr` matches (1 header + 10 FAQ), Published/
  Draft badge visible
- GET /admin/subscribers → 200, 74KB, empty state with Mail icon (0 subscriber)
- POST /api/admin/categories (create "Test Kategori Baru") → 200, returned
  `{ok:true, id, slug:"test-kategori-baru"}`
- POST /api/admin/tags (create "Test Tag Script") → 200, returned id + slug
- POST /api/admin/faq (create "Pertanyaan dari script test?") → 200, returned
  id + `order:11` (next order after 10 existing FAQs)
- GET /api/admin/tags → 200, returns array of {id, name, slug, createdAt,
  articleCount}
- GET /api/admin/subscribers/export → 200, returns CSV with header row even
  when empty
- DELETE /api/admin/categories/[peredam-mobil-id] → **409** with message
  "Tidak bisa hapus kategori yang masih dipakai 10 artikel. Pindahkan artikel
  ke kategori lain dulu." + `articleCount:10` ✓ (preflight check works!)
- Created 3 test subscribers via Prisma → GET /admin/subscribers shows them with
  source badges
- POST /api/admin/subscribers/[id]/unsubscribe → 200, status changed ACTIVE →
  UNSUBSCRIBED + `unsubscribedAt` set
- POST /api/admin/subscribers/bulk {action:"unsubscribe"} → 200, `affected:2`
- GET /api/admin/subscribers/export?status=all → 200, CSV includes 3 rows
  dengan status UNSUBSCRIBED + timestamps ISO 8601
- POST /api/admin/subscribers/bulk {action:"delete"} → 200, `affected:3`
- POST /api/admin/faq/reorder (swap first 2) → 200, `updated:2`
- All test data cleaned up via direct Prisma script (subscribers deleted, test
  category/tag/FAQ removed, FAQ order reverted)

## Lint & Dev Log
- `bun run lint` → no errors
- `tail dev.log` — semua endpoint API return 200 OK. Hanya ada satu log entry
  "EADDRINUSE" karena sistem mencoba auto-start dev saat saya menjalankan
  instance manual untuk testing (tidak terkait code).
- Tidak ada `Module not found`, `SyntaxError`, atau `Type error`.

## Notes for Next Agents
- Subscribers page akan otomatis muncul kosong sampai front-end portal membuat
  form newsletter subscribe → Subscriber entries akan dibuat oleh API yang
  belum ada (agent front-end harus buat `POST /api/subscribe` atau sejenis yang
  insert ke tabel Subscriber). Admin hanya manage.
- FAQ `reorder` endpoint menerima `{ ids: [...] }` (full ordered list). Front-end
  bisa pakai drag-drop library yang emit ordered IDs dan POST ke endpoint ini.
  Saat ini UI pakai up/down button saja.
- Categories: link `/admin/articles?category={slug}` sudah ada di kolom artikel
  count — agent front-end articles list HARUS support `?tag=` & `?category=`
  filter (saya pakai di tag & category pages). Kalau belum ada, link tetap aman
  (akan tampil semua artikel).
- Tags: link `/admin/articles?tag={slug}` juga sudah ada — same note.
- Color palette categories: jika ingin tambah warna baru, edit `ALLOWED_COLORS`
  di 2 file: `categories/route.ts` (POST) + `categories/[id]/route.ts` (PUT) +
  `COLOR_OPTIONS` di `category-dialog.tsx` + `COLOR_BADGE`/`COLOR_DOT` maps di
  `categories/page.tsx`.
