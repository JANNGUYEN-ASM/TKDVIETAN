/** An's rule: age_years = currentYear - birthYear; if > 12 → Đi làm */
export function ageYearsFromDob(dob: string, now = new Date()): number | null {
  const m = dob.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const birthYear = Number(m[3])
  return now.getFullYear() - birthYear
}

export function computeTrinhDo(
  dob: string,
  fallbackGrade?: string,
  now = new Date(),
): string {
  const age = ageYearsFromDob(dob, now)
  if (age != null && age > 12) return 'Đi làm'
  if (fallbackGrade && fallbackGrade.trim()) return fallbackGrade.trim()
  if (age == null) return fallbackGrade?.trim() || '—'
  // Heuristic school grade when import has no Trình độ: rough map
  const grade = Math.min(12, Math.max(1, age - 5))
  return `Lớp ${grade}`
}
