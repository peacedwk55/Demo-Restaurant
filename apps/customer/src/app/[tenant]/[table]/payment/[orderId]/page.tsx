'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useOrderSocket } from '@/hooks/useSocket'
import { PaymentDto, OrderStatus } from '@tableflow/types'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, RefreshCw, Banknote, QrCode } from 'lucide-react'
import { useCartStore } from '@/store/cart.store'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

type PaymentTab = 'PROMPTPAY' | 'CASH'

export default function PaymentPage() {
  const params = useParams<{ tenant: string; table: string; orderId: string }>()
  const router = useRouter()
  const { setActiveOrder } = useCartStore()
  const [payment, setPayment] = useState<PaymentDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<PaymentTab>('PROMPTPAY')
  const [calledStaff, setCalledStaff] = useState(false)
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      api.getPayment(params.tenant, params.orderId),
      api.getOrder(params.tenant, params.orderId),
    ])
      .then(([p, o]) => { setPayment(p); setOrder(o) })
      .catch(() => toast.error('ไม่พบข้อมูลการชำระเงิน'))
      .finally(() => setLoading(false))
  }, [params.tenant, params.orderId])

  // Poll for payment confirmation
  useEffect(() => {
    if (!payment || payment.status === 'CONFIRMED') return
    const interval = setInterval(async () => {
      try {
        const updated = await api.getPayment(params.tenant, params.orderId)
        setPayment(updated)
        if (updated.status === 'CONFIRMED') clearInterval(interval)
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [payment?.status])

  // Real-time: listen for payment confirmed via WebSocket
  useOrderSocket({
    orderId: params.orderId,
    tenantId: order?.tenantId ?? '',
    tableId: order?.tableId ?? '',
    onOrderUpdated: () => {},
    onPaymentConfirmed: ({ orderId }) => {
      if (orderId === params.orderId) {
        setActiveOrder(null)
        setPayment((prev) => prev ? { ...prev, status: 'CONFIRMED' } : prev)
      }
    },
  })

  const handleCallStaff = async () => {
    try {
      await api.callStaff(params.tenant, params.orderId, 'PAYMENT')
      setCalledStaff(true)
      toast.success('แจ้งพนักงานแล้วค่ะ รอสักครู่')
    } catch {
      toast.error('ไม่สามารถส่งสัญญาณได้')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!payment) return null

  if (payment.status === 'CONFIRMED') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce-in">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900 mb-2">ชำระเงินสำเร็จ</h1>
        <p className="text-stone-500 text-sm">ขอบคุณที่มาใช้บริการนะคะ 🙏</p>
        <p className="text-3xl font-extrabold text-orange-500 mt-4">{formatPrice(payment.amount)}</p>
        <button
          onClick={() => router.push(`/${params.tenant}/${params.table}`)}
          className="mt-8 bg-orange-500 text-white px-8 py-3.5 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
        >
          กลับหน้าหลัก
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center active:scale-90 transition-transform">
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="text-base font-bold text-stone-900">ชำระเงิน</h1>
      </div>

      <div className="flex-1 px-4 py-5 space-y-4">
        {/* Amount */}
        <div className="bg-orange-500 rounded-3xl px-8 py-6 text-center shadow-brand">
          <p className="text-orange-100 text-sm font-medium mb-1">ยอดที่ต้องชำระ</p>
          <p className="text-4xl font-extrabold text-white">{formatPrice(payment.amount)}</p>
          <p className="text-orange-200 text-xs mt-2">รวม VAT 7% แล้ว</p>
        </div>

        {/* Method tabs */}
        <div className="bg-white rounded-2xl p-1.5 flex gap-1.5 border border-stone-100 shadow-card">
          <button
            onClick={() => setTab('PROMPTPAY')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all',
              tab === 'PROMPTPAY' ? 'bg-orange-500 text-white shadow-sm' : 'text-stone-500 hover:bg-stone-50'
            )}
          >
            <QrCode className="w-4 h-4" />
            PromptPay QR
          </button>
          <button
            onClick={() => setTab('CASH')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all',
              tab === 'CASH' ? 'bg-orange-500 text-white shadow-sm' : 'text-stone-500 hover:bg-stone-50'
            )}
          >
            <Banknote className="w-4 h-4" />
            เงินสด
          </button>
        </div>

        {/* PromptPay tab */}
        {tab === 'PROMPTPAY' && (
          <div className="bg-white rounded-3xl p-6 shadow-card border border-stone-100 flex flex-col items-center gap-4">
            {payment.promptPayQrUrl ? (
              <>
                <div className="w-52 h-52 bg-white p-3 rounded-2xl border-2 border-stone-100 flex items-center justify-center">
                  <img src={payment.promptPayQrUrl} alt="PromptPay QR" className="w-full h-full object-contain" />
                </div>
                <p className="text-xs text-stone-500 text-center leading-relaxed">
                  สแกน QR Code ด้วย Mobile Banking<br />แล้วแจ้งพนักงานหลังชำระเงิน
                </p>
              </>
            ) : (
              <div className="py-6 text-center">
                <div className="text-5xl mb-3">💳</div>
                <p className="text-sm font-semibold text-stone-800">กรุณาแจ้งพนักงาน</p>
                <p className="text-xs text-stone-400 mt-1">สแกน QR PromptPay กับพนักงาน</p>
              </div>
            )}
            <div className="flex items-center gap-2 text-stone-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span className="text-xs">รอการยืนยันจากพนักงาน...</span>
            </div>
          </div>
        )}

        {/* Cash tab */}
        {tab === 'CASH' && (
          <div className="bg-white rounded-3xl p-6 shadow-card border border-stone-100 flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
              <Banknote className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-900">ชำระเงินสด</h3>
              <p className="text-sm text-stone-500 mt-1">กด "เรียกพนักงาน" เพื่อแจ้งชำระเงินสด<br />พนักงานจะมาเก็บเงินและยืนยันการชำระ</p>
            </div>
            <div className="w-full bg-stone-50 rounded-2xl p-4">
              <p className="text-xs text-stone-500">ยอดที่ต้องเตรียม</p>
              <p className="text-3xl font-extrabold text-stone-900 mt-1">{formatPrice(payment.amount)}</p>
            </div>
            {calledStaff ? (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl w-full justify-center">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-semibold">แจ้งพนักงานแล้ว รอสักครู่...</span>
              </div>
            ) : (
              <button
                onClick={handleCallStaff}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-extrabold text-base active:scale-95 transition-all shadow-sm shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <Banknote className="w-5 h-5" />
                เรียกพนักงานมาเก็บเงิน
              </button>
            )}
            <div className="flex items-center gap-2 text-stone-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span className="text-xs">รอการยืนยันจากพนักงาน...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
