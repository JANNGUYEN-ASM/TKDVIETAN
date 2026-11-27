import type { BeltRank } from '../types'

export const COLOR_BELTS: BeltRank[] = [
  'Cấp 10',
  'Cấp 9',
  'Cấp 8',
  'Cấp 7',
  'Cấp 6',
  'Cấp 5',
  'Cấp 4',
  'Cấp 3',
  'Cấp 2',
  'Cấp 1',
]

/** Parse Excel "Cấp bậc" like "2" or "Cấp 2" → BeltRank */
export function parseBelt(raw: string | number | undefined): BeltRank {
  if (raw == null || raw === '') return 'Cấp 10'
  const s = String(raw).trim()
  if (/nhập\s*môn|đai\s*trắng/i.test(s)) return 'Cấp 10'
  const known = COLOR_BELTS.find((b) => b.toLowerCase() === s.toLowerCase())
  if (known) return known
  const n = Number(s.replace(/[^\d]/g, ''))
  if (!Number.isNaN(n) && n >= 1 && n <= 10) return `Cấp ${n}` as BeltRank
  if (/poom\s*1/i.test(s)) return 'Poom 1'
  if (/poom\s*2/i.test(s)) return 'Poom 2'
  if (/poom\s*3/i.test(s)) return 'Poom 3'
  return canonicalBelt(s)
}

export function canonicalBelt(belt: string | undefined): BeltRank {
  if (!belt || /nhập\s*môn|đai\s*trắng/i.test(belt)) return 'Cấp 10'
  return belt as BeltRank
}

export function beltStripeCount(belt: BeltRank): number {
  if (belt === 'Cấp 9' || belt === 'Cấp 3') return 1
  if (belt === 'Cấp 8' || belt === 'Cấp 2') return 2
  if (belt === 'Cấp 1') return 3
  return 0
}

export function isWhiteBelt(belt: BeltRank | string): boolean {
  return belt === 'Cấp 10' || /nhập\s*môn/i.test(belt)
}

export function beltLabel(belt: BeltRank): string {
  if (belt === 'Cấp 10') return 'Cấp 10 · Đai trắng'
  return belt
}

export function beltBaseColor(belt: BeltRank): string {
  if (belt === 'Cấp 10' || belt === 'Cấp 9' || belt === 'Cấp 8') return '#F5F5F5'
  if (belt === 'Cấp 7') return '#F5C518'
  if (belt === 'Cấp 6') return '#2E8B57'
  if (belt === 'Cấp 5') return '#1E5AA8'
  if (belt === 'Cấp 4' || belt === 'Cấp 3' || belt === 'Cấp 2' || belt === 'Cấp 1') return '#C8102E'
  if (belt.startsWith('Poom')) return 'poom'
  return '#111'
}

export function nextBelt(belt: BeltRank, ageYears: number): BeltRank {
  if (belt === 'Cấp 10') return 'Cấp 9'
  const i = COLOR_BELTS.indexOf(belt)
  if (i >= 0 && i < COLOR_BELTS.length - 1) return COLOR_BELTS[i + 1]
  if (belt === 'Cấp 1') return ageYears < 15 ? 'Poom 1' : 'Nhất đẳng'
  if (belt === 'Poom 1') return 'Poom 2'
  if (belt === 'Poom 2') return 'Poom 3'
  if (belt === 'Nhất đẳng') return 'Nhị đẳng'
  if (belt === 'Nhị đẳng') return 'Tam đẳng'
  return belt
}
