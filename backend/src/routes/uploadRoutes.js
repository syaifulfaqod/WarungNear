import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { formatResponse } from '../utils/response.js';
import { storageService } from '../services/storageService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads/products');

// Multer Local Disk Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a secure, unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

// File type validation
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp/;
  const mimeType = allowedExtensions.test(file.mimetype);
  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extName) {
    return cb(null, true);
  }
  cb(new Error('Format file tidak didukung. Hanya mendukung JPG, JPEG, PNG, dan WEBP.'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter
});

const router = express.Router();

// Secure routes
router.use(authMiddleware);
router.use(roleMiddleware('OWNER', 'ADMIN'));

router.post('/product-image', (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json(formatResponse(false, 'Ukuran file melebihi batas maksimal 5MB.'));
      }
      return res.status(400).json(formatResponse(false, err.message));
    } else if (err) {
      return res.status(400).json(formatResponse(false, err.message));
    }

    if (!req.file) {
      return res.status(400).json(formatResponse(false, 'File gambar wajib diunggah.'));
    }

    try {
      // Process using storage service abstraction
      const result = await storageService.uploadProductImage(req.file);
      res.json(formatResponse(true, { imageUrl: result.imageUrl }));
    } catch (uploadError) {
      console.error('Upload route error:', uploadError);
      res.status(500).json(formatResponse(false, 'Gagal memproses gambar.'));
    }
  });
});

export default router;
