import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data (in reverse order of dependencies)
  await prisma.subscriptionHistory.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.transactionDetail.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // ─── 1. Create Users: 3 OWNER + 1 ADMIN + 1 CUSTOMER ───
  const admin = await prisma.user.create({
    data: { name: 'Admin WarungNear', email: 'admin@warungnear.com', password: hashedPassword, role: 'ADMIN' }
  });

  const owner1 = await prisma.user.create({
    data: { name: 'Budi Santoso', email: 'budi@warungnear.com', password: hashedPassword, role: 'OWNER' }
  });

  const owner2 = await prisma.user.create({
    data: { name: 'Siti Rahma', email: 'siti@warungnear.com', password: hashedPassword, role: 'OWNER' }
  });

  const owner3 = await prisma.user.create({
    data: { name: 'Agus Permana', email: 'agus@warungnear.com', password: hashedPassword, role: 'OWNER' }
  });

  const customer = await prisma.user.create({
    data: { name: 'Eko Prasetyo', email: 'eko@customer.com', password: hashedPassword, role: 'CUSTOMER' }
  });

  // Create Subscription Plans
  const planMonthly = await prisma.subscriptionPlan.create({
    data: {
      name: 'Langganan Bulanan',
      duration_type: 'MONTHLY',
      duration_days: 30,
      price: 30000,
      description: 'Aktif 30 hari premium Kasir POS.'
    }
  });

  const planYearly = await prisma.subscriptionPlan.create({
    data: {
      name: 'Langganan Tahunan',
      duration_type: 'YEARLY',
      duration_days: 365,
      price: 300000,
      description: 'Lebih hemat! Aktif 365 hari premium.'
    }
  });

  const planPermanent = await prisma.subscriptionPlan.create({
    data: {
      name: 'Langganan Permanen',
      duration_type: 'PERMANENT',
      duration_days: null,
      price: 1000000,
      description: 'Sekali bayar untuk selamanya.'
    }
  });

  console.log('✅ Subscription Plans created');

  // Create Subscriptions for Owners
  const trialEndDateBudi = new Date();
  trialEndDateBudi.setDate(trialEndDateBudi.getDate() + 7);
  const expiredDateBudi = new Date();
  expiredDateBudi.setDate(expiredDateBudi.getDate() + 30);

  await prisma.subscription.create({
    data: {
      owner_id: owner1.id,
      status: 'ACTIVE',
      start_date: new Date(),
      trial_end_date: trialEndDateBudi,
      expired_date: expiredDateBudi,
      plan_id: planMonthly.id
    }
  });

  const trialEndDateSiti = new Date();
  trialEndDateSiti.setDate(trialEndDateSiti.getDate() + 5);

  await prisma.subscription.create({
    data: {
      owner_id: owner2.id,
      status: 'TRIAL',
      start_date: new Date(),
      trial_end_date: trialEndDateSiti,
      plan_id: null
    }
  });

  const startDateAgus = new Date();
  startDateAgus.setDate(startDateAgus.getDate() - 10);
  const trialEndDateAgus = new Date();
  trialEndDateAgus.setDate(trialEndDateAgus.getDate() - 3);

  await prisma.subscription.create({
    data: {
      owner_id: owner3.id,
      status: 'EXPIRED',
      start_date: startDateAgus,
      trial_end_date: trialEndDateAgus,
      expired_date: trialEndDateAgus,
      plan_id: planMonthly.id
    }
  });

  console.log('✅ Users, Plans & Subscriptions created');

  // ─── 2. Create 5 Stores (spread across Surabaya area) ───
  const store1 = await prisma.store.create({
    data: {
      name: 'Toko Berkah Jaya',
      address: 'Jl. Raya Darmo No. 45, Surabaya',
      latitude: -7.2906,
      longitude: 112.7384,
      open_time: '07:00',
      close_time: '22:00',
      owner_id: owner1.id
    }
  });

  const store2 = await prisma.store.create({
    data: {
      name: 'Warung Makmur Sejahtera',
      address: 'Jl. Gubeng Kertajaya No. 12, Surabaya',
      latitude: -7.2756,
      longitude: 112.7521,
      open_time: '06:00',
      close_time: '23:00',
      owner_id: owner1.id
    }
  });

  const store3 = await prisma.store.create({
    data: {
      name: 'Kelontong Ibu Siti',
      address: 'Jl. Manyar Kertoarjo No. 78, Surabaya',
      latitude: -7.2850,
      longitude: 112.7650,
      open_time: '08:00',
      close_time: '21:00',
      owner_id: owner2.id
    }
  });

  const store4 = await prisma.store.create({
    data: {
      name: 'Toko Agus Sembako',
      address: 'Jl. Rungkut Industri No. 33, Surabaya',
      latitude: -7.3200,
      longitude: 112.7700,
      open_time: '06:30',
      close_time: '22:30',
      owner_id: owner3.id
    }
  });

  const store5 = await prisma.store.create({
    data: {
      name: 'Warung Pojok Bahagia',
      address: 'Jl. Kenjeran No. 100, Surabaya',
      latitude: -7.2500,
      longitude: 112.7800,
      open_time: '07:00',
      close_time: '20:00',
      owner_id: owner3.id
    }
  });

  console.log('✅ Stores created');

  // ─── 3. Create Dynamic Categories for each store ───
  console.log('🌱 Creating dynamic categories...');
  const catStore1_Makanan = await prisma.category.create({ data: { name: 'Makanan', store_id: store1.id } });
  const catStore1_Sembako = await prisma.category.create({ data: { name: 'Sembako', store_id: store1.id } });

  const catStore2_Minuman = await prisma.category.create({ data: { name: 'Minuman', store_id: store2.id } });
  const catStore2_Mandi = await prisma.category.create({ data: { name: 'Peralatan Mandi', store_id: store2.id } });
  const catStore2_Sembako = await prisma.category.create({ data: { name: 'Sembako', store_id: store2.id } });

  const catStore3_Minuman = await prisma.category.create({ data: { name: 'Minuman', store_id: store3.id } });
  const catStore3_Makanan = await prisma.category.create({ data: { name: 'Makanan', store_id: store3.id } });
  const catStore3_Rumah = await prisma.category.create({ data: { name: 'Peralatan Rumah', store_id: store3.id } });

  const catStore4_Minuman = await prisma.category.create({ data: { name: 'Minuman', store_id: store4.id } });
  const catStore4_Sembako = await prisma.category.create({ data: { name: 'Sembako', store_id: store4.id } });
  const catStore4_Bumbu = await prisma.category.create({ data: { name: 'Bumbu', store_id: store4.id } });

  const catStore5_RumahTangga = await prisma.category.create({ data: { name: 'Kebutuhan Rumah', store_id: store5.id } });
  const catStore5_Lainnya = await prisma.category.create({ data: { name: 'Lainnya', store_id: store5.id } });
  const catStore5_Rumah = await prisma.category.create({ data: { name: 'Peralatan Rumah', store_id: store5.id } });
  const catStore5_Makanan = await prisma.category.create({ data: { name: 'Makanan', store_id: store5.id } });

  console.log('✅ Categories created');

  // ─── 4. Create 20 Products (4 per store) ───
  const productData = [
    // Store 1 — Toko Berkah Jaya
    { name: 'Indomie Goreng', category: 'Makanan', category_id: catStore1_Makanan.id, price: 3000, stock: 50, image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300', store_id: store1.id },
    { name: 'Beras Premium 5kg', category: 'Sembako', category_id: catStore1_Sembako.id, price: 65000, stock: 15, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300', store_id: store1.id },
    { name: 'Minyak Goreng 1L', category: 'Sembako', category_id: catStore1_Sembako.id, price: 18000, stock: 20, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300', store_id: store1.id },
    { name: 'Gula Pasir 1kg', category: 'Sembako', category_id: catStore1_Sembako.id, price: 14000, stock: 25, image: 'https://images.unsplash.com/photo-1550411294-875e80e67fac?w=300', store_id: store1.id },

    // Store 2 — Warung Makmur Sejahtera
    { name: 'Kopi Kapal Api Sachet', category: 'Minuman', category_id: catStore2_Minuman.id, price: 1500, stock: 100, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300', store_id: store2.id },
    { name: 'Sabun Mandi Lifebuoy', category: 'Peralatan Mandi', category_id: catStore2_Mandi.id, price: 4000, stock: 30, image: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=300', store_id: store2.id },
    { name: 'Teh Sariwangi 25 pcs', category: 'Minuman', category_id: catStore2_Minuman.id, price: 5500, stock: 40, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300', store_id: store2.id },
    { name: 'Telur Ayam 1kg', category: 'Sembako', category_id: catStore2_Sembako.id, price: 28000, stock: 3, image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300', store_id: store2.id },

    // Store 3 — Kelontong Ibu Siti
    { name: 'Susu Ultra 1L', category: 'Minuman', category_id: catStore3_Minuman.id, price: 17000, stock: 12, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300', store_id: store3.id },
    { name: 'Mie Sedaap Goreng', category: 'Makanan', category_id: catStore3_Makanan.id, price: 2800, stock: 60, image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300', store_id: store3.id },
    { name: 'Deterjen Rinso 800g', category: 'Peralatan Rumah', category_id: catStore3_Rumah.id, price: 12000, stock: 0, image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=300', store_id: store3.id },
    { name: 'Roti Tawar Sari Roti', category: 'Makanan', category_id: catStore3_Makanan.id, price: 15000, stock: 8, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300', store_id: store3.id },

    // Store 4 — Toko Agus Sembako
    { name: 'Aqua 600ml', category: 'Minuman', category_id: catStore4_Minuman.id, price: 4000, stock: 80, image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300', store_id: store4.id },
    { name: 'Bawang Merah 250g', category: 'Sembako', category_id: catStore4_Sembako.id, price: 8000, stock: 2, image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300', store_id: store4.id },
    { name: 'Sambal ABC Sachet', category: 'Bumbu', category_id: catStore4_Bumbu.id, price: 1000, stock: 150, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300', store_id: store4.id },
    { name: 'Tepung Terigu 1kg', category: 'Sembako', category_id: catStore4_Sembako.id, price: 10000, stock: 18, image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300', store_id: store4.id },

    // Store 5 — Warung Pojok Bahagia
    { name: 'Gas LPG 3kg', category: 'Kebutuhan Rumah', category_id: catStore5_RumahTangga.id, price: 20000, stock: 5, image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300', store_id: store5.id },
    { name: 'Rokok Gudang Garam', category: 'Lainnya', category_id: catStore5_Lainnya.id, price: 25000, stock: 35, image: 'https://images.unsplash.com/photo-1571156425562-12341e7c9aae?w=300', store_id: store5.id },
    { name: 'Sabun Cuci Piring', category: 'Peralatan Rumah', category_id: catStore5_Rumah.id, price: 5000, stock: 22, image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300', store_id: store5.id },
    { name: 'Snack Chitato 68g', category: 'Makanan', category_id: catStore5_Makanan.id, price: 10000, stock: 40, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300', store_id: store5.id },
  ];

  for (const product of productData) {
    await prisma.product.create({ data: product });
  }

  console.log('✅ 20 Products created');

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  🌱 Seeding complete!');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('  Login credentials (all passwords: password123):');
  console.log('  ─────────────────────────────────────────');
  console.log(`  Admin   : admin@warungnear.com`);
  console.log(`  Owner1  : budi@warungnear.com`);
  console.log(`  Owner2  : siti@warungnear.com`);
  console.log(`  Owner3  : agus@warungnear.com`);
  console.log(`  Customer: eko@customer.com`);
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
