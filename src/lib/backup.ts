import type { AppState } from '../types'
import { createInitialState } from '../data/seed'

export const BACKUP_VERSION = 1

export type ClubBackup = {
  app: 'clb-taekwondo-viet-an'
  version: number
  exportedAt: string // ISO
  state: AppState
}

export function buildBackup(state: AppState): ClubBackup {
  return {
    app: 'clb-taekwondo-viet-an',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  }
}

export function parseBackup(raw: unknown): AppState {
  const base = createInitialState()
  if (!raw || typeof raw !== 'object') throw new Error('File không hợp lệ')
  const obj = raw as Partial<ClubBackup> & { state?: AppState }

  // Accept full backup wrapper or raw AppState
  const state = obj.state && typeof obj.state === 'object' ? obj.state : (obj as unknown as AppState)

  if (!Array.isArray(state.students)) throw new Error('Thiếu danh sách võ sinh trong file')

  return {
    ...base,
    ...state,
    settings: { ...base.settings, ...(state.settings || {}) },
    students: state.students,
    sessions: (state.sessions || []).map((s) => ({ ...s, kind: s.kind || 'regular' })),
    attendance: state.attendance || [],
    fees: state.fees || [],
    role: state.role === 'hlv' ? 'hlv' : 'an',
  }
}

export function downloadBackup(state: AppState) {
  const backup = buildBackup(state)
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `viet-an-backup-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
  return a.download
}
