import { PrismaClient, UserRole, UserStatus, AppType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 0. Create Apps (FASE and OKR)
  const faseApp = await prisma.app.upsert({
    where: { code: AppType.FASE },
    update: {},
    create: {
      code: AppType.FASE,
      name: 'FASE',
      description: 'Objetivos mensuales Big Rocks - Focus, Atención, Sistemas, Energía',
      icon: 'Target',
      isActive: true,
    },
  });
  console.log(`Created/Found FASE app: ${faseApp.name} (${faseApp.id})`);

  const okrApp = await prisma.app.upsert({
    where: { code: AppType.OKR },
    update: {},
    create: {
      code: AppType.OKR,
      name: 'OKRs',
      description: 'Objetivos y Resultados Clave trimestrales',
      icon: 'BarChart3',
      isActive: true,
    },
  });
  console.log(`Created/Found OKR app: ${okrApp.name} (${okrApp.id})`);

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

  // 4. Assign FASE app to all existing users who don't have it
  const usersWithoutFaseApp = await prisma.user.findMany({
    where: {
      apps: {
        none: {
          appId: faseApp.id,
        },
      },
    },
  });

  for (const user of usersWithoutFaseApp) {
    await prisma.userApp.create({
      data: {
        userId: user.id,
        appId: faseApp.id,
      },
    });
    // Set currentAppId to FASE if not set
    if (!user.currentAppId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { currentAppId: faseApp.id },
      });
    }
  }

  if (usersWithoutFaseApp.length > 0) {
    console.log(`Assigned FASE app to ${usersWithoutFaseApp.length} users`);
  }

  // 5. Assign OKR app to all existing users who don't have it
  const usersWithoutOkrApp = await prisma.user.findMany({
    where: {
      apps: {
        none: {
          appId: okrApp.id,
        },
      },
    },
  });

  for (const user of usersWithoutOkrApp) {
    await prisma.userApp.create({
      data: {
        userId: user.id,
        appId: okrApp.id,
      },
    });
  }

  if (usersWithoutOkrApp.length > 0) {
    console.log(`Assigned OKR app to ${usersWithoutOkrApp.length} users`);
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
