export type Role = 'an' | 'hlv'

export type Gender = 'Nam' | 'Nữ'

export type StudentStatus = 'Đang học' | 'Nghỉ học'

export type BeltRank =
  | 'Cấp 10'
  | 'Cấp 9'
  | 'Cấp 8'
  | 'Cấp 7'
  | 'Cấp 6'
  | 'Cấp 5'
  | 'Cấp 4'
  | 'Cấp 3'
  | 'Cấp 2'
  | 'Cấp 1'
  | 'Poom 1'
  | 'Poom 2'
  | 'Poom 3'
  | 'Nhất đẳng'
  | 'Nhị đẳng'
  | 'Tam đẳng'

export type SessionDay = 'T3' | 'T5' | 'CN' | 'Bù'

export type SessionKind = 'regular' | 'cancelled' | 'makeup'

export type AttendanceStatus = 'Có mặt' | 'Vắng' | 'Có phép' | 'Trễ'

export type CancelReason = 'Mưa' | 'Có việc' | 'Khác'

export type FeeMode = 'tháng' | 'khóa' | 'võ phục' | 'dụng cụ' | 'lệ phí thi' | 'lệ phí thi lên đẳng'

export type FeeStatus = 'Chưa thu' | 'Đã thu' | 'Miễn'

export const EXTRA_FEE_MODES = ['võ phục', 'dụng cụ', 'lệ phí thi', 'lệ phí thi lên đẳng'] as const

export const TUITION_FEE_MODES = ['tháng', 'khóa'] as const

export type Student = {
  id: string
  stt: number
  maDinhDanh: string
  maHV: string
  fullName: string
  dob: string
  gender: Gender
  gradeDisplay: string
  belt: BeltRank
  joinDate: string
  note: string
  course: string
  phone: string
  address: string
  status: StudentStatus
}

export type ClassSession = {
  id: string
  date: string
  dayCode: SessionDay
  timeLabel: string
  kind: SessionKind
  cancelReason?: string
  makeupSessionId?: string
  makeupForSessionId?: string
}

export type AttendanceRecord = {
  sessionId: string
  studentId: string
  status: AttendanceStatus
}

export type FeeRecord = {
  id: string
  studentId: string
  mode: FeeMode
  period: string
  amount: number
  status: FeeStatus
}

export type ClubSettings = {
  defaultFee: number
  defaultCourse: string
}

export type AppState = {
  role: Role
  settings: ClubSettings
  students: Student[]
  sessions: ClassSession[]
  attendance: AttendanceRecord[]
  fees: FeeRecord[]
  removedStudentIds?: string[]
}
