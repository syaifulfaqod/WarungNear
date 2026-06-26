import prisma from '../config/db.js';

async function run() {
  try {
    const stores = await prisma.store.findMany({
      include: {
        products: true,
        owner: true
      }
    });
    console.log('Stores in database:', JSON.stringify(stores, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
