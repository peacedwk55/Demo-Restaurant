'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'
import { Star, MessageSquare, TrendingUp, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

const EMOJI_MAP: Record<number, string> = { 1: '😡', 2: '😕', 3: '😐', 4: '😊', 5: '🤩' }

function StarBar({ rating, count, total }: { rating: number; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-4">{rating}</span>
      <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
    </div>
  )
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn('w-3.5 h-3.5', s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200')} />
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filter, setFilter] = useState<number | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminApi.getReviews(), adminApi.getReviewStats()])
      .then(([r, s]) => { setReviews(r); setStats(s) })
      .finally(() => setLoading(false))
  }, [])

  const displayed = filter === 'ALL' ? reviews : reviews.filter((r) => r.rating === filter)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) +
      ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-orange-500" />
            รีวิวลูกค้า
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">ความคิดเห็นจากลูกค้าทั้งหมด</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats row */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Avg rating */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-gray-900">{stats.avgRating.toFixed(1)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">คะแนนเฉลี่ย จาก {stats.total} รีวิว</p>
                  <RatingStars rating={Math.round(stats.avgRating)} />
                </div>
              </div>

              {/* Distribution */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <p className="text-sm font-bold text-gray-900">การกระจาย</p>
                </div>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((r) => (
                    <StarBar key={r} rating={r} count={stats.distribution[r] ?? 0} total={stats.total} />
                  ))}
                </div>
              </div>

              {/* Satisfaction */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
                <p className="text-sm font-bold text-gray-900 mb-4">ความพึงพอใจ</p>
                <div className="space-y-3">
                  {[
                    { label: 'พอใจมาก (4-5 ดาว)', stars: [4, 5], color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'กลางๆ (3 ดาว)', stars: [3], color: 'text-amber-600 bg-amber-50' },
                    { label: 'ไม่พอใจ (1-2 ดาว)', stars: [1, 2], color: 'text-red-600 bg-red-50' },
                  ].map((g) => {
                    const count = g.stars.reduce((s, r) => s + (stats.distribution[r] ?? 0), 0)
                    const pct = stats.total ? Math.round((count / stats.total) * 100) : 0
                    return (
                      <div key={g.label} className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{g.label}</span>
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', g.color)}>
                          {pct}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Filter */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => setFilter('ALL')}
              className={cn('px-4 py-2 rounded-xl text-sm font-semibold border transition-all',
                filter === 'ALL' ? 'bg-gray-900 text-white border-transparent' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50')}
            >
              ทั้งหมด ({reviews.length})
            </button>
            {[5, 4, 3, 2, 1].map((r) => {
              const count = reviews.filter((rv) => rv.rating === r).length
              return (
                <button
                  key={r}
                  onClick={() => setFilter(r)}
                  className={cn('px-4 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center gap-1.5',
                    filter === r ? 'bg-amber-400 text-white border-transparent' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50')}
                >
                  {r} <Star className={cn('w-3 h-3', filter === r ? 'fill-white text-white' : 'fill-amber-400 text-amber-400')} /> ({count})
                </button>
              )
            })}
          </div>

          {/* Reviews list */}
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium">ยังไม่มีรีวิว</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayed.map((review) => (
                <div key={review.id} className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">
                        {review.emoji ?? EMOJI_MAP[review.rating] ?? '⭐'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <RatingStars rating={review.rating} />
                          <span className="text-xs text-gray-400">
                            โต๊ะ {review.order?.table?.code ?? '-'}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-700 mt-1">"{review.comment}"</p>
                        )}
                        {/* Order items */}
                        {review.order?.items?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {review.order.items.map((item: any) => (
                              <span key={item.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">
                                {item.menuItemName} x{item.quantity}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                      {review.order?.totalAmount && (
                        <p className="text-sm font-bold text-orange-500 mt-1">
                          {formatPrice(Number(review.order.totalAmount))}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
