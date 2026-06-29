import prisma from '../config/db.js';
import { formatResponse } from '../utils/response.js';
import { emitSuspendOwner } from '../socket/index.js';

/**
 * GET /api/admin/stats
 * Admin dashboard statistics
 */
export const getAdminStats = async (req, res) => {
  try {
    const totalOwners = await prisma.user.count({ where: { role: 'OWNER' } });
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalStores = await prisma.store.count({ where: { isActive: true } });
    const totalTransactions = await prisma.order.count();

    const completedOrders = await prisma.order.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { total: true }
    });
    const totalRevenue = completedOrders._sum.total || 0;

    const subscriptionRevenue = await prisma.subscriptionHistory.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { price: true }
    });
    const totalSubscriptionRevenue = subscriptionRevenue._sum.price || 0;

    res.json(formatResponse(true, {
      totalOwners,
      totalCustomers,
      totalStores,
      totalTransactions,
      totalRevenue,
      totalSubscriptionRevenue
    }));
  } catch (error) {
    console.error('getAdminStats error:', error);
    res.status(500).json(formatResponse(false, 'Server error'));
  }
};

/**
 * GET /api/admin/users
 * Retrieve all users
 */
export const getAdminUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        is_active: true,
        suspend_reason: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(formatResponse(true, users));
  } catch (error) {
    console.error('getAdminUsers error:', error);
    res.status(500).json(formatResponse(false, 'Server error'));
  }
};

/**
 * GET /api/admin/owners
 * Retrieve all owners with stores & subscription info
 */
export const getAdminOwners = async (req, res) => {
  try {
    const owners = await prisma.user.findMany({
      where: { role: 'OWNER' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        is_active: true,
        suspend_reason: true,
        createdAt: true,
        stores: {
          select: {
            id: true,
            name: true,
            isActive: true,
            phoneNumber: true
          }
        },
        subscription: {
          include: {
            plan: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(formatResponse(true, owners));
  } catch (error) {
    console.error('getAdminOwners error:', error);
    res.status(500).json(formatResponse(false, 'Server error'));
  }
};

/**
 * GET /api/admin/stores
 * Retrieve all stores
 */
export const getAdminStores = async (req, res) => {
  try {
    const stores = await prisma.store.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            subscription: {
              include: {
                plan: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(formatResponse(true, stores));
  } catch (error) {
    console.error('getAdminStores error:', error);
    res.status(500).json(formatResponse(false, 'Server error'));
  }
};

/**
 * PUT /api/admin/stores/:id/toggle
 * Toggle store active state
 */
export const toggleStoreStatus = async (req, res) => {
  try {
    const storeId = parseInt(req.params.id);
    if (isNaN(storeId)) {
      return res.status(400).json(formatResponse(false, 'Invalid Store ID'));
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      return res.status(404).json(formatResponse(false, 'Store not found'));
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: { isActive: !store.isActive }
    });

    res.json(formatResponse(true, updatedStore));
  } catch (error) {
    console.error('toggleStoreStatus error:', error);
    res.status(500).json(formatResponse(false, 'Server error'));
  }
};

/**
 * PUT /api/admin/users/:id/suspend
 * Suspend an Owner account
 */
export const suspendUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { reason } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json(formatResponse(false, 'Invalid User ID'));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json(formatResponse(false, 'User not found'));
    }

    const suspendReason = reason || 'Akun Anda telah dinonaktifkan oleh Admin WarungNear. Silakan hubungi admin untuk informasi lebih lanjut.';

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'SUSPENDED',
        is_active: false,
        suspend_reason: suspendReason
      }
    });

    // Emit realtime notification to user
    emitSuspendOwner(userId, suspendReason, 'SUSPENDED');

    res.json(formatResponse(true, {
      id: updatedUser.id,
      name: updatedUser.name,
      status: updatedUser.status,
      is_active: updatedUser.is_active,
      suspend_reason: updatedUser.suspend_reason
    }));
  } catch (error) {
    console.error('suspendUser error:', error);
    res.status(500).json(formatResponse(false, 'Server error'));
  }
};

/**
 * PUT /api/admin/users/:id/unsuspend
 * Activate a suspended user account
 */
export const unsuspendUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json(formatResponse(false, 'Invalid User ID'));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json(formatResponse(false, 'User not found'));
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        is_active: true,
        suspend_reason: null
      }
    });

    // Emit realtime notification to user
    emitSuspendOwner(userId, 'Akun Anda telah diaktifkan kembali.', 'ACTIVE');

    res.json(formatResponse(true, {
      id: updatedUser.id,
      name: updatedUser.name,
      status: updatedUser.status,
      is_active: updatedUser.is_active,
      suspend_reason: updatedUser.suspend_reason
    }));
  } catch (error) {
    console.error('unsuspendUser error:', error);
    res.status(500).json(formatResponse(false, 'Server error'));
  }
};

/**
 * GET /api/admin/reports
 * Generate Reports from live data
 */
export const getAdminReports = async (req, res) => {
  try {
    const totalTransactions = await prisma.order.count();
    const totalStores = await prisma.store.count();
    const activeOwners = await prisma.user.count({ where: { role: 'OWNER', status: 'ACTIVE' } });
    const suspendedOwners = await prisma.user.count({ where: { role: 'OWNER', status: 'SUSPENDED' } });

    const subscriptionRevenue = await prisma.subscriptionHistory.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { price: true }
    });
    const totalSubscriptionRevenue = subscriptionRevenue._sum.price || 0;

    const completedOrders = await prisma.order.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { total: true }
    });
    const totalCompletedRevenue = completedOrders._sum.total || 0;

    // Fetch last 10 completed orders
    const recentOrders = await prisma.order.findMany({
      where: { status: 'COMPLETED' },
      take: 10,
      include: {
        customer: { select: { name: true, email: true } },
        store: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(formatResponse(true, {
      totalTransactions,
      totalStores,
      activeOwners,
      suspendedOwners,
      totalSubscriptionRevenue,
      totalCompletedRevenue,
      recentOrders
    }));
  } catch (error) {
    console.error('getAdminReports error:', error);
    res.status(500).json(formatResponse(false, 'Server error'));
  }
};
