'use client'
import { useEffect, useRef } from 'react'
import { getSocket } from '@/lib/socket'
import { WS_EVENTS } from '@tableflow/types'

interface UseOrderSocketOptions {
  orderId: string
  tenantId: string
  tableId: string
  onOrderUpdated?: (data: { orderId: string; status: string }) => void
  onPaymentConfirmed?: (data: { orderId: string }) => void
}

export function useOrderSocket({ orderId, tenantId, tableId, onOrderUpdated, onPaymentConfirmed }: UseOrderSocketOptions) {
  const cbRef = useRef({ onOrderUpdated, onPaymentConfirmed })
  useEffect(() => { cbRef.current = { onOrderUpdated, onPaymentConfirmed } })

  useEffect(() => {
    if (!tenantId || !tableId || !orderId) return
    const socket = getSocket()

    const joinAll = () => {
      socket.emit(WS_EVENTS.JOIN_TABLE, { tenantId, tableId })
      socket.emit(WS_EVENTS.JOIN_ORDER, { orderId })
    }

    socket.on('connect', joinAll)
    if (socket.connected) joinAll()

    const onUpdated   = (d: any) => cbRef.current.onOrderUpdated?.(d)
    const onConfirmed = (d: any) => cbRef.current.onPaymentConfirmed?.(d)

    socket.on(WS_EVENTS.ORDER_UPDATED,     onUpdated)
    socket.on(WS_EVENTS.PAYMENT_CONFIRMED, onConfirmed)

    return () => {
      socket.off('connect',                   joinAll)
      socket.off(WS_EVENTS.ORDER_UPDATED,     onUpdated)
      socket.off(WS_EVENTS.PAYMENT_CONFIRMED, onConfirmed)
      socket.emit(WS_EVENTS.LEAVE_TABLE, { tenantId, tableId })
      socket.emit(WS_EVENTS.LEAVE_ORDER, { orderId })
    }
  }, [orderId, tenantId, tableId])
}
