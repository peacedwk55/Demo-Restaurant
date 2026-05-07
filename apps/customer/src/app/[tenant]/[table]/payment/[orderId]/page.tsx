'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { PaymentDto } from '@tableflow/types'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PaymentPage() {
  const params = useParams<{ tenant: string; table: string; orderId: string }>()
  const router = useRouter()
  const [payment, setPayment] = useState<PaymentDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    api
      .getPayment(params.tenant, params.orderId)
      .then(setPayment)
      .catch(() => toast.error('ไม่พบข้อมูลการชำระเงิน'))
      .finally(() => setLoading(false))
  }, [params.tenant, params.orderId])

  // Poll for payment status
  useEffect(() => {
    if (!payment || payment.status === 'CONFIRMED') return
    const interval = setInterval(async () => {
      try {
        const updated = await api.getPayment(params.tenant, params.orderId)
        setPayment(updated)
        if (updated.status === 'CONFIRMED') {
          clearInterval(interval)
          toast.success('ชำระเงินสำเร็จ! ขอบคุณครับ/ค่ะ 🙏')
          setTimeout(() => router.push(`/${params.tenant}/${params.table}/review/${params.orderId}`), 1500)
        }
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [payment?.status])

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
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce-in">
          <CheckCircle2 className="w-12 h-12 text-green-500 fill-green-100" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">ชำระเงินสำเร็จ</h1>
        <p className="text-stone-500">ขอบคุณที่มาใช้บริการนะคะ 🙏</p>
        <p className="text-2xl font-bold text-orange-500 mt-3">{formatPrice(payment.amount)}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-stone-700" />
        </button>
        <h1 className="text-base font-bold text-stone-900">ชำระเงิน</h1>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col items-center">
        {/* Amount */}
        <div className="bg-orange-500 rounded-3xl px-8 py-6 w-full text-center mb-6 shadow-brand">
          <p className="text-orange-100 text-sm font-medium mb-1">ยอดที่ต้องชำระ</p>
          <p className="text-4xl font-bold text-white">{formatPrice(payment.amount)}</p>
          <p className="text-orange-200 text-xs mt-2">รวม VAT 7% แล้ว</p>
        </div>

        {/* PromptPay QR */}
        {payment.promptPayQrUrl ? (
          <div className="bg-white rounded-3xl p-6 w-full shadow-card border border-stone-100 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">💳</span>
              <h2 className="text-base font-bold text-stone-900">PromptPay QR</h2>
            </div>
            <div className="w-52 h-52 bg-white p-3 rounded-2xl border-2 border-stone-100 flex items-center justify-center">
              <img
                src={payment.promptPayQrUrl}
                alt="PromptPay QR"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-xs text-stone-500 text-center">
              สแกน QR Code ด้วย Mobile Banking ของคุณ<br />
              แล้วแจ้งพนักงานหลังชำระเงิน
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 w-full shadow-card border border-stone-100 text-center">
            <div className="text-5xl mb-4">💳</div>
            <p className="text-sm font-semibold text-stone-800">ชำระเงินกับพนักงาน</p>
            <p className="text-xs text-stone-500 mt-1">กรุณาเรียกพนักงานเพื่อชำระเงิน</p>
          </div>
        )}

        {/* Polling indicator */}
        <div className="flex items-center gap-2 mt-4 text-stone-400">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span className="text-xs">รอการยืนยันจากพนักงาน...</span>
        </div>
      </div>

      {/* Call staff to confirm */}
      <div className="px-4 pb-safe pt-3 bg-white border-t border-stone-100">
        <button
          onClick={() => api.callStaff(params.tenant, params.orderId, 'PAYMENT').then(() => toast.success('แจ้งพนักงานแล้วค่ะ')).catch(() => {})}
          className="w-full border-2 border-orange-500 text-orange-500 py-4 rounded-2xl font-bold text-base active:scale-95 transition-transform"
        >
          เรียกพนักงานมาเก็บเงิน
        </button>
      </div>
    </div>
  )
}
