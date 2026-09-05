# Task 11+12 — Comment Moderation + Site Settings Builder

## Konteks
Membangun halaman admin **Komentar Moderasi** (`/admin/comments`) dan **Pengaturan Situs** (`/admin/settings`) lengkap dengan API endpoints, seed komentar dummy, dan client components. Dikerjakan setelah Task 5 (dashboard layout), Task 6+7 (article CRUD), Task 8+9+10 (category/tag/faq/subscriber), Task 13 (seed data).

## File yang Dibuat (12 files)

### Pages (server components)
- `/home/z/my-project/src/app/admin/(dashboard)/comments/page.tsx`
- `/home/z/my-project/src/app/admin/(dashboard)/settings/page.tsx`

### Client components
- `/home/z/my-project/src/components/admin/comments/comments-table.tsx`
- `/home/z/my-project/src/components/admin/settings/settings-form.tsx`

### API routes
- `/home/z/my-project/src/app/api/admin/comments/route.ts` (GET list + filter)
- `/home/z/my-project/src/app/api/admin/comments/[id]/moderate/route.ts` (POST)
- `/home/z/my-project/src/app/api/admin/comments/[id]/route.ts` (DELETE)
- `/home/z/my-project/src/app/api/admin/comments/bulk/route.ts` (POST bulk)
- `/home/z/my-project/src/app/api/admin/settings/route.ts` (GET, PUT)
- `/home/z/my-project/src/app/api/admin/upload-logo/route.ts` (POST, sharp 512x512)
- `/home/z/my-project/src/app/api/admin/upload-favicon/route.ts` (POST, sharp 64x64)

### Seed script
- `/home/z/my-project/seed/seed-comments.ts` — generate 10 komentar dummy (idempotent)

## API Endpoints

### Comments
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/admin/comments?status=...&page=...&q=...` | — | `{ ok, total, page, pageSize, totalPages, items[] }` |
| POST | `/api/admin/comments/[id]/moderate` | `{ status }` | `{ ok, id, status, previousStatus }` |
| DELETE | `/api/admin/comments/[id]` | — | `{ ok, id }` or 404 |
| POST | `/api/admin/comments/bulk` | `{ ids, action }` | `{ ok, affected, action, status }` |

Status valid: `PENDING | APPROVED | REJECTED | SPAM`.
Action valid: `approve | reject | spam | delete`.

### Settings
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/admin/settings` | — | `{ ok, setting }` |
| PUT | `/api/admin/settings` | partial fields | `{ ok, updatedAt }` |
| POST | `/api/admin/upload-logo` | multipart `file` | `{ ok, url }` → `/uploads/site/logo-*.png` |
| POST | `/api/admin/upload-favicon` | multipart `file` | `{ ok, url }` → `/uploads/site/favicon-*.png` |

`primaryColor` whitelist: `amber, red, emerald, slate, zinc, violet, rose, cyan`.

## Komentar Seed
Total 10 komentar di DB setelah `bun run seed/seed-comments.ts`:

| Status | Count |
|---|---|
| PENDING | 3 |
| APPROVED | 3 |
| REJECTED | 2 |
| SPAM | 2 |
| **Total** | **10** |

Distribusi ke artikel: round-robin ke 30 artikel PUBLISHED (satu komentar per artikel untuk 10 artikel pertama). Author email pakai marker `demo_*@example.com` agar idempotent — `deleteMany` di awal script menghapus seed-comment lama sebelum insert ulang.

## Catatan Teknis

### SiteSetting Singleton Pattern
- Field `id` di-default `"global"` di schema Prisma (lihat `prisma/schema.prisma` line 182).
- API GET & PUT memakai `db.siteSetting.upsert({ where: { id: 'global' }, update, create })` — auto-create default kalau belum ada.
- Default values dari schema: `siteName="Peredam Mobil Jakarta"`, `tagline="Review Workshop..."`, `contactEmail="innovationcaraudio@gmail.com"`, `contactAddress="Jl. Taman Surya..."`, `authorName="Innovation Car Audio"`, `newsletterHeadline="Buletin Mingguan"`, `footerCopyright="© 2026..."`, `primaryColor="amber"`.

### Upload Logo & Favicon
- Pakai `sharp` untuk resize: logo 512×512 fit-inside PNG (preserve transparency), favicon 64×64 fit-inside PNG.
- `withoutEnlargement: true` → gambar kecil tidak di-upscale (tidak blur).
- `background: { r:0, g:0, b:0, alpha:0 }` → preserve alpha channel untuk PNG transparan.
- Simpan ke `/public/uploads/site/` (folder baru). Filename: `logo-{timestamp}-{uuid8}.png` / `favicon-{timestamp}-{uuid8}.png`.
- Limit: 4MB untuk logo, 2MB untuk favicon.
- Client component `ImageField` punya toggle **Upload vs URL** — upload langsung dari disk, atau paste URL eksternal.

### Comments Moderation UX
- **Stat cards** di atas (Total, Pending, Approved, Spam+Rejected) dengan gradient amber→orange→emerald→slate.
- **Filter tabs** URL-synced (`?status=all|pending|approved|rejected|spam`), pakai button-group styled (bukan shadcn Tabs karena Tabs client-side, kita perlu URL-driven).
- **Search** URL-synced (`?q=...`) — cari di `authorName`, `authorEmail`, atau `content` (Prisma `OR` clause).
- **Tabel**: kolom Komentar (content 3-line clamp + author + email + link ke artikel + createdAt + IP + parent flag), Status badge, Aksi.
- **Per-row aksi**: Approve (✓ emerald), Reject (✗ rose), Spam (⚑ slate), Delete (🗑 destructive). Tombol 8×8 px p-0, accessible aria-label. Kalau klik aksi yang sama dengan status saat ini, tampilkan toast info.
- **Bulk action bar**: muncul kalau ada yang dipilih. Approve Selected (outline), Reject Selected (rose outline), Spam Selected (slate outline), Delete Selected (destructive outline), Clear. Pakai AlertDialog untuk konfirmasi. Tombol "Approve Selected" di-bulk langsung approve tanpa konfirmasi tambahan (cukup konfirmasi bulk action).
- **Empty state** dengan icon MessageSquare + hint.
- **Indeterminate checkbox** di header row (shadcn Checkbox mendukung `'indeterminate'` value).
- Setiap aksi (per-row & bulk) pakai `router.refresh()` untuk reload server component, dan `clearSelection()` untuk reset checkbox.

### Settings Form UX
- 6 section cards dengan icon di header (Building2/Mail/Share2/UserCircle2/Newspaper/Copyright).
- Grid responsive: 1 column mobile, 2-3 columns di md+.
- Sticky submit bar di bottom (sticky bottom-4) — menampilkan status dirty (`Ada perubahan yang belum disimpan` vs `Semua perubahan tersimpan`) + tombol **Simpan Perubahan** (disabled jika !dirty atau saving). Gradient amber→orange.
- `useTransition` untuk loading state submit.
- Color select menampilkan swatch 3×3 px + label.
- Toast sonner sukses/error.

### Keputusan Penting
1. **Comments list dari server, bukan dari API** — server component fetch DB langsung (lebih cepat untuk initial render, SEO-friendly, menghindari loading skeleton). API endpoint `/api/admin/comments` tetap dibuat untuk konsistensi spec & untuk future client-side filtering (kalau mau pindah ke SPA mode).
2. **Search & filter URL-synced** via `router.replace()` + server re-render — pola sama dengan subscribers-table (Task 9). Tidak perlu state loading skeleton karena server langsung render data baru.
3. **Bulk action tidak pakai router.refresh() sebelum dialog close** — AlertDialog di-trigger dari tombol outline (disabled state `open`), refresh hanya setelah POST berhasil.
4. **Comments list max 200 items per page** di server fetch (simple, tanpa pagination UI). API endpoint punya pagination 25/page proper. Kalau komentar tumbuh banyak nanti, perlu tambah pagination UI di tabel — tapi untuk seed data 10 item cukup.
5. **SiteSetting PUT validation server-side**: `siteName` wajib (return 400 jika kosong), `primaryColor` divalidasi terhadap whitelist 8 warna, semua field punya `maxLength` (schema-level + server-level double safety).
6. **Upload endpoint tidak validate image dimension** — hanya tipe MIME & size. Sharp auto-resize regardless of input dimension.

## Verifikasi
- `bun run lint` → no errors ✓
- `bun run seed/seed-comments.ts` → sukses buat 10 komentar (PENDING 3 + APPROVED 3 + REJECTED 2 + SPAM 2) ✓
- `curl /admin/comments` (with cookie) → 200, HTML 156KB, semua nama author + status badge visible ✓
- `curl /admin/settings` (with cookie) → 200, HTML 91KB, semua section label + SiteSetting data terisi ✓
- API GET comments → 200 with 10 items ✓
- API POST moderate → 200 + previousStatus field ✓
- API POST moderate invalid status → 400 ✓
- API POST bulk approve → 200 affected=1 ✓
- API POST bulk empty ids → 400 ✓
- API POST bulk invalid action → 400 ✓
- API DELETE → 200 + 404 for missing ✓
- API PUT settings → 200 with updatedAt ✓
- API POST upload-logo → 200 url=/uploads/site/logo-{timestamp}-{uuid}.png ✓
- API POST upload-favicon → 200 url=/uploads/site/favicon-{timestamp}-{uuid}.png ✓
- Unauthenticated GET /admin/comments → 307 to /admin/login ✓
- Unauthenticated GET /admin/settings → 307 to /admin/login ✓
- Unauthenticated API calls → 307 (requireAdmin redirect) ✓
- Dev log clean — tidak ada error ✓

## Test End-to-End
1. Login via `/api/admin/login` dengan ADMIN_EMAIL/ADMIN_PASSWORD → dapat cookie `admin_session`
2. GET `/admin/comments` → render HTML dengan 10 komentar + 4 stat cards + filter tabs + search + table
3. GET `/admin/settings` → render HTML dengan 6 section cards, semua field pre-filled dari DB (siteName="Peredam Mobil Jakarta", tagline="Review Workshop...", logoUrl=https://peredammobiljakarta.com/.../logo.svg, dst)
4. POST `/api/admin/comments/{id}/moderate` body `{status:"APPROVED"}` → comment berubah status, dashboard re-fetch tampilkan status baru
5. POST `/api/admin/comments/bulk` body `{ids:[...],action:"spam"}` → multiple comments jadi SPAM
6. DELETE `/api/admin/comments/{id}` → comment dihapus, dashboard re-render
7. PUT `/api/admin/settings` body `{tagline:"..."}` → field update, toast sukses
8. POST `/api/admin/upload-logo` (multipart) → file tersimpan di `/public/uploads/site/`, return URL
9. Semua perubahan tersimpan di DB, dashboard re-render setelah action

## State Database Setelah Build
- Comments: 10 (PENDING 3, APPROVED 3, REJECTED 2, SPAM 2) — di-restore ke kondisi seed setelah testing
- SiteSetting: 1 (id="global", tagline di-restore ke "Review Workshop Peredam & Upgrade Audio Terbaik", semua field lain unchanged)
- Uploads: folder `/public/uploads/site/` dibuat (kosong setelah test cleanup)

## Catatan untuk Agent Berikutnya
1. **Front-end portal** harus baca SiteSetting dari DB untuk render header/footer/newsletter/copyright. Pakai pattern `db.siteSetting.upsert({ where: { id: 'global' }, update: {}, create: {} })` di server component (auto-create default). Lihat `src/app/admin/(dashboard)/settings/page.tsx` untuk pattern.
2. **Comments display** di artikel front-end: query `db.comment.findMany({ where: { articleId, status: "APPROVED" }, orderBy: [{ createdAt: "asc" }] })` — hanya tampilkan APPROVED.
3. **Public comment submit API** belum dibuat (perlu endpoint `/api/articles/[slug]/comments` POST di front-end, akan dibuat agent front-end). Validasi: authorName wajib, authorEmail format email, content minimal 5 char, status default PENDING. Optional: rate-limit via IP (field `ipAddress` sudah ada).
4. **primaryColor** di SiteSetting belum di-apply ke CSS — agent front-end perlu baca value (amber/red/emerald/slate/zinc/violet/rose/cyan) dan inject CSS variable di root atau gunakan Tailwind class dinamis. Untuk sekarang default amber/orange yang dipakai (dari globals.css).
5. **Logo/favicon** yang sudah di-upload via settings — front-end perlu baca `logoUrl` & `faviconUrl` dari SiteSetting dan inject ke `<link rel="icon">` dan `<img src={logoUrl}>`. Kalau null, fallback ke SVG default di `/public/`.
6. **Sidebar nav** sudah ada link `/admin/comments` (label "Komentar", icon MessageSquare) dan `/admin/settings` (label "Pengaturan", icon Settings) — lihat `src/components/admin/nav.tsx` line 53-66. Aktif otomatis via `isItemActive` di nav.tsx.
7. **Database sudah ter-sync** — `bun run db:push` tidak perlu dijalankan ulang (tidak ada perubahan schema, hanya tambah data + API).
