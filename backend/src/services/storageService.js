import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads/products');
const uploadStoresDir = path.join(__dirname, '../../uploads/stores');

// Ensure upload directories exist on startup
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(uploadStoresDir)) {
  fs.mkdirSync(uploadStoresDir, { recursive: true });
}

export const storageService = {
  /**
   * Process and save an uploaded file.
   * In a future cloud integration (e.g., Cloudinary, S3, Supabase),
   * this would accept a buffer or stream, send it to the cloud, and return the cloud URL.
   * @param {Object} file - The file object from multer
   * @returns {Promise<Object>} - Object containing success and the imageUrl
   */
  uploadProductImage: async (file) => {
    if (!file) {
      throw new Error("No file provided");
    }
    
    // For local storage, the file is already written by multer.
    // We construct the URL path served by Express.
    const imageUrl = `/uploads/products/${file.filename}`;
    return { success: true, imageUrl };
  },

  /**
   * Delete an image from storage.
   * In a future cloud integration, this would call the cloud SDK to remove the file by key/public_id.
   * @param {string} imageUrl - The URL of the image to delete
   * @returns {Promise<Object>} - Success status
   */
  deleteProductImage: async (imageUrl) => {
    try {
      if (!imageUrl || !imageUrl.startsWith('/uploads/products/')) {
        return { success: false, message: 'Not a local product image path' };
      }
      
      const filename = path.basename(imageUrl);
      const filePath = path.join(uploadDir, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true, message: 'Image deleted from disk' };
      }
      return { success: false, message: 'Image file does not exist on disk' };
    } catch (error) {
      console.error('Error deleting image from disk:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Process and save an uploaded store file.
   */
  uploadStoreImage: async (file) => {
    if (!file) {
      throw new Error("No file provided");
    }
    const imageUrl = `/uploads/stores/${file.filename}`;
    return { success: true, imageUrl };
  },

  /**
   * Delete a store image from storage.
   */
  deleteStoreImage: async (imageUrl) => {
    try {
      if (!imageUrl || !imageUrl.startsWith('/uploads/stores/')) {
        return { success: false, message: 'Not a local store image path' };
      }
      
      const filename = path.basename(imageUrl);
      const filePath = path.join(uploadStoresDir, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true, message: 'Image deleted from disk' };
      }
      return { success: false, message: 'Image file does not exist on disk' };
    } catch (error) {
      console.error('Error deleting image from disk:', error);
      return { success: false, message: error.message };
    }
  }
};
