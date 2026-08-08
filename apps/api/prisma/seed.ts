import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

// Chirundu, Zambia sits on the Zambezi at roughly -16.033, 28.850.
const TOWN_CENTER = { lat: -16.0334, lng: 28.85 };

async function main() {
  console.log('Seeding ChiruDeli...');

  // ── Store classes (spec §17/§18) — admin-managed data, not an enum ───
  const storeClassSeeds = [
    { name: 'Restaurants', slug: 'restaurants', icon: '🍔', sortOrder: 1, docs: [] },
    { name: 'Groceries', slug: 'groceries', icon: '🛒', sortOrder: 2, docs: [] },
    {
      name: 'Pharmacies',
      slug: 'pharmacies',
      icon: '💊',
      sortOrder: 3,
      docs: ['Business Registration Certificate', 'Pharmacy Licence'],
    },
    { name: 'Electronics', slug: 'electronics', icon: '📱', sortOrder: 4, docs: ['Business Registration Certificate'] },
    { name: 'Stationery', slug: 'stationery', icon: '📚', sortOrder: 5, docs: [] },
    { name: 'Household', slug: 'household', icon: '🏠', sortOrder: 6, docs: [] },
    { name: 'Hardware', slug: 'hardware', icon: '🔧', sortOrder: 7, docs: ['Business Registration Certificate'] },
    { name: 'Butcheries', slug: 'butcheries', icon: '🥩', sortOrder: 8, docs: ['Health/Food Handling Certificate'] },
    { name: 'Other', slug: 'other', icon: '📦', sortOrder: 9, docs: [] },
  ];

  const storeClassBySlug: Record<string, { id: string }> = {};
  for (const sc of storeClassSeeds) {
    const existing = await prisma.storeClass.findUnique({ where: { slug: sc.slug } });
    const storeClass = existing
      ? await prisma.storeClass.update({
          where: { slug: sc.slug },
          data: { name: sc.name, icon: sc.icon, sortOrder: sc.sortOrder },
        })
      : await prisma.storeClass.create({
          data: {
            name: sc.name,
            slug: sc.slug,
            icon: sc.icon,
            sortOrder: sc.sortOrder,
            requiredDocuments: {
              create: sc.docs.map((label, i) => ({ documentLabel: label, isRequired: true, sortOrder: i })),
            },
          },
        });
    storeClassBySlug[sc.slug] = storeClass;
  }

  // ── Delivery zones (spec section 18's example table) ────────────────
  const chirunduTownData = {
    isServiceArea: true,
    feeType: 'FIXED_ZONE' as const,
    fixedFee: 15,
    centerLatitude: TOWN_CENTER.lat,
    centerLongitude: TOWN_CENTER.lng,
    radiusKm: 2.5,
  };
  const zoneChirunduTown = await prisma.deliveryZone.upsert({
    where: { name: 'Chirundu Town' },
    update: chirunduTownData,
    create: { name: 'Chirundu Town', ...chirunduTownData },
  });
  // Kept tight and offset from the town center so it doesn't overlap the
  // seeded demo address (which sits solidly inside Chirundu Town).
  const borderAreaData = {
    isServiceArea: true,
    feeType: 'FIXED_ZONE' as const,
    fixedFee: 25,
    centerLatitude: -16.055,
    centerLongitude: 28.8705,
    radiusKm: 1.2,
  };
  const zoneBorderArea = await prisma.deliveryZone.upsert({
    where: { name: 'Border Area' },
    update: borderAreaData,
    create: { name: 'Border Area', ...borderAreaData },
  });
  const farmAreaData = {
    isServiceArea: true,
    feeType: 'FIXED_ZONE' as const,
    fixedFee: 30,
    centerLatitude: -16.09,
    centerLongitude: 28.81,
    radiusKm: 6,
  };
  await prisma.deliveryZone.upsert({
    where: { name: 'Farm Area' },
    update: farmAreaData,
    create: { name: 'Farm Area', ...farmAreaData },
  });
  const customAreaData = {
    isServiceArea: true,
    feeType: 'FIXED_ZONE' as const,
    fixedFee: 40,
    centerLatitude: TOWN_CENTER.lat,
    centerLongitude: TOWN_CENTER.lng,
    radiusKm: 15,
  };
  await prisma.deliveryZone.upsert({
    where: { name: 'Custom Area' },
    update: customAreaData,
    create: { name: 'Custom Area', ...customAreaData },
  });

  // ── Platform-wide delivery fee default (base + per-km formula) ──────
  const existingFeeConfig = await prisma.deliveryFeeConfig.findFirst({ where: { isActive: true } });
  if (!existingFeeConfig) {
    await prisma.deliveryFeeConfig.create({ data: { baseFee: 15, perKmFee: 5, isActive: true } });
  }

  // ── Admin ─────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { phone: '+260970000001' },
    update: {},
    create: {
      phone: '+260970000001',
      email: 'admin@chirudeli.zm',
      passwordHash: await hashPassword('Admin123!'),
      role: 'SYSTEM_ADMIN',
      adminUser: { create: { fullName: 'Chisenga Mumba', permissionLevel: 'SUPER_ADMIN' } },
    },
  });

  // ── Approved & activated stores ──────────────────────────────────────
  const businessSeeds = [
    {
      managerPhone: '+260971000001',
      managerName: 'Thandiwe Banda',
      name: 'Chirundu Grill House',
      storeClassSlug: 'restaurants',
      description: 'Char-grilled Zambian favourites — nshima, chicken, bream, and cold drinks.',
      lat: TOWN_CENTER.lat + 0.002,
      lng: TOWN_CENTER.lng + 0.001,
      zoneId: zoneChirunduTown.id,
      productCategories: {
        Popular: [
          { name: 'Nshima & Chicken Combo', description: 'Grilled chicken quarter with nshima and veg.', price: 65 },
          { name: 'Beef Stew Combo', description: 'Slow-cooked beef stew, nshima, and rape.', price: 70 },
        ],
        Meals: [
          { name: 'Grilled Bream', description: 'Whole bream from the Zambezi, chargrilled.', price: 85 },
          { name: 'T-Bone & Chips', description: 'Grilled T-bone steak with fries.', price: 95 },
        ],
        Drinks: [
          { name: 'Mosi Lager 500ml', description: 'Ice-cold Zambian lager.', price: 25 },
          { name: 'Coca-Cola 500ml', description: 'Chilled soft drink.', price: 12 },
        ],
        Snacks: [
          { name: 'Beef Samosa (3pc)', description: 'Crispy pastry, spiced beef filling.', price: 15 },
          { name: 'Chips', description: 'Golden fried potato chips.', price: 25 },
        ],
      },
    },
    {
      managerPhone: '+260971000002',
      managerName: 'Bwalya Mwansa',
      name: 'Zambezi Fresh Groceries',
      storeClassSlug: 'groceries',
      description: 'Fresh produce and everyday household groceries, restocked daily.',
      lat: TOWN_CENTER.lat - 0.0015,
      lng: TOWN_CENTER.lng + 0.0025,
      zoneId: zoneChirunduTown.id,
      productCategories: {
        'Fresh Produce': [
          { name: 'Tomatoes (1kg)', description: 'Locally grown, vine-ripened.', price: 15 },
          { name: 'Onions (1kg)', description: 'Fresh red onions.', price: 12 },
        ],
        Pantry: [
          { name: 'Mealie Meal (5kg)', description: 'Roller meal, breakfast grade.', price: 90 },
          { name: 'Cooking Oil (2L)', description: 'Pure sunflower oil.', price: 65 },
          { name: 'Rice (2kg)', description: 'Long grain white rice.', price: 48 },
          { name: 'Sugar (2kg)', description: 'White granulated sugar.', price: 35 },
        ],
        Beverages: [
          { name: 'Milk (1L)', description: 'Fresh full-cream milk.', price: 18 },
          { name: 'Bread Loaf', description: 'Freshly baked white bread.', price: 12 },
        ],
      },
    },
    {
      managerPhone: '+260971000003',
      managerName: 'Natasha Zulu',
      name: 'Riverside Pharmacy',
      storeClassSlug: 'pharmacies',
      description: 'Everyday medicines, first aid, and personal care essentials.',
      lat: TOWN_CENTER.lat + 0.001,
      lng: TOWN_CENTER.lng - 0.0015,
      zoneId: zoneChirunduTown.id,
      productCategories: {
        'Pain Relief': [
          { name: 'Panadol (20 tabs)', description: 'Paracetamol 500mg.', price: 20 },
          { name: 'Vitamin C Tablets', description: 'Immune support, 30 tabs.', price: 30 },
        ],
        'First Aid': [
          { name: 'ORS Sachet', description: 'Oral rehydration salts.', price: 5 },
          { name: 'Bandages Pack', description: 'Assorted adhesive bandages.', price: 15 },
        ],
        'Personal Care': [{ name: 'Hand Sanitizer 100ml', description: '70% alcohol gel.', price: 25 }],
      },
    },
    {
      managerPhone: '+260971000004',
      managerName: 'Emmanuel Chileshe',
      name: 'Chirundu Electronics Hub',
      storeClassSlug: 'electronics',
      description: 'Phone accessories, audio gear, and everyday electronics.',
      lat: TOWN_CENTER.lat - 0.0008,
      lng: TOWN_CENTER.lng - 0.0008,
      zoneId: zoneChirunduTown.id,
      productCategories: {
        'Phone Accessories': [
          { name: 'Phone Charger (USB-C)', description: 'Fast-charging 20W adapter + cable.', price: 45 },
          { name: 'Power Bank 10000mAh', description: 'Dual USB output.', price: 180 },
        ],
        Audio: [
          { name: 'Wired Earphones', description: 'In-ear, 3.5mm jack.', price: 60 },
          { name: 'Bluetooth Speaker', description: 'Portable, 6hr battery.', price: 250 },
        ],
      },
    },
    {
      managerPhone: '+260971000005',
      managerName: 'Mercy Sinkala',
      name: 'Border Stationers',
      storeClassSlug: 'stationery',
      description: 'School and office supplies for Chirundu and surrounding areas.',
      lat: TOWN_CENTER.lat + 0.0022,
      lng: TOWN_CENTER.lng - 0.0022,
      zoneId: zoneBorderArea.id,
      productCategories: {
        'School Supplies': [
          { name: 'Exercise Book', description: '96 pages, ruled.', price: 8 },
          { name: 'Pen Pack (5)', description: 'Blue ballpoint pens.', price: 15 },
        ],
        Office: [
          { name: 'A4 Paper Ream', description: '500 sheets, 80gsm.', price: 90 },
          { name: 'Calculator', description: 'Basic 8-digit calculator.', price: 120 },
        ],
      },
    },
    {
      managerPhone: '+260971000006',
      managerName: 'Joseph Mulenga',
      name: 'Zambezi Home & Household',
      storeClassSlug: 'household',
      description: 'Cleaning supplies and kitchenware for the home.',
      lat: TOWN_CENTER.lat - 0.0022,
      lng: TOWN_CENTER.lng - 0.0015,
      zoneId: zoneChirunduTown.id,
      productCategories: {
        Cleaning: [
          { name: 'Dish Soap', description: '750ml, lemon scent.', price: 20 },
          { name: 'Laundry Soap Bar', description: 'All-purpose bar soap.', price: 10 },
        ],
        Kitchenware: [
          { name: 'Plastic Basin', description: '30L capacity, durable.', price: 40 },
          { name: 'Broom', description: 'Long-handle household broom.', price: 35 },
        ],
      },
    },
  ];

  const openingHours = {
    mon: { open: '07:00', close: '21:00', closed: false },
    tue: { open: '07:00', close: '21:00', closed: false },
    wed: { open: '07:00', close: '21:00', closed: false },
    thu: { open: '07:00', close: '21:00', closed: false },
    fri: { open: '07:00', close: '22:00', closed: false },
    sat: { open: '08:00', close: '22:00', closed: false },
    sun: { open: '09:00', close: '18:00', closed: false },
  };

  for (const seed of businessSeeds) {
    const managerUser = await prisma.user.upsert({
      where: { phone: seed.managerPhone },
      update: {},
      create: {
        phone: seed.managerPhone,
        passwordHash: await hashPassword('Business123!'),
        role: 'STORE_MANAGER',
        storeManager: { create: { fullName: seed.managerName } },
      },
      include: { storeManager: true },
    });

    const slug = seed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const business = await prisma.business.upsert({
      where: { slug },
      update: {},
      create: {
        name: seed.name,
        slug,
        storeClassId: storeClassBySlug[seed.storeClassSlug]!.id,
        description: seed.description,
        phone: seed.managerPhone,
        status: 'APPROVED',
        isActivated: true,
        storeState: 'OPEN',
        latitude: seed.lat,
        longitude: seed.lng,
        address: `${seed.name}, Chirundu, Zambia`,
        openingHours,
        zoneId: seed.zoneId,
        submittedAt: new Date(),
        approvedAt: new Date(),
        approvedById: adminUser.id,
        activatedAt: new Date(),
        managers: managerUser.storeManager
          ? { create: { storeManagerId: managerUser.storeManager.id, isPrimary: true } }
          : undefined,
      },
    });

    const existingCategoryCount = await prisma.productCategory.count({ where: { businessId: business.id } });
    let sortOrder = 0;
    for (const [categoryName, products] of existingCategoryCount > 0 ? [] : Object.entries(seed.productCategories)) {
      const productCategory = await prisma.productCategory.create({
        data: { businessId: business.id, name: categoryName, sortOrder: sortOrder++ },
      });
      for (const product of products) {
        await prisma.product.create({
          data: {
            businessId: business.id,
            categoryId: productCategory.id,
            name: product.name,
            description: product.description,
            price: product.price,
            isAvailable: true,
          },
        });
      }
    }
    console.log(`  ✓ ${seed.name}`);
  }

  // ── One store still awaiting approval — demoes the approval workflow ─
  const pendingManagerUser = await prisma.user.upsert({
    where: { phone: '+260971000099' },
    update: {},
    create: {
      phone: '+260971000099',
      passwordHash: await hashPassword('Business123!'),
      role: 'STORE_MANAGER',
      storeManager: { create: { fullName: 'Ruth Sakala' } },
    },
    include: { storeManager: true },
  });
  const pendingSlug = 'chirundu-hardware-supplies';
  const existingPending = await prisma.business.findUnique({ where: { slug: pendingSlug } });
  if (!existingPending) {
    await prisma.business.create({
      data: {
        name: 'Chirundu Hardware Supplies',
        slug: pendingSlug,
        storeClassId: storeClassBySlug.hardware!.id,
        description: 'Building materials, tools, and plumbing supplies.',
        phone: '+260971000099',
        status: 'PENDING_APPROVAL',
        isActivated: false,
        latitude: TOWN_CENTER.lat + 0.003,
        longitude: TOWN_CENTER.lng + 0.003,
        address: 'Chirundu Hardware Supplies, Chirundu, Zambia',
        openingHours,
        submittedAt: new Date(),
        managers: pendingManagerUser.storeManager
          ? { create: { storeManagerId: pendingManagerUser.storeManager.id, isPrimary: true } }
          : undefined,
      },
    });
  }
  console.log('  ✓ Chirundu Hardware Supplies (pending admin approval)');

  // ── Riders ────────────────────────────────────────────────────────────
  const riderSeeds = [
    { phone: '+260975000001', name: 'Kunda Banda', vehicle: 'MOTORCYCLE' as const },
    { phone: '+260975000002', name: 'Grace Tembo', vehicle: 'BICYCLE' as const },
  ];
  for (const r of riderSeeds) {
    const user = await prisma.user.upsert({
      where: { phone: r.phone },
      update: {},
      create: { phone: r.phone, passwordHash: await hashPassword('Rider123!'), role: 'RIDER' },
    });
    await prisma.rider.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        fullName: r.name,
        nationalId: `NRC-${Math.floor(100000 + Math.random() * 900000)}`,
        vehicleType: r.vehicle,
        emergencyContactName: 'Next of Kin',
        emergencyContactPhone: '+260976000000',
        status: 'APPROVED',
        onlineStatus: 'ONLINE',
        currentLatitude: TOWN_CENTER.lat,
        currentLongitude: TOWN_CENTER.lng,
        approvedAt: new Date(),
        approvedById: adminUser.id,
      },
    });
    console.log(`  ✓ Rider: ${r.name}`);
  }

  // ── Demo customer ────────────────────────────────────────────────────
  const customerUser = await prisma.user.upsert({
    where: { phone: '+260976543210' },
    update: {},
    create: {
      phone: '+260976543210',
      passwordHash: await hashPassword('Customer123!'),
      role: 'CUSTOMER',
      customer: { create: { displayName: 'Mwansa Phiri' } },
    },
  });
  const existingAddress = await prisma.address.findFirst({ where: { userId: customerUser.id } });
  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: customerUser.id,
        label: 'Home',
        line1: 'Plot 24, Kariba Road',
        area: 'Chirundu Town',
        latitude: TOWN_CENTER.lat + 0.0012,
        longitude: TOWN_CENTER.lng + 0.0009,
        deliveryInstructions: 'Blue gate, call on arrival.',
        isDefault: true,
      },
    });
  }
  console.log('  ✓ Demo customer: Mwansa Phiri (+260976543210 / Customer123!)');

  // ── Promotions ───────────────────────────────────────────────────────
  await prisma.promotion.upsert({
    where: { code: 'CHIRU10' },
    update: {},
    create: {
      code: 'CHIRU10',
      type: 'PERCENTAGE',
      value: 10,
      perCustomerLimit: 1,
      maxDiscountAmount: 30,
    },
  });
  await prisma.promotion.upsert({
    where: { code: 'FREESHIP' },
    update: {},
    create: { code: 'FREESHIP', type: 'FREE_DELIVERY', value: 0, perCustomerLimit: 1 },
  });

  console.log('\nSeed complete. Demo logins:');
  console.log('  Admin:          +260970000001 / Admin123!');
  console.log('  Store manager:  +260971000001 / Business123!  (Chirundu Grill House)');
  console.log('  Pending store:  +260971000099 / Business123!  (Chirundu Hardware Supplies, awaiting approval)');
  console.log('  Rider:          +260975000001 / Rider123!      (Kunda Banda)');
  console.log('  Customer:       +260976543210 / Customer123!   (Mwansa Phiri)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
