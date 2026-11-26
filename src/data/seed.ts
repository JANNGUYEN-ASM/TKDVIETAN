import type { AppState, ClassSession, FeeRecord, Student } from '../types'

export const CLASS_TIME = '18:00–19:30'
export const DEFAULT_FEE = 1_500_000
export const STORAGE_KEY = 'viet-an-club-v4'

export const SAMPLE_STUDENTS: Student[] = [
  {
    id: 's1',
    stt: 1,
    maDinhDanh: 'VA-2025-0001',
    maHV: 'HV-0001',
    fullName: 'Nguyễn Tuấn Anh',
    dob: '25/06/2013',
    gender: 'Nam',
    gradeDisplay: 'Lớp 8',
    belt: 'Cấp 2',
    joinDate: '07/02/2025',
    note: '',
    course: 'I-25',
    phone: '',
    address: 'Ấp Bình Thuận, xã Bình Trưng, Đồng Tháp',
    status: 'Nghỉ học',
  },
  {
    id: 's2',
    stt: 2,
    maDinhDanh: 'VA-2025-0002',
    maHV: 'HV-0002',
    fullName: 'Lê Minh Quý',
    dob: '29/05/2014',
    gender: 'Nam',
    gradeDisplay: 'Lớp 7',
    belt: 'Cấp 2',
    joinDate: '08/02/2025',
    note: '',
    course: 'I-25',
    phone: '0901 234 567',
    address: '',
    status: 'Đang học',
  },
  {
    id: 's3',
    stt: 3,
    maDinhDanh: 'VA-2025-0003',
    maHV: 'HV-0003',
    fullName: 'Lê Nguyễn Gia Bảo',
    dob: '03/12/2013',
    gender: 'Nam',
    gradeDisplay: 'Lớp 2',
    belt: 'Cấp 2',
    joinDate: '18/02/2025',
    note: '',
    course: '',
    phone: '',
    address: '',
    status: 'Đang học',
  },
  {
    id: 's4',
    stt: 4,
    maDinhDanh: 'VA-2025-0004',
    maHV: 'HV-0004',
    fullName: 'Nguyễn Ngọc Thanh Trâm',
    dob: '13/06/2016',
    gender: 'Nữ',
    gradeDisplay: 'Lớp 5',
    belt: 'Cấp 2',
    joinDate: '18/02/2025',
    note: '',
    course: '',
    phone: '',
    address: '',
    status: 'Đang học',
  },
]

function session(
  id: string,
  date: string,
  dayCode: ClassSession['dayCode'],
  extra?: Partial<ClassSession>,
): ClassSession {
  return { id, date, dayCode, timeLabel: CLASS_TIME, kind: 'regular', ...extra }
}

export const SAMPLE_SESSIONS: ClassSession[] = [
  session('ses-2025-11-20', '2025-11-20', 'T5'),
  session('ses-2025-11-23', '2025-11-23', 'CN', {
    kind: 'cancelled',
    cancelReason: 'Mưa',
    makeupSessionId: 'ses-bu-2025-11-26',
  }),
  session('ses-bu-2025-11-26', '2025-11-26', 'Bù', {
    kind: 'makeup',
    makeupForSessionId: 'ses-2025-11-23',
  }),
  session('ses-2025-11-25', '2025-11-25', 'T3'),
]

export function buildSampleFees(month = '2026-11'): FeeRecord[] {
  return [
    {
      id: 'f1',
      studentId: 's2',
      mode: 'tháng',
      period: month,
      amount: DEFAULT_FEE,
      status: 'Đã thu',
    },
    {
      id: 'f2',
      studentId: 's3',
      mode: 'tháng',
      period: month,
      amount: DEFAULT_FEE,
      status: 'Phải thu',
    },
    {
      id: 'f3',
      studentId: 's4',
      mode: 'tháng',
      period: month,
      amount: DEFAULT_FEE,
      status: 'Đã thu',
    },
    {
      id: 'f4',
      studentId: 's1',
      mode: 'tháng',
      period: month,
      amount: DEFAULT_FEE,
      status: 'Miễn',
    },
    {
      id: 'f5',
      studentId: 's2',
      mode: 'khóa',
      period: 'I-25',
      amount: DEFAULT_FEE,
      status: 'Đã thu',
    },
  ]
}

export function createInitialState(): AppState {
  return {
    role: 'an',
    settings: {
      defaultFee: DEFAULT_FEE,
      defaultCourse: 'I-25',
    },
    students: SAMPLE_STUDENTS,
    sessions: SAMPLE_SESSIONS,
    attendance: [
      { sessionId: 'ses-2025-11-25', studentId: 's2', status: 'Có mặt' },
      { sessionId: 'ses-2025-11-25', studentId: 's3', status: 'Có mặt' },
      { sessionId: 'ses-2025-11-25', studentId: 's4', status: 'Trễ' },
      { sessionId: 'ses-bu-2025-11-26', studentId: 's2', status: 'Có mặt' },
      { sessionId: 'ses-bu-2025-11-26', studentId: 's3', status: 'Có mặt' },
      { sessionId: 'ses-bu-2025-11-26', studentId: 's4', status: 'Có mặt' },
    ],
    fees: buildSampleFees(),
  }
}
