/**
 * Data migration: Copy User.role and User.supervisorId to UserCompany records.
 *
 * Run with: npx tsx prisma/migrate-roles-and-supervisors.ts
 */
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data migration: roles and supervisors to UserCompany...\n');

  const users = await prisma.user.findMany({
    include: {
      companies: { select: { id: true, companyId: true, role: true, supervisorId: true } },
    },
  });

  let rolesUpdated = 0;
  let supervisorsUpdated = 0;
  let superAdminsSet = 0;

  for (const user of users) {
    // Set isSuperAdmin flag for SUPERADMIN users
    if (user.role === UserRole.SUPERADMIN && !user.isSuperAdmin) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isSuperAdmin: true },
      });
      superAdminsSet++;
      console.log(`  [SUPERADMIN] ${user.email} → isSuperAdmin = true`);
    }

    for (const uc of user.companies) {
      const updates: { role?: UserRole; supervisorId?: string } = {};

      // Copy role if it hasn't been set yet (still default USER) and user has a non-USER global role
      if (uc.role === UserRole.USER && user.role !== UserRole.USER && user.role !== UserRole.SUPERADMIN) {
        updates.role = user.role;
      }

      // Copy supervisorId if not already set and user has a global supervisor
      if (!uc.supervisorId && user.supervisorId) {
        // Only copy if the supervisor also belongs to this company
        const supervisorInCompany = await prisma.userCompany.findUnique({
          where: { userId_companyId: { userId: user.supervisorId, companyId: uc.companyId } },
        });
        if (supervisorInCompany) {
          updates.supervisorId = user.supervisorId;
        }
      }

      if (Object.keys(updates).length > 0) {
        await prisma.userCompany.update({
          where: { id: uc.id },
          data: updates,
        });
        if (updates.role) rolesUpdated++;
        if (updates.supervisorId) supervisorsUpdated++;
        console.log(`  [UPDATE] ${user.email} in company ${uc.companyId}: ${JSON.stringify(updates)}`);
      }
    }
  }

  console.log(`\nMigration complete!`);
  console.log(`  SuperAdmins set: ${superAdminsSet}`);
  console.log(`  Roles copied to UserCompany: ${rolesUpdated}`);
  console.log(`  Supervisors copied to UserCompany: ${supervisorsUpdated}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
