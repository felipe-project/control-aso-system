require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'rh@hospital.com';
  const plainPassword = process.env.SEED_ADMIN_PASSWORD || 'MudeEstaSenha123';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Usuário ${email} já existe. Nada a fazer.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  await prisma.user.create({
    data: {
      name: 'Administrador RH',
      email,
      password: hashedPassword,
    },
  });

  console.log('Usuário inicial criado com sucesso:');
  console.log(`  E-mail: ${email}`);
  console.log(`  Senha:  ${plainPassword}`);
  console.log('IMPORTANTE: troque essa senha após o primeiro login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
