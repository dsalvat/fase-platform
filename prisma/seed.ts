import { PrismaClient, UserRole, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create default company
  const defaultCompany = await prisma.company.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Empresa por Defecto',
      slug: 'default',
    },
  });
  console.log(`Created/Found default company: ${defaultCompany.name} (${defaultCompany.id})`);

  // 2. Set daniel.salvat@gmail.com as SUPERADMIN (without company)
  const superadminEmail = 'daniel.salvat@gmail.com';
  const existingSuperadmin = await prisma.user.findUnique({
    where: { email: superadminEmail },
  });

  if (existingSuperadmin) {
    // Update existing user to SUPERADMIN
    await prisma.user.update({
      where: { email: superadminEmail },
      data: {
        role: UserRole.SUPERADMIN,
        currentCompanyId: null,
      },
    });
    console.log(`Updated ${superadminEmail} to SUPERADMIN role`);
  } else {
    // Create SUPERADMIN user
    await prisma.user.create({
      data: {
        email: superadminEmail,
        name: 'Daniel Salvat',
        role: UserRole.SUPERADMIN,
        status: UserStatus.ACTIVE,
        currentCompanyId: null,
        gamification: {
          create: {
            points: 0,
            level: 1,
            currentStreak: 0,
            longestStreak: 0,
          },
        },
      },
    });
    console.log(`Created SUPERADMIN user: ${superadminEmail}`);
  }

  // 3. Assign all existing users (except SUPERADMIN) to default company if they have no companies
  const usersWithoutCompanies = await prisma.user.findMany({
    where: {
      role: { not: UserRole.SUPERADMIN },
      companies: { none: {} },
    },
  });

  for (const user of usersWithoutCompanies) {
    await prisma.userCompany.create({
      data: {
        userId: user.id,
        companyId: defaultCompany.id,
      },
    });
    // Set currentCompanyId if not set
    if (!user.currentCompanyId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { currentCompanyId: defaultCompany.id },
      });
    }
  }

  if (usersWithoutCompanies.length > 0) {
    console.log(`Assigned ${usersWithoutCompanies.length} users to default company`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
