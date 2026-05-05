'use client'
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { WS_EVENTS, OrderDto, WsStaffCallPayload } from '@tableflow/types'
import { useAuthStore } from '@/store/auth.store'

let socket: Socket | null = null

function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
    })
  }
  return socket
}

interface UseAdminSocketOptions {
  onOrderNew?: (payload: { order: OrderDto }) => void
  onOrderUpdated?: (payload: { orderId: string; status: string }) => void
  onTableUpdated?: (payload: { tableId: string; code: string; status: string }) => void
  onStaffCall?: (payload: WsStaffCallPayload) => void
  onPaymentRequested?: (payload: any) => void
}

export function useAdminSocket(options: UseAdminSocketOptions) {
  const tenant = useAuthStore((s) => s.tenant)
  const joinedRef = useRef(false)

  useEffect(() => {
    if (!tenant?.id) return
    const s = getSocket()

    const join = () => {
      if (!joinedRef.current) {
        s.emit(WS_EVENTS.JOIN_RESTAURANT, { tenantId: tenant.id })
        joinedRef.current = true
      }
    }

    s.connected ? join() : s.once('connect', join)

    if (options.onOrderNew) s.on(WS_EVENTS.ORDER_NEW, options.onOrderNew)
    if (options.onOrderUpdated) s.on(WS_EVENTS.ORDER_UPDATED, options.onOrderUpdated)
    if (options.onTableUpdated) s.on(WS_EVENTS.TABLE_UPDATED, options.onTableUpdated)
    if (options.onStaffCall) s.on(WS_EVENTS.STAFF_CALL, options.onStaffCall)
    if (options.onPaymentRequested) s.on(WS_EVENTS.PAYMENT_REQUESTED, options.onPaymentRequested)

    return () => {
      s.off(WS_EVENTS.ORDER_NEW, options.onOrderNew)
      s.off(WS_EVENTS.ORDER_UPDATED, options.onOrderUpdated)
      s.off(WS_EVENTS.TABLE_UPDATED, options.onTableUpdated)
      s.off(WS_EVENTS.STAFF_CALL, options.onStaffCall)
      s.off(WS_EVENTS.PAYMENT_REQUESTED, options.onPaymentRequested)
      joinedRef.current = false
    }
  }, [tenant?.id])
}
