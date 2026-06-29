import fs from 'fs';
import prisma from '../config/db.js';
import { formatResponse } from '../utils/response.js';
import { storageService } from '../services/storageService.js';

export const uploadStoreImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json(formatResponse(false, 'File gambar wajib diunggah.'));
  }

  try {
    // Ownership check: does the owner have a store?
    const store = await prisma.store.findFirst({
      where: { owner_id: req.user.id }
    });

    if (!store) {
      // Remove local file
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Failed to clean up file after store check:', e);
      }
      return res.status(400).json(formatResponse(false, 'Buat toko terlebih dahulu sebelum mengunggah foto.'));
    }

    // Limit check: max 3 images
    const count = await prisma.storeImage.count({
      where: { store_id: store.id }
    });

    if (count >= 3) {
      // Remove local file
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Failed to clean up file after limit check:', e);
      }
      return res.status(400).json(formatResponse(false, 'Maksimal upload 3 foto toko.'));
    }

    // Save image path
    const result = await storageService.uploadStoreImage(req.file);
    const isPrimary = count === 0; // If first image, set as primary by default

    const newImage = await prisma.storeImage.create({
      data: {
        store_id: store.id,
        image_url: result.imageUrl,
        is_primary: isPrimary
      }
    });

    res.json(formatResponse(true, newImage));
  } catch (error) {
    console.error('uploadStoreImage error:', error);
    // Cleanup file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    res.status(500).json(formatResponse(false, 'Server error saat mengunggah foto toko.'));
  }
};

export const deleteStoreImage = async (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    const image = await prisma.storeImage.findUnique({
      where: { id: imageId },
      include: { store: true }
    });

    if (!image) {
      return res.status(404).json(formatResponse(false, 'Foto tidak ditemukan.'));
    }

    // Authorization validation: only owner of the store
    if (image.store.owner_id !== req.user.id) {
      return res.status(403).json(formatResponse(false, 'Anda tidak memiliki akses untuk menghapus foto ini.'));
    }

    // Delete file from disk
    await storageService.deleteStoreImage(image.image_url);

    // Delete record from database
    await prisma.storeImage.delete({
      where: { id: imageId }
    });

    // If deleted image was primary, make another image primary if available
    if (image.is_primary) {
      const nextImage = await prisma.storeImage.findFirst({
        where: { store_id: image.store_id }
      });
      if (nextImage) {
        await prisma.storeImage.update({
          where: { id: nextImage.id },
          data: { is_primary: true }
        });
      }
    }

    res.json(formatResponse(true, 'Foto berhasil dihapus.'));
  } catch (error) {
    console.error('deleteStoreImage error:', error);
    res.status(500).json(formatResponse(false, 'Server error saat menghapus foto toko.'));
  }
};

export const setPrimaryStoreImage = async (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    const image = await prisma.storeImage.findUnique({
      where: { id: imageId },
      include: { store: true }
    });

    if (!image) {
      return res.status(404).json(formatResponse(false, 'Foto tidak ditemukan.'));
    }

    // Authorization validation: only owner of the store
    if (image.store.owner_id !== req.user.id) {
      return res.status(403).json(formatResponse(false, 'Anda tidak memiliki akses untuk mengubah foto utama ini.'));
    }

    // Transaction to update all other images of this store to non-primary and set this one as primary
    await prisma.$transaction([
      prisma.storeImage.updateMany({
        where: { store_id: image.store_id },
        data: { is_primary: false }
      }),
      prisma.storeImage.update({
        where: { id: imageId },
        data: { is_primary: true }
      })
    ]);

    res.json(formatResponse(true, 'Foto utama berhasil diubah.'));
  } catch (error) {
    console.error('setPrimaryStoreImage error:', error);
    res.status(500).json(formatResponse(false, 'Server error saat mengubah foto utama.'));
  }
};
