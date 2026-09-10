'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { UserCircle, Save, KeyRound } from 'lucide-react'

export type ProfileData = {
  id: string
  email: string
  fullName: string | null
  role: string
  avatarUrl: string | null
  createdAt: string
  lastLoginAt: string | null
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

export function ProfileForm({ profile }: { profile: ProfileData }) {
  const [fullName, setFullName] = useState(profile.fullName || '')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.message || 'Gagal update')
      toast.success('Profil berhasil disimpan.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal update profil')
    } finally {
      setLoading(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password baru minimal 8 karakter.')
      return
    }
    if (!confirm('Ubah password akun Anda?')) return
    setPwLoading(true)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.message || 'Gagal ubah password')
      toast.success('Password berhasil diubah.')
      setNewPassword('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal ubah password')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Profile summary card */}
      <div className="md:col-span-1">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-xl font-bold text-white">
              {profile.email.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold">{profile.fullName || '—'}</h3>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_CLASS[profile.role] || 'bg-slate-400 text-white'}`}>
              {ROLE_LABELS[profile.role] || profile.role}
            </span>
          </div>
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Bergabung</dt>
              <dd>{new Date(profile.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Login Terakhir</dt>
              <dd>{profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum pernah'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Edit forms */}
      <div className="md:col-span-2 space-y-6">
        {/* Identity */}
        <form onSubmit={handleSaveProfile} className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <UserCircle className="h-5 w-5 text-amber-500" />
            Identitas
          </h2>
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama tampilan Anda"
            />
            <p className="text-xs text-muted-foreground">Nama ini akan tampil di header & sidebar admin.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled />
            <p className="text-xs text-muted-foreground">Email tidak bisa diubah. Hubungi admin kalau perlu.</p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>

        {/* Change password */}
        <form onSubmit={handleChangePassword} className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <KeyRound className="h-5 w-5 text-amber-500" />
            Ubah Password
          </h2>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Password Baru</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 karakter"
              minLength={8}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="outline" disabled={pwLoading}>
              <KeyRound className="h-4 w-4 mr-2" />
              {pwLoading ? 'Mengubah...' : 'Ubah Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
