import type { Student } from '../types'

/** Mã HV và mã định danh do liên đoàn cấp. Giữ đúng chữ đã gõ, không tự sinh. */
export function assignCodesForNew(student: Student): Student {
  return {
    ...student,
    maDinhDanh: student.maDinhDanh?.trim() || '',
    maHV: student.maHV?.trim() || '',
  }
}

export function ensureStudentCodes(students: Student[]): Student[] {
  return students.map((s) => assignCodesForNew(s))
}
