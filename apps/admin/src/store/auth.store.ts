import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserRole } from '@tableflow/types'

interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl: string | null
}

interface AuthTenant {
  id: string
  slug: string
  name: string
  logoUrl: string | null
}

interface AuthStore {
  token: string | null
  user: AuthUser | null
  tenant: AuthTenant | null
  isAuthenticated: boolean
  hasHydrated: boolean

  setAuth: (token: string, user: AuthUser, tenant: AuthTenant) => void
  logout: () => void
  setHasHydrated: (v: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      tenant: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (token, user, tenant) => set({ token, user, tenant, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, tenant: null, isAuthenticated: false }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'tableflow-admin-auth',
      onRehydrateStorage: () => (state) => { state?.setHasHydrated(true) },
    }
  )
)
