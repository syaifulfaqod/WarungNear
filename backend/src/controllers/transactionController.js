import prisma from '../config/db.js';
import { transactionCreateSchema } from '../utils/validators.js';
import { formatResponse } from '../utils/response.js';

export const createTransaction = async (req, res) => {
  try {
    const validatedData = transactionCreateSchema.parse(req.body);

    // Get the owner's store
    const store = await prisma.store.findFirst({
      where: { owner_id: req.user.id }
    });

    if (!store) {
      return res.status(400).json(formatResponse(false, "You must create a store first"));
    }

    // 1. Validate stock availability for every item
    for (const item of validatedData.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(404).json(formatResponse(false, `Product with ID ${item.productId} not found`));
      }

      if (product.stock < item.quantity) {
        return res.status(400).json(
          formatResponse(false, "Stock tidak cukup")
        );
      }

    }

    // 2. Use Prisma transaction for atomicity
    const transaction = await prisma.$transaction(async (tx) => {
      // Create the transaction record
      const trx = await tx.transaction.create({
        data: {
          total: validatedData.total,
          store_id: store.id
        }
      });

      // Create transaction details and reduce stock
      for (const item of validatedData.items) {
        // Create detail
        await tx.transactionDetail.create({
          data: {
            transaction_id: trx.id,
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price
          }
        });

        // Reduce product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity }
          }
        });
      }

      // Fetch the full transaction with details
      return tx.transaction.findUnique({
        where: { id: trx.id },
        include: {
          details: {
            include: {
              product: {
                select: { id: true, name: true }
              }
            }
          }
        }
      });
    });

    res.status(201).json(formatResponse(true, transaction));
  } catch (error) {
    console.error('createTransaction error:', error);
    res.status(400).json(formatResponse(false, error.errors || error.message));
  }
};

export const getTransactions = async (req, res) => {
  try {
    const store = await prisma.store.findFirst({
      where: { owner_id: req.user.id }
    });

    if (!store) {
      return res.json(formatResponse(true, []));
    }

    const transactions = await prisma.transaction.findMany({
      where: { store_id: store.id },
      include: {
        details: {
          include: {
            product: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(formatResponse(true, transactions));
  } catch (error) {
    console.error('getTransactions error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};
