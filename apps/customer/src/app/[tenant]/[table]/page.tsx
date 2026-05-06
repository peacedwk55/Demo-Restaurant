import { notFound } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Utensils, QrCode, Zap, Star, ChevronRight } from 'lucide-react'

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
  const color = tenant.primaryColor ?? '#f97316'

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Hero */}
      <div
        className="relative flex flex-col items-center justify-end pb-10 pt-20 px-6 overflow-hidden"
        style={{ background: `linear-gradient(150deg, ${color} 0%, ${color}dd 60%, ${color}99 100%)`, minHeight: 320 }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-white/10" />
        <div className="absolute top-8 left-8 w-20 h-20 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-3xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/40">
            <Utensils className="w-11 h-11 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">{tenant.name}</h1>
            <p className="text-white/75 text-sm mt-1.5 font-medium">ยินดีต้อนรับ · Welcome</p>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="px-5 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-soft p-4 flex items-center gap-4 border border-stone-100">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
            <QrCode className="w-7 h-7" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">โต๊ะของคุณ · Your Table</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-0.5">{table.name}</p>
          </div>
          <div className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: `${color}15`, color }}>
            {table.zone ?? 'Indoor'}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-5 pt-6 flex-1">
        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">สั่งอาหารกับเรา</p>
        <div className="space-y-2.5">
          {[
            { icon: '🍜', title: 'เมนูครบครัน', desc: 'เลือกได้ตามใจ ทุกเมนู ทุกรส' },
            { icon: '⚡', title: 'สั่งได้ใน 3 ขั้นตอน', desc: 'เลือก • ยืนยัน • รอรับ' },
            { icon: '📡', title: 'ติดตามออร์เดอร์สด', desc: 'รู้ทุกสถานะแบบ real-time' },
            { icon: '💳', title: 'ชำระด้วย PromptPay', desc: 'สะดวก รวดเร็ว ปลอดภัย' },
          ].map(f => (
            <div key={f.title} className="flex items-center gap-3.5 bg-stone-50 rounded-2xl px-4 py-3.5">
              <span className="text-2xl w-9 text-center flex-shrink-0">{f.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-stone-800">{f.title}</p>
                <p className="text-xs text-stone-500 mt-0.5">{f.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-12 pt-6 space-y-3">
        <Link
          href={`/${params.tenant}/${params.table}/menu`}
          className="flex items-center justify-center gap-2.5 w-full py-4.5 rounded-2xl font-extrabold text-lg text-white shadow-brand transition-all active:scale-95"
          style={{ backgroundColor: color, paddingTop: '1.125rem', paddingBottom: '1.125rem' }}
        >
          <Utensils className="w-5 h-5" />
          เริ่มสั่งอาหาร
        </Link>
        <p className="text-center text-xs text-stone-400">ไม่ต้องสมัครสมาชิก · No account required</p>
      </div>
    </main>
  )
}
