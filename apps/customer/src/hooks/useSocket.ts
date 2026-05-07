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
  const cbRef = useRef({ onOrderUpdated, onPaymentConfirmed })
  useEffect(() => { cbRef.current = { onOrderUpdated, onPaymentConfirmed } })

  useEffect(() => {
    if (!tenantId || !tableId) return
    const socket = getSocket()

    const join = () => socket.emit(WS_EVENTS.JOIN_TABLE, { tenantId, tableId })

    socket.on('connect', join)
    if (socket.connected) join()

    const onUpdated   = (d: any) => cbRef.current.onOrderUpdated?.(d)
    const onConfirmed = (d: any) => cbRef.current.onPaymentConfirmed?.(d)

    socket.on(WS_EVENTS.ORDER_UPDATED,     onUpdated)
    socket.on(WS_EVENTS.PAYMENT_CONFIRMED, onConfirmed)

    return () => {
      socket.off('connect',                   join)
      socket.off(WS_EVENTS.ORDER_UPDATED,     onUpdated)
      socket.off(WS_EVENTS.PAYMENT_CONFIRMED, onConfirmed)
      socket.emit(WS_EVENTS.LEAVE_TABLE, { tenantId, tableId })
    }
  }, [tenantId, tableId])
}
