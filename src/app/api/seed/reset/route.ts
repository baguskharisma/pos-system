import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * @swagger
 * /api/seed/reset:
 *   post:
 *     summary: Clean all data from database (DANGEROUS - USE WITH CAUTION)
 *     tags: [Admin]
 *     security:
 *       - SecretKey: []
 *     responses:
 *       200:
 *         description: Database cleaned successfully
 *       401:
 *         description: Unauthorized - Invalid secret
 *       500:
 *         description: Clean failed
 */
export async function POST(request: Request) {
  try {
    // Security: Require secret key from environment
    const { secret } = await request.json()

    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only allow in development or with explicit confirmation
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          error: 'Database reset is disabled in production for safety.',
          message: 'Please use Prisma Studio or direct database access to manage production data.'
        },
        { status: 403 }
      )
    }

    console.log('🗑️  Starting database cleanup...')

    // Count existing data
    const counts = {
      orderItems: await prisma.orderItem.count(),
      payments: await prisma.payment.count(),
      orders: await prisma.order.count(),
      products: await prisma.product.count(),
      categories: await prisma.category.count(),
      sessions: await prisma.session.count(),
      users: await prisma.user.count(),
    }

    // Delete in correct order (respecting foreign key constraints)
    await prisma.orderItem.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.order.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()

    console.log('✅ Database cleaned successfully')

    return NextResponse.json({
      success: true,
      message: 'Database cleaned successfully. You can now run /api/seed to seed fresh data.',
      deletedCounts: counts,
    })
  } catch (error) {
    console.error('❌ Reset error:', error)
    return NextResponse.json(
      {
        error: 'Failed to clean database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
