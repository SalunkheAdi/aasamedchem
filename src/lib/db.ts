import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Use environment variable, with fallback for local development if not yet set
const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/assignment";

if (!globalForPrisma.pool) {
  globalForPrisma.pool = new Pool({
    connectionString,
    // Add neon specific connection limits/timeout settings if needed
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

if (!globalForPrisma.prisma) {
  const adapter = new PrismaPg(globalForPrisma.pool);
  globalForPrisma.prisma = new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma;
export const pool = globalForPrisma.pool;
