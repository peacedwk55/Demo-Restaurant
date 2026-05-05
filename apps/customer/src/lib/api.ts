import {
  MenuDto,
  CreateOrderDto,
  OrderDto,
  PaymentDto,
  CreateReviewDto,
  StaffCallType,
  TableDto,
} from '@tableflow/types'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Network error' }))
    throw new Error(err.message ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  getMenu: (tenantSlug: string): Promise<MenuDto> =>
    request(`/public/${tenantSlug}/menu`),

  getTable: (tenantSlug: string, tableCode: string): Promise<TableDto> =>
    request(`/public/${tenantSlug}/tables/${tableCode}`),

  createOrder: (tenantSlug: string, dto: CreateOrderDto): Promise<OrderDto> =>
    request(`/public/${tenantSlug}/orders`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  getOrder: (tenantSlug: string, orderId: string): Promise<OrderDto> =>
    request(`/public/${tenantSlug}/orders/${orderId}`),

  getPayment: (tenantSlug: string, orderId: string): Promise<PaymentDto> =>
    request(`/public/${tenantSlug}/payments/${orderId}`),

  createReview: (tenantSlug: string, orderId: string, dto: CreateReviewDto) =>
    request(`/public/${tenantSlug}/reviews/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  callStaff: (tenantSlug: string, orderId: string, type: StaffCallType, message?: string) =>
    request(`/public/${tenantSlug}/orders/${orderId}/staff-call`, {
      method: 'POST',
      body: JSON.stringify({ type, message }),
    }),
}
