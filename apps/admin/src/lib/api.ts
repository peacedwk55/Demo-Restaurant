import { OrderDto, OrderStatus, ItemStatus, DashboardSummary, SalesDataPoint, PopularItem } from '@tableflow/types'
import { useAuthStore } from '@/store/auth.store'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  // 1. Try cookie (most reliable — always set on login, survives full reload)
  const cookieMatch = document.cookie.match(/(?:^|;\s*)tableflow-token=([^;]+)/)
  const cookieToken = cookieMatch?.[1]?.trim()
  if (cookieToken) return cookieToken
  // 2. Fallback: Zustand in-memory state
  const memToken = useAuthStore.getState().token
  if (memToken) return memToken
  // 3. Last resort: localStorage
  try {
    const raw = localStorage.getItem('tableflow-admin-auth')
    if (raw) return JSON.parse(raw)?.state?.token ?? null
  } catch {}
  return null
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  })

  if (res.status === 401) {
    useAuthStore.getState().logout()
    document.cookie = 'tableflow-token=; path=/; max-age=0'
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Network error' }))
    throw new Error(err.message ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export const adminApi = {
  login: (tenantSlug: string, email: string, password: string) =>
    request<{ token: string; user: any; tenant: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ tenantSlug, email, password }),
    }),

  loginPin: (tenantSlug: string, pin: string) =>
    request<{ token: string; user: any; tenant: any }>('/auth/login/pin', {
      method: 'POST',
      body: JSON.stringify({ tenantSlug, pin }),
    }),

  getMe: () => request<any>('/auth/me'),

  getOrders: (status?: string): Promise<OrderDto[]> =>
    request(`/admin/orders${status ? `?status=${status}` : ''}`),

  updateOrderStatus: (orderId: string, status: OrderStatus): Promise<OrderDto> =>
    request(`/admin/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  updateItemStatus: (orderId: string, itemId: string, status: ItemStatus) =>
    request(`/admin/orders/${orderId}/items/${itemId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  getTables: () => request<any[]>('/admin/tables'),

  updateTableStatus: (tableId: string, status: string) =>
    request(`/admin/tables/${tableId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  clearTable: (tableId: string) =>
    request(`/admin/tables/${tableId}/clear`, { method: 'PATCH' }),

  confirmPayment: (orderId: string, method: string, transactionRef?: string) =>
    request(`/admin/payments/${orderId}/confirm`, { method: 'POST', body: JSON.stringify({ method, transactionRef }) }),

  getAnalytics: (): Promise<DashboardSummary> => request('/admin/analytics/summary'),
  getSalesData: (days?: number): Promise<SalesDataPoint[]> => request(`/admin/analytics/sales${days ? `?days=${days}` : ''}`),
  getPopularItems: (): Promise<PopularItem[]> => request('/admin/analytics/popular-items'),

  getMenuCategories: () => request<any[]>('/admin/menu/categories'),
  getMenuItems: () => request<any[]>('/admin/menu/items'),
  createMenuItem: (data: any) => request('/admin/menu/items', { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: (id: string, data: any) => request(`/admin/menu/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  toggleItemAvailability: (id: string) => request(`/admin/menu/items/${id}/toggle-availability`, { method: 'PATCH' }),
  deleteMenuItem: (id: string) => request(`/admin/menu/items/${id}`, { method: 'DELETE' }),

  getPendingCalls: () => request<any[]>('/admin/staff-calls/pending'),
  resolveCall: (callId: string) => request(`/admin/staff-calls/${callId}/resolve`, { method: 'PATCH' }),
}
