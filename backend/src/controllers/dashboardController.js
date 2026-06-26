import prisma from '../config/db.js';
import { formatResponse } from '../utils/response.js';

export const getSalesAnalytics = async (req, res) => {
  try {
    const ownerId = req.user.id;
    
    // 1. Get owner's store
    const store = await prisma.store.findFirst({
      where: { owner_id: ownerId }
    });
    
    if (!store) {
      return res.status(404).json(formatResponse(false, "Store not found for this owner."));
    }
    
    // 2. Parse date range based on period query or custom dates
    let { period, startDate, endDate } = req.query;
    let start = new Date();
    let end = new Date();
    
    // Reset times for boundaries
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    if (startDate && endDate) {
      // Custom range: parse from query params
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'today' || period === 'Hari Ini') {
      // Today (already start/end of today)
    } else if (period === 'weekly' || period === 'Mingguan') {
      // Last 7 days
      start.setDate(start.getDate() - 6);
    } else if (period === 'monthly' || period === 'Bulanan') {
      // Last 30 days
      start.setDate(start.getDate() - 29);
    } else {
      // Default: Last 30 days
      start.setDate(start.getDate() - 29);
    }
    
    // 3. Fetch completed orders in the range
    const orders = await prisma.order.findMany({
      where: {
        store_id: store.id,
        status: 'COMPLETED',
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Fetch POS transactions in the range
    const transactions = await prisma.transaction.findMany({
      where: {
        store_id: store.id,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        details: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    // 4. Calculate total revenue, order count, and products sold
    const totalOrders = orders.length + transactions.length;
    let totalRevenue = 0;
    let totalProductsSold = 0;
    
    // Chart aggregation: group by date (YYYY-MM-DD)
    const dailyMap = {};
    
    // Pre-populate chart dates in the range to show days with zero revenue
    const tempDate = new Date(start);
    while (tempDate <= end) {
      const dateStr = tempDate.toISOString().split('T')[0];
      dailyMap[dateStr] = 0;
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    // Aggregate completed orders
    orders.forEach(order => {
      totalRevenue += order.total;
      
      order.items.forEach(item => {
        totalProductsSold += item.quantity;
      });
      
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (dailyMap[dateStr] !== undefined) {
        dailyMap[dateStr] += order.total;
      } else {
        dailyMap[dateStr] = order.total;
      }
    });

    // Aggregate POS transactions
    transactions.forEach(tx => {
      totalRevenue += tx.total;
      
      tx.details.forEach(detail => {
        totalProductsSold += detail.quantity;
      });
      
      const dateStr = tx.createdAt.toISOString().split('T')[0];
      if (dailyMap[dateStr] !== undefined) {
        dailyMap[dateStr] += tx.total;
      } else {
        dailyMap[dateStr] = tx.total;
      }
    });
    
    const chartData = Object.keys(dailyMap).sort().map(date => ({
      date,
      revenue: dailyMap[date]
    }));
    
    res.json(formatResponse(true, {
      totalRevenue,
      totalOrders,
      totalProductsSold,
      chartData
    }));
  } catch (error) {
    console.error('getSalesAnalytics error:', error);
    res.status(500).json(formatResponse(false, "Server error"));
  }
};
