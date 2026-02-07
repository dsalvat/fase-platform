import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import type { PrismaClient } from '@prisma/client'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: mockDeep<PrismaClient>(),
}))

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth-options', () => ({
  authOptions: {},
}))

// Reset mocks between tests
afterEach(() => {
  vi.clearAllMocks()
})
