export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function formatMoney(n: number): string {
  return `${n.toLocaleString('vi-VN')}đ`
}

const DAY_LABELS: Record<string, string> = {
  T2: 'Thứ Hai (T2)',
  T3: 'Thứ Ba (T3)',
  T4: 'Thứ Tư (T4)',
  T5: 'Thứ Năm (T5)',
  T6: 'Thứ Sáu (T6)',
  T7: 'Thứ Bảy (T7)',
  CN: 'Chủ Nhật (CN)',
  Bù: 'Buổi tập bù',
}

export const WEEKDAY_CODES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const

export function sessionDayLabel(code: string): string {
  return DAY_LABELS[code] || code
}

/** YYYY-MM-DD → DD/MM/YYYY */
export function isoToVi(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function todayIso(): string {
  return toIso(new Date())
}

export function toIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseIso(iso: string): Date {
  return new Date(`${iso}T12:00:00`)
}

export function addDays(iso: string, days: number): string {
  const d = parseIso(iso)
  d.setDate(d.getDate() + days)
  return toIso(d)
}

export function startOfWeek(iso: string): string {
  const d = parseIso(iso)
  const weekday = d.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  d.setDate(d.getDate() + mondayOffset)
  return toIso(d)
}

export function startOfMonth(iso: string): string {
  const d = parseIso(iso)
  d.setDate(1)
  return toIso(d)
}

export function endOfMonth(iso: string): string {
  const d = parseIso(iso)
  d.setMonth(d.getMonth() + 1, 0)
  return toIso(d)
}

export function eachDay(startIso: string, endIso: string): string[] {
  const days: string[] = []
  let cursor = startIso
  while (cursor <= endIso) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return days
}

export function quarterInfo(iso: string): { year: number; quarter: number; start: string; end: string } {
  const d = parseIso(iso)
  const quarter = Math.floor(d.getMonth() / 3) + 1
  const startMonth = (quarter - 1) * 3
  const start = new Date(d.getFullYear(), startMonth, 1, 12)
  const end = new Date(d.getFullYear(), startMonth + 3, 0, 12)
  return { year: d.getFullYear(), quarter, start: toIso(start), end: toIso(end) }
}

export function quarterLabel(iso: string): string {
  const info = quarterInfo(iso)
  const roman = ['I', 'II', 'III', 'IV'][info.quarter - 1]
  const startMonth = String((info.quarter - 1) * 3 + 1).padStart(2, '0')
  const endMonth = String(info.quarter * 3).padStart(2, '0')
  return `Quý ${roman} (${startMonth}/${info.year}–${endMonth}/${info.year})`
}

export function shiftPeriod(iso: string, scope: 'week' | 'month' | 'quarter', direction: -1 | 1): string {
  if (scope === 'week') return addDays(iso, 7 * direction)
  const d = parseIso(iso)
  d.setMonth(d.getMonth() + (scope === 'month' ? direction : 3 * direction))
  return toIso(d)
}

/** Missing or unreadable dates sort after every real date. */
export function dobSortValue(dob: string): number {
  const iso = viToIso(dob)
  if (!iso) return Number.POSITIVE_INFINITY
  const time = Date.parse(`${iso}T12:00:00`)
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time
}

/** DD/MM/YYYY → YYYY-MM-DD for <input type="date"> */
export function viToIso(vi: string): string {
  const m = vi.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return ''
  const pad = (n: string) => n.padStart(2, '0')
  return `${m[3]}-${pad(m[2])}-${pad(m[1])}`
}

/** YYYY-MM-DD → DD/MM/YYYY */
export function isoDateToVi(iso: string): string {
  if (!iso) return ''
  return isoToVi(iso)
}

export function incompleteStudent(s: { phone: string; address: string; course: string }): string[] {
  const miss: string[] = []
  if (!s.phone.trim()) miss.push('SĐT')
  if (!s.address.trim()) miss.push('Địa chỉ')
  if (!s.course.trim()) miss.push('Khóa')
  return miss
}

export function dayCodeFromIso(iso: string): (typeof WEEKDAY_CODES)[number] | null {
  const d = parseIso(iso)
  if (Number.isNaN(d.getTime())) return null
  const byJsDay = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const
  return byJsDay[d.getDay()] ?? null
}
