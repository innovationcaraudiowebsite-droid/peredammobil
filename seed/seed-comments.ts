/**
 * Seed komentar dummy untuk moderasi.
 *
 * Generate 12 komentar dummy pada artikel random dengan status mix:
 *   PENDING (5), APPROVED (3), REJECTED (2), SPAM (2)
 *
 * Idempotent: setiap run hapus dulu komentar lama yang author email-nya
 * diawali "demo_" + diakhiri "@example.com" (marker seed).
 *
 * Usage: bun run seed/seed-comments.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

interface SeedComment {
  authorName: string
  authorEmail: string
  content: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM'
  daysAgo: number
}

const SEED_COMMENTS: SeedComment[] = [
  {
    authorName: 'Budi Santoso',
    authorEmail: 'demo_budi@example.com',
    content:
      'Mantap, akhirnya nemu artikel yang bahas peredam pintu lengkap. Workshopnya rekomendasi daerah mana ya untuk Jakarta Barat?',
    status: 'PENDING',
    daysAgo: 0,
  },
  {
    authorName: 'Sari Wulandari',
    authorEmail: 'demo_sari@example.com',
    content:
      'Sudah coba pasang butyl di pintu, beda banget suara audio jadi lebih solid. Thanks infonya!',
    status: 'APPROVED',
    daysAgo: 1,
  },
  {
    authorName: 'Andi Pratama',
    authorEmail: 'demo_andi@example.com',
    content:
      'Budget 2 juta bisa dapet hasil bagus nggak untuk peredam 4 pintu? Ada rekomendasi merk tapiyl vs foam?',
    status: 'PENDING',
    daysAgo: 1,
  },
  {
    authorName: 'Rina Marlina',
    authorEmail: 'demo_rina@example.com',
    content:
      'Workshop di Kalideres memang recommended, saya sudah 3x service di sana. Pengerjaan rapi & garansi jelas.',
    status: 'APPROVED',
    daysAgo: 2,
  },
  {
    authorName: 'Joko Widodo',
    authorEmail: 'demo_joko@example.com',
    content:
      'Artikel kurang detail soal ketebalan butyl. Ada minimum berapa mm yang efektif untuk meredam getaran door panel?',
    status: 'PENDING',
    daysAgo: 3,
  },
  {
    authorName: 'Promo Online',
    authorEmail: 'demo_promo@example.com',
    content:
      'KLIK DI SINI UNTUK DISKON 90%!!! Beli peredam mobil termurah hanya di toko kami bit.ly/peredam-promo',
    status: 'SPAM',
    daysAgo: 3,
  },
  {
    authorName: 'Dimas Anggara',
    authorEmail: 'demo_dimas@example.com',
    content:
      'Saya pakai DSP Audiocontrol, kombinasi sama peredam butyl+foam hasilnya juara. Treble jadi gak nyangkut.',
    status: 'APPROVED',
    daysAgo: 4,
  },
  {
    authorName: 'Haters Account',
    authorEmail: 'demo_haters@example.com',
    content:
      'Artikel sampah, gak berguna. Penulisnya gak ngerti otomotif. Mending baca blog lain.',
    status: 'REJECTED',
    daysAgo: 5,
  },
  {
    authorName: 'Free Money',
    authorEmail: 'demo_money@example.com',
    content:
      'SELAMAT! Anda mendapat hadiah $500 dari kami. Klaim sekarang di link ini: freemoney.scam.tk',
    status: 'SPAM',
    daysAgo: 7,
  },
  {
    authorName: 'Bayu Setiawan',
    authorEmail: 'demo_bayu@example.com',
    content:
      'Konten tentang perbandingan premium vs ekonomis kurang menyinggung soal garansi. Sebenarnya apa aja bedanya?',
    status: 'REJECTED',
    daysAgo: 9,
  },
]

async function main() {
  console.log('Seeding comments...')

  // Cleanup previous seed comments (marker email)
  const deleted = await db.comment.deleteMany({
    where: {
      authorEmail: { contains: '@example.com' },
      AND: [{ authorEmail: { startsWith: 'demo_' } }],
    },
  })
  if (deleted.count > 0) {
    console.log(`  Deleted ${deleted.count} previous seed comments.`)
  }

  // Ambil semua artikel PUBLISHED untuk dipilih secara random
  const articles = await db.article.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, title: true, slug: true },
  })
  if (articles.length === 0) {
    throw new Error('Tidak ada artikel PUBLISHED di DB. Jalankan `bun run seed/seed.ts` dulu.')
  }
  console.log(`  Found ${articles.length} PUBLISHED articles.`)

  // Distribusikan komentar ke artikel berbeda (round-robin)
  const created: { status: string; articleTitle: string }[] = []
  for (let i = 0; i < SEED_COMMENTS.length; i++) {
    const c = SEED_COMMENTS[i]
    const article = articles[i % articles.length]
    const createdAt = new Date(Date.now() - c.daysAgo * 24 * 60 * 60 * 1000)

    await db.comment.create({
      data: {
        articleId: article.id,
        authorName: c.authorName,
        authorEmail: c.authorEmail,
        content: c.content,
        status: c.status,
        ipAddress: `192.168.1.${(i % 200) + 10}`,
        createdAt,
      },
    })
    created.push({ status: c.status, articleTitle: article.title })
  }

  // Stats
  const byStatus = await db.comment.groupBy({
    by: ['status'],
    _count: { _all: true },
  })
  console.log('\nKomentar di DB setelah seed:')
  for (const s of byStatus) {
    console.log(`  ${s.status.padEnd(10)} = ${s._count._all}`)
  }

  console.log(`\nSeeded ${SEED_COMMENTS.length} komentar dummy selesai.`)
  console.log('Distribusi awal:')
  const initial = SEED_COMMENTS.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1
    return acc
  }, {})
  for (const [s, n] of Object.entries(initial)) {
    console.log(`  ${s.padEnd(10)} = ${n}`)
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
