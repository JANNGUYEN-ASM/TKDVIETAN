import { LEGACY_DEFAULT_FEE } from '../data/seed'
import type { FeeMode, FeeRecord, FeeStatus } from '../types'

const FEE_MODES: FeeMode[] = ['tháng', 'khóa', 'võ phục', 'dụng cụ', 'lệ phí thi', 'lệ phí thi lên đẳng']

export function isTuitionMode(mode: string): boolean {
  return mode === 'tháng' || mode === 'khóa'
}

export function canonicalFeeStatus(status: string | undefined): FeeStatus {
  if (status === 'Đã thu' || status === 'Miễn') return status
  return 'Chưa thu'
}

export function canonicalFeeMode(mode: string | undefined): FeeMode {
  if (mode && (FEE_MODES as string[]).includes(mode)) return mode as FeeMode
  return 'tháng'
}

export function canonicalFee(fee: FeeRecord): FeeRecord {
  return {
    ...fee,
    mode: canonicalFeeMode(fee.mode),
    status: canonicalFeeStatus(fee.status),
  }
}

export function migrateFeeAmount(amount: number, mode: string, defaultWasLegacy: boolean): number {
  if (defaultWasLegacy && isTuitionMode(mode) && amount === LEGACY_DEFAULT_FEE) return 150_000
  return amount
}
