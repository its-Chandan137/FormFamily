// Prisma client singleton instance
import { PrismaClient } from '@prisma/client';

// Use a global variable to store the Prisma client instance across hot reloads
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Enable query logging in development
    //   query: process.env.NODE_ENV === 'development' ? {
    //     logQuery: true,
    //   } : undefined,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
