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
  onPaymentConfirmed?: (payload: { orderId: string; tenantId: string }) => void
}

export function useAdminSocket(options: UseAdminSocketOptions) {
  const tenant = useAuthStore((s) => s.tenant)
  // Keep latest callbacks in a ref so handlers never go stale
  const cbRef = useRef(options)
  useEffect(() => { cbRef.current = options })

  useEffect(() => {
    if (!tenant?.id) return
    const s = getSocket()
    const tenantId = tenant.id

    // Join room — called on every (re)connect so room is always fresh
    const join = () => s.emit(WS_EVENTS.JOIN_RESTAURANT, { tenantId })

    s.on('connect', join)
    if (s.connected) join()

    // Stable wrapper handlers that delegate to latest callbacks via ref
    const onOrderNew      = (p: any) => cbRef.current.onOrderNew?.(p)
    const onOrderUpdated  = (p: any) => cbRef.current.onOrderUpdated?.(p)
    const onTableUpdated  = (p: any) => cbRef.current.onTableUpdated?.(p)
    const onStaffCall     = (p: any) => cbRef.current.onStaffCall?.(p)
    const onPaymentReq       = (p: any) => cbRef.current.onPaymentRequested?.(p)
    const onPaymentConfirmed = (p: any) => cbRef.current.onPaymentConfirmed?.(p)

    s.on(WS_EVENTS.ORDER_NEW,           onOrderNew)
    s.on(WS_EVENTS.ORDER_UPDATED,       onOrderUpdated)
    s.on(WS_EVENTS.TABLE_UPDATED,       onTableUpdated)
    s.on(WS_EVENTS.STAFF_CALL,          onStaffCall)
    s.on(WS_EVENTS.PAYMENT_REQUESTED,   onPaymentReq)
    s.on(WS_EVENTS.PAYMENT_CONFIRMED,   onPaymentConfirmed)

    return () => {
      s.off('connect',                    join)
      s.off(WS_EVENTS.ORDER_NEW,          onOrderNew)
      s.off(WS_EVENTS.ORDER_UPDATED,      onOrderUpdated)
      s.off(WS_EVENTS.TABLE_UPDATED,      onTableUpdated)
      s.off(WS_EVENTS.STAFF_CALL,         onStaffCall)
      s.off(WS_EVENTS.PAYMENT_REQUESTED,  onPaymentReq)
      s.off(WS_EVENTS.PAYMENT_CONFIRMED,  onPaymentConfirmed)
    }
  }, [tenant?.id])
}
