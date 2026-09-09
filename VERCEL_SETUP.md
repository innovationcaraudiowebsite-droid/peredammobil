# 🚀 Setup Vercel Environment Variables — Step by Step

File `.env.vercel` (di root project, **TIDAK ter-commit ke GitHub** karena sudah di-gitignore) berisi semua env vars yang dibutuhkan untuk deploy ke Vercel. Buka file itu secara lokal untuk lihat nilai asli, lalu copy-paste ke Vercel Dashboard.

## Cara Setup di Vercel

### Step 1: Buka Vercel Project Settings
1. Login ke https://vercel.com/dashboard
2. Klik project `peredammobiljakarta`
3. Tab **Settings** → **Environment Variables**

### Step 2: Add Each Variable

Untuk setiap env var di `.env.vercel` (buka file lokal), klik **Add New** dan isi. Penting: **centang ketiga environment** (Production, Preview, Development) untuk setiap var.

| Key | Value | Environments |
|-----|-------|--------------|
| `DATABASE_URL` | (lihat `.env.vercel` lokal) | Production + Preview + Development |
| `SUPABASE_URL` | (lihat `.env.vercel` lokal) | Production + Preview + Development |
| `SUPABASE_SECRET_KEY` | (lihat `.env.vercel` lokal) | Production + Preview + Development |
| `NEXT_PUBLIC_SUPABASE_URL` | (lihat `.env.vercel` lokal) | Production + Preview + Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | (lihat `.env.vercel` lokal) | Production + Preview + Development |
| `ADMIN_EMAIL` | (lihat `.env.vercel` lokal) | Production + Preview + Development |
| `ADMIN_PASSWORD` | (lihat `.env.vercel` lokal) | Production + Preview + Development |
| `ADMIN_SESSION_SECRET` | (lihat `.env.vercel` lokal) | Production + Preview + Development |
| `NEXT_PUBLIC_GA_ID` | (kosongkan dulu) | Production + Preview + Development |

### Step 3: Redeploy
1. Tab **Deployments**
2. Klik 3 titik di deployment terbaru → **Redeploy**
3. Tunggu 2-3 menit sampai status **Ready**

### Step 4: Test
Buka https://peredammobiljakarta.vercel.app:
- Homepage: harus tampil dengan 40 artikel + gambar
- `/admin/login`: form login muncul
- Login dengan credentials dari `.env.vercel` (ADMIN_EMAIL + ADMIN_PASSWORD)
- Setelah login → redirect ke `/admin` → dashboard tampil

## ⚠️ PENTING — Yang Paling Sering Salah

### DATABASE_URL — Port 6543 BUKAN 5432

❌ **SALAH** (tidak bisa connect dari Vercel):
```
DATABASE_URL=postgresql://postgres:PASSWORD@db.dxtxpobdnskdfqmlskyv.supabase.co:5432/postgres
```

✅ **BENAR** (transaction pooler, work di Vercel):
```
DATABASE_URL=postgresql://postgres.dxtxpobdnskdfqmlskyv:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Bedanya**:
- Host: `aws-0-ap-southeast-1.pooler.supabase.com` (BUKAN `db.{ref}.supabase.co`)
- Port: `6543` (BUKAN `5432`)
- Username: `postgres.dxtxpobdnskdfqmlskyv` (pakai prefix project ref)
- Query: `?pgbouncer=true&connection_limit=1` (wajib untuk Vercel serverless)

Cara dapat URL ini:
1. Buka https://supabase.com/dashboard/project/dxtxpobdnskdfqmlskyv
2. Tab **Project Settings** → **Database**
3. Section **Connection String** → **Connection Pooling** (Transaction Mode)
4. Copy URL di sana

## 🚨 Setelah Deploy Berhasil — Rotate Credentials!

Karena password + secret key sudah pernah di-share di chat publik, WAJIB:

1. **Ganti database password Supabase**
   - https://supabase.com/dashboard/project/dxtxpobdnskdfqmlskyv/settings/database
   - Klik **Reset database password**
   - Copy password baru
   - Update `DATABASE_URL` di Vercel (encode password baru: ganti `@` jadi `%40`)
   - Update `.env.vercel` lokal + `.env` lokal

2. **Rotate Supabase secret key**
   - https://supabase.com/dashboard/project/dxtxpobdnskdfqmlskyv/settings/api
   - Klik **Revoke & regenerate** secret key
   - Copy secret key baru
   - Update `SUPABASE_SECRET_KEY` di Vercel + `.env` lokal

3. **Ganti admin password** (lewat halaman `/admin/profile`)
   - Login sebagai admin
   - Buka `/admin/profile`
   - Form "Ubah Password" → isi password baru
   - Atau via Supabase Dashboard → Authentication → Users → klik user → Reset password

4. **Update `ADMIN_SESSION_SECRET`** (opsional tapi disarankan)
   - Generate baru: `openssl rand -hex 32`
   - Update di Vercel + `.env` lokal
   - Note: ini akan invalidate semua session yang ada (semua user harus login ulang)

5. **Revoke GitHub token lama**
   - https://github.com/settings/tokens
   - Delete token lama (yang pernah di-share)
   - Generate token baru, simpan di password manager

## 📋 Verification Checklist

Setelah deploy, test semuanya:

- [ ] Homepage `/` tampil dengan 40 artikel + gambar Supabase
- [ ] Search `/pencarian?q=peredam` jalan
- [ ] Kategori `/kategori/peredam-mobil` jalan
- [ ] Artikel detail `/berita/peredam-mobil/peredam-pintu-mobil-...` jalan
- [ ] `/admin/login` form muncul
- [ ] Login dengan admin credentials → redirect ke `/admin`
- [ ] Dashboard overview tampil (stat cards + charts + tables)
- [ ] `/admin/articles` list 40 artikel
- [ ] `/admin/users` list 1 user (admin)
- [ ] `/admin/profile` form edit profil
- [ ] `/admin/settings` form pengaturan situs
- [ ] `/admin/categories`, `/admin/tags`, `/admin/faq` jalan
- [ ] `/admin/comments` list komentar
- [ ] `/admin/subscribers` list subscriber
- [ ] `/sitemap.xml` return XML
- [ ] `/robots.txt` return text
- [ ] `/rss.xml` return RSS
- [ ] `/manifest.webmanifest` return JSON

Jika ada yang error, cek **Vercel Logs** (Dashboard → Logs) untuk detail error.
