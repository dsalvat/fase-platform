import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'dsalvat@ametllerorigen.cat';

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log(`Usuario ${email} no encontrado en la base de datos.`);
    console.log('El usuario debe iniciar sesión primero para ser registrado.');
    return;
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' }
  });

  console.log(`Usuario actualizado: ${updated.email} -> role: ${updated.role}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
