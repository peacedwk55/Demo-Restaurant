'use client'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function ReviewPage() {
  const params = useParams<{ tenant: string; table: string }>()
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => router.push(`/${params.tenant}/${params.table}`), 3000)
    return () => clearTimeout(t)
  }, [router, params.tenant, params.table])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center gap-4">
      <div className="text-6xl">🙏</div>
      <h1 className="text-2xl font-bold text-stone-900">ขอบคุณมากค่ะ!</h1>
      <p className="text-stone-500 text-sm">ยินดีต้อนรับทุกครั้งที่มาเยือนนะคะ</p>
    </div>
  )
}
