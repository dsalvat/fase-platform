import { vi } from 'vitest'
import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended'
import type { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/db'

export type MockPrisma = DeepMockProxy<PrismaClient>

export const prismaMock = prisma as unknown as MockPrisma

export function resetPrismaMock() {
  vi.mocked(prisma).mockReset()
}

// Helper to create mock BigRock data
export function createMockBigRock(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-big-rock-id',
    title: 'Test Big Rock',
    description: 'Test description for the big rock that is long enough',
    indicator: 'Complete 5 tasks successfully',
    numTars: 3,
    status: 'CREADO' as const,
    month: '2026-03',
    userId: 'test-user-id',
    companyId: 'test-company-id',
    aiScore: null,
    aiObservations: null,
    aiRecommendations: null,
    aiRisks: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// Helper to create mock User data
export function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    role: 'USER' as const,
    status: 'ACTIVE' as const,
    language: 'ES' as const,
    supervisorId: null,
    currentCompanyId: 'test-company-id',
    currentAppId: null,
    onboardingCompletedAt: null,
    lastVisitedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// Helper to create mock TAR data
export function createMockTAR(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-tar-id',
    description: 'Test TAR description',
    bigRockId: 'test-big-rock-id',
    status: 'PENDIENTE' as const,
    progress: 0,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// Helper to create mock Gamification data
export function createMockGamification(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-gamification-id',
    userId: 'test-user-id',
    points: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    bigRocksCreated: 0,
    tarsCompleted: 0,
    weeklyReviews: 0,
    dailyLogs: 0,
    lastActivityDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// Helper to create mock Activity data
export function createMockActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-activity-id',
    description: 'Test activity description',
    tarId: 'test-tar-id',
    type: 'DIARIA' as const,
    status: 'PENDIENTE' as const,
    scheduledDate: new Date(),
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}
