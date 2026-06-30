import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { formatResponse } from '../utils/response.js';
import { uploadStoreImage, deleteStoreImage, setPrimaryStoreImage } from '../controllers/storeImageController.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUploadDir = process.env.UPLOAD_DIR 
  ? path.resolve(process.env.UPLOAD_DIR) 
  : path.join(__dirname, '../../uploads');

const uploadDir = path.join(baseUploadDir, 'stores');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage config specifically for store images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `store-${uniqueSuffix}${ext}`);
  }
});

// File validation
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

// Require OWNER role for all store image management actions
router.use(authMiddleware);
router.use(roleMiddleware('OWNER', 'ADMIN'));

router.post('/', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json(formatResponse(false, 'Ukuran file melebihi batas maksimal 5MB.'));
      }
      return res.status(400).json(formatResponse(false, err.message));
    } else if (err) {
      return res.status(400).json(formatResponse(false, err.message));
    }
    next();
  });
}, uploadStoreImage);

router.delete('/:id', deleteStoreImage);
router.patch('/:id/primary', setPrimaryStoreImage);

export default router;
