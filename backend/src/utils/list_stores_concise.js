import prisma from '../config/db.js';

async function run() {
  try {
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        owner_id: true,
        owner: {
          select: { name: true, email: true }
        },
        _count: {
          select: { products: true }
        }
      }
    });
    console.log('Stores in database:', stores);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
