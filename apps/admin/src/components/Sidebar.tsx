'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ChefHat,
  CreditCard,
  UtensilsCrossed,
  Grid3X3,
  Users,
  BarChart3,
  LogOut,
  Utensils,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['OWNER', 'ADMIN'] },
  { href: '/kitchen', label: 'Kitchen', icon: ChefHat, roles: ['OWNER', 'ADMIN', 'KITCHEN'] },
  { href: '/cashier', label: 'Cashier', icon: CreditCard, roles: ['OWNER', 'ADMIN', 'CASHIER'] },
  { href: '/menu', label: 'Menu', icon: UtensilsCrossed, roles: ['OWNER', 'ADMIN'] },
  { href: '/tables', label: 'Tables', icon: Grid3X3, roles: ['OWNER', 'ADMIN', 'CASHIER'] },
  { href: '/staff', label: 'Staff', icon: Users, roles: ['OWNER', 'ADMIN'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['OWNER', 'ADMIN'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, tenant, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    document.cookie = 'tableflow-admin-auth=; path=/; max-age=0'
    router.push('/login')
  }

  const visibleItems = NAV_ITEMS.filter((item) => !user || item.roles.includes(user.role))

  return (
    <aside className="w-64 bg-gray-900 flex flex-col min-h-screen fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Utensils className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{tenant?.name ?? 'TableFlow'}</p>
            <p className="text-gray-500 text-xs capitalize">{user?.role?.toLowerCase() ?? 'staff'}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase() ?? 'U'}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
