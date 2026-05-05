import { notFound } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Utensils, QrCode, Star, Zap } from 'lucide-react'

interface Props {
  params: { tenant: string; table: string }
}

export default async function LandingPage({ params }: Props) {
  const [menu, table] = await Promise.all([
    api.getMenu(params.tenant).catch(() => null),
    api.getTable(params.tenant, params.table.toUpperCase()).catch(() => null),
  ])

  if (!menu || !table) notFound()

  const { tenant } = menu

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Hero */}
      <div
        className="relative overflow-hidden flex flex-col items-center justify-end pb-8 pt-16 px-6"
        style={{
          background: `linear-gradient(160deg, ${tenant.primaryColor}ee 0%, ${tenant.primaryColor}cc 50%, ${tenant.primaryColor}88 100%)`,
          minHeight: '320px',
        }}
      >
        {/* Background circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 bg-white -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 bg-white translate-y-1/2 -translate-x-1/2" />

        {/* Logo */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-xl border border-white/30">
            <Utensils className="w-9 h-9 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight">{tenant.name}</h1>
            <p className="text-white/80 text-sm mt-1">ยินดีต้อนรับ · Welcome</p>
          </div>
        </div>
      </div>

      {/* Table badge */}
      <div className="px-6 -mt-5 relative z-10">
        <div className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3 border border-stone-100">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${tenant.primaryColor}20` }}
          >
            <QrCode className="w-6 h-6" style={{ color: tenant.primaryColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">โต๊ะของคุณ · Your Table</p>
            <p className="text-xl font-bold text-stone-900">{table.name}</p>
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: `${tenant.primaryColor}15`, color: tenant.primaryColor }}
          >
            {table.zone ?? 'Indoor'}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 pt-6 flex-1">
        <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-widest mb-4">สั่งอาหารกับเรา</h2>
        <div className="space-y-3">
          {[
            { icon: '🍜', title: 'เมนูครบครัน', desc: 'เลือกได้ตามใจ ทุกเมนู ทุกรส' },
            { icon: '⚡', title: 'สั่งได้ใน 3 ขั้นตอน', desc: 'เลือก • ยืนยัน • รอรับ' },
            { icon: '📡', title: 'ติดตามออร์เดอร์สด', desc: 'รู้ทันทีว่าครัวกำลังทำอยู่' },
            { icon: '💳', title: 'ชำระด้วย PromptPay', desc: 'สะดวก รวดเร็ว ปลอดภัย' },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3 bg-stone-50 rounded-xl p-3">
              <span className="text-2xl w-9 flex-shrink-0 text-center">{f.icon}</span>
              <div>
                <p className="text-sm font-semibold text-stone-800">{f.title}</p>
                <p className="text-xs text-stone-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 pt-6 space-y-3">
        <Link
          href={`/${params.tenant}/${params.table}/menu`}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-lg text-white shadow-brand transition-all active:scale-95"
          style={{ backgroundColor: tenant.primaryColor }}
        >
          <Utensils className="w-5 h-5" />
          เริ่มสั่งอาหาร
        </Link>
        <p className="text-center text-xs text-stone-400">ไม่ต้องสมัครสมาชิก · No account required</p>
      </div>
    </main>
  )
}
