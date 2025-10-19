import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

function createPrismaClient() {
  const prismaClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })

  // Soft delete extension
  return prismaClient.$extends({
    name: 'softDelete',
    query: {
      user: {
        async delete({ args, query }) {
          return query({ ...args, data: { deletedAt: new Date() } } as any)
        },
        async deleteMany({ args, query }) {
          return query({ ...args, data: { deletedAt: new Date() } } as any)
        },
        async findUnique({ args, query }) {
          return query({ ...args, where: { ...args.where, deletedAt: null } } as any)
        },
        async findFirst({ args, query }) {
          return query({ ...args, where: { ...args.where, deletedAt: null } } as any)
        },
        async findMany({ args, query }) {
          return query({ ...args, where: { ...args.where, deletedAt: null } } as any)
        },
      },
      product: {
        async delete({ args, query }) {
          return query({ ...args, data: { deletedAt: new Date() } } as any)
        },
        async deleteMany({ args, query }) {
          return query({ ...args, data: { deletedAt: new Date() } } as any)
        },
        async findUnique({ args, query }) {
          return query({ ...args, where: { ...args.where, deletedAt: null } } as any)
        },
        async findFirst({ args, query }) {
          return query({ ...args, where: { ...args.where, deletedAt: null } } as any)
        },
        async findMany({ args, query }) {
          return query({ ...args, where: { ...args.where, deletedAt: null } } as any)
        },
      },
      category: {
        async delete({ args, query }) {
          return query({ ...args, data: { deletedAt: new Date() } } as any)
        },
        async deleteMany({ args, query }) {
          return query({ ...args, data: { deletedAt: new Date() } } as any)
        },
        async findUnique({ args, query }) {
          return query({ ...args, where: { ...args.where, deletedAt: null } } as any)
        },
        async findFirst({ args, query }) {
          return query({ ...args, where: { ...args.where, deletedAt: null } } as any)
        },
        async findMany({ args, query }) {
          return query({ ...args, where: { ...args.where, deletedAt: null } } as any)
        },
      },
      order: {
        async delete({ args, query }) {
          return query({ ...args, data: { deletedAt: new Date() } } as any)
        },
        async deleteMany({ args, query }) {
          return query({ ...args, data: { deletedAt: new Date() } } as any)
        },
        async findUnique({ args, query }) {
          return query({ ...args, where: { ...args.where, deletedAt: null } } as any)
        },
        async findFirst({ args, query }) {
          return query({ ...args, where: { ...args.where, deletedAt: null } } as any)
        },
        async findMany({ args, query }) {
          return query({ ...args, where: { ...args.where, deletedAt: null } } as any)
        },
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
