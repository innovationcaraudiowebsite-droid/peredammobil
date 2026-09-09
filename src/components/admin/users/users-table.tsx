'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { UserPlus, Search, Trash2, KeyRound, Edit3 } from 'lucide-react'

export type ProfileRow = {
  id: string
  email: string
  fullName: string | null
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  articleCount: number
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  editor: 'Editor',
  writer: 'Writer',
}

const ROLE_BADGE_CLASS: Record<string, string> = {
  admin: 'bg-amber-500 text-white',
  editor: 'bg-emerald-500 text-white',
  writer: 'bg-slate-500 text-white',
}

export function UsersTable({ initialProfiles }: { initialProfiles: ProfileRow[] }) {
  const [profiles, setProfiles] = useState<ProfileRow[]>(initialProfiles)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editProfile, setEditProfile] = useState<ProfileRow | null>(null)

  const filtered = profiles.filter((p) => {
    const matchesSearch =
      !search ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.fullName || '').toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || p.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari email atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Semua Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="writer">Writer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white">
          <UserPlus className="h-4 w-4 mr-2" />
          Tambah Akun
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Nama</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Artikel</th>
              <th className="px-4 py-3 text-left font-medium">Login Terakhir</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Tidak ada akun yang cocok.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{p.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.fullName || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_CLASS[p.role] || 'bg-slate-400 text-white'}`}>
                      {ROLE_LABELS[p.role] || p.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.isActive ? (
                      <Badge className="bg-emerald-500 text-white">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Nonaktif</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.articleCount}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {p.lastLoginAt ? formatRelative(p.lastLoginAt) : 'Belum pernah'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditProfile(p)}
                        title="Edit"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResetPassword(p.email)}
                        title="Reset Password"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(p)}
                        className="text-destructive hover:text-destructive"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(newProfile) => {
          setProfiles((prev) => [newProfile, ...prev])
          toast.success('Akun berhasil dibuat.')
        }}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        profile={editProfile}
        onOpenChange={(open) => !open && setEditProfile(null)}
        onUpdated={(updated) => {
          setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
          toast.success('Akun berhasil diperbarui.')
          setEditProfile(null)
        }}
      />
    </div>
  )
}

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Baru saja'
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} hari lalu`
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function handleResetPassword(email: string) {
  // Note: Implementasi reset password lewat dialog terpisah untuk UX lebih baik.
  // Untuk sekarang, prompt password baru sederhana.
  const newPassword = window.prompt(`Reset password untuk ${email}\n\nMasukkan password baru (min 8 karakter):`)
  if (!newPassword || newPassword.length < 8) {
    if (newPassword) toast.error('Password minimal 8 karakter.')
    return
  }
  try {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(email)}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    })
    if (!res.ok) throw new Error((await res.json()).message || 'Gagal reset password')
    toast.success('Password berhasil direset.')
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Gagal reset password')
  }
}

async function handleDelete(p: ProfileRow) {
  if (!confirm(`Hapus akun ${p.email}?\n\nTindakan ini tidak bisa dibatalkan.`)) return
  try {
    const res = await fetch(`/api/admin/users/${p.id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error((await res.json()).message || 'Gagal hapus')
    toast.success('Akun dihapus.')
    // Reload page to refresh list
    window.location.reload()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Gagal hapus akun')
  }
}

// ============================================================
//  Create User Dialog
// ============================================================
function CreateUserDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (profile: ProfileRow) => void
}) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('writer')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password || password.length < 8) {
      toast.error('Email dan password (min 8 char) wajib diisi.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, password, role }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.message || 'Gagal membuat akun')
      onCreated(data.profile)
      setEmail('')
      setFullName('')
      setPassword('')
      setRole('writer')
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat akun')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Akun Baru</DialogTitle>
          <DialogDescription>
            Buat akun admin/editor/writer baru. User akan terdaftar di Supabase Auth.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Budi Santoso"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 karakter"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator (full access)</SelectItem>
                <SelectItem value="editor">Editor (kelola semua artikel + komentar)</SelectItem>
                <SelectItem value="writer">Writer (cuma artikel miliknya)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white">
              {loading ? 'Menyimpan...' : 'Buat Akun'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
//  Edit User Dialog
// ============================================================
function EditUserDialog({
  profile,
  onOpenChange,
  onUpdated,
}: {
  profile: ProfileRow | null
  onOpenChange: (open: boolean) => void
  onUpdated: (profile: ProfileRow) => void
}) {
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('writer')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)

  // Sync state when profile changes
  useState(() => {
    if (profile) {
      setFullName(profile.fullName || '')
      setRole(profile.role)
      setIsActive(profile.isActive)
    }
  })

  if (!profile) {
    return (
      <Dialog open={false} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, role, isActive }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.message || 'Gagal update')
      onUpdated({
        ...profile,
        fullName,
        role,
        isActive,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal update akun')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!profile} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Akun: {profile.email}</DialogTitle>
          <DialogDescription>
            Ubah nama, role, dan status akun.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-fullName">Nama Lengkap</Label>
            <Input
              id="edit-fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama lengkap"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="writer">Writer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-border p-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} id="edit-active" />
            <div className="flex-1">
              <Label htmlFor="edit-active" className="cursor-pointer">
                Akun Aktif
              </Label>
              <p className="text-xs text-muted-foreground">
                Nonaktif untuk blokir login tanpa hapus akun.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
