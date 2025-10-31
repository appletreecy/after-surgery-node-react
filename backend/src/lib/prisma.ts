import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// (optional) log and handle process exit
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
