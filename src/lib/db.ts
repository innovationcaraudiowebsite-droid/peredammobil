import 'server-only'
import { PrismaClient } from '@prisma/client'

/**
 * Prisma client with Vercel-friendly configuration.
 *
 * In production (Vercel serverless):
 *   - No query logging (wasteful, can leak info, slows cold starts).
 *   - Don't cache on globalThis (each function invocation is fresh).
 *
 * In development:
 *   - Log queries for debugging.
 *   - Cache on globalThis to avoid exhausting connection pool on hot reload.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const isProd = process.env.NODE_ENV === 'production'

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['error', 'warn'] : ['query', 'error', 'warn'],
  })

if (!isProd) globalForPrisma.prisma = db
