import prisma from '../config/db.js';
import { orderCreateSchema } from '../utils/validators.js';
import { formatResponse } from '../utils/response.js';
import { emitStockUpdate, emitNewOrder, emitOrderUpdate, emitOrderCancelled } from '../socket/index.js';

/**
 * Create a new customer order
 * Transaction Safety Flow:
 * BEGIN transaction -> Check stock -> Reduce stock -> Create order -> Create order item -> COMMIT -> Emit socket event
 */
export const createOrder = async (req, res) => {
  try {
    const validatedData = orderCreateSchema.parse(req.body);
    const { store_id, items } = validatedData;

    // Check if store exists
    const store = await prisma.store.findUnique({
      where: { id: store_id },
      include: { 
        owner: {
          include: {
            subscription: true
          }
        }
      }
    });

    if (!store) {
      return res.status(404).json(formatResponse(false, "Store not found"));
    }

    // Verify if store owner is active/not suspended
    if (store.owner.status === 'SUSPENDED' || !store.owner.is_active) {
      return res.status(400).json(formatResponse(false, "Toko tidak dapat menerima pesanan karena akun pemilik dinonaktifkan oleh Admin."));
    }

    // Verify store owner subscription status
    const now = new Date();
    const sub = store.owner.subscription;
    const isSubActive = sub && (
      sub.status === 'ACTIVE' ||
      (sub.status === 'TRIAL' && new Date(sub.trial_end_date) >= now)
    );

    if (!isSubActive) {
      return res.status(400).json(formatResponse(false, "Toko tidak dapat menerima pesanan baru karena masa langganan aktif telah berakhir."));
    }

    // Verify if store is currently active/open
    if (!store.isActive) {
      return res.status(400).json(formatResponse(false, "Toko sedang tidak aktif dan tidak menerima pesanan."));
    }

    // Determine isOpen based on current time (Asia/Jakarta timezone & midnight safe)
    let isOpen = true;
    try {
      const openTime = store.open_time || "07:00";
      const closeTime = store.close_time || "22:00";
      
      const now = new Date();
      const jakartaFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const currentTimeStr = jakartaFormatter.format(now).replace('.', ':');
      
      const [currH, currM] = currentTimeStr.split(':').map(Number);
      const [openH, openM] = openTime.split(':').map(Number);
      const [closeH, closeM] = closeTime.split(':').map(Number);
      
      const currentVal = currH * 60 + currM;
      const openVal = openH * 60 + openM;
      const closeVal = closeH * 60 + closeM;
      
      if (openVal < closeVal) {
        isOpen = currentVal >= openVal && currentVal <= closeVal;
      } else if (openVal > closeVal) {
        isOpen = currentVal >= openVal || currentVal <= closeVal;
      } else {
        isOpen = true; // open 24 hours
      }
    } catch (e) {
      console.error("Order time verification failed, fallback to open:", e);
      isOpen = true;
    }

    if (!isOpen) {
      return res.status(400).json(formatResponse(false, "Toko sedang tutup dan tidak dapat menerima pesanan."));
    }

    // Run transaction
    const { order, updatedProducts } = await prisma.$transaction(async (tx) => {
      let total = 0;
      const itemsData = [];
      const updatedProducts = [];

      for (const item of items) {
        // Fetch product inside transaction
        const product = await tx.product.findUnique({
          where: { id: item.product_id }
        });

        if (!product) {
          throw new Error(`Product dengan ID ${item.product_id} tidak ditemukan`);
        }

        if (product.store_id !== store_id) {
          throw new Error(`Product ${product.name} tidak terdaftar di toko ini`);
        }

        if (product.stock < item.quantity) {
          throw new Error("Stock tidak cukup");
        }

        // Reduce stock in DB
        const updatedProduct = await tx.product.update({
          where: { id: item.product_id },
          data: {
            stock: { decrement: item.quantity }
          }
        });

        updatedProducts.push(updatedProduct);

        const itemTotal = product.price * item.quantity;
        total += itemTotal;

        // Snapshot price at checkout
        itemsData.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price: product.price // Product.price -> OrderItem.price
        });
      }

      // Create Order and OrderItems
      const createdOrder = await tx.order.create({
        data: {
          customer_id: req.user.id,
          store_id: store_id,
          total: total,
          status: 'PENDING',
          items: {
            create: itemsData.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, image: true }
              }
            }
          },
          store: {
            select: { id: true, name: true, address: true, latitude: true, longitude: true }
          },
          customer: {
            select: { id: true, name: true }
          }
        }
      });

      return { order: createdOrder, updatedProducts };
    });

    // EMIT SOCKET EVENTS ONLY AFTER TRANSACTION SUCCEEDED/COMMITTED
    // Emit stock updates for each updated product
    for (const product of updatedProducts) {
      emitStockUpdate(product.id, product.stock);
    }

    // Emit new order to store owner room
    emitNewOrder(store_id, order);

    res.status(201).json(formatResponse(true, order));
  } catch (error) {
    console.error('createOrder error:', error);
    // Return standard error response
    const status = error.message === 'Stock tidak cukup' ? 400 : (error.message.includes('tidak ditemukan') || error.message.includes('tidak terdaftar') ? 404 : 400);
    res.status(status).json(formatResponse(false, error.errors || error.message));
  }
};

/**
 * Get orders for CUSTOMER (their own orders) or OWNER (orders received by their store)
 */
export const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'CUSTOMER') {
      // Mark all unseen customer orders as seen
      await prisma.order.updateMany({
        where: {
          customer_id: userId,
          customer_is_seen: false
        },
        data: {
          customer_is_seen: true
        }
      });

      const orders = await prisma.order.findMany({
        where: { customer_id: userId },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, image: true }
              }
            }
          },
          store: {
            select: { id: true, name: true, address: true, latitude: true, longitude: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      console.log("Orders Query Result (CUSTOMER):", JSON.stringify(orders, null, 2));
      return res.json(formatResponse(true, orders));
    } else if (userRole === 'OWNER') {
      // Find all stores owned by owner
      const stores = await prisma.store.findMany({
        where: { owner_id: userId },
        select: { id: true }
      });

      if (stores.length === 0) {
        return res.json(formatResponse(true, []));
      }

      const storeIds = stores.map(s => s.id);

      // Mark all unseen orders of these stores as seen
      await prisma.order.updateMany({
        where: {
          store_id: { in: storeIds },
          is_seen: false
        },
        data: {
          is_seen: true
        }
      });

      const orders = await prisma.order.findMany({
        where: {
          store_id: { in: storeIds }
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, image: true }
              }
            }
          },
          customer: {
            select: { id: true, name: true, email: true }
          },
          store: {
            select: { id: true, name: true, address: true, latitude: true, longitude: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      console.log("Orders Query Result (OWNER):", JSON.stringify(orders, null, 2));
      return res.json(formatResponse(true, orders));
    } else {
      return res.status(403).json(formatResponse(false, "Forbidden"));
    }
  } catch (error) {
    console.error('getOrders error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};

/**
 * Update order status with sequential validation:
 * PENDING -> CONFIRMED -> READY -> COMPLETED
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['PENDING', 'CONFIRMED', 'READY', 'COMPLETED'].includes(status)) {
      return res.status(400).json(formatResponse(false, "Invalid status"));
    }

    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return res.status(400).json(formatResponse(false, "Invalid order ID"));
    }

    // Fetch order first to verify ownership and check transition status
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: {
          select: { owner_id: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json(formatResponse(false, "Order not found"));
    }

    // Verify owner of the store is updating the order status
    if (order.store.owner_id !== userId) {
      return res.status(403).json(formatResponse(false, "You are not authorized to manage this store's orders"));
    }

    // Validate sequential progression
    const validTransitions = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'READY',
      READY: 'COMPLETED'
    };

    if (validTransitions[order.status] !== status) {
      return res.status(400).json(formatResponse(false, `Invalid status transition: cannot change status from ${order.status} to ${status}`));
    }

    // Update status in DB
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
        customer_is_seen: false
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, image: true }
            }
          }
        },
        store: {
          select: { id: true, name: true, address: true, latitude: true, longitude: true }
        },
        customer: {
          select: { id: true, name: true }
        }
      }
    });

    // Emit event to customer user room
    emitOrderUpdate(order.customer_id, updatedOrder);

    // If order becomes READY, send automated system message in chat
    if (status === 'READY') {
      try {
        const systemMessageKey = `[READY_NOTIFICATION_ORDER_${updatedOrder.id}]`;
        const existingSystemMsg = await prisma.message.findFirst({
          where: {
            message: {
              contains: systemMessageKey
            }
          }
        });

        if (!existingSystemMsg) {
          // Find or create conversation
          let conversation = await prisma.conversation.findUnique({
            where: {
              customer_id_store_id: {
                customer_id: updatedOrder.customer_id,
                store_id: updatedOrder.store_id
              }
            }
          });

          if (!conversation) {
            conversation = await prisma.conversation.create({
              data: {
                customer_id: updatedOrder.customer_id,
                store_id: updatedOrder.store_id,
                order_id: updatedOrder.id
              }
            });
          }

          // Build item list detail
          const itemDetails = updatedOrder.items.map(item => `- ${item.product.name} x${item.quantity}`).join('\n');

          // Build message text (prefixed with systemMessageKey for uniqueness check)
          const messageText = `${systemMessageKey}Halo ${updatedOrder.customer.name}, pesanan #ORD-${updatedOrder.id} dari ${updatedOrder.store.name} sudah siap diambil.\n\nDetail:\n${itemDetails}\n\nSilakan datang ke toko untuk mengambil pesanan Anda.\nTerima kasih.`;

          // Create message
          const systemMsg = await prisma.message.create({
            data: {
              conversation_id: conversation.id,
              sender_id: userId,
              message: messageText,
              is_system: true,
              latitude: updatedOrder.store.latitude,
              longitude: updatedOrder.store.longitude,
              is_read: false,
              customer_is_read: false
            }
          });

          // Update conversation timestamp
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
          });

          // Import and emit chat:message
          const { emitChatMessage } = await import('../socket/index.js');
          emitChatMessage(updatedOrder.store_id, updatedOrder.customer_id, systemMsg);
        }
      } catch (chatErr) {
        console.error('Failed to send auto-ready message:', chatErr);
      }
    }

    res.json(formatResponse(true, updatedOrder));
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};

export const getStoreHistory = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const store = await prisma.store.findFirst({
      where: { owner_id: ownerId }
    });
    
    if (!store) {
      return res.status(404).json(formatResponse(false, "Store not found for this owner."));
    }
    
    // Fetch Online Orders
    const orders = await prisma.order.findMany({
      where: { store_id: store.id },
      include: {
        customer: {
          select: { id: true, name: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Fetch POS Transactions (Offline)
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
      orderBy: { createdAt: 'desc' }
    });

    const formattedOrders = orders.map(order => ({
      id: order.id,
      createdAt: order.createdAt,
      type: 'ONLINE ORDER',
      customer: {
        name: order.customer?.name || 'Tamu'
      },
      items: (order.items || []).map(item => ({
        id: item.id,
        product: item.product?.name || 'Produk',
        quantity: item.quantity,
        price: item.price
      })),
      total: order.total,
      status: order.status
    }));

    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      createdAt: tx.createdAt,
      type: 'POS OFFLINE',
      customer: {
        name: 'POS Offline'
      },
      items: (tx.details || []).map(detail => ({
        id: detail.id,
        product: detail.product?.name || 'Produk',
        quantity: detail.quantity,
        price: detail.price
      })),
      total: tx.total,
      status: 'COMPLETED'
    }));

    const combinedHistory = [...formattedOrders, ...formattedTransactions].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    res.json(formatResponse(true, combinedHistory));
  } catch (error) {
    console.error('getStoreHistory error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'OWNER') {
      return res.status(403).json(formatResponse(false, "Forbidden: Only owners can check unread counts"));
    }

    const stores = await prisma.store.findMany({
      where: { owner_id: userId },
      select: { id: true }
    });

    const storeIds = stores.map(s => s.id);

    if (storeIds.length === 0) {
      return res.json(formatResponse(true, { count: 0, unreadOrders: [] }));
    }

    // Count unseen orders (PENDING status)
    const count = await prisma.order.count({
      where: {
        store_id: { in: storeIds },
        is_seen: false,
        status: 'PENDING'
      }
    });

    // Get list of unseen orders for the header dropdown
    const unreadOrders = await prisma.order.findMany({
      where: {
        store_id: { in: storeIds },
        is_seen: false,
        status: 'PENDING'
      },
      select: {
        id: true,
        total: true,
        createdAt: true,
        customer: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(formatResponse(true, { count, unreadOrders }));
  } catch (error) {
    console.error('getUnreadCount error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};

/**
 * Cancel an order by CUSTOMER
 */
export const cancelOrderByCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return res.status(400).json(formatResponse(false, "Invalid order ID"));
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });

    if (!order) {
      return res.status(404).json(formatResponse(false, "Order tidak ditemukan"));
    }

    if (order.customer_id !== userId) {
      return res.status(403).json(formatResponse(false, "Anda tidak memiliki akses untuk membatalkan pesanan ini"));
    }

    // WAITING_CONFIRMATION or PENDING or anything similar
    if (!['PENDING', 'WAITING_CONFIRMATION'].includes(order.status)) {
      return res.status(400).json(formatResponse(false, "Pesanan tidak dapat dibatalkan karena sudah diproses atau selesai"));
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Restore stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.product_id },
          data: {
            stock: { increment: item.quantity }
          }
        });
      }

      // Update status
      return await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, image: true } }
            }
          },
          store: {
            select: { id: true, name: true, owner_id: true }
          },
          customer: {
            select: { id: true, name: true }
          }
        }
      });
    });

    // Emit stock updates for each item
    const refreshedItems = await prisma.orderItem.findMany({
      where: { order_id: orderId },
      include: {
        product: { select: { id: true, stock: true } }
      }
    });
    for (const item of refreshedItems) {
      emitStockUpdate(item.product_id, item.product.stock);
    }

    emitOrderCancelled(updatedOrder.store_id, updatedOrder.customer_id, updatedOrder, 'CUSTOMER');

    return res.json(formatResponse(true, updatedOrder));
  } catch (error) {
    console.error('cancelOrderByCustomer error:', error);
    return res.status(500).json(formatResponse(false, "Server error"));
  }
};

/**
 * Cancel an order by OWNER
 */
export const cancelOrderByOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return res.status(400).json(formatResponse(false, "Invalid order ID"));
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        store: {
          select: { owner_id: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json(formatResponse(false, "Order tidak ditemukan"));
    }

    if (order.store.owner_id !== userId) {
      return res.status(403).json(formatResponse(false, "Anda tidak berwenang untuk membatalkan pesanan di toko ini"));
    }

    if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
      return res.status(400).json(formatResponse(false, "Pesanan sudah selesai atau sudah dibatalkan sebelumnya"));
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Restore stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.product_id },
          data: {
            stock: { increment: item.quantity }
          }
        });
      }

      // Update status
      return await tx.order.update({
        where: { id: orderId },
        data: { 
          status: 'CANCELLED',
          customer_is_seen: false
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, image: true } }
            }
          },
          store: {
            select: { id: true, name: true, owner_id: true }
          },
          customer: {
            select: { id: true, name: true }
          }
        }
      });
    });

    // Emit stock updates for each item
    const refreshedItems = await prisma.orderItem.findMany({
      where: { order_id: orderId },
      include: {
        product: { select: { id: true, stock: true } }
      }
    });
    for (const item of refreshedItems) {
      emitStockUpdate(item.product_id, item.product.stock);
    }

    emitOrderCancelled(updatedOrder.store_id, updatedOrder.customer_id, updatedOrder, 'OWNER');

    return res.json(formatResponse(true, updatedOrder));
  } catch (error) {
    console.error('cancelOrderByOwner error:', error);
    return res.status(500).json(formatResponse(false, "Server error"));
  }
};

export const getCustomerUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'CUSTOMER') {
      return res.status(403).json(formatResponse(false, "Forbidden: Only customers can check unread counts"));
    }

    const count = await prisma.order.count({
      where: {
        customer_id: userId,
        customer_is_seen: false
      }
    });

    res.json(formatResponse(true, { unreadOrderCount: count }));
  } catch (error) {
    console.error('getCustomerUnreadCount order error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};
