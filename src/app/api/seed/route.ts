import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * @swagger
 * /api/seed:
 *   post:
 *     summary: Seed database with initial data (PRODUCTION USE - ONE TIME ONLY)
 *     tags: [Admin]
 *     security:
 *       - SecretKey: []
 *     responses:
 *       200:
 *         description: Database seeded successfully
 *       401:
 *         description: Unauthorized - Invalid secret
 *       500:
 *         description: Seeding failed
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

    console.log('🌱 Starting database seed via API...')

    // Check if data already exists
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      return NextResponse.json(
        {
          message: 'Database already seeded. Delete existing data first if you want to re-seed.',
          existingUsers
        },
        { status: 400 }
      )
    }

    // Create Users
    const adminPassword = await bcrypt.hash('Admin123!', 12)
    const cashierPassword = await bcrypt.hash('Cashier123!', 12)

    const admin = await prisma.user.create({
      data: {
        email: 'admin@possystem.com',
        passwordHash: adminPassword,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        employeeId: 'EMP001',
        emailVerified: new Date(),
      },
    })

    const cashier = await prisma.user.create({
      data: {
        email: 'kasir@possystem.com',
        passwordHash: cashierPassword,
        name: 'Kasir Utama',
        role: 'CASHIER',
        employeeId: 'EMP002',
        emailVerified: new Date(),
      },
    })

    // Create Categories
    const categories = await Promise.all([
      prisma.category.create({
        data: {
          name: 'Makanan',
          description: 'Kategori produk makanan',
          slug: 'makanan',
        },
      }),
      prisma.category.create({
        data: {
          name: 'Minuman',
          description: 'Kategori produk minuman',
          slug: 'minuman',
        },
      }),
      prisma.category.create({
        data: {
          name: 'Snack',
          description: 'Kategori produk snack dan cemilan',
          slug: 'snack',
        },
      }),
    ])

    // Create Sample Products
    await Promise.all([
      prisma.product.create({
        data: {
          name: 'Nasi Goreng',
          description: 'Nasi goreng spesial dengan telur',
          price: 25000,
          costPrice: 15000,
          sku: 'FOOD-001',
          categoryId: categories[0].id,
          trackInventory: true,
          quantity: 100,
          lowStockAlert: 10,
          isAvailable: true,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Es Teh Manis',
          description: 'Es teh manis segar',
          price: 5000,
          costPrice: 2000,
          sku: 'DRINK-001',
          categoryId: categories[1].id,
          trackInventory: true,
          quantity: 200,
          lowStockAlert: 20,
          isAvailable: true,
        },
      }),
      prisma.product.create({
        data: {
          name: 'Keripik Singkong',
          description: 'Keripik singkong renyah',
          price: 10000,
          costPrice: 5000,
          sku: 'SNACK-001',
          categoryId: categories[2].id,
          trackInventory: true,
          quantity: 150,
          lowStockAlert: 15,
          isAvailable: true,
        },
      }),
    ])

    console.log('✅ Database seeded successfully via API')

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        users: [
          { email: 'admin@possystem.com', password: 'Admin123!', role: 'SUPER_ADMIN' },
          { email: 'kasir@possystem.com', password: 'Cashier123!', role: 'CASHIER' },
        ],
        categories: categories.length,
        products: 3,
      },
    })
  } catch (error) {
    console.error('❌ Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
