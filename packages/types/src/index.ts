// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export type Plan = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
export type UserRole = 'OWNER' | 'ADMIN' | 'CASHIER' | 'KITCHEN'
export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'PAYMENT_PENDING' | 'CLEANING'
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED'
export type ItemStatus = 'PENDING' | 'PREPARING' | 'DONE' | 'CANCELLED'
export type PaymentMethod = 'PROMPTPAY' | 'CASH' | 'CREDIT_CARD' | 'STRIPE'
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED'
export type StaffCallType = 'ASSISTANCE' | 'PAYMENT' | 'WATER' | 'CUSTOM'
export type OptionGroupType = 'SINGLE' | 'MULTIPLE'

// ─────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ─────────────────────────────────────────────
// TENANT
// ─────────────────────────────────────────────

export interface TenantPublic {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  bannerUrl: string | null
  primaryColor: string
  currency: string
  timezone: string
  googleMapsUrl: string | null
}

// ─────────────────────────────────────────────
// MENU
// ─────────────────────────────────────────────

export interface CategoryDto {
  id: string
  name: string
  nameEn: string | null
  icon: string | null
  imageUrl: string | null
  sortOrder: number
  itemCount: number
}

export interface OptionDto {
  id: string
  name: string
  nameEn: string | null
  priceAdjust: number
  isDefault: boolean
  sortOrder: number
}

export interface OptionGroupDto {
  id: string
  name: string
  nameEn: string | null
  type: OptionGroupType
  required: boolean
  minSelect: number
  maxSelect: number
  sortOrder: number
  options: OptionDto[]
}

export interface MenuItemDto {
  id: string
  categoryId: string
  name: string
  nameEn: string | null
  description: string | null
  price: number
  imageUrl: string | null
  isAvailable: boolean
  isPopular: boolean
  isNew: boolean
  preparationTime: number | null
  calories: number | null
  sortOrder: number
  optionGroups: OptionGroupDto[]
}

export interface MenuDto {
  tenant: TenantPublic
  categories: CategoryDto[]
  items: MenuItemDto[]
}

// ─────────────────────────────────────────────
// TABLES
// ─────────────────────────────────────────────

export interface TableDto {
  id: string
  code: string
  name: string
  capacity: number
  zone: string | null
  status: TableStatus
  qrCodeUrl: string | null
}

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────

export interface CartItem {
  menuItemId: string
  menuItemName: string
  menuItemImage: string | null
  quantity: number
  unitPrice: number
  notes?: string
  selectedOptions: CartItemOption[]
}

export interface CartItemOption {
  optionId: string
  optionGroupId: string
  name: string
  priceAdjust: number
}

export interface CreateOrderDto {
  tableId: string
  sessionCode: string
  items: CreateOrderItemDto[]
  notes?: string
}

export interface CreateOrderItemDto {
  menuItemId: string
  quantity: number
  unitPrice: number
  notes?: string
  options: CreateOrderItemOptionDto[]
}

export interface CreateOrderItemOptionDto {
  optionId: string
  name: string
  priceAdjust: number
}

export interface OrderItemOptionDto {
  id: string
  name: string
  priceAdjust: number
}

export interface OrderItemDto {
  id: string
  menuItemId: string
  menuItemName: string
  menuItemImage: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  notes: string | null
  status: ItemStatus
  options: OrderItemOptionDto[]
}

export interface OrderDto {
  id: string
  tenantId: string
  tableId: string
  tableCode: string
  tableName: string
  sessionCode: string
  orderNumber: number
  status: OrderStatus
  totalAmount: number
  notes: string | null
  items: OrderItemDto[]
  createdAt: string
  updatedAt: string
}

export interface UpdateOrderStatusDto {
  status: OrderStatus
}

export interface UpdateItemStatusDto {
  status: ItemStatus
}

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────

export interface PaymentDto {
  id: string
  orderId: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  promptPayQrUrl: string | null
  transactionRef: string | null
  confirmedAt: string | null
}

export interface ConfirmPaymentDto {
  method: PaymentMethod
  transactionRef?: string
}

// ─────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────

export interface CreateReviewDto {
  rating: number
  emoji?: string
  comment?: string
}

export interface ReviewDto {
  id: string
  rating: number
  emoji: string | null
  comment: string | null
  redirectedToGoogle: boolean
  createdAt: string
}

// ─────────────────────────────────────────────
// STAFF CALLS
// ─────────────────────────────────────────────

export interface CreateStaffCallDto {
  type: StaffCallType
  message?: string
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export interface LoginDto {
  tenantSlug: string
  email: string
  password: string
}

export interface LoginPinDto {
  tenantSlug: string
  pin: string
}

export interface AuthResponseDto {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    avatarUrl: string | null
  }
  tenant: {
    id: string
    slug: string
    name: string
    logoUrl: string | null
  }
}

export interface JwtPayload {
  sub: string
  tenantId: string
  role: UserRole
  iat: number
  exp: number
}

// ─────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────

export interface DashboardSummary {
  todaySales: number
  todayOrders: number
  activeTables: number
  totalTables: number
  avgOrderValue: number
  pendingOrders: number
  salesChange: number
  ordersChange: number
}

export interface SalesDataPoint {
  date: string
  sales: number
  orders: number
}

export interface PopularItem {
  menuItemId: string
  name: string
  imageUrl: string | null
  totalOrdered: number
  totalRevenue: number
}

// ─────────────────────────────────────────────
// WEBSOCKET EVENTS
// ─────────────────────────────────────────────

export const WS_EVENTS = {
  // Server → Client
  ORDER_NEW: 'order:new',
  ORDER_UPDATED: 'order:updated',
  ORDER_ITEM_UPDATED: 'order:item_updated',
  TABLE_UPDATED: 'table:updated',
  STAFF_CALL: 'staff:call',
  PAYMENT_CONFIRMED: 'payment:confirmed',
  PAYMENT_REQUESTED: 'payment:requested',

  // Client → Server
  JOIN_RESTAURANT: 'join:restaurant',
  JOIN_TABLE: 'join:table',
  LEAVE_TABLE: 'leave:table',
} as const

export type WsEventName = (typeof WS_EVENTS)[keyof typeof WS_EVENTS]

export interface WsOrderNewPayload {
  order: OrderDto
  tenantId: string
}

export interface WsOrderUpdatedPayload {
  orderId: string
  status: OrderStatus
  tenantId: string
}

export interface WsTableUpdatedPayload {
  tableId: string
  code: string
  status: TableStatus
  tenantId: string
}

export interface WsStaffCallPayload {
  callId: string
  orderId: string
  tableCode: string
  tableName: string
  type: StaffCallType
  message: string | null
  tenantId: string
}

export interface WsPaymentRequestPayload {
  orderId: string
  tableCode: string
  tableName: string
  amount: number
  tenantId: string
}
