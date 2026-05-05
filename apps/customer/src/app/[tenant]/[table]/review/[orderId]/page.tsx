'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

const EMOJIS = [
  { value: 1, emoji: '😞', label: 'แย่มาก' },
  { value: 2, emoji: '😕', label: 'ไม่ดี' },
  { value: 3, emoji: '😐', label: 'พอใช้' },
  { value: 4, emoji: '😊', label: 'ดีมาก' },
  { value: 5, emoji: '🤩', label: 'ยอดเยี่ยม' },
]

export default function ReviewPage() {
  const params = useParams<{ tenant: string; table: string; orderId: string }>()
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!rating) {
      toast.error('กรุณาให้คะแนนก่อนนะคะ')
      return
    }
    setLoading(true)
    try {
      const result = await api.createReview(params.tenant, params.orderId, {
        rating,
        emoji: EMOJIS.find((e) => e.value === rating)?.emoji,
        comment: comment || undefined,
      }) as any

      setSubmitted(true)

      if (result.redirectToGoogle && result.googleMapsUrl) {
        setTimeout(() => {
          window.location.href = result.googleMapsUrl
        }, 2000)
      }
    } catch (err: any) {
      toast.error(err.message ?? 'ไม่สามารถส่งรีวิวได้')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center gap-4">
        <div className="text-6xl animate-bounce-in">🙏</div>
        <h1 className="text-2xl font-bold text-stone-900">ขอบคุณมากค่ะ!</h1>
        <p className="text-stone-500 text-sm">
          ความคิดเห็นของคุณมีค่ามาก<br />
          ยินดีต้อนรับทุกครั้งที่มาเยือนนะคะ
        </p>
        {rating >= 4 && (
          <p className="text-xs text-orange-500 font-medium animate-pulse">กำลังพาไปที่ Google Maps...</p>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 text-center">
        <div className="text-5xl mb-4">
          {rating ? EMOJIS.find((e) => e.value === rating)?.emoji : '⭐'}
        </div>
        <h1 className="text-2xl font-bold text-stone-900">รีวิวประสบการณ์</h1>
        <p className="text-stone-500 text-sm mt-1">บอกเราว่าคุณพึงพอใจแค่ไหน?</p>
      </div>

      <div className="flex-1 px-6 space-y-6">
        {/* Emoji rating */}
        <div>
          <p className="text-sm font-semibold text-stone-700 mb-4 text-center">เลือกความรู้สึกของคุณ</p>
          <div className="flex justify-between">
            {EMOJIS.map((e) => (
              <button
                key={e.value}
                onClick={() => setRating(e.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all active:scale-90 ${
                  rating === e.value
                    ? 'bg-orange-50 ring-2 ring-orange-400 scale-110'
                    : 'bg-stone-50 hover:bg-stone-100'
                }`}
              >
                <span className="text-3xl">{e.emoji}</span>
                <span className="text-xs text-stone-500 font-medium">{e.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Star rating */}
        {rating > 0 && (
          <div className="text-center animate-fade-in">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className="text-3xl transition-transform active:scale-90">
                  {s <= rating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            <p className="text-sm font-semibold text-stone-700 mt-2">
              {EMOJIS.find((e) => e.value === rating)?.label}
            </p>
          </div>
        )}

        {/* Comment */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            ความคิดเห็น (ไม่บังคับ)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="บอกเราเพิ่มเติมได้เลย เช่น รสชาติ การบริการ ความสะอาด..."
            rows={4}
            className="w-full text-sm border border-stone-200 rounded-xl p-3 resize-none outline-none focus:border-orange-400 placeholder-stone-300"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="px-6 pb-safe pt-4 space-y-3">
        <button
          onClick={handleSubmit}
          disabled={!rating || loading}
          className="w-full bg-orange-500 disabled:bg-stone-200 disabled:text-stone-400 text-white py-4 rounded-2xl font-bold text-base shadow-brand active:scale-95 transition-all"
        >
          {loading ? 'กำลังส่ง...' : 'ส่งรีวิว'}
        </button>
        <button
          onClick={() => router.push(`/${params.tenant}/${params.table}`)}
          className="w-full text-stone-400 text-sm py-2"
        >
          ข้ามไปก่อน
        </button>
      </div>
    </div>
  )
}
