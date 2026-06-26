import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import multer from 'multer';
import prisma from '../config/db.js';
import { formatResponse } from '../utils/response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads/payments');

// Ensure payments directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration for payment proofs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `payment-${uniqueSuffix}${ext}`);
  }
});

// File type filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp/;
  const mimeType = allowedExtensions.test(file.mimetype);
  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extName) {
    return cb(null, true);
  }
  cb(new Error('Format file tidak didukung. Hanya mendukung JPG, JPEG, PNG, dan WEBP.'));
};

export const uploadPaymentProof = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

// GET /api/subscription/plans
export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { is_active: true },
      orderBy: { price: 'asc' }
    });
    return res.json(formatResponse(true, plans));
  } catch (error) {
    console.error('Get subscription plans error:', error);
    return res.status(500).json(formatResponse(false, 'Gagal mengambil daftar paket langganan.'));
  }
};

// GET /api/subscription/status (Owner)
export const getSubscriptionStatus = async (req, res) => {
  try {
    const ownerId = req.user.id;
    let sub = await prisma.subscription.findUnique({
      where: { owner_id: ownerId },
      include: { plan: true }
    });

    if (!sub) {
      return res.status(404).json(formatResponse(false, 'Data langganan tidak ditemukan.'));
    }

    const today = new Date();
    let status = sub.status;

    // Check expiration dynamically and sync with DB if expired (unless lifetime plan)
    if (status === 'ACTIVE' && sub.plan && sub.plan.duration_type === 'PERMANENT') {
      // Permanent subscription never expires
    } else if (status === 'TRIAL' && today > new Date(sub.trial_end_date)) {
      status = 'EXPIRED';
      sub = await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
        include: { plan: true }
      });
    } else if (status === 'ACTIVE' && sub.expired_date && today > new Date(sub.expired_date)) {
      status = 'EXPIRED';
      sub = await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
        include: { plan: true }
      });
    }

    // Calculate days remaining
    let daysRemaining = 0;
    if (status === 'TRIAL') {
      daysRemaining = Math.max(0, Math.ceil((new Date(sub.trial_end_date) - today) / (1000 * 60 * 60 * 24)));
    } else if (status === 'ACTIVE') {
      if (sub.plan && sub.plan.duration_type === 'PERMANENT') {
        daysRemaining = null; // null represents permanent/lifetime
      } else if (sub.expired_date) {
        daysRemaining = Math.max(0, Math.ceil((new Date(sub.expired_date) - today) / (1000 * 60 * 60 * 24)));
      }
    }

    const expiredDate = (status === 'ACTIVE' && sub.plan && sub.plan.duration_type === 'PERMANENT')
      ? null
      : (status === 'TRIAL' ? sub.trial_end_date : sub.expired_date);

    // Fetch history
    const historyList = await prisma.subscriptionHistory.findMany({
      where: { owner_id: ownerId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    });

    const hasPending = historyList.some(h => h.status === 'PENDING');

    const formattedHistory = historyList.map(h => ({
      id: h.id,
      paymentDate: h.payment_date,
      planName: h.plan.name,
      planPrice: h.price,
      status: h.status,
      durationDays: h.duration_days,
      expiredDateAfter: h.expired_date_after
    }));

    return res.json(formatResponse(true, {
      status,
      daysRemaining,
      expiredDate,
      plan: sub.plan ? {
        id: sub.plan.id,
        name: sub.plan.name,
        duration_type: sub.plan.duration_type,
        price: sub.plan.price
      } : null,
      hasPending,
      history: formattedHistory
    }));
  } catch (error) {
    console.error('Get subscription status error:', error);
    return res.status(500).json(formatResponse(false, 'Gagal mengambil status langganan.'));
  }
};

// POST /api/subscription/payment (Owner)
export const submitPayment = async (req, res) => {
  const upload = uploadPaymentProof.single('image');

  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json(formatResponse(false, 'Ukuran file melebihi batas maksimal 5MB.'));
      }
      return res.status(400).json(formatResponse(false, err.message));
    } else if (err) {
      return res.status(400).json(formatResponse(false, err.message));
    }

    if (!req.file) {
      return res.status(400).json(formatResponse(false, 'Bukti pembayaran wajib diunggah.'));
    }

    if (!req.body.plan_id) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json(formatResponse(false, 'Paket langganan wajib dipilih.'));
    }

    try {
      const ownerId = req.user.id;
      const planId = parseInt(req.body.plan_id, 10);

      if (isNaN(planId)) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json(formatResponse(false, 'ID Paket tidak valid.'));
      }

      // Verify plan exists
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId }
      });

      if (!plan) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json(formatResponse(false, 'Paket langganan tidak ditemukan di database.'));
      }

      // Check if already permanent
      const currentSub = await prisma.subscription.findUnique({
        where: { owner_id: ownerId },
        include: { plan: true }
      });

      if (currentSub && currentSub.status === 'ACTIVE' && currentSub.plan && currentSub.plan.duration_type === 'PERMANENT') {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json(formatResponse(false, 'Anda sudah menggunakan paket permanen.'));
      }

      const paymentProofPath = `/uploads/payments/${req.file.filename}`;

      // Create SubscriptionHistory record
      await prisma.subscriptionHistory.create({
        data: {
          owner_id: ownerId,
          plan_id: planId,
          status: 'PENDING',
          price: plan.price,
          payment_proof_image: paymentProofPath,
          payment_date: new Date(),
          duration_days: plan.duration_days
        }
      });

      // Check current active status to prevent premature blocking of POS
      const today = new Date();
      let isCurrentlyActive = false;

      if (currentSub) {
        if (currentSub.status === 'ACTIVE') {
          if (currentSub.plan && currentSub.plan.duration_type === 'PERMANENT') {
            isCurrentlyActive = true;
          } else if (currentSub.expired_date && today <= new Date(currentSub.expired_date)) {
            isCurrentlyActive = true;
          }
        } else if (currentSub.status === 'TRIAL') {
          if (today <= new Date(currentSub.trial_end_date)) {
            isCurrentlyActive = true;
          }
        }
      }

      const newStatus = isCurrentlyActive ? currentSub.status : 'PENDING';

      // Update Subscription Utama (keep status ACTIVE/TRIAL if active, else change to PENDING)
      const updatedSub = await prisma.subscription.update({
        where: { owner_id: ownerId },
        data: {
          status: newStatus,
          payment_proof_image: paymentProofPath,
          payment_date: new Date(),
          plan_id: planId
        },
        include: { plan: true }
      });

      return res.json(formatResponse(true, {
        message: 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin.',
        subscription: {
          id: updatedSub.id,
          status: updatedSub.status,
          paymentProofImage: updatedSub.payment_proof_image,
          paymentDate: updatedSub.payment_date,
          planName: plan.name,
          planPrice: plan.price
        }
      }));
    } catch (error) {
      console.error('Submit payment proof error:', error);
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(500).json(formatResponse(false, 'Gagal menyimpan bukti pembayaran ke database.'));
    }
  });
};

// GET /api/admin/subscriptions (Admin)
export const getAdminSubscriptions = async (req, res) => {
  try {
    const histories = await prisma.subscriptionHistory.findMany({
      include: {
        owner: {
          include: {
            stores: true,
            subscription: { include: { plan: true } }
          }
        },
        plan: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formatted = histories.map(history => {
      const sub = history.owner.subscription;
      return {
        id: history.id, // SubscriptionHistory ID
        ownerId: history.owner_id,
        ownerName: history.owner.name,
        ownerEmail: history.owner.email,
        storeName: history.owner.stores.map(s => s.name).join(', ') || 'Belum Membuat Toko',
        status: history.status, // PENDING, ACTIVE, EXPIRED (maps History status)
        paymentProofImage: history.payment_proof_image,
        paymentDate: history.payment_date,
        trialEndDate: sub ? sub.trial_end_date : null,
        expiredDate: history.expired_date_after || (sub ? sub.expired_date : null),
        planName: history.plan.name,
        planPrice: history.plan.price,
        planDurationType: history.plan.duration_type,
        createdAt: history.createdAt,
        updatedAt: history.updatedAt
      };
    });

    return res.json(formatResponse(true, formatted));
  } catch (error) {
    console.error('Get admin subscriptions error:', error);
    return res.status(500).json(formatResponse(false, 'Gagal mengambil data langganan admin.'));
  }
};

// PATCH /api/admin/subscription/:id/approve (Admin)
export const approveSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const historyId = parseInt(id, 10);

    if (isNaN(historyId)) {
      return res.status(400).json(formatResponse(false, 'ID pengajuan tidak valid.'));
    }

    const history = await prisma.subscriptionHistory.findUnique({
      where: { id: historyId },
      include: { plan: true }
    });

    if (!history) {
      return res.status(404).json(formatResponse(false, 'Data pengajuan pembayaran tidak ditemukan.'));
    }

    if (history.status !== 'PENDING') {
      return res.status(400).json(formatResponse(false, 'Pengajuan pembayaran ini sudah diproses.'));
    }

    const sub = await prisma.subscription.findUnique({
      where: { owner_id: history.owner_id }
    });

    if (!sub) {
      return res.status(404).json(formatResponse(false, 'Data langganan utama tidak ditemukan.'));
    }

    const today = new Date();
    let expiredDate = null;

    if (history.plan.duration_type === 'PERMANENT') {
      expiredDate = null;
    } else {
      // Accumulative expired date logic
      let baseDate = today;

      if (sub.status === 'ACTIVE' && sub.expired_date && today <= new Date(sub.expired_date)) {
        baseDate = new Date(sub.expired_date);
      } else if (sub.status === 'TRIAL' && today <= new Date(sub.trial_end_date)) {
        baseDate = new Date(sub.trial_end_date);
      }

      expiredDate = new Date(baseDate);
      expiredDate.setDate(expiredDate.getDate() + history.duration_days);
    }

    // Update SubscriptionHistory to ACTIVE
    await prisma.subscriptionHistory.update({
      where: { id: historyId },
      data: {
        status: 'ACTIVE',
        expired_date_after: expiredDate
      }
    });

    // Update Subscription Utama
    const updatedSub = await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'ACTIVE',
        expired_date: expiredDate,
        verified_by: req.user.id,
        plan_id: history.plan_id
      }
    });

    return res.json(formatResponse(true, {
      message: 'Langganan berhasil disetujui.',
      subscription: updatedSub
    }));
  } catch (error) {
    console.error('Approve subscription error:', error);
    return res.status(500).json(formatResponse(false, 'Gagal menyetujui langganan.'));
  }
};

// PATCH /api/admin/subscription/:id/reject (Admin)
export const rejectSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const historyId = parseInt(id, 10);

    if (isNaN(historyId)) {
      return res.status(400).json(formatResponse(false, 'ID pengajuan tidak valid.'));
    }

    const history = await prisma.subscriptionHistory.findUnique({
      where: { id: historyId }
    });

    if (!history) {
      return res.status(404).json(formatResponse(false, 'Data pengajuan pembayaran tidak ditemukan.'));
    }

    if (history.status !== 'PENDING') {
      return res.status(400).json(formatResponse(false, 'Pengajuan pembayaran ini sudah diproses.'));
    }

    // Update SubscriptionHistory to EXPIRED
    await prisma.subscriptionHistory.update({
      where: { id: historyId },
      data: {
        status: 'EXPIRED'
      }
    });

    const sub = await prisma.subscription.findUnique({
      where: { owner_id: history.owner_id }
    });

    let updatedSub = sub;
    if (sub && sub.status === 'PENDING') {
      // Revert status to EXPIRED if they were expired/pending, otherwise keep ACTIVE/TRIAL
      updatedSub = await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'EXPIRED'
        }
      });
    }

    return res.json(formatResponse(true, {
      message: 'Langganan berhasil ditolak.',
      subscription: updatedSub
    }));
  } catch (error) {
    console.error('Reject subscription error:', error);
    return res.status(500).json(formatResponse(false, 'Gagal menolak langganan.'));
  }
};
