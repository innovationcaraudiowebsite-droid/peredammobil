'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, LockKeyhole, Mail, ShieldAlert } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .min(6, 'Password minimal 6 karakter'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginValues) {
    setServerError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.ok) {
        const msg =
          data?.message ??
          (res.status === 401
            ? 'Email atau password salah.'
            : 'Gagal masuk. Silakan coba lagi.')
        setServerError(msg)
        toast({
          title: 'Login gagal',
          description: msg,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Berhasil masuk',
        description: 'Mengarahkan ke dashboard…',
      })
      // small delay so the toast can render before navigate
      setTimeout(() => router.push('/admin'), 250)
      // Fallback hard redirect in case router.push is intercepted
      setTimeout(() => {
        window.location.href = '/admin'
      }, 1500)
    } catch (err) {
      const msg = 'Koneksi gagal. Periksa jaringan Anda.'
      setServerError(msg)
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-white/10 bg-white/95 shadow-2xl backdrop-blur-xl">
      <CardHeader className="space-y-1.5 pb-2">
        <CardTitle className="text-xl text-slate-900">Masuk Dashboard</CardTitle>
        <CardDescription className="text-slate-600">
          Gunakan kredensial admin untuk mengelola konten portal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-800">
              Email
            </Label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="admin@peredammobiljakarta.com"
                className={cn(
                  'h-10 pl-9 bg-white',
                  errors.email && 'border-destructive',
                )}
                {...register('email')}
                disabled={submitting}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-800">
              Password
            </Label>
            <div className="relative">
              <LockKeyhole
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                className={cn(
                  'h-10 pl-9 bg-white',
                  errors.password && 'border-destructive',
                )}
                {...register('password')}
                disabled={submitting}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Inline server error */}
          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{serverError}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="h-10 w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold shadow-md hover:from-amber-600 hover:to-orange-700 focus-visible:ring-amber-500/40"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                <span>Memproses…</span>
              </>
            ) : (
              'Masuk Dashboard'
            )}
          </Button>

          <p className="text-center text-xs text-slate-500">
            Akses terbatas untuk admin authorized saja.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
