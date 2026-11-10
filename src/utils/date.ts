const DAY_IN_MS = 24 * 60 * 60 * 1000

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function toDateKey(value: Date | string | number = new Date()): string {
  const date = value instanceof Date ? value : new Date(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  return toDateKey(new Date(year, month - 1, day + days))
}

export function dateParts(dateKey: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateKey.split('-').map(Number)
  return { year, month, day }
}

export function compareDateKeys(a: string, b: string): number {
  return a.localeCompare(b)
}

export function isBeforeToday(dateKey: string): boolean {
  return compareDateKeys(dateKey, todayKey()) < 0
}

export function dayDifference(from: string, to: string): number {
  const fromDate = new Date(`${from}T00:00:00`)
  const toDate = new Date(`${to}T00:00:00`)
  return Math.round((toDate.getTime() - fromDate.getTime()) / DAY_IN_MS)
}
