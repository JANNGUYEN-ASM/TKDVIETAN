import type { AppState } from '../types'

/** Saved club records stay. A later update must not drop students the club already typed. */
export function keepClubState(state: AppState): AppState {
  return state
}
