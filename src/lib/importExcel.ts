import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import type { Gender, Student, StudentStatus } from '../types'
import { parseBelt } from './belt'
import { computeTrinhDo } from './grade'

const FIELD_ALIASES: Record<string, keyof RowMap> = {
  stt: 'stt',
  'mã định danh': 'maDinhDanh',
  'ma dinh danh': 'maDinhDanh',
  'mã hv': 'maHV',
  'ma hv': 'maHV',
  mahv: 'maHV',
  'họ và tên': 'fullName',
  'ho va ten': 'fullName',
  'họ tên': 'fullName',
  'ngày sinh': 'dob',
  'ngay sinh': 'dob',
  'giới tính': 'gender',
  'gioi tinh': 'gender',
  'trình độ': 'grade',
  'trinh do': 'grade',
  'cấp bậc': 'belt',
  'cap bac': 'belt',
  'ngày vào lớp': 'joinDate',
  'ngay vao lop': 'joinDate',
  'ghi chú': 'note',
  'ghi chu': 'note',
  khóa: 'course',
  khoa: 'course',
  sđt: 'phone',
  sdt: 'phone',
  'địa chỉ': 'address',
  'dia chi': 'address',
  'trạng thái': 'status',
  'trang thai': 'status',
}

type RowMap = {
  stt?: string
  maDinhDanh?: string
  maHV?: string
  fullName?: string
  dob?: string
  gender?: string
  grade?: string
  belt?: string
  joinDate?: string
  note?: string
  course?: string
  phone?: string
  address?: string
  status?: string
}

function normHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/\s+/g, ' ')
}

function excelSerialToVi(n: number): string {
  // Excel serial date → JS date (UTC noon)
  const utc = Math.round((n - 25569) * 86400 * 1000)
  const d = new Date(utc)
  const pad = (x: number) => String(x).padStart(2, '0')
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`
}

function cellToString(v: unknown): string {
  if (v == null || v === '') return ''
  if (typeof v === 'number') return String(v)
  return String(v).trim()
}

function cellToDateVi(v: unknown): string {
  if (v == null || v === '') return ''
  if (typeof v === 'number') return excelSerialToVi(v)
  const s = String(v).trim()
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return s
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  return s
}

export function mapHeaders(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const h of headers) {
    const key = FIELD_ALIASES[normHeader(h)]
    if (key) map[h] = key
  }
  return map
}

function rowToStudent(
  row: Record<string, unknown>,
  headerMap: Record<string, string>,
  index: number,
  idPrefix: string,
): Student | null {
  const mapped: RowMap = {}
  for (const [header, field] of Object.entries(headerMap) as [string, keyof RowMap][]) {
    const raw = row[header]
    if (field === 'dob' || field === 'joinDate') {
      mapped[field] = cellToDateVi(raw)
    } else {
      mapped[field] = cellToString(raw)
    }
  }
  if (!mapped.fullName) return null

  const genderRaw = (mapped.gender || 'Nam').toLowerCase()
  const gender: Gender = genderRaw.startsWith('nữ') || genderRaw.startsWith('nu') ? 'Nữ' : 'Nam'
  const statusRaw = (mapped.status || 'Đang học').toLowerCase()
  const status: StudentStatus = statusRaw.includes('nghỉ') || statusRaw.includes('nghi')
    ? 'Nghỉ học'
    : 'Đang học'

  const dob = mapped.dob || ''
  const gradeFromFile = mapped.grade || ''
  // Prefer file value for demo fidelity; still expose rule via recompute helper
  const gradeDisplay = gradeFromFile || computeTrinhDo(dob, gradeFromFile)

  return {
    id: `${idPrefix}-${index}`,
    stt: Number(mapped.stt) || index + 1,
    // Để trống → store/API tự gán VA-YYYY-#### / HV-####
    maDinhDanh: (mapped.maDinhDanh || '').trim(),
    maHV: (mapped.maHV || '').trim(),
    fullName: mapped.fullName,
    dob,
    gender,
    gradeDisplay,
    belt: parseBelt(mapped.belt),
    joinDate: mapped.joinDate || '',
    note: mapped.note || '',
    course: mapped.course || '',
    phone: mapped.phone || '',
    address: mapped.address || '',
    status,
  }
}

export async function parseImportFile(file: File): Promise<{
  headers: string[]
  headerMap: Record<string, string>
  students: Student[]
  rows: Record<string, unknown>[]
}> {
  const name = file.name.toLowerCase()
  let rows: Record<string, unknown>[] = []
  let headers: string[] = []

  if (name.endsWith('.csv')) {
    const text = await file.text()
    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
    })
    rows = parsed.data
    headers = parsed.meta.fields || []
  } else {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })
    headers = ((aoa[0] as unknown[]) || []).map((h) => String(h ?? ''))
  }

  const headerMap = mapHeaders(headers)
  const idPrefix = `imp-${Date.now()}`
  const students = rows
    .map((row, i) => rowToStudent(row, headerMap, i, idPrefix))
    .filter((s): s is Student => s != null)

  return { headers, headerMap, students, rows }
}
