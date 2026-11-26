import type { AppState } from '../types'

const DEMO_STUDENT_IDS = new Set(['s1', 's2', 's3', 's4'])
const DEMO_SESSION_IDS = new Set([
  'ses-2025-11-20',
  'ses-2025-11-23',
  'ses-bu-2025-11-26',
  'ses-2025-11-25',
])
const DEMO_FEE_IDS = new Set(['f1', 'f2', 'f3', 'f4', 'f5'])

/** Drop the old built-in roster so a saved copy of it does not come back. */
export function stripLegacyDemo(state: AppState): AppState {
  const students = state.students.filter((s) => !DEMO_STUDENT_IDS.has(s.id))
  const sessions = state.sessions.filter((s) => !DEMO_SESSION_IDS.has(s.id))
  const sessionIds = new Set(sessions.map((s) => s.id))
  return {
    ...state,
    students,
    sessions,
    attendance: state.attendance.filter(
      (a) => !DEMO_STUDENT_IDS.has(a.studentId) && sessionIds.has(a.sessionId),
    ),
    fees: state.fees.filter((f) => !DEMO_FEE_IDS.has(f.id) && !DEMO_STUDENT_IDS.has(f.studentId)),
  }
}
