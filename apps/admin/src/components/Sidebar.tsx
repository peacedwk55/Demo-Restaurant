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
  { href: '/',          label: 'Dashboard', labelTh: 'ภาพรวม',    icon: LayoutDashboard, roles: ['OWNER', 'ADMIN'] },
  { href: '/kitchen',   label: 'Kitchen',   labelTh: 'ครัว',       icon: ChefHat,         roles: ['OWNER', 'ADMIN', 'KITCHEN'] },
  { href: '/cashier',   label: 'Cashier',   labelTh: 'แคชเชียร์',  icon: CreditCard,      roles: ['OWNER', 'ADMIN', 'CASHIER'] },
  { href: '/menu',      label: 'Menu',      labelTh: 'เมนู',       icon: UtensilsCrossed, roles: ['OWNER', 'ADMIN'] },
  { href: '/tables',    label: 'Tables',    labelTh: 'โต๊ะ',       icon: Grid3X3,         roles: ['OWNER', 'ADMIN', 'CASHIER'] },
  { href: '/staff',     label: 'Staff',     labelTh: 'พนักงาน',    icon: Users,           roles: ['OWNER', 'ADMIN'] },
  { href: '/analytics', label: 'Analytics', labelTh: 'รายงาน',    icon: BarChart3,       roles: ['OWNER', 'ADMIN'] },
]

const ROLE_LABEL: Record<string, string> = {
  OWNER:   'เจ้าของร้าน',
  ADMIN:   'ผู้จัดการ',
  CASHIER: 'แคชเชียร์',
  KITCHEN: 'ครัว',
}

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, tenant, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    document.cookie = 'tableflow-token=; path=/; max-age=0'
    router.push('/login')
  }

  const visibleItems = NAV_ITEMS.filter((item) => !user || item.roles.includes(user.role))

  return (
    <aside className="w-64 bg-gray-900 flex flex-col min-h-screen fixed left-0 top-0 z-40 border-r border-gray-800/50">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-800/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-brand">
            <Utensils className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate leading-tight">
              {tenant?.name ?? 'TableFlow'}
            </p>
            <p className="text-gray-500 text-[11px] truncate mt-0.5">Restaurant Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const Icon    = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-orange-500 text-white shadow-brand'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110', isActive && 'scale-110')} />
              <span className="flex-1">{item.label}</span>
              {isActive && <span className="text-[10px] text-orange-200 font-normal">{item.labelTh}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-800/70">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl bg-gray-800/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate leading-tight">{user?.name}</p>
            <p className="text-gray-500 text-[10px] truncate mt-0.5">
              {ROLE_LABEL[user?.role ?? ''] ?? user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  )
}
