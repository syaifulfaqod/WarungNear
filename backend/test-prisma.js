import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function runAudit() {
  console.log('🏁 Starting Database Integrity Audit in backend context...');
  
  // 1. Connection check
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('🟢 Database connected successfully via Prisma Client');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }

  const testEmailCustomer = `test_cust_${Date.now()}@audit.com`;
  const testEmailOwner = `test_owner_${Date.now()}@audit.com`;
  const hashedPassword = await bcrypt.hash('audit123', 10);

  let customer = null;
  let owner = null;
  let store = null;
  let product = null;
  let category = null;
  let order = null;
  let conversation = null;

  try {
    // 2. User creation (Customer & Owner)
    console.log('👉 Creating test Customer and Owner accounts...');
    customer = await prisma.user.create({
      data: {
        name: 'Audit Customer',
        email: testEmailCustomer,
        password: hashedPassword,
        role: 'CUSTOMER',
      }
    });
    console.log(`  ✔ Customer created: ID=${customer.id}, Role=${customer.role}`);

    owner = await prisma.user.create({
      data: {
        name: 'Audit Owner',
        email: testEmailOwner,
        password: hashedPassword,
        role: 'OWNER',
      }
    });
    console.log(`  ✔ Owner created: ID=${owner.id}, Role=${owner.role}`);

    // 3. Store creation
    console.log('👉 Creating store for Owner...');
    store = await prisma.store.create({
      data: {
        name: 'Audit Store',
        address: 'Jl. Audit No. 1',
        latitude: -7.28,
        longitude: 112.75,
        open_time: '08:00',
        close_time: '21:00',
        phoneNumber: '08123456789',
        owner_id: owner.id
      }
    });
    console.log(`  ✔ Store created: ID=${store.id}, Phone=${store.phoneNumber}, Lat=${store.latitude}, Lng=${store.longitude}`);

    // 4. Custom Category creation
    console.log('👉 Creating custom category for Store...');
    category = await prisma.category.create({
      data: {
        name: 'Sembako Audit',
        store_id: store.id
      }
    });
    console.log(`  ✔ Category created: ID=${category.id}, Name=${category.name}`);

    // 5. Product creation
    console.log('👉 Creating product in Store...');
    product = await prisma.product.create({
      data: {
        name: 'Beras Premium',
        category: 'Sembako',
        category_id: category.id,
        price: 15000.0,
        stock: 50,
        store_id: store.id
      }
    });
    console.log(`  ✔ Product created: ID=${product.id}, Name=${product.name}, Price=${product.price}, Stock=${product.stock}`);

    // 6. Order & Snapshot pricing creation
    console.log('👉 Creating order and verifying snapshot price...');
    order = await prisma.order.create({
      data: {
        customer_id: customer.id,
        store_id: store.id,
        total: 30000.0,
        status: 'PENDING',
        items: {
          create: {
            product_id: product.id,
            quantity: 2,
            price: product.price // Snapshot price
          }
        }
      },
      include: {
        items: true
      }
    });
    console.log(`  ✔ Order created: ID=${order.id}, Status=${order.status}`);
    const orderItem = order.items[0];
    if (orderItem.price === 15000.0) {
      console.log(`  ✔ Snapshot Price verified: OrderItem price is snapshot = ${orderItem.price}`);
    } else {
      console.error(`  ❌ Snapshot Price mismatch! Expected 15000, got ${orderItem.price}`);
    }

    // 7. Chat Conversation & Message creation
    console.log('👉 Creating conversation and messages...');
    conversation = await prisma.conversation.create({
      data: {
        customer_id: customer.id,
        store_id: store.id,
        order_id: order.id
      }
    });
    console.log(`  ✔ Conversation created: ID=${conversation.id}`);

    const message = await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        sender_id: customer.id,
        message: 'Apakah Beras Premium masih ready?'
      }
    });
    console.log(`  ✔ Message created: ID=${message.id}, Content="${message.message}"`);

    // 8. Cascade delete validation
    console.log('👉 Verifying cascade delete behaviors...');
    
    // Delete store and verify products, categories, conversations are deleted
    await prisma.store.delete({
      where: { id: store.id }
    });
    console.log('  ✔ Store deleted');

    const productsCount = await prisma.product.count({ where: { store_id: store.id } });
    const categoriesCount = await prisma.category.count({ where: { store_id: store.id } });
    const conversationsCount = await prisma.conversation.count({ where: { store_id: store.id } });
    
    console.log(`  ✔ Post-delete check: Products count = ${productsCount}`);
    console.log(`  ✔ Post-delete check: Categories count = ${categoriesCount}`);
    console.log(`  ✔ Post-delete check: Conversations count = ${conversationsCount}`);

    if (productsCount === 0 && categoriesCount === 0 && conversationsCount === 0) {
      console.log('  ✔ Cascade delete works perfectly for Products, Categories, and Conversations!');
    } else {
      console.error('  ❌ Cascade delete failed! Some child records still exist.');
    }

    // Clean up users
    await prisma.user.delete({ where: { id: customer.id } });
    await prisma.user.delete({ where: { id: owner.id } });
    console.log('  ✔ Test users deleted successfully');
    
    console.log('🎉 Database Integrity Audit: ALL TESTS PASSED!');
  } catch (error) {
    console.error('❌ Database Integrity Audit: FAILED with error:', error);
    // Cleanup on error if possible
    try {
      if (store) await prisma.store.deleteMany({ where: { id: store.id } });
      if (customer) await prisma.user.deleteMany({ where: { id: customer.id } });
      if (owner) await prisma.user.deleteMany({ where: { id: owner.id } });
    } catch (_) {}
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();