import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { db } from '@/lib/db'

/**
 * Paket Layanan section — section id="paket".
 *
 * DINAMIS dari database (tabel products). Sebelumnya hardcode PACKAGES array,
 * sekarang fetch dari DB supaya admin bisa CRUD produk via dashboard
 * (/admin/products).
 *
 * Layout: horizontal card (gambar kiri 120×120 + konten kanan).
 * Tiap card punya CTA WhatsApp yang mengarah ke nomor WA produk tersebut
 * (product.waNumber).
 *
 * Filter: hanya produk dengan isActive=true, urut by order ASC.
 */

type Product = {
  id: string
  name: string
  description: string | null
  price: string | null
  category: string
  imageUrl: string | null
  imageAlt: string | null
  waNumber: string
  order: number
}

async function getActiveProducts(): Promise<Product[]> {
  try {
    const products = (await db.product.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        imageUrl: true,
        imageAlt: true,
        waNumber: true,
        order: true,
      },
    } as never)) as Product[]
    return products
  } catch (err) {
    console.error('[packages] fetch error:', err)
    return []
  }
}

export async function Packages() {
  const products = await getActiveProducts()

  return (
    <section id="paket" className="border-t border-border bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:py-20">
        {/* Section header */}
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Paket Layanan
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Pilih paket pengerjaan sesuai kebutuhan &amp; budget mobil Anda.
          </p>
        </div>

        {/* Vertical list — horizontal cards */}
        {products.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Belum ada produk aktif. Admin bisa tambah produk di{' '}
            <Link
              href="/admin/products/new"
              className="font-semibold text-brand hover:underline"
            >
              dashboard admin
            </Link>
            .
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {products.map((p) => {
              const waLink = `https://wa.me/${p.waNumber}?text=${encodeURIComponent(
                `Halo, saya tertarik ${p.name}. Mohon info harga & detail.`,
              )}`
              return (
                <li
                  key={p.id}
                  className="rounded-xl border border-border bg-card p-3 sm:p-4 transition-all duration-200 hover:shadow-md hover:border-brand/40"
                >
                  <div className="flex gap-3 sm:gap-4 items-start">
                    {/* Gambar kiri — aspect-square */}
                    <div className="shrink-0 relative overflow-hidden rounded-md bg-muted border border-border w-[100px] sm:w-[120px] aspect-square">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.imageAlt || p.name}
                          fill
                          sizes="(min-width: 640px) 120px, 100px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-brand/30 to-brand-dark/40">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
                            Peredam Mobil
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Konten kanan */}
                    <div className="min-w-0 flex-1">
                      {/* Badge kategori */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-block rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand dark:text-brand-light">
                          {p.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="mt-1.5 text-lg sm:text-xl font-bold leading-snug line-clamp-1">
                        {p.name}
                      </h3>

                      {/* Deskripsi */}
                      {p.description && (
                        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                          {p.description}
                        </p>
                      )}

                      {/* Harga + CTA WhatsApp */}
                      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        {/* Harga */}
                        {p.price && (
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Harga:
                            </span>
                            <span className="text-sm font-semibold text-brand dark:text-brand-light">
                              {p.price}
                            </span>
                          </div>
                        )}

                        {/* CTA WhatsApp per produk */}
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
                        >
                          <MessageCircle className="size-3.5" />
                          Pesan via WA
                        </a>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Note */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          * Harga bisa berubah, hubungi admin untuk estimasi khusus mobil Anda.
        </p>
      </div>
    </section>
  )
}
