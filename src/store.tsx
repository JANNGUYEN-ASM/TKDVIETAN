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
import { CLASS_TIME, createInitialState, LEGACY_DEFAULT_FEE, LEGACY_STORAGE_KEY, STORAGE_KEY } from './data/seed'
import { canonicalBelt } from './lib/belt'
import { canonicalFee, migrateFeeAmount } from './lib/fees'
import { keepClubState } from './lib/stripDemo'
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

function mergeById<T extends { id: string }>(preferred: T[], other: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of other) {
    if (item?.id) map.set(item.id, item)
  }
  for (const item of preferred) {
    if (item?.id) map.set(item.id, item)
  }
  return [...map.values()]
}

function mergeClubState(local: AppState, remote: AppState): AppState {
  const attendance = new Map<string, AttendanceRecord>()
  for (const record of remote.attendance || []) {
    attendance.set(`${record.sessionId}:${record.studentId}`, record)
  }
  for (const record of local.attendance || []) {
    attendance.set(`${record.sessionId}:${record.studentId}`, record)
  }
  return {
    ...remote,
    ...local,
    settings: { ...remote.settings, ...(local.settings || {}) },
    students: mergeById(local.students || [], remote.students || []),
    sessions: mergeById(local.sessions || [], remote.sessions || []),
    fees: mergeById(local.fees || [], remote.fees || []),
    attendance: [...attendance.values()],
  }
}

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
  }
}

type Store = {
  state: AppState
  syncLabel: string
  setRole: (role: Role) => void
  updateSettings: (patch: Partial<ClubSettings>) => void
  setDefaultFee: (amount: number) => void
  upsertStudent: (student: Student) => void
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
  const skipNextPush = useRef(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/state', { cache: 'no-store' })
        if (!res.ok) {
          if (!cancelled) setSyncLabel('Dùng dữ liệu máy (API chưa sẵn sàng)')
          return
        }
        const data = (await res.json()) as { state?: AppState }
        if (!cancelled && Array.isArray(data.state?.students)) {
          const remote = keepClubState(normalizeState(data.state))
          setState((current) => {
            const merged = mergeClubState(current, remote)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
            const remoteIds = new Set((remote.students || []).map((student) => student.id))
            const phoneOnly = (current.students || []).some((student) => student?.id && !remoteIds.has(student.id))
            if (phoneOnly) {
              void fetch('/api/state', {
                method: 'PUT',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ state: merged }),
              })
            }
            return merged
          })
          setSyncLabel('Đã đồng bộ server')
        }
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
      try {
        const res = await fetch('/api/state', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ state }),
        })
        setSyncLabel(
          res.ok
            ? `Đã lưu server · ${new Date().toLocaleTimeString('vi-VN')}`
            : 'Lưu server lỗi — vẫn giữ trên máy',
        )
      } catch {
        setSyncLabel('Lưu server lỗi — vẫn giữ trên máy')
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
      if (i < 0) {
        return { ...s, students: [...s.students, assignCodesForNew(student)] }
      }
      const next = [...s.students]
      next[i] = assignCodesForNew(student)
      return { ...s, students: next }
    })
  }, [])

  const deleteStudent = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      students: s.students.filter((x) => x.id !== id),
      attendance: s.attendance.filter((a) => a.studentId !== id),
      fees: s.fees.filter((f) => f.studentId !== id),
    }))
  }, [])

  const replaceStudents = useCallback((students: Student[], mode: 'merge' | 'replace') => {
    setState((s) => {
      if (mode === 'replace') return { ...s, students: ensureStudentCodes(students) }
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

  const replaceAllState = useCallback((next: AppState) => {
    const normalized = keepClubState(normalizeState(next))
    setState(normalized)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }, [])

  const value = useMemo(
    () => ({
      state,
      syncLabel,
      setRole,
      updateSettings,
      setDefaultFee,
      upsertStudent,
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
    }),
    [
      state,
      syncLabel,
      setRole,
      updateSettings,
      setDefaultFee,
      upsertStudent,
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
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}
