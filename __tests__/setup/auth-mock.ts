import { vi } from 'vitest'
import { getServerSession } from 'next-auth'
import type { UserRole, UserStatus } from '@prisma/client'

export interface MockSessionUser {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
  currentCompanyId: string | null
}

export function mockAuthenticatedUser(user: Partial<MockSessionUser> = {}) {
  const defaultUser: MockSessionUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    status: 'ACTIVE',
    currentCompanyId: 'test-company-id',
    ...user,
  }

  vi.mocked(getServerSession).mockResolvedValue({
    user: defaultUser,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })

  return defaultUser
}

export function mockUnauthenticatedUser() {
  vi.mocked(getServerSession).mockResolvedValue(null)
}

export function mockSupervisor(supervisorId = 'supervisor-id') {
  return mockAuthenticatedUser({
    id: supervisorId,
    email: 'supervisor@example.com',
    name: 'Supervisor User',
    role: 'SUPERVISOR',
  })
}

export function mockAdmin(adminId = 'admin-id') {
  return mockAuthenticatedUser({
    id: adminId,
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
  })
}

export function mockSuperAdmin(superAdminId = 'superadmin-id') {
  return mockAuthenticatedUser({
    id: superAdminId,
    email: 'superadmin@example.com',
    name: 'Super Admin User',
    role: 'SUPERADMIN',
  })
}
