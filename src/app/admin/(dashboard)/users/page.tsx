import { requireSuperAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { UsersTable } from '@/components/admin/users/users-table'
import { ShieldCheck, UserPlus, Users as UsersIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  await requireSuperAdmin()

  let profiles: Array<{
    id: string
    email: string
    fullName: string | null
    role: string
    isActive: boolean
    lastLoginAt: Date | null
    createdAt: Date
    _count?: { articles: number }
  }> = []
  let stats = { total: 0, admin: 0, editor: 0, writer: 0, active: 0 }

  try {
    profiles = await db.profile.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { articles: true } } },
    })
    stats = {
      total: profiles.length,
      admin: profiles.filter((p) => p.role === 'admin').length,
      editor: profiles.filter((p) => p.role === 'editor').length,
      writer: profiles.filter((p) => p.role === 'writer').length,
      active: profiles.filter((p) => p.isActive).length,
    }
  } catch (err) {
    console.error('[admin/users] fetch error:', err)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl font-bold tracking-tight">Manajemen Akun</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola admin, editor, dan writer. Hanya role <strong>admin</strong> yang bisa mengakses halaman ini.
          </p>
        </div>
      </header>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Akun" value={stats.total} icon={UsersIcon} color="amber" />
        <StatCard label="Admin" value={stats.admin} icon={ShieldCheck} color="rose" />
        <StatCard label="Editor" value={stats.editor} icon={ShieldCheck} color="emerald" />
        <StatCard label="Writer" value={stats.writer} icon={ShieldCheck} color="slate" />
        <StatCard label="Aktif" value={stats.active} icon={ShieldCheck} color="cyan" />
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
          <h2 className="text-sm font-semibold">Daftar Akun</h2>
        </div>
        <UsersTable
          initialProfiles={profiles.map((p) => ({
            id: p.id,
            email: p.email,
            fullName: p.fullName,
            role: p.role,
            isActive: p.isActive,
            lastLoginAt: p.lastLoginAt?.toISOString() || null,
            createdAt: p.createdAt.toISOString(),
            articleCount: p._count?.articles || 0,
          }))}
        />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: 'amber' | 'rose' | 'emerald' | 'slate' | 'cyan'
}) {
  const colorClass = {
    amber: 'from-amber-500 to-orange-600',
    rose: 'from-rose-500 to-pink-600',
    emerald: 'from-emerald-500 to-green-600',
    slate: 'from-slate-500 to-slate-700',
    cyan: 'from-cyan-500 to-blue-600',
  }[color]
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${colorClass} text-white`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  )
}
