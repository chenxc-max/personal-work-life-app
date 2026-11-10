import { addDays, dayDifference, isBeforeToday, toDateKey, todayKey } from '@/utils/date'

describe('date utilities', () => {
  it('formats local dates without timezone drift', () => {
    expect(toDateKey(new Date(2026, 9, 11))).toBe('2026-10-11')
    expect(toDateKey(new Date(2026, 0, 2))).toBe('2026-01-02')
  })

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('compares date keys as calendar dates', () => {
    expect(dayDifference('2026-10-11', '2026-10-12')).toBe(1)
    expect(dayDifference('2026-10-12', '2026-10-11')).toBe(-1)
    expect(isBeforeToday('2000-01-01')).toBe(true)
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
