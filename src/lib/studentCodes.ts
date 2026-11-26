import type { Student } from '../types'

/**
 * Quy ước mã (CLB Việt An):
 * - Mã định danh: VA-YYYY-####  (năm vào lớp/tạo + số thứ tự trong năm)
 * - Mã HV:        HV-####       (số thứ tự toàn CLB, dễ gọi miệng)
 * Cả hai tự sinh khi thêm võ sinh — An không cần gõ.
 */

export function yearFromJoinOrNow(joinDate: string, now = new Date()): number {
  const m = joinDate.trim().match(/\/(\d{4})$/)
  if (m) return Number(m[1])
  return now.getFullYear()
}

function maxSeq(codes: string[], pattern: RegExp): number {
  let max = 0
  for (const c of codes) {
    const m = c.match(pattern)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return max
}

export function nextMaDinhDanh(existing: Student[], joinDate = '', now = new Date()): string {
  const year = yearFromJoinOrNow(joinDate, now)
  const seq =
    maxSeq(
      existing.map((s) => s.maDinhDanh || ''),
      new RegExp(`^VA-${year}-(\\d+)$`, 'i'),
    ) + 1
  return `VA-${year}-${String(seq).padStart(4, '0')}`
}

export function nextMaHV(existing: Student[]): string {
  const seq =
    maxSeq(
      existing.map((s) => s.maHV || ''),
      /^HV-(\d+)$/i,
    ) + 1
  return `HV-${String(seq).padStart(4, '0')}`
}

/** Backfill mã thiếu theo thứ tự STT — không đè mã đã có. */
export function ensureStudentCodes(students: Student[], now = new Date()): Student[] {
  const sorted = [...students].sort((a, b) => a.stt - b.stt || a.fullName.localeCompare(b.fullName, 'vi'))
  const assigned: Student[] = []
  for (const s of sorted) {
    assigned.push({
      ...s,
      maDinhDanh: s.maDinhDanh?.trim() || nextMaDinhDanh(assigned, s.joinDate, now),
      maHV: s.maHV?.trim() || nextMaHV(assigned),
    })
  }
  const byId = new Map(assigned.map((s) => [s.id, s]))
  return students.map((s) => byId.get(s.id) || s)
}

export function assignCodesForNew(student: Student, existing: Student[], now = new Date()): Student {
  return {
    ...student,
    maDinhDanh: student.maDinhDanh?.trim() || nextMaDinhDanh(existing, student.joinDate, now),
    maHV: student.maHV?.trim() || nextMaHV(existing),
  }
}
