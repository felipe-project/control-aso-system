const { PrismaClient } = require('@prisma/client');

// Instância única do Prisma Client, reaproveitada em toda a aplicação.
// Evita abrir várias conexões desnecessárias com o banco.
const prisma = new PrismaClient();

module.exports = prisma;
