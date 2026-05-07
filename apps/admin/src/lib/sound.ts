'use client'

// ─── Beep via Web Audio API ───────────────────────────────────────────────────

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch { return null }
}

async function beep(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.45) {
  try {
    const c = getCtx()
    if (!c) return
    if (c.state === 'suspended') await c.resume()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = type
    osc.frequency.setValueAtTime(frequency, c.currentTime)
    gain.gain.setValueAtTime(volume, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + duration)
  } catch {}
}

export function unlockAudio() {
  const c = getCtx()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
}

// ─── TTS ──────────────────────────────────────────────────────────────────────

let thaiVoice: SpeechSynthesisVoice | null | undefined = undefined // undefined = not checked yet

function getThaiVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  if (thaiVoice !== undefined) return thaiVoice
  const voices = window.speechSynthesis.getVoices()
  thaiVoice = voices.find((v) => v.lang.startsWith('th')) ?? null
  return thaiVoice
}

function speak(text: string) {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const voice = getThaiVoice()
    if (!voice) return // ไม่มี Thai voice ข้ามไปเลย ไม่ error
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.voice = voice
    utt.lang = 'th-TH'
    utt.rate = 1.1
    utt.volume = 1.0
    window.speechSynthesis.speak(utt)
  } catch {}
}

// Pre-load voices list (browser loads async)
if (typeof window !== 'undefined' && window.speechSynthesis) {
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices()
    const found = voices.find((v) => v.lang.startsWith('th'))
    if (found) thaiVoice = found
  }
  loadVoices()
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
}

// ─── Sound events ─────────────────────────────────────────────────────────────

export const sounds = {
  /** 🔔 ออร์เดอร์ใหม่ — บี้ป 3 ครั้ง เร่งด่วน */
  orderNew(tableCode: string, itemCount: number) {
    beep(880, 0.12, 'square', 0.5)
    setTimeout(() => beep(880, 0.12, 'square', 0.5), 180)
    setTimeout(() => beep(1100, 0.22, 'square', 0.5), 360)
    setTimeout(() => speak(`ออร์เดอร์ใหม่ โต๊ะ ${tableCode} ${itemCount} รายการ`), 650)
  },

  /** ✅ ชำระเงินสำเร็จ — โน้ตขึ้น 3 ตัว */
  paymentConfirmed(tableCode: string, amount: number) {
    beep(523, 0.15, 'sine', 0.4)
    setTimeout(() => beep(659, 0.15, 'sine', 0.4), 180)
    setTimeout(() => beep(784, 0.3,  'sine', 0.4), 360)
    setTimeout(() => speak(`ชำระเงินสำเร็จ โต๊ะ ${tableCode} ยอด ${amount.toLocaleString()} บาท`), 700)
  },

  /** 🙋 ลูกค้าเรียกพนักงาน — กริ่ง 2 ครั้ง */
  staffCall(tableCode: string, type: string) {
    beep(660, 0.2, 'sine', 0.45)
    setTimeout(() => beep(660, 0.2, 'sine', 0.45), 350)
    const label: Record<string, string> = { ASSISTANCE: 'ขอความช่วยเหลือ', PAYMENT: 'ขอเก็บเงิน' }
    setTimeout(() => speak(`โต๊ะ ${tableCode} ${label[type] ?? 'เรียกพนักงาน'}`), 750)
  },

  /** 🍽️ อาหารพร้อมเสิร์ฟ */
  foodReady(tableCode: string) {
    beep(784,  0.15, 'triangle', 0.4)
    setTimeout(() => beep(1047, 0.15, 'triangle', 0.4), 200)
    setTimeout(() => beep(784,  0.25, 'triangle', 0.4), 400)
    setTimeout(() => speak(`อาหารพร้อมเสิร์ฟ โต๊ะ ${tableCode}`), 750)
  },

  /** 💳 ลูกค้าขอชำระเงิน */
  paymentRequested(tableCode: string) {
    beep(440, 0.15, 'sine', 0.4)
    setTimeout(() => beep(550, 0.25, 'sine', 0.4), 200)
    setTimeout(() => speak(`โต๊ะ ${tableCode} ขอชำระเงิน`), 550)
  },
}
