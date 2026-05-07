import { PrismaClient, UserRole, TableStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

type SeedOption = {
  name: string
  nameEn: string
  priceAdjust: number
  isDefault?: boolean
}

type SeedOptionGroup = {
  name: string
  nameEn: string
  type: 'SINGLE' | 'MULTIPLE'
  required: boolean
  maxSelect?: number
  options: SeedOption[]
}

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-bistro' },
    update: {},
    create: {
      slug: 'demo-bistro',
      name: 'Demo Bistro',
      primaryColor: '#F97316',
      currency: 'THB',
      timezone: 'Asia/Bangkok',
      promptPayId: '0929622541',
      googleMapsUrl: 'https://maps.google.com/?q=Demo+Bistro',
      plan: 'PRO',
    },
  })

  // Create staff users
  const passwordHash = await bcrypt.hash('password123', 12)

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'owner@demo.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'owner@demo.com',
      passwordHash,
      pin: await bcrypt.hash('1234', 10),
      name: 'Restaurant Owner',
      role: UserRole.OWNER,
    },
  })

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'kitchen@demo.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'kitchen@demo.com',
      passwordHash,
      pin: await bcrypt.hash('2345', 10),
      name: 'Head Chef',
      role: UserRole.KITCHEN,
    },
  })

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'cashier@demo.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'cashier@demo.com',
      passwordHash,
      pin: await bcrypt.hash('3456', 10),
      name: 'Cashier Staff',
      role: UserRole.CASHIER,
    },
  })

  // Create tables
  const tableData = [
    { code: 'A1', name: 'Table A1', capacity: 2, zone: 'Indoor' },
    { code: 'A2', name: 'Table A2', capacity: 2, zone: 'Indoor' },
    { code: 'A3', name: 'Table A3', capacity: 4, zone: 'Indoor' },
    { code: 'A4', name: 'Table A4', capacity: 4, zone: 'Indoor' },
    { code: 'B1', name: 'Table B1', capacity: 6, zone: 'Indoor' },
    { code: 'B2', name: 'Table B2', capacity: 6, zone: 'Indoor' },
    { code: 'C1', name: 'Table C1', capacity: 4, zone: 'Outdoor' },
    { code: 'C2', name: 'Table C2', capacity: 4, zone: 'Outdoor' },
    { code: 'VIP1', name: 'VIP Room 1', capacity: 10, zone: 'VIP' },
    { code: 'VIP2', name: 'VIP Room 2', capacity: 12, zone: 'VIP' },
  ]

  for (const t of tableData) {
    await prisma.table.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: t.code } },
      update: {},
      create: { tenantId: tenant.id, ...t },
    })
  }

  // Create menu categories
  const categories = [
    { name: 'แนะนำ', nameEn: 'Recommended', icon: '⭐', sortOrder: 0 },
    { name: 'อาหารจานหลัก', nameEn: 'Main Course', icon: '🍜', sortOrder: 1 },
    { name: 'อาหารทะเล', nameEn: 'Seafood', icon: '🦐', sortOrder: 2 },
    { name: 'ผัด/ทอด', nameEn: 'Stir-fry', icon: '🍳', sortOrder: 3 },
    { name: 'ต้ม/แกง', nameEn: 'Soup & Curry', icon: '🍲', sortOrder: 4 },
    { name: 'ยำ/สลัด', nameEn: 'Salad', icon: '🥗', sortOrder: 5 },
    { name: 'เครื่องดื่ม', nameEn: 'Drinks', icon: '🧃', sortOrder: 6 },
    { name: 'ของหวาน', nameEn: 'Desserts', icon: '🍮', sortOrder: 7 },
  ]

  const createdCategories: Record<string, string> = {}
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { id: `cat-${tenant.id}-${cat.nameEn?.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `cat-${tenant.id}-${cat.nameEn?.toLowerCase().replace(/\s/g, '-')}`,
        tenantId: tenant.id,
        ...cat,
      },
    })
    createdCategories[cat.nameEn || cat.name] = c.id
  }

  // Create menu items
  const menuItems: Array<{
    categoryKey: string
    name: string
    nameEn: string
    description?: string
    price: number
    isPopular?: boolean
    isNew?: boolean
    preparationTime?: number
    calories?: number
    imageUrl?: string
    options: SeedOptionGroup[]
  }> = [
    {
      categoryKey: 'Main Course',
      name: 'ข้าวผัดกุ้ง',
      nameEn: 'Shrimp Fried Rice',
      description: 'ข้าวผัดกุ้งสดกับไข่ไก่ หอมแดง และซีอิ๊ว',
      price: 120,
      isPopular: true,
      preparationTime: 15,
      calories: 450,
      options: [
        {
          name: 'ระดับความเผ็ด',
          nameEn: 'Spice Level',
          type: 'SINGLE' as const,
          required: true,
          options: [
            { name: 'ไม่เผ็ด', nameEn: 'Not Spicy', priceAdjust: 0, isDefault: true },
            { name: 'เผ็ดน้อย', nameEn: 'Mild', priceAdjust: 0 },
            { name: 'เผ็ดกลาง', nameEn: 'Medium', priceAdjust: 0 },
            { name: 'เผ็ดมาก', nameEn: 'Spicy', priceAdjust: 0 },
          ],
        },
        {
          name: 'เพิ่มเติม',
          nameEn: 'Extras',
          type: 'MULTIPLE' as const,
          required: false,
          maxSelect: 3,
          options: [
            { name: 'ไข่ดาว', nameEn: 'Fried Egg +1', priceAdjust: 15 },
            { name: 'กุ้งเพิ่ม', nameEn: 'Extra Shrimp', priceAdjust: 30 },
          ],
        },
      ],
    },
    {
      categoryKey: 'Main Course',
      name: 'ข้าวมันไก่',
      nameEn: 'Khao Man Gai',
      description: 'ข้าวมันไก่ต้มเนื้อนุ่ม พร้อมซุปไก่และน้ำจิ้ม',
      price: 80,
      isPopular: true,
      preparationTime: 10,
      calories: 380,
      options: [
        {
          name: 'ส่วนไก่',
          nameEn: 'Chicken Part',
          type: 'SINGLE' as const,
          required: true,
          options: [
            { name: 'ผสม', nameEn: 'Mixed', priceAdjust: 0, isDefault: true },
            { name: 'อก', nameEn: 'Breast', priceAdjust: 0 },
            { name: 'น่อง/สะโพก', nameEn: 'Thigh/Leg', priceAdjust: 0 },
          ],
        },
      ],
    },
    {
      categoryKey: 'Seafood',
      name: 'ปลากะพงทอดน้ำปลา',
      nameEn: 'Deep Fried Seabass',
      description: 'ปลากะพงขาวทอดกรอบ ราดน้ำปลาพริกมะนาว',
      price: 320,
      isNew: true,
      preparationTime: 20,
      options: [],
    },
    {
      categoryKey: 'Stir-fry',
      name: 'ผัดกะเพราหมูสับ',
      nameEn: 'Pork Basil Stir-fry',
      description: 'หมูสับผัดกะเพราไข่ดาว เสิร์ฟกับข้าวสวย',
      price: 90,
      isPopular: true,
      preparationTime: 12,
      calories: 520,
      options: [
        {
          name: 'ระดับความเผ็ด',
          nameEn: 'Spice Level',
          type: 'SINGLE' as const,
          required: true,
          options: [
            { name: 'ไม่เผ็ด', nameEn: 'Not Spicy', priceAdjust: 0 },
            { name: 'เผ็ดน้อย', nameEn: 'Mild', priceAdjust: 0, isDefault: true },
            { name: 'เผ็ดกลาง', nameEn: 'Medium', priceAdjust: 0 },
            { name: 'เผ็ดมาก', nameEn: 'Spicy', priceAdjust: 0 },
            { name: 'เผ็ดพิเศษ', nameEn: 'Extra Spicy', priceAdjust: 0 },
          ],
        },
        {
          name: 'โปรตีน',
          nameEn: 'Protein',
          type: 'SINGLE' as const,
          required: false,
          options: [
            { name: 'หมูสับ', nameEn: 'Pork', priceAdjust: 0, isDefault: true },
            { name: 'ไก่สับ', nameEn: 'Chicken', priceAdjust: 0 },
            { name: 'กุ้ง', nameEn: 'Shrimp', priceAdjust: 20 },
            { name: 'เนื้อสับ', nameEn: 'Beef', priceAdjust: 30 },
          ],
        },
      ],
    },
    {
      categoryKey: 'Soup & Curry',
      name: 'ต้มยำกุ้งน้ำข้น',
      nameEn: 'Tom Yum Goong',
      description: 'ต้มยำกุ้งสดน้ำข้น กลมกล่อม หอมตะไคร้กะทิ',
      price: 180,
      isPopular: true,
      preparationTime: 15,
      options: [
        {
          name: 'ขนาด',
          nameEn: 'Size',
          type: 'SINGLE' as const,
          required: true,
          options: [
            { name: 'เล็ก (1-2 ท่าน)', nameEn: 'Small', priceAdjust: 0, isDefault: true },
            { name: 'กลาง (2-3 ท่าน)', nameEn: 'Medium', priceAdjust: 60 },
            { name: 'ใหญ่ (4-5 ท่าน)', nameEn: 'Large', priceAdjust: 150 },
          ],
        },
      ],
    },
    {
      categoryKey: 'Salad',
      name: 'ยำวุ้นเส้น',
      nameEn: 'Glass Noodle Salad',
      description: 'ยำวุ้นเส้นรสแซ่บ หมูสับ กุ้ง เห็ดหูหนู',
      price: 95,
      preparationTime: 10,
      options: [
        {
          name: 'ความเผ็ด',
          nameEn: 'Spice Level',
          type: 'SINGLE' as const,
          required: true,
          options: [
            { name: 'เผ็ดน้อย', nameEn: 'Mild', priceAdjust: 0, isDefault: true },
            { name: 'เผ็ดกลาง', nameEn: 'Medium', priceAdjust: 0 },
            { name: 'เผ็ดมาก', nameEn: 'Spicy', priceAdjust: 0 },
          ],
        },
      ],
    },
    {
      categoryKey: 'Drinks',
      name: 'ชาไทยเย็น',
      nameEn: 'Thai Iced Tea',
      description: 'ชาไทยชงเข้มข้น ใส่นมข้น หวานอร่อย',
      price: 55,
      isPopular: true,
      preparationTime: 5,
      options: [
        {
          name: 'ความหวาน',
          nameEn: 'Sweetness',
          type: 'SINGLE' as const,
          required: false,
          options: [
            { name: 'ปกติ', nameEn: 'Normal', priceAdjust: 0, isDefault: true },
            { name: 'หวานน้อย', nameEn: 'Less Sweet', priceAdjust: 0 },
            { name: 'หวานมาก', nameEn: 'Extra Sweet', priceAdjust: 0 },
          ],
        },
      ],
    },
    {
      categoryKey: 'Drinks',
      name: 'น้ำมะพร้าว',
      nameEn: 'Coconut Water',
      description: 'น้ำมะพร้าวสดเย็นชื่นใจ',
      price: 65,
      preparationTime: 3,
      options: [],
    },
    {
      categoryKey: 'Drinks',
      name: 'น้ำเปล่า',
      nameEn: 'Water',
      description: 'น้ำดื่มสะอาด',
      price: 20,
      preparationTime: 1,
      options: [],
    },
    {
      categoryKey: 'Desserts',
      name: 'ขนมครก',
      nameEn: 'Khanom Krok',
      description: 'ขนมครกแป้งนุ่มหน้าหวาน ทำสดทุกออร์เดอร์',
      price: 60,
      isNew: true,
      preparationTime: 15,
      options: [
        {
          name: 'หน้าขนม',
          nameEn: 'Topping',
          type: 'MULTIPLE' as const,
          required: false,
          maxSelect: 2,
          options: [
            { name: 'ต้นหอม', nameEn: 'Spring Onion', priceAdjust: 0, isDefault: true },
            { name: 'ข้าวโพด', nameEn: 'Corn', priceAdjust: 0 },
            { name: 'ฟักทอง', nameEn: 'Pumpkin', priceAdjust: 5 },
          ],
        },
      ],
    },
    {
      categoryKey: 'Desserts',
      name: 'ข้าวเหนียวมะม่วง',
      nameEn: 'Mango Sticky Rice',
      description: 'ข้าวเหนียวมูนราดกะทิ เสิร์ฟกับมะม่วงสด',
      price: 120,
      isPopular: true,
      preparationTime: 5,
      options: [],
    },
  ]

  let sortOrder = 0
  for (const item of menuItems) {
    const categoryId = createdCategories[item.categoryKey]
    if (!categoryId) continue

    const itemId = `item-${tenant.id}-${item.nameEn?.toLowerCase().replace(/\s+/g, '-')}`

    const created = await prisma.menuItem.upsert({
      where: { id: itemId },
      update: {},
      create: {
        id: itemId,
        tenantId: tenant.id,
        categoryId,
        name: item.name,
        nameEn: item.nameEn,
        description: item.description,
        price: item.price,
        isPopular: item.isPopular ?? false,
        isNew: item.isNew ?? false,
        preparationTime: item.preparationTime,
        calories: item.calories,
        sortOrder: sortOrder++,
      },
    })

    // Also add recommended items to the "Recommended" category
    if (item.isPopular) {
      const recatId = createdCategories['Recommended']
      if (recatId) {
        await prisma.menuItem.upsert({
          where: { id: `${itemId}-rec` },
          update: {},
          create: {
            id: `${itemId}-rec`,
            tenantId: tenant.id,
            categoryId: recatId,
            name: item.name,
            nameEn: item.nameEn,
            description: item.description,
            price: item.price,
            isPopular: true,
            preparationTime: item.preparationTime,
            sortOrder: sortOrder++,
          },
        })
      }
    }

    for (const group of item.options) {
      const og = await prisma.optionGroup.create({
        data: {
          menuItemId: created.id,
          name: group.name,
          nameEn: group.nameEn,
          type: group.type,
          required: group.required ?? false,
          maxSelect: group.maxSelect ?? 1,
        },
      })
      let optSort = 0
      for (const opt of group.options) {
        await prisma.option.create({
          data: {
            optionGroupId: og.id,
            name: opt.name,
            nameEn: opt.nameEn,
            priceAdjust: opt.priceAdjust,
            isDefault: opt.isDefault ?? false,
            sortOrder: optSort++,
          },
        })
      }
    }
  }

  console.log('✅ Seeding complete!')
  console.log(`\n📋 Demo credentials:`)
  console.log(`   Owner:   owner@demo.com / password123`)
  console.log(`   Kitchen: kitchen@demo.com / password123`)
  console.log(`   Cashier: cashier@demo.com / password123`)
  console.log(`\n🔗 Customer QR URL: http://localhost:3000/demo-bistro/A1`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
