import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database final cleanup & seeding...');

  // 1. Clean up all existing data in proper dependency order
  await prisma.storeImage.deleteMany();
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

  console.log('  ✔ Database data cleared completely.');

  // 2. Hash admin password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // 3. Create Default Admin Account
  const admin = await prisma.user.create({
    data: {
      name: 'Admin WarungNear',
      email: 'syaifulsajaaa@gmail.com',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log(`  ✔ Default Admin Account created: ${admin.email}`);

  // 4. Create Standard Subscription Plans for platform operations
  await prisma.subscriptionPlan.create({
    data: {
      name: 'Langganan Bulanan',
      duration_type: 'MONTHLY',
      duration_days: 30,
      price: 30000,
      description: 'Aktif 30 hari premium Kasir POS.'
    }
  });

  await prisma.subscriptionPlan.create({
    data: {
      name: 'Langganan Tahunan',
      duration_type: 'YEARLY',
      duration_days: 365,
      price: 300000,
      description: 'Lebih hemat! Aktif 365 hari premium.'
    }
  });

  await prisma.subscriptionPlan.create({
    data: {
      name: 'Langganan Permanen',
      duration_type: 'PERMANENT',
      duration_days: null,
      price: 1000000,
      description: 'Sekali bayar untuk selamanya.'
    }
  });

  console.log('  ✔ Standard Subscription Plans seeded.');
  console.log('🌱 Seeding process complete!');
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
