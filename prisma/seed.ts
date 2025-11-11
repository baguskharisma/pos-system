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
    // Coffee - Hot
    {
      categoryId: categories[0].id,
      sku: 'COF-001',
      barcode: '8901234567890',
      name: 'Espresso',
      description: 'Single shot espresso yang kaya dan bold',
      price: 18000,
      costPrice: 8000,
      taxRate: 11,
      trackInventory: true,
      quantity: 200,
      lowStockAlert: 30,
      tags: ['coffee', 'hot', 'bestseller'],
      isFeatured: true,
    },
    {
      categoryId: categories[0].id,
      sku: 'COF-002',
      barcode: '8901234567891',
      name: 'Americano',
      description: 'Espresso dengan air panas',
      price: 20000,
      costPrice: 9000,
      taxRate: 11,
      trackInventory: true,
      quantity: 200,
      lowStockAlert: 30,
      tags: ['coffee', 'hot', 'popular'],
    },
    {
      categoryId: categories[0].id,
      sku: 'COF-003',
      name: 'Cappuccino',
      description: 'Espresso dengan steamed milk dan milk foam',
      price: 28000,
      costPrice: 12000,
      taxRate: 11,
      tags: ['coffee', 'hot', 'milk'],
      isFeatured: true,
    },
    {
      categoryId: categories[0].id,
      sku: 'COF-004',
      name: 'Caffe Latte',
      description: 'Espresso dengan steamed milk lembut',
      price: 30000,
      costPrice: 13000,
      taxRate: 11,
      tags: ['coffee', 'hot', 'milk'],
    },
    {
      categoryId: categories[0].id,
      sku: 'COF-005',
      name: 'Flat White',
      description: 'Double shot espresso dengan microfoam',
      price: 32000,
      costPrice: 14000,
      taxRate: 11,
      tags: ['coffee', 'hot', 'milk'],
    },
    {
      categoryId: categories[0].id,
      sku: 'COF-006',
      name: 'Caramel Macchiato',
      description: 'Latte dengan vanilla dan caramel drizzle',
      price: 35000,
      costPrice: 15000,
      taxRate: 11,
      tags: ['coffee', 'hot', 'sweet'],
    },
    
    // Coffee - Iced
    {
      categoryId: categories[1].id,
      sku: 'ICF-001',
      name: 'Iced Americano',
      description: 'Espresso dengan air dingin dan es',
      price: 22000,
      costPrice: 10000,
      taxRate: 11,
      tags: ['coffee', 'iced', 'popular'],
    },
    {
      categoryId: categories[1].id,
      sku: 'ICF-002',
      name: 'Iced Latte',
      description: 'Espresso dengan susu dingin dan es',
      price: 32000,
      costPrice: 14000,
      taxRate: 11,
      tags: ['coffee', 'iced', 'milk'],
      isFeatured: true,
    },
    {
      categoryId: categories[1].id,
      sku: 'ICF-003',
      name: 'Iced Caramel Macchiato',
      description: 'Iced latte dengan vanilla dan caramel',
      price: 37000,
      costPrice: 16000,
      taxRate: 11,
      tags: ['coffee', 'iced', 'sweet'],
    },
    {
      categoryId: categories[1].id,
      sku: 'ICF-004',
      name: 'Vietnamese Coffee',
      description: 'Kopi Vietnam dengan susu kental manis',
      price: 28000,
      costPrice: 12000,
      taxRate: 11,
      tags: ['coffee', 'iced', 'sweet'],
    },
    {
      categoryId: categories[1].id,
      sku: 'ICF-005',
      name: 'Cold Brew',
      description: 'Kopi diseduh dingin selama 12 jam',
      price: 30000,
      costPrice: 13000,
      taxRate: 11,
      tags: ['coffee', 'iced', 'smooth'],
    },
    
    // Non-Coffee
    {
      categoryId: categories[2].id,
      sku: 'NCF-001',
      name: 'Matcha Latte',
      description: 'Green tea Jepang dengan steamed milk',
      price: 32000,
      costPrice: 14000,
      taxRate: 11,
      tags: ['tea', 'hot', 'milk'],
      isFeatured: true,
    },
    {
      categoryId: categories[2].id,
      sku: 'NCF-002',
      name: 'Iced Matcha Latte',
      description: 'Matcha dengan susu dingin dan es',
      price: 34000,
      costPrice: 15000,
      taxRate: 11,
      tags: ['tea', 'iced', 'milk'],
    },
    {
      categoryId: categories[2].id,
      sku: 'NCF-003',
      name: 'Hot Chocolate',
      description: 'Cokelat panas dengan whipped cream',
      price: 28000,
      costPrice: 12000,
      taxRate: 11,
      tags: ['chocolate', 'hot', 'sweet'],
    },
    {
      categoryId: categories[2].id,
      sku: 'NCF-004',
      name: 'Iced Chocolate',
      description: 'Cokelat dingin dengan es dan whipped cream',
      price: 30000,
      costPrice: 13000,
      taxRate: 11,
      tags: ['chocolate', 'iced', 'sweet'],
    },
    {
      categoryId: categories[2].id,
      sku: 'NCF-005',
      name: 'Lemon Tea',
      description: 'Teh dengan lemon segar',
      price: 18000,
      costPrice: 8000,
      taxRate: 11,
      tags: ['tea', 'iced', 'fresh'],
    },
    
    // Pastry & Food
    {
      categoryId: categories[3].id,
      sku: 'PST-001',
      name: 'Croissant',
      description: 'Croissant butter yang renyah',
      price: 22000,
      costPrice: 10000,
      taxRate: 11,
      trackInventory: true,
      quantity: 30,
      lowStockAlert: 5,
      tags: ['pastry', 'breakfast'],
    },
    {
      categoryId: categories[3].id,
      sku: 'PST-002',
      name: 'Chocolate Croissant',
      description: 'Croissant dengan isian cokelat',
      price: 25000,
      costPrice: 12000,
      taxRate: 11,
      trackInventory: true,
      quantity: 25,
      lowStockAlert: 5,
      tags: ['pastry', 'chocolate'],
    },
    {
      categoryId: categories[3].id,
      sku: 'PST-003',
      name: 'Blueberry Muffin',
      description: 'Muffin dengan blueberry segar',
      price: 20000,
      costPrice: 9000,
      taxRate: 11,
      trackInventory: true,
      quantity: 20,
      lowStockAlert: 5,
      tags: ['pastry', 'muffin'],
    },
    {
      categoryId: categories[3].id,
      sku: 'PST-004',
      name: 'Banana Cake',
      description: 'Cake pisang yang lembut',
      price: 18000,
      costPrice: 8000,
      taxRate: 11,
      trackInventory: true,
      quantity: 15,
      lowStockAlert: 3,
      tags: ['cake', 'sweet'],
    },
    {
      categoryId: categories[3].id,
      sku: 'PST-005',
      name: 'Sandwich Club',
      description: 'Sandwich dengan ayam, keju, tomat, dan selada',
      price: 35000,
      costPrice: 18000,
      taxRate: 11,
      trackInventory: true,
      quantity: 20,
      lowStockAlert: 5,
      tags: ['food', 'lunch', 'bestseller'],
      isFeatured: true,
    },
    {
      categoryId: categories[3].id,
      sku: 'PST-006',
      name: 'Tuna Sandwich',
      description: 'Sandwich tuna dengan mayo dan sayuran',
      price: 32000,
      costPrice: 16000,
      taxRate: 11,
      trackInventory: true,
      quantity: 20,
      lowStockAlert: 5,
      tags: ['food', 'lunch'],
    },
    {
      categoryId: categories[3].id,
      sku: 'PST-007',
      name: 'Cheesecake Slice',
      description: 'Potongan cheesecake New York style',
      price: 35000,
      costPrice: 17000,
      taxRate: 11,
      trackInventory: true,
      quantity: 12,
      lowStockAlert: 3,
      tags: ['dessert', 'sweet'],
    },
    {
      categoryId: categories[3].id,
      sku: 'PST-008',
      name: 'Brownies',
      description: 'Brownies cokelat fudgy',
      price: 20000,
      costPrice: 9000,
      taxRate: 11,
      trackInventory: true,
      quantity: 25,
      lowStockAlert: 5,
      tags: ['dessert', 'chocolate'],
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