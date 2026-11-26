import * as XLSX from 'xlsx'
import type { Student } from '../types'

export const STUDENT_EXCEL_HEADERS = [
  'STT',
  'Mã định danh',
  'Mã HV',
  'Họ và tên',
  'Ngày sinh',
  'Giới tính',
  'Trình độ',
  'Cấp bậc',
  'Ngày vào lớp',
  'Ghi chú',
  'KHÓA',
  'SĐT',
  'Địa chỉ',
  'Trạng thái',
] as const

export function studentsToExcelRows(students: Student[]): Record<string, string | number>[] {
  return students
    .slice()
    .sort((a, b) => a.stt - b.stt)
    .map((s) => ({
      STT: s.stt,
      'Mã định danh': s.maDinhDanh,
      'Mã HV': s.maHV,
      'Họ và tên': s.fullName,
      'Ngày sinh': s.dob,
      'Giới tính': s.gender,
      'Trình độ': s.gradeDisplay,
      'Cấp bậc': s.belt,
      'Ngày vào lớp': s.joinDate,
      'Ghi chú': s.note,
      KHÓA: s.course,
      SĐT: s.phone,
      'Địa chỉ': s.address,
      'Trạng thái': s.status,
    }))
}

export function buildStudentsWorkbook(students: Student[]): XLSX.WorkBook {
  const sheet = XLSX.utils.json_to_sheet(studentsToExcelRows(students), {
    header: [...STUDENT_EXCEL_HEADERS],
  })
  sheet['!cols'] = STUDENT_EXCEL_HEADERS.map((header) => ({
    wch: Math.min(36, Math.max(12, header.length + 2)),
  }))
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Võ sinh')
  return book
}

export function studentsExcelFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  return `viet-an-vo-sinh-${stamp}.xlsx`
}

export function downloadStudentsExcel(students: Student[]) {
  const name = studentsExcelFileName()
  XLSX.writeFile(buildStudentsWorkbook(students), name)
  return name
}
