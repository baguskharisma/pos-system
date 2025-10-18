import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')
  
  // Clean existing data (be careful in production!)
  if (process.env.NODE_ENV === 'development') {
    await prisma.orderItem.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.order.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()
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
        slug: 'makanan',
        description: 'Berbagai menu makanan',
        sortOrder: 1,
        color: '#FF6B6B',
        icon: 'utensils',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Minuman',
        slug: 'minuman',
        description: 'Berbagai menu minuman',
        sortOrder: 2,
        color: '#4ECDC4',
        icon: 'coffee',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Snack',
        slug: 'snack',
        description: 'Cemilan dan snack',
        sortOrder: 3,
        color: '#FFD93D',
        icon: 'cookie',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Dessert',
        slug: 'dessert',
        description: 'Menu penutup',
        sortOrder: 4,
        color: '#FF6BCB',
        icon: 'ice-cream',
      },
    }),
  ])
  
  // Create Products
  const productData = [
    // Makanan
    {
      categoryId: categories[0].id,
      sku: 'MKN-001',
      barcode: '8901234567890',
      name: 'Nasi Goreng Spesial',
      description: 'Nasi goreng dengan telur, ayam, dan sayuran',
      price: 25000,
      costPrice: 15000,
      taxRate: 11,
      trackInventory: true,
      quantity: 50,
      lowStockAlert: 10,
      tags: ['bestseller', 'spicy'],
      isFeatured: true,
    },
    {
      categoryId: categories[0].id,
      sku: 'MKN-002',
      barcode: '8901234567891',
      name: 'Mie Ayam',
      description: 'Mie ayam dengan topping ayam jamur',
      price: 20000,
      costPrice: 12000,
      taxRate: 11,
      trackInventory: true,
      quantity: 30,
      lowStockAlert: 5,
      tags: ['popular'],
    },
    {
      categoryId: categories[0].id,
      sku: 'MKN-003',
      name: 'Ayam Bakar',
      description: 'Ayam bakar dengan sambal dan lalapan',
      price: 35000,
      costPrice: 20000,
      taxRate: 11,
    },
    {
      categoryId: categories[0].id,
      sku: 'MKN-004',
      name: 'Soto Ayam',
      description: 'Soto ayam dengan kuah bening',
      price: 22000,
      costPrice: 13000,
      taxRate: 11,
    },
    
    // Minuman
    {
      categoryId: categories[1].id,
      sku: 'MNM-001',
      name: 'Es Kopi Susu',
      description: 'Kopi susu dengan es batu',
      price: 18000,
      costPrice: 8000,
      taxRate: 11,
      isFeatured: true,
      tags: ['coffee', 'cold'],
    },
    {
      categoryId: categories[1].id,
      sku: 'MNM-002',
      name: 'Es Teh Manis',
      description: 'Teh manis dingin',
      price: 8000,
      costPrice: 3000,
      taxRate: 11,
      tags: ['tea', 'cold'],
    },
    {
      categoryId: categories[1].id,
      sku: 'MNM-003',
      name: 'Jus Jeruk',
      description: 'Jus jeruk segar',
      price: 15000,
      costPrice: 7000,
      taxRate: 11,
      tags: ['juice', 'fresh'],
    },
    {
      categoryId: categories[1].id,
      sku: 'MNM-004',
      name: 'Air Mineral',
      description: 'Air mineral 600ml',
      price: 5000,
      costPrice: 2500,
      taxRate: 11,
      trackInventory: true,
      quantity: 100,
      lowStockAlert: 20,
    },
    
    // Snack
    {
      categoryId: categories[2].id,
      sku: 'SNK-001',
      name: 'Kentang Goreng',
      description: 'Kentang goreng crispy',
      price: 15000,
      costPrice: 7000,
      taxRate: 11,
      tags: ['crispy'],
    },
    {
      categoryId: categories[2].id,
      sku: 'SNK-002',
      name: 'Pisang Goreng',
      description: 'Pisang goreng dengan topping',
      price: 12000,
      costPrice: 5000,
      taxRate: 11,
    },
    
    // Dessert
    {
      categoryId: categories[3].id,
      sku: 'DST-001',
      name: 'Es Krim Vanilla',
      description: 'Es krim vanilla 2 scoop',
      price: 15000,
      costPrice: 7000,
      taxRate: 11,
    },
    {
      categoryId: categories[3].id,
      sku: 'DST-002',
      name: 'Puding Coklat',
      description: 'Puding coklat dengan vla',
      price: 12000,
      costPrice: 5000,
      taxRate: 11,
    },
  ]
  
  await Promise.all(
    productData.map((data) => prisma.product.create({ data }))
  )
  
  // Create System Settings
  await Promise.all([
    prisma.systemSetting.create({
      data: {
        key: 'business_info',
        value: {
          name: 'POS Cafe & Resto',
          address: 'Jl. Contoh No. 123, Jakarta',
          phone: '021-12345678',
          email: 'info@poscafe.com',
          website: 'www.poscafe.com',
        },
        groupName: 'business',
        isPublic: true,
      },
    }),
    prisma.systemSetting.create({
      data: {
        key: 'tax_settings',
        value: {
          enabled: true,
          rate: 11,
          type: 'INCLUSIVE',
          name: 'PPN',
        },
        groupName: 'finance',
      },
    }),
    prisma.systemSetting.create({
      data: {
        key: 'receipt_settings',
        value: {
          showLogo: true,
          showQR: true,
          footerText: 'Terima kasih atas kunjungan Anda!',
          paperSize: '80mm',
        },
        groupName: 'receipt',
      },
    }),
  ])
  
  console.log('✅ Database seed completed!')
  console.log('Admin login: admin@possystem.com / Admin123!')
  console.log('Cashier login: kasir@possystem.com / Cashier123!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })