import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CLASS_TIME, createInitialState, DEFAULT_QUARTER_FEE, LEGACY_DEFAULT_FEE, LEGACY_STORAGE_KEY, STORAGE_KEY } from './data/seed'
import { canonicalBelt, nextBelt } from './lib/belt'
import { ageYearsFromDob } from './lib/grade'
import { canonicalFee, migrateFeeAmount } from './lib/fees'
import { mergeClubState, removedIds, revisionOf } from './lib/mergeState'
import { keepClubState } from './lib/stripDemo'
import { createSyncCode, normalizeSyncCode, SYNC_CODE_KEY, SYNC_HEADER } from './lib/syncCode'
import type {
  AppState,
  AttendanceRecord,
  AttendanceStatus,
  CancelReason,
  ClassSession,
  ClubSettings,
  FeeRecord,
  Role,
  SessionDay,
  Student,
} from './types'
import { dayCodeFromIso } from './lib/format'
import { assignCodesForNew, ensureStudentCodes } from './lib/studentCodes'

function normalizeState(raw: AppState): AppState {
  const base = createInitialState()
  return {
    ...base,
    ...raw,
    settings: {
      ...base.settings,
      ...(raw.settings || {}),
      defaultFee:
        raw.settings?.defaultFee === LEGACY_DEFAULT_FEE
          ? base.settings.defaultFee
          : (raw.settings?.defaultFee ?? base.settings.defaultFee),
      defaultQuarterFee:
        typeof raw.settings?.defaultQuarterFee === 'number' && raw.settings.defaultQuarterFee >= 0
          ? raw.settings.defaultQuarterFee
          : DEFAULT_QUARTER_FEE,
    },
    sessions: normalizeSessions(raw.sessions || []),
    students: ensureStudentCodes(raw.students || []).map((student) => ({
      ...student,
      belt: canonicalBelt(student.belt),
    })),
    fees: (raw.fees || []).map((fee) => {
      const next = canonicalFee(fee)
      return {
        ...next,
        amount: migrateFeeAmount(next.amount, next.mode, raw.settings?.defaultFee === LEGACY_DEFAULT_FEE),
      }
    }),
    removedStudentIds: removedIds(raw.removedStudentIds),
    revision: revisionOf(raw.revision),
  }
}

function clubHeaders(code: string): HeadersInit {
  return { 'content-type': 'application/json', [SYNC_HEADER]: code }
}

type Store = {
  state: AppState
  syncLabel: string
  setRole: (role: Role) => void
  updateSettings: (patch: Partial<ClubSettings>) => void
  setDefaultFee: (amount: number) => void
  upsertStudent: (student: Student) => void
  promoteBelts: (ids: string[]) => void
  deleteStudent: (id: string) => void
  replaceStudents: (students: Student[], mode: 'merge' | 'replace') => void
  ensureSession: (session: ClassSession) => void
  getOrCreateSession: (date: string) => ClassSession
  cancelSession: (sessionId: string, reason: CancelReason | string) => void
  reopenSession: (sessionId: string) => void
  scheduleMakeup: (cancelledSessionId: string, makeupDate: string) => ClassSession | null
  setAttendance: (sessionId: string, studentId: string, status: AttendanceStatus) => void
  saveAttendanceBulk: (sessionId: string, records: AttendanceRecord[]) => void
  markFeePaid: (feeId: string) => void
  upsertFee: (fee: FeeRecord) => void
  replaceAllState: (next: AppState) => void
  clearAllData: () => void
  syncCode: string
  createClubSync: () => Promise<string>
  joinClubSync: (raw: string) => Promise<string>
}

const Ctx = createContext<Store | null>(null)

function normalizeSessions(sessions: ClassSession[]): ClassSession[] {
  return sessions.map((s) => ({
    ...s,
    kind: s.kind || 'regular',
  }))
}

function readStored(key: string): AppState | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppState
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.students)) return null
    return keepClubState(normalizeState(parsed))
  } catch {
    return null
  }
}

function loadState(): AppState {
  return readStored(STORAGE_KEY) ?? readStored(LEGACY_STORAGE_KEY) ?? createInitialState()
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())
  const [syncLabel, setSyncLabel] = useState('Đang kết nối…')
  const [hydrated, setHydrated] = useState(false)
  const [syncCode, setSyncCode] = useState('')
  const syncCodeRef = useRef('')
  const skipNextPush = useRef(true)
  const forceReplace = useRef(false)

  function rememberCode(code: string) {
    syncCodeRef.current = code
    setSyncCode(code)
    try {
      localStorage.setItem(SYNC_CODE_KEY, code)
    } catch {
      /* keep the code in memory for this visit */
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const saved = normalizeSyncCode(localStorage.getItem(SYNC_CODE_KEY) || '') || ''
      if (saved) rememberCode(saved)
      const headers: HeadersInit = saved ? { [SYNC_HEADER]: saved } : {}
      try {
        const res = await fetch('/api/state', { cache: 'no-store', headers })
        if (cancelled) return
        if (res.status === 401) {
          setSyncLabel('Chưa đồng bộ — tạo mã để dùng chung các máy')
          return
        }
        if (res.status === 404) {
          const put = await fetch('/api/state', {
            method: 'PUT',
            headers: saved ? clubHeaders(saved) : { 'content-type': 'application/json' },
            body: JSON.stringify({ state }),
          })
          if (!cancelled) setSyncLabel(put.ok ? 'Đã đẩy dữ liệu lên database' : 'Chưa lưu được database')
          return
        }
        if (!res.ok) {
          setSyncLabel('Dùng dữ liệu máy (API chưa sẵn sàng)')
          return
        }
        const data = (await res.json()) as { state?: AppState }
        if (!Array.isArray(data.state?.students)) return
        const remote = keepClubState(normalizeState(data.state))
        setState((current) => {
          const merged = mergeClubState(current, remote)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
          const remoteIds = new Set((remote.students || []).map((student) => student.id))
          const remoteRemoved = new Set(remote.removedStudentIds || [])
          const phoneOnly = (current.students || []).some((student) => student?.id && !remoteIds.has(student.id))
          const localDelete = (current.removedStudentIds || []).some((id) => !remoteRemoved.has(id))
          if ((phoneOnly || localDelete) && saved) {
            void fetch('/api/state', {
              method: 'PUT',
              headers: clubHeaders(saved),
              body: JSON.stringify({ state: merged }),
            })
          }
          return merged
        })
        setSyncLabel('Đã đồng bộ database')
      } catch {
        if (!cancelled) setSyncLabel('Dùng dữ liệu máy (offline)')
      } finally {
        if (!cancelled) {
          skipNextPush.current = true
          setHydrated(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    if (!hydrated) return
    if (skipNextPush.current) {
      skipNextPush.current = false
      return
    }
    const t = window.setTimeout(async () => {
      const code = syncCodeRef.current
      const replace = forceReplace.current
      forceReplace.current = false
      try {
        const res = await fetch('/api/state', {
          method: 'PUT',
          headers: code ? clubHeaders(code) : { 'content-type': 'application/json' },
          body: JSON.stringify({ state, replace }),
        })
        if (res.status === 401) {
          setSyncLabel('Chưa đồng bộ — tạo mã để dùng chung các máy')
          return
        }
        if (res.status === 409) {
          const data = (await res.json()) as { state?: AppState }
          if (data.state && Array.isArray(data.state.students)) {
            const next = keepClubState(normalizeState(data.state))
            skipNextPush.current = true
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
            setState(next)
          }
          setSyncLabel('Máy này đang giữ bản cũ. Đã lấy lại dữ liệu trên database.')
          return
        }
        if (res.ok && replace) {
          const data = (await res.json()) as { state?: AppState }
          if (data.state && Array.isArray(data.state.students)) {
            const next = keepClubState(normalizeState(data.state))
            skipNextPush.current = true
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
            setState(next)
          }
        }
        setSyncLabel(
          res.ok
            ? `Đã lưu database · ${new Date().toLocaleTimeString('vi-VN')}`
            : 'Lưu database lỗi — vẫn giữ trên máy',
        )
      } catch {
        setSyncLabel('Lưu database lỗi — vẫn giữ trên máy')
      }
    }, 700)
    return () => window.clearTimeout(t)
  }, [state, hydrated])

  const setRole = useCallback((role: Role) => {
    setState((s) => ({ ...s, role }))
  }, [])

  const updateSettings = useCallback((patch: Partial<ClubSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  }, [])

  const setDefaultFee = useCallback((amount: number) => {
    const fee = Number.isFinite(amount) && amount >= 0 ? amount : 0
    setState((s) => ({
      ...s,
      settings: { ...s.settings, defaultFee: fee },
      fees: s.fees.map((item) =>
        item.mode === 'tháng' || item.mode === 'khóa' ? { ...item, amount: fee } : item,
      ),
    }))
  }, [])

  const upsertStudent = useCallback((student: Student) => {
    setState((s) => {
      const i = s.students.findIndex((x) => x.id === student.id)
      const removedStudentIds = (s.removedStudentIds || []).filter((id) => id !== student.id)
      if (i < 0) {
        return { ...s, removedStudentIds, students: [...s.students, assignCodesForNew(student)] }
      }
      const next = [...s.students]
      next[i] = assignCodesForNew(student)
      return { ...s, removedStudentIds, students: next }
    })
  }, [])

  const promoteBelts = useCallback((ids: string[]) => {
    const chosen = new Set(ids)
    setState((s) => ({
      ...s,
      students: s.students.map((student) => {
        if (!chosen.has(student.id) || student.status !== 'Đang học') return student
        const age = ageYearsFromDob(student.dob)
        if (age == null || age < 6) return student
        const belt = nextBelt(student.belt, age)
        if (belt === student.belt) return student
        return { ...student, belt }
      }),
    }))
  }, [])

  const deleteStudent = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      students: s.students.filter((x) => x.id !== id),
      attendance: s.attendance.filter((a) => a.studentId !== id),
      fees: s.fees.filter((f) => f.studentId !== id),
      removedStudentIds: [...new Set([...(s.removedStudentIds || []), id])].slice(0, 4000),
    }))
  }, [])

  const replaceStudents = useCallback((students: Student[], mode: 'merge' | 'replace') => {
    setState((s) => {
      if (mode === 'replace') {
        const nextStudents = ensureStudentCodes(students)
        const keep = new Set(nextStudents.map((student) => student.id))
        const removed = new Set(s.removedStudentIds || [])
        for (const old of s.students) {
          if (!keep.has(old.id)) removed.add(old.id)
        }
        for (const id of keep) removed.delete(id)
        return { ...s, students: nextStudents, removedStudentIds: [...removed] }
      }
      const byNameDob = new Map(s.students.map((st) => [`${st.fullName}|${st.dob}`, st]))
      const merged = [...s.students]
      for (const incoming of students) {
        const key = `${incoming.fullName}|${incoming.dob}`
        const existing = byNameDob.get(key)
        if (existing) {
          const idx = merged.findIndex((x) => x.id === existing.id)
          merged[idx] = {
            ...existing,
            ...incoming,
            id: existing.id,
            stt: existing.stt,
            maDinhDanh: incoming.maDinhDanh?.trim() || existing.maDinhDanh,
            maHV: incoming.maHV?.trim() || existing.maHV,
          }
        } else {
          merged.push(assignCodesForNew({ ...incoming, stt: merged.length + 1 }))
        }
      }
      return { ...s, students: ensureStudentCodes(merged) }
    })
  }, [])

  const ensureSession = useCallback((session: ClassSession) => {
    setState((s) => {
      if (s.sessions.some((x) => x.id === session.id)) return s
      return { ...s, sessions: [...s.sessions, { ...session, kind: session.kind || 'regular' }] }
    })
  }, [])

  const getOrCreateSession = useCallback((date: string): ClassSession => {
    const id = `ses-${date}`
    const existing = state.sessions.find((x) => x.id === id || (x.date === date && x.kind !== 'makeup'))
    if (existing) return existing
    const day = dayCodeFromIso(date)
    const created: ClassSession = {
      id,
      date,
      dayCode: (day || 'Bù') as SessionDay,
      timeLabel: CLASS_TIME,
      kind: 'regular',
    }
    setState((s) => {
      if (s.sessions.some((x) => x.id === id)) return s
      return { ...s, sessions: [...s.sessions, created] }
    })
    return created
  }, [state.sessions])

  const cancelSession = useCallback((sessionId: string, reason: CancelReason | string) => {
    setState((s) => ({
      ...s,
      sessions: s.sessions.map((ses) =>
        ses.id === sessionId
          ? { ...ses, kind: 'cancelled' as const, cancelReason: reason }
          : ses,
      ),
      // Cancelled buổi: không tính điểm danh — xóa marks buổi đó
      attendance: s.attendance.filter((a) => a.sessionId !== sessionId),
    }))
  }, [])

  const reopenSession = useCallback((sessionId: string) => {
    setState((s) => ({
      ...s,
      sessions: s.sessions.map((ses) => {
        if (ses.id !== sessionId) return ses
        return {
          ...ses,
          kind: 'regular' as const,
          cancelReason: undefined,
          // keep makeupSessionId link if any — An can still use makeup separately
        }
      }),
    }))
  }, [])

  const scheduleMakeup = useCallback(
    (cancelledSessionId: string, makeupDate: string): ClassSession | null => {
      let created: ClassSession | null = null
      setState((s) => {
        const cancelled = s.sessions.find((x) => x.id === cancelledSessionId)
        if (!cancelled || cancelled.kind !== 'cancelled') return s
        if (cancelled.makeupSessionId) {
          const existing = s.sessions.find((x) => x.id === cancelled.makeupSessionId)
          created = existing || null
          return s
        }
        const makeupId = `ses-bu-${makeupDate}-${cancelledSessionId.slice(-6)}`
        const day = dayCodeFromIso(makeupDate)
        const makeup: ClassSession = {
          id: makeupId,
          date: makeupDate,
          dayCode: day || 'Bù',
          timeLabel: CLASS_TIME,
          kind: 'makeup',
          makeupForSessionId: cancelledSessionId,
        }
        created = makeup
        return {
          ...s,
          sessions: [
            ...s.sessions.map((ses) =>
              ses.id === cancelledSessionId ? { ...ses, makeupSessionId: makeupId } : ses,
            ),
            makeup,
          ],
        }
      })
      return created
    },
    [],
  )

  const setAttendance = useCallback(
    (sessionId: string, studentId: string, status: AttendanceStatus) => {
      setState((s) => {
        const rest = s.attendance.filter(
          (a) => !(a.sessionId === sessionId && a.studentId === studentId),
        )
        return { ...s, attendance: [...rest, { sessionId, studentId, status }] }
      })
    },
    [],
  )

  const saveAttendanceBulk = useCallback((sessionId: string, records: AttendanceRecord[]) => {
    setState((s) => {
      const rest = s.attendance.filter((a) => a.sessionId !== sessionId)
      return { ...s, attendance: [...rest, ...records] }
    })
  }, [])

  const markFeePaid = useCallback((feeId: string) => {
    setState((s) => ({
      ...s,
      fees: s.fees.map((f) => (f.id === feeId ? { ...f, status: 'Đã thu' as const } : f)),
    }))
  }, [])

  const upsertFee = useCallback((fee: FeeRecord) => {
    setState((s) => {
      const i = s.fees.findIndex((f) => f.id === fee.id)
      if (i < 0) return { ...s, fees: [...s.fees, fee] }
      const next = [...s.fees]
      next[i] = fee
      return { ...s, fees: next }
    })
  }, [])

  async function writeWholeBook(next: AppState) {
    const normalized = keepClubState(normalizeState(next))
    const code = syncCodeRef.current
    try {
      const res = await fetch('/api/state', {
        method: 'PUT',
        headers: code ? clubHeaders(code) : { 'content-type': 'application/json' },
        body: JSON.stringify({ state: normalized, replace: true }),
      })
      if (res.ok) {
        const data = (await res.json()) as { state?: AppState }
        const saved =
          data.state && Array.isArray(data.state.students)
            ? keepClubState(normalizeState(data.state))
            : normalized
        skipNextPush.current = true
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
        setState(saved)
        return true
      }
    } catch {
      /* keep the new copy on this device and retry through the normal save */
    }
    forceReplace.current = true
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    setState(normalized)
    return false
  }

  const replaceAllState = useCallback((next: AppState) => {
    void writeWholeBook(next).then((ok) => {
      setSyncLabel(ok ? 'Đã thay toàn bộ dữ liệu trên database' : 'Đã đổi trên máy. Database sẽ cập nhật khi có mạng.')
    })
  }, [])

  const clearAllData = useCallback(() => {
    void writeWholeBook(createInitialState()).then((ok) => {
      setSyncLabel(ok ? 'Đã xóa dữ liệu trên database' : 'Đã xóa trên máy. Database sẽ xóa khi có mạng.')
    })
  }, [])

  const createClubSync = useCallback(async () => {
    const code = createSyncCode()
    rememberCode(code)
    try {
      const res = await fetch('/api/state', {
        method: 'PUT',
        headers: clubHeaders(code),
        body: JSON.stringify({ state }),
      })
      if (!res.ok) {
        setSyncLabel('Chưa lưu được database')
        return ''
      }
      setSyncLabel('Đã lưu database. Nhập mã này trên máy kia.')
      return code
    } catch {
      setSyncLabel('Chưa lưu được database')
      return ''
    }
  }, [state])

  const joinClubSync = useCallback(async (raw: string) => {
    const code = normalizeSyncCode(raw)
    if (!code) return 'Mã gồm 12 ký tự, dạng ABCD-EFGH-JKLM'
    try {
      const res = await fetch('/api/state', { cache: 'no-store', headers: { [SYNC_HEADER]: code } })
      if (res.status === 404) return 'Không thấy dữ liệu với mã này. Kiểm tra lại mã trên điện thoại.'
      if (!res.ok) return 'Không đồng bộ được. Thử lại.'
      const data = (await res.json()) as { state?: AppState }
      if (!Array.isArray(data.state?.students)) return 'Không đồng bộ được. Thử lại.'
      const remote = keepClubState(normalizeState(data.state))
      rememberCode(code)
      setState((current) => {
        const merged = mergeClubState(current, remote)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
        return merged
      })
      setSyncLabel('Đã lấy dữ liệu từ database')
      return ''
    } catch {
      return 'Không đồng bộ được. Thử lại.'
    }
  }, [])

  const value = useMemo(
    () => ({
      state,
      syncLabel,
      setRole,
      updateSettings,
      setDefaultFee,
      upsertStudent,
      promoteBelts,
      deleteStudent,
      replaceStudents,
      ensureSession,
      getOrCreateSession,
      cancelSession,
      reopenSession,
      scheduleMakeup,
      setAttendance,
      saveAttendanceBulk,
      markFeePaid,
      upsertFee,
      replaceAllState,
      clearAllData,
      syncCode,
      createClubSync,
      joinClubSync,
    }),
    [
      state,
      syncLabel,
      syncCode,
      createClubSync,
      joinClubSync,
      setRole,
      updateSettings,
      setDefaultFee,
      upsertStudent,
      promoteBelts,
      deleteStudent,
      replaceStudents,
      ensureSession,
      getOrCreateSession,
      cancelSession,
      reopenSession,
      scheduleMakeup,
      setAttendance,
      saveAttendanceBulk,
      markFeePaid,
      upsertFee,
      replaceAllState,
      clearAllData,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}
