'use client'
import { useState } from 'react'
import { adminApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { Utensils, Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const DEMO_ACCOUNTS = [
  { label: 'เจ้าของร้าน', email: 'owner@demo.com',   color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { label: 'ครัว',        email: 'kitchen@demo.com',  color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { label: 'แคชเชียร์',  email: 'cashier@demo.com',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
]

export default function LoginPage() {
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
    if (!tenantSlug) { toast.error('กรุณากรอก Restaurant Slug'); return }
    setLoading(true)
    try {
      const result = mode === 'email'
        ? await adminApi.login(tenantSlug, email, password)
        : await adminApi.loginPin(tenantSlug, pin)
      setAuth(result.token, result.user, result.tenant)
      document.cookie = `tableflow-token=${result.token}; path=/; max-age=604800; SameSite=Lax`
      toast.success(`ยินดีต้อนรับ, ${result.user.name}!`)
      const role = result.user.role
      const dest = role === 'KITCHEN' ? '/kitchen' : role === 'CASHIER' ? '/cashier' : '/'
      window.location.href = dest
    } catch (err: any) {
      toast.error(err.message ?? 'เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const INPUT_CLASS = 'w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all'

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Subtle top accent */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600" />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brand">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">TableFlow</h1>
          <p className="text-gray-500 text-sm mt-1">ระบบจัดการร้านอาหาร</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Mode toggle */}
          <div className="flex bg-gray-900/60">
            {(['email', 'pin'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex-1 py-3 text-sm font-semibold transition-all',
                  mode === m
                    ? 'bg-gray-800 text-white border-b-2 border-orange-500'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {m === 'email' ? '✉️  Email' : '🔢  PIN'}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                Restaurant
              </label>
              <input
                type="text"
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                placeholder="demo-bistro"
                className={INPUT_CLASS}
                required
              />
            </div>

            {mode === 'email' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@demo.com"
                    className={INPUT_CLASS}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={cn(INPUT_CLASS, 'pr-11')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • •"
                  className={cn(INPUT_CLASS, 'text-2xl text-center tracking-[0.5em]')}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-brand mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>เข้าสู่ระบบ <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="mt-4 bg-gray-800/60 border border-gray-700/50 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3 text-center">
            Demo — รหัสผ่าน: password123
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => { setMode('email'); setEmail(acc.email); setPassword('password123') }}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-xs font-bold transition-all hover:scale-105 active:scale-95',
                  acc.color
                )}
              >
                <span>{acc.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
