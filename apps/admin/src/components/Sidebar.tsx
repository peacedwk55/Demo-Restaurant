'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ChefHat, CreditCard, UtensilsCrossed, Grid3X3, Users, BarChart3, LogOut, Utensils, MessageSquare } from 'lucide-react'
import { unlockAudio } from '@/lib/sound'

const NAV_ITEMS = [
  { href: '/',          label: 'Dashboard', icon: LayoutDashboard, roles: ['OWNER', 'ADMIN'] },
  { href: '/kitchen',   label: 'Kitchen',   icon: ChefHat,         roles: ['OWNER', 'ADMIN', 'KITCHEN'] },
  { href: '/cashier',   label: 'Cashier',   icon: CreditCard,      roles: ['OWNER', 'ADMIN', 'CASHIER'] },
  { href: '/menu',      label: 'Menu',      icon: UtensilsCrossed, roles: ['OWNER', 'ADMIN'] },
  { href: '/tables',    label: 'Tables',    icon: Grid3X3,         roles: ['OWNER', 'ADMIN', 'CASHIER'] },
  { href: '/staff',     label: 'Staff',     icon: Users,           roles: ['OWNER', 'ADMIN'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart3,       roles: ['OWNER', 'ADMIN'] },
  { href: '/reviews',   label: 'Reviews',   icon: MessageSquare,   roles: ['OWNER', 'ADMIN'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, tenant, logout } = useAuthStore()

  useEffect(() => {
    const unlock = () => { unlockAudio(); document.removeEventListener('click', unlock, true) }
    document.addEventListener('click', unlock, true)
    return () => document.removeEventListener('click', unlock, true)
  }, [])

  const handleLogout = () => {
    logout()
    document.cookie = 'tableflow-token=; path=/; max-age=0'
    window.location.href = '/login'
  }

  const visibleItems = NAV_ITEMS.filter(item => !user || item.roles.includes(user.role))

  return (
    <aside className="w-64 flex flex-col min-h-screen fixed left-0 top-0 z-40" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)' }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-extrabold text-sm truncate">{tenant?.name ?? 'TableFlow'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <p className="text-gray-400 text-xs capitalize">{user?.role?.toLowerCase() ?? 'staff'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-150',
                isActive
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-white' : 'text-gray-500')} />
              {item.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-500/30">
            <span className="text-white text-sm font-extrabold">{user?.name?.[0]?.toUpperCase() ?? 'U'}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-bold truncate">{user?.name}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-2xl text-sm font-medium text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}
