# Task ID 4 — Build Admin Auth Sederhana

**Agent:** Admin Auth Builder
**Status:** ✅ Selesai & terverifikasi end-to-end

## Ringkasan
Auth sederhana berbasis env var (1 akun admin) dengan cookie session httpOnly + middleware proteksi `/admin/*`. Tidak menggunakan NextAuth, tidak menambah package baru (cukup `node:crypto` + Web Crypto API).

## File yang Dibuat
1. `/home/z/my-project/src/lib/auth.ts` — server-only utility (login, createSessionToken, verifySessionToken, setSessionCookie, clearSessionCookie, getSession, requireAdmin)
2. `/home/z/my-project/src/middleware.ts` — protect `/admin/*` kecuali `/admin/login`, verifikasi HMAC pakai Web Crypto API (Edge-runtime compatible)
3. `/home/z/my-project/src/app/admin/login/page.tsx` — server component, redirect ke `/admin` kalau sudah login, gradient amber
4. `/home/z/my-project/src/app/admin/login/form.tsx` — client form (react-hook-form + zod), submit ke `/api/admin/login`, toast error, loading state
5. `/home/z/my-project/src/app/api/admin/login/route.ts` — POST endpoint, verifikasi kredensial, set httpOnly cookie
6. `/home/z/my-project/src/app/api/admin/logout/route.ts` — POST endpoint, clear cookie

## Env Vars Ditambahkan ke `.env` (APPEND, tidak overwrite)
```
ADMIN_EMAIL=admin@peredammobiljakarta.com
ADMIN_PASSWORD=k4FWnxeIW47NVUUS
ADMIN_SESSION_SECRET=29d4fd65722583c6842af1990ed8aa40
```

## Endpoint API
- `POST /api/admin/login` — body `{email, password}` → 200 `{ok:true}` + set cookie, atau 401/400 `{ok:false, message}`
- `POST /api/admin/logout` → 200 `{ok:true}` + clear cookie

## Token Format
`base64url(JSON{email,exp,nonce}).base64url(HMAC-SHA256(payload, ADMIN_SESSION_SECRET))`
- HMAC dihitung di atas string `base64url(payload)` (string signature, bukan JSON)
- Verifikasi di middleware pakai `crypto.subtle.verify` (Web Crypto API, Edge-compatible)
- Verifikasi di lib/auth.ts pakai `createHmac('sha256')` (node:crypto, server-only)
- Exp 7 hari, juga dicek email match `process.env.ADMIN_EMAIL` (rotasi password otomatis invalidate session lama)

## Catatan Penting untuk Agent Lain
- **Dashboard agent (Task 5+)**: Jangan buat `/admin/page.tsx` sendiri tanpa pakai `requireAdmin()` di server component root layout. Contoh:
  ```ts
  // src/app/admin/layout.tsx (server component)
  import { requireAdmin } from '@/lib/auth'
  export default async function AdminLayout({ children }) {
    const session = await requireAdmin() // throw redirect ke /admin/login kalau belum auth
    return <div>...sidebar + {children}</div>
  }
  ```
- **Logout button**: Panggil `POST /api/admin/logout` lalu `router.push('/admin/login')` di client. Token name cookie: `admin_session`.
- **Tidak ada `/admin/page.tsx`** dibuat di task ini (sesuai instruksi). Saat ini `/admin` setelah login mengembalikan 404 — itu expected, menunggu Task 5.
- **Middleware jalan di Edge Runtime default** — jangan import `node:crypto` atau Prisma di middleware. Web Crypto API (`crypto.subtle`) sudah cukup.
- **Cookie**: httpOnly, path=/, sameSite=lax, maxAge=7 hari (604800 detik), secure=auto (production only).
- **Tidak ada package baru yang diinstall** — semua pakai bawaan Node/browser crypto.

## Verifikasi End-to-End (curl)
```
POST /api/admin/login (wrong)  → 401 {"ok":false,"message":"Email atau password salah."}
POST /api/admin/login (correct)→ 200 {"ok":true"} + Set-Cookie: admin_session (162 chars)
GET  /admin (no cookie)         → 307 redirect to /admin/login
GET  /admin (with cookie)       → 404 (middleware PASS, dashboard belum ada — Task 5)
POST /api/admin/logout          → 200 {"ok":true"} + clear cookie
GET  /admin (after logout)      → 307 redirect to /admin/login
GET  /admin/articles (no auth)  → 307 redirect to /admin/login
POST /api/admin/login (empty)   → 400 {"ok":false,"message":"Email dan password wajib diisi."}
GET  /                          → 200 (portal front-end tidak diproteksi)
GET  /admin/login (already auth)→ redirect ke /admin (lewat server component)
```

## Lint & Build
- `bun run lint` → no errors ✅
- Dev server log → no fresh errors (warning `node:crypto` di log adalah stale entry dari versi middleware lama sebelum fix ke Web Crypto API)
