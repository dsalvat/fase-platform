import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isMonthReadOnly,
  getCurrentMonth,
  getNextMonth,
  getPreviousMonth,
  formatMonthLabel,
  formatMonthShort,
  isValidMonthFormat,
  compareMonths,
  getMonthState,
  isMonthEditable,
  getWeeksInMonth,
  getTodayDate,
  getCurrentWeek,
  isToday,
  getMonthFromDate,
} from '@/lib/month-helpers'

describe('month-helpers', () => {
  describe('isMonthReadOnly', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-15'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns true for past months', () => {
      expect(isMonthReadOnly('2026-01')).toBe(true)
      expect(isMonthReadOnly('2025-12')).toBe(true)
      expect(isMonthReadOnly('2020-06')).toBe(true)
    })

    it('returns false for current month', () => {
      expect(isMonthReadOnly('2026-02')).toBe(false)
    })

    it('returns false for future months', () => {
      expect(isMonthReadOnly('2026-03')).toBe(false)
      expect(isMonthReadOnly('2027-01')).toBe(false)
    })
  })

  describe('getCurrentMonth', () => {
    it('returns current month in YYYY-MM format', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-15'))

      expect(getCurrentMonth()).toBe('2026-02')

      vi.useRealTimers()
    })

    it('pads single digit months', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-01'))

      expect(getCurrentMonth()).toBe('2026-03')

      vi.useRealTimers()
    })

    it('handles December correctly', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-12-25'))

      expect(getCurrentMonth()).toBe('2026-12')

      vi.useRealTimers()
    })

    it('handles January correctly', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2027-01-01'))

      expect(getCurrentMonth()).toBe('2027-01')

      vi.useRealTimers()
    })
  })

  describe('getNextMonth', () => {
    it('returns next month correctly', () => {
      expect(getNextMonth('2026-02')).toBe('2026-03')
      expect(getNextMonth('2026-05')).toBe('2026-06')
    })

    it('handles year boundary (December to January)', () => {
      expect(getNextMonth('2026-12')).toBe('2027-01')
    })

    it('pads single digit months', () => {
      expect(getNextMonth('2026-01')).toBe('2026-02')
      expect(getNextMonth('2026-09')).toBe('2026-10')
    })

    it('uses current month when no argument provided', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-15'))

      expect(getNextMonth()).toBe('2026-03')

      vi.useRealTimers()
    })
  })

  describe('getPreviousMonth', () => {
    it('returns previous month correctly', () => {
      expect(getPreviousMonth('2026-02')).toBe('2026-01')
      expect(getPreviousMonth('2026-06')).toBe('2026-05')
    })

    it('handles year boundary (January to December)', () => {
      expect(getPreviousMonth('2026-01')).toBe('2025-12')
    })

    it('pads single digit months', () => {
      expect(getPreviousMonth('2026-10')).toBe('2026-09')
    })
  })

  describe('formatMonthLabel', () => {
    it('formats month in Spanish', () => {
      const result = formatMonthLabel('2026-01')
      expect(result.toLowerCase()).toContain('enero')
      expect(result).toContain('2026')
    })

    it('formats different months correctly', () => {
      expect(formatMonthLabel('2026-12').toLowerCase()).toContain('diciembre')
      expect(formatMonthLabel('2026-06').toLowerCase()).toContain('junio')
    })

    it('returns original string for invalid input', () => {
      expect(formatMonthLabel('invalid')).toBe('invalid')
    })
  })

  describe('formatMonthShort', () => {
    it('formats month in short Spanish', () => {
      const result = formatMonthShort('2026-01')
      expect(result).toContain('2026')
    })
  })

  describe('isValidMonthFormat', () => {
    it('returns true for valid formats', () => {
      expect(isValidMonthFormat('2026-01')).toBe(true)
      expect(isValidMonthFormat('2026-12')).toBe(true)
      expect(isValidMonthFormat('2030-06')).toBe(true)
    })

    it('returns false for invalid formats', () => {
      expect(isValidMonthFormat('2026-1')).toBe(false)
      expect(isValidMonthFormat('2026-13')).toBe(false)
      expect(isValidMonthFormat('2026-00')).toBe(false)
      expect(isValidMonthFormat('26-01')).toBe(false)
      expect(isValidMonthFormat('2026/01')).toBe(false)
      expect(isValidMonthFormat('')).toBe(false)
      expect(isValidMonthFormat('invalid')).toBe(false)
    })
  })

  describe('compareMonths', () => {
    it('returns 0 for equal months', () => {
      expect(compareMonths('2026-02', '2026-02')).toBe(0)
    })

    it('returns -1 when first month is earlier', () => {
      expect(compareMonths('2026-01', '2026-02')).toBe(-1)
      expect(compareMonths('2025-12', '2026-01')).toBe(-1)
    })

    it('returns 1 when first month is later', () => {
      expect(compareMonths('2026-03', '2026-02')).toBe(1)
      expect(compareMonths('2027-01', '2026-12')).toBe(1)
    })
  })

  describe('getMonthState', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-15'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns "past" for past months', () => {
      expect(getMonthState('2026-01', [])).toBe('past')
      expect(getMonthState('2025-12', [])).toBe('past')
    })

    it('returns "current" for current month', () => {
      expect(getMonthState('2026-02', [])).toBe('current')
    })

    it('returns "future-open" for open future months', () => {
      expect(getMonthState('2026-03', ['2026-03'])).toBe('future-open')
      expect(getMonthState('2026-04', ['2026-03', '2026-04'])).toBe('future-open')
    })

    it('returns "future-locked" for locked future months', () => {
      expect(getMonthState('2026-03', [])).toBe('future-locked')
      expect(getMonthState('2026-04', ['2026-03'])).toBe('future-locked')
    })
  })

  describe('isMonthEditable', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-15'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns false for past months', () => {
      expect(isMonthEditable('2026-01', [])).toBe(false)
    })

    it('returns true for current month', () => {
      expect(isMonthEditable('2026-02', [])).toBe(true)
    })

    it('returns true for open future months', () => {
      expect(isMonthEditable('2026-03', ['2026-03'])).toBe(true)
    })

    it('returns false for locked future months', () => {
      expect(isMonthEditable('2026-03', [])).toBe(false)
    })
  })

  describe('getWeeksInMonth', () => {
    it('returns array of weeks for a month', () => {
      const weeks = getWeeksInMonth('2026-02')

      expect(weeks.length).toBeGreaterThan(0)
      expect(weeks[0]).toHaveProperty('week')
      expect(weeks[0]).toHaveProperty('startDate')
      expect(weeks[0]).toHaveProperty('endDate')
      expect(weeks[0]).toHaveProperty('days')
    })

    it('returns weeks with 7 days each', () => {
      const weeks = getWeeksInMonth('2026-02')

      for (const week of weeks) {
        expect(week.days.length).toBe(7)
      }
    })

    it('returns weeks in correct format', () => {
      const weeks = getWeeksInMonth('2026-02')

      // Week format should be YYYY-Wnn
      expect(weeks[0].week).toMatch(/^\d{4}-W\d{2}$/)
    })
  })

  describe('getTodayDate', () => {
    it('returns today in YYYY-MM-DD format', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-15'))

      expect(getTodayDate()).toBe('2026-02-15')

      vi.useRealTimers()
    })
  })

  describe('getCurrentWeek', () => {
    it('returns current week in YYYY-Wnn format', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-15'))

      const week = getCurrentWeek()
      expect(week).toMatch(/^\d{4}-W\d{2}$/)

      vi.useRealTimers()
    })
  })

  describe('isToday', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-15'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns true for today', () => {
      expect(isToday('2026-02-15')).toBe(true)
    })

    it('returns false for other dates', () => {
      expect(isToday('2026-02-14')).toBe(false)
      expect(isToday('2026-02-16')).toBe(false)
    })

    it('returns false for invalid date', () => {
      expect(isToday('invalid')).toBe(false)
    })
  })

  describe('getMonthFromDate', () => {
    it('extracts month from date string', () => {
      expect(getMonthFromDate('2026-02-15')).toBe('2026-02')
      expect(getMonthFromDate('2026-12-31')).toBe('2026-12')
    })
  })
})
