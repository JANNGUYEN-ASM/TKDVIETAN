import * as XLSX from 'xlsx'
import { isWhiteBelt } from './belt'
import { dobSortValue } from './format'
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

export const WHITE_BELT_HEADERS = [
  'STT',
  'Mã hội viên',
  'Họ và tên',
  'Ngày tháng năm sinh dd/mm/yyyy',
  'Giới tính (Nam/Nữ)',
  'Số điện thoại',
  'CMND/CCCD',
  'Trình độ văn hóa',
  'Email',
  'Mã đơn vị',
  'Tổ chức thành viên',
  'Mã CLB',
  'CLB/ Võ đường',
  'Mã HLV',
  'Mã Trọng tài',
  'Số VB Kukkiwon',
  'Ngày tham gia',
  'Địa chỉ',
  'Ghi chú',
] as const

const CLUB_NAME = 'CLB Taekwondo Việt An'

export function whiteBeltExamTitle(now = new Date()): string {
  const quarter = Math.floor(now.getMonth() / 3) + 1
  const roman = ['I', 'II', 'III', 'IV'][quarter - 1] ?? 'IV'
  return `DANH SÁCH ĐAI TRẮNG ĐĂNG KÝ THI QUÝ ${roman} NĂM ${now.getFullYear()}`
}

export function whiteBeltStudents(students: Student[]): Student[] {
  return students
    .filter((s) => isWhiteBelt(s.belt))
    .slice()
    .sort((a, b) => dobSortValue(a.dob) - dobSortValue(b.dob) || a.fullName.localeCompare(b.fullName, 'vi'))
}

export function buildWhiteBeltWorkbook(students: Student[], now = new Date()): XLSX.WorkBook {
  const title = whiteBeltExamTitle(now)
  const rows = whiteBeltStudents(students)
  const aoa: (string | number)[][] = [
    [title],
    [...WHITE_BELT_HEADERS],
    ...rows.map((s, index) => [
      index + 1,
      s.maDinhDanh || s.maHV,
      s.fullName,
      s.dob,
      s.gender,
      s.phone,
      '',
      s.gradeDisplay,
      '',
      '',
      '',
      '',
      CLUB_NAME,
      '',
      '',
      '',
      s.joinDate,
      s.address,
      s.note,
    ]),
  ]
  const sheet = XLSX.utils.aoa_to_sheet(aoa)
  sheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: WHITE_BELT_HEADERS.length - 1 } }]
  sheet['!cols'] = WHITE_BELT_HEADERS.map((header) => ({
    wch: Math.min(36, Math.max(14, header.length + 2)),
  }))
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Đai trắng')
  return book
}

export function downloadWhiteBeltExcel(students: Student[], now = new Date()) {
  const count = whiteBeltStudents(students).length
  if (count === 0) return { count, name: '' }
  const name = `${whiteBeltExamTitle(now)}.xlsx`
  XLSX.writeFile(buildWhiteBeltWorkbook(students, now), name)
  return { count, name }
}
