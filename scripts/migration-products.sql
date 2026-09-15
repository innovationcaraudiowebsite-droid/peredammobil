-- Migration: Create products table for landing page Section 4 (Paket Layanan)
-- Jalankan di Supabase Dashboard → SQL Editor
--
-- Tabel ini menyimpan produk yang akan tampil di landing page Section 4.
-- Di-manage via admin dashboard /admin/products.

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  category TEXT NOT NULL DEFAULT 'Paket Layanan',
  image_url TEXT,
  image_alt TEXT,
  wa_number TEXT NOT NULL DEFAULT '6282111222989',
  order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index untuk query orderBy order ASC
CREATE INDEX IF NOT EXISTS idx_products_order ON products(order ASC);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Enable RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: public bisa SELECT produk aktif (untuk landing page)
-- Admin (service_role) bypass RLS, jadi tidak perlu policy untuk admin
CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DATA: 4 produk contoh (Paket 4 Pintu, Full Kabin, Kap Mesin, Wheel Housing)
-- ============================================================

INSERT INTO products (name, description, price, category, image_url, wa_number, order, is_active)
VALUES
  (
    'Paket 4 Pintu',
    'Peredam 4 pintu dengan butyl 2mm + foam absorber. Audio speaker jernih, suara jalan berkurang.',
    'Hubungi Admin',
    'Paket Layanan',
    'https://dxtxpobdnskdfqmlskyv.supabase.co/storage/v1/object/public/site-assets/landing/paket-4-pintu.png',
    '6282111222989',
    1,
    true
  ),
  (
    'Paket Full Kabin',
    'Peredam lantai + 4 pintu + plafon. Redam derau jalan, mesin, dan getaran body secara menyeluruh.',
    'Hubungi Admin',
    'Paket Layanan',
    'https://dxtxpobdnskdfqmlskyv.supabase.co/storage/v1/object/public/site-assets/landing/paket-full-kabin.png',
    '6282111222989',
    2,
    true
  ),
  (
    'Paket Kap Mesin',
    'Peredam kap mesin + firewall dengan heat barrier + butyl. Kurangi panas & derau mesin masuk kabin.',
    'Hubungi Admin',
    'Paket Layanan',
    'https://dxtxpobdnskdfqmlskyv.supabase.co/storage/v1/object/public/site-assets/landing/paket-kap-mesin.png',
    '6282111222989',
    3,
    true
  ),
  (
    'Paket Wheel Housing',
    'Peredam wheel housing (4 fender) dengan butyl tebal + foam. Redam suara ban & suspensi di jalan rusak.',
    'Hubungi Admin',
    'Paket Layanan',
    'https://dxtxpobdnskdfqmlskyv.supabase.co/storage/v1/object/public/site-assets/landing/paket-wheel-housing.png',
    '6282111222989',
    4,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Catatan: setelah run migration ini, buka /admin/products untuk kelola produk.
-- Gambar paket sudah ada di Supabase Storage (dari sesi sebelumnya).
