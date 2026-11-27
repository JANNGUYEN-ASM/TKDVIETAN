import type { AppState, AttendanceRecord } from '../types'

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

export function removedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const ids = value.filter((id) => typeof id === 'string' && id.length > 0 && id.length < 80)
  return [...new Set(ids)].slice(0, 4000)
}

export function mergeClubState(preferred: AppState, other: AppState): AppState {
  const removed = new Set([
    ...removedIds(preferred.removedStudentIds),
    ...removedIds(other.removedStudentIds),
  ])
  for (const student of preferred.students || []) {
    if (!removedIds(preferred.removedStudentIds).includes(student.id)) removed.delete(student.id)
  }
  const attendance = new Map<string, AttendanceRecord>()
  for (const record of other.attendance || []) attendance.set(`${record.sessionId}:${record.studentId}`, record)
  for (const record of preferred.attendance || []) attendance.set(`${record.sessionId}:${record.studentId}`, record)
  return {
    ...other,
    ...preferred,
    settings: { ...other.settings, ...(preferred.settings || {}) },
    students: mergeById(preferred.students || [], other.students || []).filter((student) => !removed.has(student.id)),
    sessions: mergeById(preferred.sessions || [], other.sessions || []),
    fees: mergeById(preferred.fees || [], other.fees || []).filter((fee) => !removed.has(fee.studentId)),
    attendance: [...attendance.values()].filter((record) => !removed.has(record.studentId)),
    removedStudentIds: [...removed],
  }
}
