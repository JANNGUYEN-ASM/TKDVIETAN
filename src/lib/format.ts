export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function formatMoney(n: number): string {
  return `${n.toLocaleString('vi-VN')}đ`
}

export function sessionDayLabel(code: string): string {
  if (code === 'T3') return 'Thứ Ba (T3)'
  if (code === 'T5') return 'Thứ Năm (T5)'
  if (code === 'CN') return 'Chủ Nhật (CN)'
  if (code === 'Bù') return 'Buổi tập bù'
  return code
}

/** YYYY-MM-DD → DD/MM/YYYY */
export function isoToVi(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function todayIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** DD/MM/YYYY → YYYY-MM-DD for <input type="date"> */
export function viToIso(vi: string): string {
  const m = vi.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return ''
  const pad = (n: string) => n.padStart(2, '0')
  return `${m[3]}-${pad(m[2])}-${pad(m[1])}`
}

/** YYYY-MM-DD → DD/MM/YYYY */
export function isoDateToVi(iso: string): string {
  if (!iso) return ''
  return isoToVi(iso)
}

export function incompleteStudent(s: { phone: string; address: string; course: string }): string[] {
  const miss: string[] = []
  if (!s.phone.trim()) miss.push('SĐT')
  if (!s.address.trim()) miss.push('Địa chỉ')
  if (!s.course.trim()) miss.push('Khóa')
  return miss
}

export function dayCodeFromIso(iso: string): 'T3' | 'T5' | 'CN' | null {
  const d = new Date(`${iso}T12:00:00`)
  const day = d.getDay()
  if (day === 2) return 'T3'
  if (day === 4) return 'T5'
  if (day === 0) return 'CN'
  return null
}
