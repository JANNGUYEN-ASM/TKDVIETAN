import type { AppState } from '../types'

export const CLASS_TIME = '18:00–19:30'
export const DEFAULT_FEE = 150_000
export const LEGACY_DEFAULT_FEE = 1_500_000
export const STORAGE_KEY = 'viet-an-club-v5'
export const LEGACY_STORAGE_KEY = 'viet-an-club-v4'

export function createInitialState(): AppState {
  return {
    role: 'an',
    settings: {
      defaultFee: DEFAULT_FEE,
      defaultCourse: 'I-25',
    },
    students: [],
    sessions: [],
    attendance: [],
    fees: [],
    removedStudentIds: [],
    revision: 0,
  }
}
