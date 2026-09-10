# 🚀 Setup Vercel Environment Variables — Step by Step

File `.env.vercel` (di root project, **TIDAK ter-commit ke GitHub**) berisi semua env vars yang dibutuhkan untuk deploy ke Vercel. Buka file tersebut secara lokal, lalu copy-paste setiap var ke Vercel Dashboard.

## 📍 Lokasi File

```
/home/z/my-project/.env.vercel
```

**PENTING**: File ini TIDAK akan ter-push ke GitHub (sudah di-gitignore). Aman berisi credentials asli.

---

## 🎯 Cara Setup di Vercel (3 Menit)

### Step 1: Buka Vercel Dashboard

1. Login ke https://vercel.com/dashboard
2. Klik project **peredammobiljakarta**
3. Tab **Settings** (di atas)
4. Sidebar kiri → **Environment Variables**

### Step 2: Add 7 Variables

Untuk setiap var di `.env.vercel`, klik tombol **Add New** dan isi:

| # | Key | Value | Environments |
|---|-----|-------|-------------|
| 1 | `SUPABASE_URL` | `https://dxtxpobdnskdfqmlskyv.supabase.co` | Production + Preview + Development |
| 2 | `SUPABASE_SECRET_KEY` | `[REDACTED-SECRET-KEY]` | Production + Preview + Development |
| 3 | `NEXT_PUBLIC_SUPABASE_URL` | `https://dxtxpobdnskdfqmlskyv.supabase.co` | Production + Preview + Development |
| 4 | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `[REDACTED-PUBLISHABLE-KEY]` | Production + Preview + Development |
| 5 | `ADMIN_EMAIL` | `admin@peredammobiljakarta.com` | Production + Preview + Development |
| 6 | `ADMIN_PASSWORD` | `[REDACTED-PASSWORD]` | Production + Preview + Development |
| 7 | `ADMIN_SESSION_SECRET` | `[REDACTED-SECRET]` | Production + Preview + Development |

**PENTING**: Untuk setiap var, **centang ketiga environment** (Production, Preview, Development) — bukan "Production only".

### Step 3: Redeploy

1. Tab **Deployments** (di atas)
2. Klik deployment terbaru (atau 3-titik → Redeploy)
3. Tunggu 2-3 menit sampai status **Ready**

### Step 4: Test

Buka URL ini untuk verify:
```
https://peredammobiljakarta.vercel.app/api/health
```

Response seharusnya:
```json
{
  "env": {
    "SUPABASE_URL": "PRESENT (40 chars, https://dx...)",
    "SUPABASE_SECRET_KEY": "PRESENT (41 chars, sb_secret_...)",
    ...
  },
  "database": {
    "ok": true,
    "articles": 40,
    "profiles": 1,
    "categories": 4,
    "faqs": 10
  },
  "storage": {
    "ok": true,
    "buckets": ["articles-featured", "articles-inline", "site-assets"]
  },
  "diagnosis": {
    "hasAllRequiredEnvVars": true,
    "hasArticles": true,
    "message": "DB connection OK. Articles found. Homepage should display them."
  }
}
```

### Step 5: Test Homepage

Buka https://peredammobiljakarta.vercel.app/

✅ Seharusnya tampil:
- 40 artikel dengan gambar dari Supabase Storage
- 4 kategori sections
- Paling Banyak Dibaca, Topik Populer
- FAQ accordion
- Footer dengan alamat Innovation Car Audio Kalideres

### Step 6: Test Admin Login

Buka https://peredammobiljakarta.vercel.app/admin/login

- Email: `admin@peredammobiljakarta.com`
- Password: `[REDACTED-PASSWORD]`

Setelah login → redirect ke `/admin` (dashboard overview dengan stat cards + charts).

---

## ⚠️ Yang Paling Sering Salah

### 1. Hanya centang "Production" (TIDAK BOLEH)

Env vars yang hanya Production-only tidak akan available di Preview branches (untuk PR testing) dan Development (untuk `vercel dev` lokal). Selalu centang ketiga environment.

### 2. Ada spasi sebelum/after value

Copy-paste kadang bawa whitespace yang tidak terlihat. Pastikan value bersih.

Contoh SALAH: `[REDACTED-SECRET-KEY] ` (ada spasi di akhir)
Contoh BENAR: `[REDACTED-SECRET-KEY]` (tanpa spasi)

### 3. Tidak ada DATABASE_URL (tidak masalah)

Karena Prisma sudah dihapus (commit `9234c54`), `DATABASE_URL` tidak diperlukan. Kalau ada di Vercel, biarkan saja (tidak digunakan).

---

## 🚨 Setelah Deploy Berhasil — Rotate Credentials!

Karena password + secret key sudah pernah di-share di chat publik, WAJIB:

### 1. Ganti Database Password Supabase
- https://supabase.com/dashboard/project/dxtxpobdnskdfqmlskyv/settings/database
- Klik **Reset database password**
- Copy password baru (encode `@` jadi `%40` kalau ada)
- Update `.env.vercel` lokal + `.env` lokal
- (Database URL tidak dipakai aplikasi kita sekarang, jadi tidak perlu update Vercel)

### 2. Rotate Supabase Secret Key
- https://supabase.com/dashboard/project/dxtxpobdnskdfqmlskyv/settings/api
- Klik **Revoke & regenerate** secret key
- Copy secret key baru
- Update `.env.vercel` lokal + `.env` lokal
- Update `SUPABASE_SECRET_KEY` di Vercel env vars
- Redeploy

### 3. Ganti Admin Password (via UI)
- Login ke https://peredammobiljakarta.vercel.app/admin/login (pakai password lama)
- Buka `/admin/profile`
- Form "Ubah Password" → isi password baru (min 8 char)
- Save

### 4. Update ADMIN_SESSION_SECRET (opsional, disarankan)
```bash
# Generate baru
openssl rand -hex 32
```
Update di Vercel + `.env` lokal. Semua session akan invalidate (semua user harus login ulang).

### 5. Revoke GitHub Token Lama
- https://github.com/settings/tokens
- Delete token `[REDACTED-GITHUB-TOKEN]`
- Generate token baru, simpan di password manager

---

## 📋 Verification Checklist

Setelah deploy + setup env vars, test semuanya:

- [ ] `/api/health` → `env.SUPABASE_SECRET_KEY` = "PRESENT..."
- [ ] `/api/health` → `database.ok` = true, `database.articles` = 40
- [ ] `/api/health` → `storage.ok` = true, 3 buckets listed
- [ ] `/` (homepage) → tampil 40 artikel + gambar Supabase
- [ ] `/admin/login` → form login muncul
- [ ] Login dengan `admin@peredammobiljakarta.com` + password → redirect ke `/admin`
- [ ] `/admin` → dashboard overview tampil (stats + charts)
- [ ] `/admin/articles` → list 40 artikel
- [ ] `/admin/users` → 1 user (admin)
- [ ] `/admin/profile` → form edit profil sendiri
- [ ] `/admin/settings` → form pengaturan situs
- [ ] `/berita/peredam-mobil/peredam-pintu-mobil-...` → artikel detail jalan
- [ ] `/kategori/peredam-mobil` → kategori page jalan
- [ ] `/sitemap.xml` → valid XML
- [ ] `/rss.xml` → valid RSS
- [ ] `/robots.txt` → text file

Jika ada yang error, cek **Vercel Logs** (Dashboard → Logs) untuk detail error.
