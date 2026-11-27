/** Age is the current calendar year minus the birth year. */
export function ageYearsFromDob(dob: string, now = new Date()): number | null {
  const m = dob.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const birthYear = Number(m[3])
  if (!Number.isFinite(birthYear)) return null
  return now.getFullYear() - birthYear
}

export const ADULT_GRADE_OPTIONS = ['Đi làm', 'Cao đẳng', 'Đại học'] as const

export type AdultGrade = (typeof ADULT_GRADE_OPTIONS)[number]

export function isAdultGrade(value: string): value is AdultGrade {
  return (ADULT_GRADE_OPTIONS as readonly string[]).includes(value)
}

export function needsAdultGradeChoice(dob: string, now = new Date()): boolean {
  const age = ageYearsFromDob(dob, now)
  return age != null && age >= 19
}

/**
 * 6 tuổi = Lớp 1, rồi mỗi tuổi thêm một lớp.
 * 17 và 18 tuổi vẫn Lớp 12. Dưới 6 tuổi là Mẫu giáo.
 * Từ 19 tuổi không tự gán: người dùng chọn Đi làm, Cao đẳng hoặc Đại học.
 */
export function computeTrinhDo(dob: string, fallbackGrade?: string, now = new Date()): string {
  const age = ageYearsFromDob(dob, now)
  if (age == null) return fallbackGrade?.trim() || ''
  if (age < 6) return 'Mẫu giáo'
  if (age >= 19) return ''
  if (age >= 17) return 'Lớp 12'
  return `Lớp ${age - 5}`
}
