# Task 5 — Dashboard Layout Builder

Subagent untuk Task ID 5: Build Dashboard Layout & Overview Page.

## Ringkasan
Membangun layout admin (sidebar + header + sheet mobile) + halaman overview
dashboard dengan stat cards, charts (recharts), tabel artikel terbaru & paling
dibaca, serta quick actions.

## Keputusan Penting — Route Group `(dashboard)`
Spec awal menyuruh meletakkan `await requireAdmin()` di `app/admin/layout.tsx`,
namun hal itu akan menyebabkan **infinite redirect loop** karena `requireAdmin()`
redirect ke `/admin/login`, dan `/admin/login` adalah child dari `app/admin/`.

Solusi yang diambil: gunakan **route group** `(dashboard)`:
- `src/app/admin/layout.tsx` → pass-through (`<>{children}</>`) — wajib ada
  supaya spec path tetap dipenuhi, tapi tidak call `requireAdmin`.
- `src/app/admin/(dashboard)/layout.tsx` → layout asli (sidebar + header +
  `requireAdmin`). Hanya berlaku untuk halaman di dalam route group `(dashboard)`.
- `src/app/admin/(dashboard)/page.tsx` → halaman overview (URL: `/admin`).
- `src/app/admin/login/page.tsx` → halaman login TIDAK ada di route group
  `(dashboard)`, jadi hanya dapat pass-through layout, tanpa `requireAdmin`.
  ✅ Tidak ada redirect loop.

**PENTING untuk agent berikutnya** yang akan menambah halaman admin baru
(/admin/articles, /admin/categories, dll): taruh di dalam route group
`src/app/admin/(dashboard)/...` supaya otomatis diproteksi + dapat sidebar +
header. Jangan taruh di luar route group.

## File yang Dibuat
1. `src/components/admin/nav.tsx` — nav items array + NavLink client component
   - Export: `navSections`, `NavSection`, `NavItem`, `isItemActive`, `NavLink`,
     `SidebarNav`
   - Active item: `border-l-2 border-amber-500 bg-amber-500/10 text-amber-300`
2. `src/components/admin/logout-button.tsx` — client logout button (POST
   `/api/admin/logout` → router.push('/admin/login'))
   - Variants: `compact` (icon-only) & full (icon + "Logout")
3. `src/components/admin/breadcrumb.tsx` — client breadcrumb (usePathname →
   label Indonesia: Dashboard/Artikel/Kategori/Tag/FAQ/Komentar/Subscriber/
   Pengaturan/Tambah Baru/Edit/Detail)
4. `src/components/admin/sidebar.tsx` — `SidebarContent` (shared desktop +
   mobile): brand logo PMJ + nav + user card + logout di footer
5. `src/components/admin/shell.tsx` — `AdminShell`: desktop fixed sidebar
   (lg+, w-60) + mobile Sheet (controlled) + sticky header h-14 + main p-6
6. `src/app/admin/layout.tsx` — pass-through (lihat alasan di atas)
7. `src/app/admin/(dashboard)/layout.tsx` — `await requireAdmin()` + render
   `<AdminShell email={session.email}>`
8. `src/app/admin/(dashboard)/charts.tsx` — client: `MonthlyArticlesChart`
   (AreaChart, 12 bulan) + `CategoryViewsPie` (donut PieChart + legend custom)
9. `src/app/admin/(dashboard)/page.tsx` — server overview dashboard

## Struktur Layout (Visual)
```
┌─────────────────────────────────────────────────────────┐
│ Sidebar (slate-950, w-60, lg+ fixed)  │  Header (sticky)  │
│  ┌───┐ Portal Admin                    │  [☰] breadcrumb │  │
│  │PMJ│ Peredam Mobil Jakarta          │  user + logout   │
│  └───┘                                 │  ─────────────  │
│  Overview (active: amber-500)         │                  │
│  ─ Konten ─                            │  Main content    │
│  Semua Artikel                         │  (children, p-6) │
│  Tambah Artikel                        │                  │
│  Kategori / Tag / FAQ                  │                  │
│  ─ Interaksi ─                         │                  │
│  Komentar / Subscriber                 │                  │
│  ─ Sistem ─                            │                  │
│  Pengaturan                            │                  │
│  ────────────                          │                  │
│  [AD] admin@...                        │                  │
│  [Logout]                              │                  │
└────────────────────────────────────────┴──────────────────┘
```

## Overview Page (Halaman `/admin`)
Mengambil data via 11 query Prisma paralel (Promise.all):
- `db.article.count()` (total, by status PUBLISHED/DRAFT/ARCHIVED)
- `db.article.aggregate({ _sum: { viewCount: true } })`
- `db.subscriber.count({ where: { status: 'ACTIVE' } })`
- `db.comment.count({ where: { status: 'PENDING' } })`
- 5 artikel terbaru (orderBy createdAt desc, include category)
- 5 artikel top views (orderBy viewCount desc, include category)
- Artikel dalam 12 bulan terakhir (for monthly chart, diproses di JS)
- All categories + their articles' viewCount (for pie chart, di-sum di JS)

Yang dirender:
1. **Page heading** "Overview Dashboard" + timestamp update
2. **4 Stat Cards** (sm:grid-cols-2 lg:grid-cols-4):
   - Total Artikel (amber→orange gradient) — link ke /admin/articles
   - Published (emerald gradient) — link ke /admin/articles
   - Total Views (slate gradient, amber-300 icon)
   - Subscribers (orange→rose gradient) — link ke /admin/subscribers
3. **Charts row** (lg:grid-cols-3):
   - Card col-span-2: MonthlyArticlesChart (AreaChart 12 bulan, gradient
     amber fill)
   - Card col-span-1: CategoryViewsPie (donut, center label total views,
     legend custom 2-col)
4. **Quick Actions** card: tombol "+ Artikel Baru" → /admin/articles/new,
   "Kelola FAQ" → /admin/faq, "Moderasi Komentar" → /admin/comments
5. **2 Tables side-by-side** (lg:grid-cols-2, stacked on mobile):
   - Artikel Terbaru (title + status badge + relative date)
   - Paling Banyak Dibaca (rank #, title + category + publishedAt, view count)
6. **Mini stat grid** (4 cols): Drafts, Arsip, Komentar Pending, Subscriber
   Aktif

## Charts yang Dipakai (recharts 2.15.4)
- `AreaChart` + `Area` + `ResponsiveContainer` + `XAxis`/`YAxis`/`Tooltip`
  (linearGradient amber fill, dot, activeDot)
- `PieChart` + `Pie` (innerRadius=56, outerRadius=84, donut) + `Cell`
  (PALETTE amber/orange/slate 10 warna)
- Center label overlay (pointer-events-none) menampilkan total views
- Custom legend (HTML ul/li) untuk tampilan kategori + views + donut center

Color palette:
```ts
const PALETTE = [
  '#f59e0b', '#f97316', '#fb923c', '#fcd34d', '#fbbf24',
  '#ea580c', '#fdba74', '#fde68a', '#94a3b8', '#64748b',
]
```

## Verifikasi
- `bun run lint` → no errors ✓
- `POST /api/admin/login` with correct creds → 200 + cookie ✓
- `GET /admin` without cookie → 307 redirect to /admin/login ✓
- `GET /admin` with cookie → 200 (dashboard HTML 206KB) ✓
- `GET /admin/login` with cookie → 307 to /admin (login page sudah ada
  getSession() check yang redirect ke /admin kalau sudah auth) ✓
- `GET /admin/login` without cookie → 200 (login form render) ✓
- `GET /admin/articles` without cookie → 307 to /admin/login (middleware
  protects /admin/* except /admin/login) ✓
- `GET /admin/articles` with cookie → 404 (expected, agent lain akan build
  halaman ini) ✓
- Semua section HTML ada: Overview Dashboard, Total Artikel, Published,
  Total Views, Subscribers, Artikel Dipublikasi per Bulan, Views per
  Kategori, Artikel Terbaru, Paling Banyak Dibaca, Aksi Cepat, Portal
  Admin (sidebar), 7 nav links (/admin/articles, /admin/categories,
  /admin/tags, /admin/faq, /admin/comments, /admin/subscribers,
  /admin/settings)
- Dev log: tidak ada error baru (line 577-591: GET /admin 200, GET
  /admin/login 307, GET /admin/login 200, GET /admin/articles 404)
  "Ecmascript file had an error" di line 531-541 adalah STALE dari saat
  Task 4 develop middleware dengan node:crypto — sudah diperbaiki ke Web
  Crypto API sejak line 544.

## Catatan untuk Agent Berikutnya
1. **PATH PENTING**: Untuk halaman admin baru (articles, categories, tags,
   faq, comments, subscribers, settings), buat di:
   `src/app/admin/(dashboard)/{slug}/page.tsx`
   JANGAN buat di `src/app/admin/{slug}/page.tsx` — yang terakhir akan
   bypass `requireAdmin()` + sidebar + header.

2. **Komponen reusable yang sudah ada** (import dari `@/components/admin/*`):
   - `SidebarContent` (untuk custom chrome)
   - `AdminBreadcrumb` (auto-render di header)
   - `LogoutButton` (compact atau full)
   - `navSections` dari `@/components/admin/nav` (untuk reference path nav)

3. **Database masih kosong**: Article, Category, Comment, Faq, Subscriber,
   SiteSetting belum ada data. Overview dashboard menampilkan empty state
   yang graceful ("Belum ada artikel", "Belum ada data views", chart kosong
   dengan placeholder text).

4. **Stat card "Views Bulan Ini" diubah jadi "Total Views"**: Karena schema
   Article hanya punya `viewCount` (cumulative, tidak ada per-month tracking),
   tidak mungkin compute "views bulan ini" secara akurat. Untuk akurasi,
   ditampilkan "Total Views" sebagai sum seluruh viewCount.

5. **URL link yang ada di dashboard**:
   - `/admin/articles` (Semua Artikel) — 404 sampai agent lain build
   - `/admin/articles/new` (Tambah Artikel) — 404 sampai agent lain build
   - `/admin/articles/{id}/edit` — 404 sampai agent lain build
   - `/admin/faq` — 404
   - `/admin/comments` — 404
   - `/admin/subscribers` — 404
   - `/admin/settings` — 404
   - `/admin/categories`, `/admin/tags` — 404

   Semua link akan jadi 404 sampai agent lain build halaman target. Tidak
   ada placeholder page sengaja dibuat (sesuai instruksi: agent lain akan
   handle).

6. **Middleware match `/admin/:path*`** sudah protect SEMUA `/admin/*` kecuali
   `/admin/login`. Jadi halaman admin baru tidak perlu call `requireAdmin()`
   manual di page-nya — cukup taruh di route group `(dashboard)`.

7. **`requireAdmin()`** throw `redirect('/admin/login')` kalau belum auth.
   Dipanggil di `(dashboard)/layout.tsx`. `session.email` tersedia untuk
   dipass ke client component (AdminShell terima prop `email`).
