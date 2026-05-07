'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Utensils, Eye, EyeOff, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [mode, setMode] = useState<'email' | 'pin'>('email')
  const [tenantSlug, setTenantSlug] = useState('demo-bistro')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantSlug) { toast.error('Enter restaurant slug'); return }

    setLoading(true)
    try {
      const result = mode === 'email'
        ? await adminApi.login(tenantSlug, email, password)
        : await adminApi.loginPin(tenantSlug, pin)

      setAuth(result.token, result.user, result.tenant)
      document.cookie = `tableflow-token=${result.token}; path=/; max-age=604800; SameSite=Lax`
      toast.success(`ยินดีต้อนรับ, ${result.user.name}!`)
      // Full reload so middleware sees the cookie on the very first server request
      window.location.href = '/'
    } catch (err: any) {
      toast.error(err.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">TableFlow</h1>
          <p className="text-gray-400 text-sm mt-1">Restaurant Management System</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
          {/* Mode toggle */}
          <div className="flex bg-gray-900 rounded-xl p-1 mb-6">
            {(['email', 'pin'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                  mode === m ? 'bg-orange-500 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                )}
              >
                {m === 'email' ? '📧 Email' : '🔢 PIN'}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Tenant slug */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Restaurant
              </label>
              <input
                type="text"
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                placeholder="demo-bistro"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>

            {mode === 'email' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@demo.com"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 pr-10 text-white text-sm placeholder-gray-600 outline-none focus:border-orange-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-2xl text-center tracking-[0.5em] placeholder-gray-600 outline-none focus:border-orange-500 transition-colors"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">Demo: owner@demo.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
