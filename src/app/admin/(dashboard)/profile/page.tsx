import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ProfileForm } from '@/components/admin/profile/profile-form'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await requireAdmin()

  let profile: {
    id: string
    email: string
    fullName: string | null
    role: string
    avatarUrl: string | null
    createdAt: Date
    lastLoginAt: Date | null
  } | null = null

  try {
    profile = await db.profile.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })
  } catch (err) {
    console.error('[admin/profile] fetch error:', err)
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Profil Saya</h1>
        <p className="text-muted-foreground">Profil tidak ditemukan. Hubungi admin.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Profil Saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola nama tampilan, avatar, dan password akun Anda.
        </p>
      </header>
      <ProfileForm
        profile={{
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName,
          role: profile.role,
          avatarUrl: profile.avatarUrl,
          createdAt: profile.createdAt.toISOString(),
          lastLoginAt: profile.lastLoginAt?.toISOString() || null,
        }}
      />
    </div>
  )
}
