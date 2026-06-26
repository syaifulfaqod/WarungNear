import prisma from '../config/db.js';
import { formatResponse } from '../utils/response.js';

/**
 * Fetch categories for the logged-in owner's store
 */
export const getCategories = async (req, res) => {
  try {
    const store = await prisma.store.findFirst({
      where: { owner_id: req.user.id }
    });

    if (!store) {
      return res.json(formatResponse(true, []));
    }

    const categories = await prisma.category.findMany({
      where: { store_id: store.id },
      orderBy: { name: 'asc' }
    });

    res.json(formatResponse(true, categories));
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json(formatResponse(false, 'Gagal memuat kategori.'));
  }
};

/**
 * Create a new dynamic category for the owner's store
 */
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json(formatResponse(false, 'Nama kategori wajib diisi.'));
    }

    const store = await prisma.store.findFirst({
      where: { owner_id: req.user.id }
    });

    if (!store) {
      return res.status(400).json(formatResponse(false, 'Buat toko terlebih dahulu sebelum menambahkan kategori.'));
    }

    // Check if category name already exists in this store
    const exists = await prisma.category.findUnique({
      where: {
        store_id_name: {
          store_id: store.id,
          name: name.trim()
        }
      }
    });

    if (exists) {
      return res.status(400).json(formatResponse(false, 'Nama kategori ini sudah terdaftar.'));
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        store_id: store.id
      }
    });

    res.status(201).json(formatResponse(true, category));
  } catch (error) {
    console.error('createCategory error:', error);
    res.status(500).json(formatResponse(false, 'Gagal membuat kategori.'));
  }
};

/**
 * Update a category name
 */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
      return res.status(400).json(formatResponse(false, 'ID kategori tidak valid.'));
    }

    if (!name || name.trim() === '') {
      return res.status(400).json(formatResponse(false, 'Nama kategori wajib diisi.'));
    }

    const store = await prisma.store.findFirst({
      where: { owner_id: req.user.id }
    });

    if (!store) {
      return res.status(403).json(formatResponse(false, 'Akses ditolak.'));
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category || category.store_id !== store.id) {
      return res.status(404).json(formatResponse(false, 'Kategori tidak ditemukan atau bukan milik toko Anda.'));
    }

    // Check unique constraint for the new name
    const nameExists = await prisma.category.findFirst({
      where: {
        store_id: store.id,
        name: name.trim(),
        NOT: { id: categoryId }
      }
    });

    if (nameExists) {
      return res.status(400).json(formatResponse(false, 'Nama kategori ini sudah digunakan.'));
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: { name: name.trim() }
    });

    // Optional: Synchronize string category on products that use this category
    await prisma.product.updateMany({
      where: { category_id: categoryId },
      data: { category: name.trim() }
    });

    res.json(formatResponse(true, updatedCategory));
  } catch (error) {
    console.error('updateCategory error:', error);
    res.status(500).json(formatResponse(false, 'Gagal memperbarui kategori.'));
  }
};

/**
 * Delete a category (with dependency protection)
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
      return res.status(400).json(formatResponse(false, 'ID kategori tidak valid.'));
    }

    const store = await prisma.store.findFirst({
      where: { owner_id: req.user.id }
    });

    if (!store) {
      return res.status(403).json(formatResponse(false, 'Akses ditolak.'));
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category || category.store_id !== store.id) {
      return res.status(404).json(formatResponse(false, 'Kategori tidak ditemukan atau bukan milik toko Anda.'));
    }

    // Category Delete Protection: check if any products are using it
    const productCount = await prisma.product.count({
      where: { category_id: categoryId }
    });

    if (productCount > 0) {
      return res.status(400).json(formatResponse(false, 'Kategori tidak dapat dihapus karena masih digunakan oleh produk. Harap pindahkan kategori produk tersebut terlebih dahulu.'));
    }

    await prisma.category.delete({
      where: { id: categoryId }
    });

    res.json(formatResponse(true, { id: categoryId }));
  } catch (error) {
    console.error('deleteCategory error:', error);
    res.status(500).json(formatResponse(false, 'Gagal menghapus kategori.'));
  }
};
