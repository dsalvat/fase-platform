import { describe, it, expect } from 'vitest'
import {
  createBigRockSchema,
  updateBigRockSchema,
  monthParamSchema,
  uuidParamSchema,
  validateMonthIsFuture,
} from '@/lib/validations/big-rock'

describe('big-rock validations', () => {
  describe('createBigRockSchema', () => {
    const validInput = {
      title: 'Complete Q1 goals',
      description: 'Focus on completing all quarterly objectives for the team',
      indicator: 'All 5 objectives marked as complete',
      numTars: 5,
      month: '2026-03',
      status: 'CREADO',
    }

    it('validates correct input', () => {
      const result = createBigRockSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('allows different status values', () => {
      const input1 = { ...validInput, status: 'EN_PROGRESO' }
      const input2 = { ...validInput, status: 'FINALIZADO' }
      const input3 = { ...validInput, status: 'CONFIRMADO' }
      const input4 = { ...validInput, status: 'FEEDBACK_RECIBIDO' }
      expect(createBigRockSchema.safeParse(input1).success).toBe(true)
      expect(createBigRockSchema.safeParse(input2).success).toBe(true)
      expect(createBigRockSchema.safeParse(input3).success).toBe(true)
      expect(createBigRockSchema.safeParse(input4).success).toBe(true)
    })

    describe('title validation', () => {
      it('rejects title shorter than 3 characters', () => {
        const input = { ...validInput, title: 'Go' }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('3 caracteres')
        }
      })

      it('rejects title longer than 100 characters', () => {
        const input = { ...validInput, title: 'A'.repeat(101) }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('100 caracteres')
        }
      })

      it('accepts title with exactly 3 characters', () => {
        const input = { ...validInput, title: 'Abc' }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('accepts title with exactly 100 characters', () => {
        const input = { ...validInput, title: 'A'.repeat(100) }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    describe('description validation', () => {
      it('rejects description shorter than 10 characters', () => {
        const input = { ...validInput, description: 'Short' }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('10 caracteres')
        }
      })

      it('rejects description longer than 2000 characters', () => {
        const input = { ...validInput, description: 'A'.repeat(2001) }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('2000 caracteres')
        }
      })

      it('accepts description with exactly 10 characters', () => {
        const input = { ...validInput, description: 'A'.repeat(10) }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    describe('indicator validation', () => {
      it('rejects indicator shorter than 5 characters', () => {
        const input = { ...validInput, indicator: 'Done' }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('5 caracteres')
        }
      })

      it('rejects indicator longer than 500 characters', () => {
        const input = { ...validInput, indicator: 'A'.repeat(501) }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('500 caracteres')
        }
      })
    })

    describe('numTars validation', () => {
      it('rejects numTars less than 1', () => {
        const input = { ...validInput, numTars: 0 }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('1 TAR')
        }
      })

      it('rejects numTars greater than 20', () => {
        const input = { ...validInput, numTars: 21 }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.errors[0].message).toContain('20 TARs')
        }
      })

      it('rejects non-integer numTars', () => {
        const input = { ...validInput, numTars: 3.5 }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('accepts numTars of exactly 1', () => {
        const input = { ...validInput, numTars: 1 }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('accepts numTars of exactly 20', () => {
        const input = { ...validInput, numTars: 20 }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    describe('month validation', () => {
      it('rejects invalid month format (missing leading zero)', () => {
        const input = { ...validInput, month: '2026-1' }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('rejects invalid month format (invalid month number)', () => {
        const input = { ...validInput, month: '2026-13' }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('rejects invalid month format (short year)', () => {
        const input = { ...validInput, month: '26-01' }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('rejects invalid month format (wrong separator)', () => {
        const input = { ...validInput, month: '2026/01' }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('accepts valid month format (January)', () => {
        const input = { ...validInput, month: '2026-01' }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('accepts valid month format (December)', () => {
        const input = { ...validInput, month: '2026-12' }
        const result = createBigRockSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('updateBigRockSchema', () => {
    it('requires id field', () => {
      const input = { title: 'Updated title' }
      const result = updateBigRockSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('validates UUID format for id', () => {
      const input = { id: 'not-a-uuid', title: 'Updated title' }
      const result = updateBigRockSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('ID inválido')
      }
    })

    it('allows partial updates with valid id', () => {
      const input = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Only updating title',
      }
      const result = updateBigRockSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('accepts complete update with valid id', () => {
      const input = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Updated Big Rock',
        description: 'Updated description that is long enough',
        indicator: 'Updated indicator',
        numTars: 5,
        month: '2026-04',
        status: 'EN_PROGRESO',
      }
      const result = updateBigRockSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('monthParamSchema', () => {
    it('validates correct month format', () => {
      expect(monthParamSchema.safeParse('2026-01').success).toBe(true)
      expect(monthParamSchema.safeParse('2026-12').success).toBe(true)
      expect(monthParamSchema.safeParse('2030-06').success).toBe(true)
    })

    it('rejects invalid month formats', () => {
      expect(monthParamSchema.safeParse('2026-1').success).toBe(false)
      expect(monthParamSchema.safeParse('2026-13').success).toBe(false)
      expect(monthParamSchema.safeParse('2026-00').success).toBe(false)
      expect(monthParamSchema.safeParse('202-01').success).toBe(false)
      expect(monthParamSchema.safeParse('2026/01').success).toBe(false)
      expect(monthParamSchema.safeParse('').success).toBe(false)
    })
  })

  describe('uuidParamSchema', () => {
    it('validates correct UUID format', () => {
      expect(uuidParamSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
      expect(uuidParamSchema.safeParse('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11').success).toBe(true)
    })

    it('rejects invalid UUID formats', () => {
      expect(uuidParamSchema.safeParse('not-a-uuid').success).toBe(false)
      expect(uuidParamSchema.safeParse('').success).toBe(false)
      expect(uuidParamSchema.safeParse('550e8400-e29b-41d4-a716').success).toBe(false)
    })
  })

  describe('validateMonthIsFuture', () => {
    it('returns true for far future months', () => {
      expect(validateMonthIsFuture('2030-12')).toBe(true)
    })

    it('returns false for past months', () => {
      expect(validateMonthIsFuture('2020-01')).toBe(false)
    })
  })
})
