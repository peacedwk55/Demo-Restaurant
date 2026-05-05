'use client'
import { useEffect, useRef } from 'react'
import { getSocket } from '@/lib/socket'
import { WS_EVENTS } from '@tableflow/types'

interface UseOrderSocketOptions {
  tenantId: string
  tableId: string
  onOrderUpdated?: (data: { orderId: string; status: string }) => void
  onPaymentConfirmed?: (data: { orderId: string }) => void
}

export function useOrderSocket({ tenantId, tableId, onOrderUpdated, onPaymentConfirmed }: UseOrderSocketOptions) {
  const joinedRef = useRef(false)

  useEffect(() => {
    if (!tenantId || !tableId) return
    const socket = getSocket()

    const join = () => {
      if (!joinedRef.current) {
        socket.emit(WS_EVENTS.JOIN_TABLE, { tenantId, tableId })
        joinedRef.current = true
      }
    }

    if (socket.connected) {
      join()
    } else {
      socket.once('connect', join)
    }

    if (onOrderUpdated) socket.on(WS_EVENTS.ORDER_UPDATED, onOrderUpdated)
    if (onPaymentConfirmed) socket.on(WS_EVENTS.PAYMENT_CONFIRMED, onPaymentConfirmed)

    return () => {
      socket.off(WS_EVENTS.ORDER_UPDATED, onOrderUpdated)
      socket.off(WS_EVENTS.PAYMENT_CONFIRMED, onPaymentConfirmed)
      socket.emit(WS_EVENTS.LEAVE_TABLE, { tenantId, tableId })
      joinedRef.current = false
    }
  }, [tenantId, tableId])
}
