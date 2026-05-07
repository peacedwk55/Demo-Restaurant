import { notFound } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
<<<<<<< HEAD
import { Utensils, QrCode, Zap, Radio, CreditCard } from 'lucide-react'
=======
import { Utensils, QrCode, Zap, Star, ChevronRight } from 'lucide-react'
>>>>>>> 9825c5ea184c036ebb9464fb538eb614163e518e

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
<<<<<<< HEAD
  const primary = tenant.primaryColor ?? '#f97316'

  const features = [
    { icon: '🍜', title: 'เมนูครบครัน', desc: 'เลือกได้ตามใจ ทุกเมนู ทุกรส' },
    { icon: '⚡', title: 'สั่งได้ใน 3 ขั้นตอน', desc: 'เลือก • ยืนยัน • รอรับ' },
    { icon: '📡', title: 'ติดตามออร์เดอร์สด', desc: 'รู้ทันทีว่าครัวกำลังทำอยู่' },
    { icon: '💳', title: 'ชำระด้วย PromptPay', desc: 'สะดวก รวดเร็ว ปลอดภัย' },
  ]
=======
  const color = tenant.primaryColor ?? '#f97316'
>>>>>>> 9825c5ea184c036ebb9464fb538eb614163e518e

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* ── Hero ── */}
      <div
<<<<<<< HEAD
        className="relative overflow-hidden flex flex-col items-center justify-end pb-10 pt-16 px-6"
        style={{
          background: `linear-gradient(155deg, ${primary}ff 0%, ${primary}dd 45%, ${primary}99 100%)`,
          minHeight: '340px',
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, white, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full opacity-[0.10]"
          style={{ background: 'radial-gradient(circle, white, transparent 70%)' }}
        />
        {/* Dots pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Logo + name */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-[22px] bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/30 ring-4 ring-white/10">
            <Utensils className="w-9 h-9 text-white drop-shadow" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-sm">
              {tenant.name}
            </h1>
            <p className="text-white/75 text-sm mt-1 font-medium tracking-wide">
              ยินดีต้อนรับ · Welcome
            </p>
=======
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
>>>>>>> 9825c5ea184c036ebb9464fb538eb614163e518e
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* ── Table badge (floating card) ── */}
      <div className="px-5 -mt-5 relative z-10">
        <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-4 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${primary}18` }}
          >
            <QrCode className="w-6 h-6" style={{ color: primary }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">
              โต๊ะของคุณ · Your Table
            </p>
            <p className="text-xl font-bold text-stone-900">{table.name}</p>
          </div>
          {table.zone && (
            <div
              className="px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
              style={{ backgroundColor: `${primary}15`, color: primary }}
            >
              {table.zone}
            </div>
          )}
        </div>
      </div>

      {/* ── Features ── */}
      <div className="px-5 pt-6 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">
          สั่งอาหารกับเรา
        </p>
        <div className="grid grid-cols-2 gap-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-stone-50 rounded-2xl p-4 flex flex-col gap-2 border border-stone-100"
            >
              <span className="text-2xl leading-none">{f.icon}</span>
              <div>
                <p className="text-sm font-bold text-stone-800 leading-tight">{f.title}</p>
                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{f.desc}</p>
=======
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
>>>>>>> 9825c5ea184c036ebb9464fb538eb614163e518e
              </div>
              <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

<<<<<<< HEAD
      {/* ── CTA ── */}
      <div className="px-5 pb-10 pt-6 space-y-3">
        <Link
          href={`/${params.tenant}/${params.table}/menu`}
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-lg text-white shadow-brand-lg transition-all active:scale-95"
          style={{ backgroundColor: primary }}
=======
      {/* CTA */}
      <div className="px-5 pb-12 pt-6 space-y-3">
        <Link
          href={`/${params.tenant}/${params.table}/menu`}
          className="flex items-center justify-center gap-2.5 w-full py-4.5 rounded-2xl font-extrabold text-lg text-white shadow-brand transition-all active:scale-95"
          style={{ backgroundColor: color, paddingTop: '1.125rem', paddingBottom: '1.125rem' }}
>>>>>>> 9825c5ea184c036ebb9464fb538eb614163e518e
        >
          <Utensils className="w-5 h-5" />
          เริ่มสั่งอาหาร
        </Link>
        <p className="text-center text-xs text-stone-400">
          ไม่ต้องสมัครสมาชิก · No account required
        </p>
      </div>
    </main>
  )
}
