import prisma from '../config/db.js';
import { formatResponse } from '../utils/response.js';

export const checkSubscription = async (req, res, next) => {
  try {
    // Only enforce subscription checks on OWNER role
    if (!req.user || req.user.role !== 'OWNER') {
      return next();
    }

    const sub = await prisma.subscription.findUnique({
      where: { owner_id: req.user.id },
      include: { plan: true }
    });

    if (!sub) {
      return res.status(403).json(formatResponse(false, "Anda belum memiliki data langganan. Silakan hubungi admin."));
    }

    const today = new Date();

    if (sub.status === 'TRIAL') {
      if (today <= new Date(sub.trial_end_date)) {
        return next();
      } else {
        // Automatically mark as EXPIRED
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED' }
        });
        return res.status(403).json(formatResponse(false, "Masa percobaan gratis (Free Trial) Anda telah berakhir. Silakan lakukan pembayaran."));
      }
    }

    if (sub.status === 'ACTIVE') {
      // Lifetime/Permanent plan bypass
      if (sub.plan && sub.plan.duration_type === 'PERMANENT') {
        return next();
      }
      
      if (sub.expired_date && today <= new Date(sub.expired_date)) {
        return next();
      } else {
        // Automatically mark as EXPIRED
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED' }
        });
        return res.status(403).json(formatResponse(false, "Masa langganan Anda telah berakhir. Silakan lakukan pembayaran untuk mengaktifkan kembali."));
      }
    }

    if (sub.status === 'PENDING') {
      return res.status(403).json(formatResponse(false, "Pembayaran Anda sedang dalam proses verifikasi oleh Admin. Mohon tunggu."));
    }

    if (sub.status === 'EXPIRED') {
      return res.status(403).json(formatResponse(false, "Langganan Anda tidak aktif/habis. Silakan lakukan pembayaran."));
    }

    return res.status(403).json(formatResponse(false, "Status langganan tidak valid."));
  } catch (error) {
    console.error('Subscription Middleware Error:', error);
    return res.status(500).json(formatResponse(false, "Terjadi kesalahan pada verifikasi langganan"));
  }
};
