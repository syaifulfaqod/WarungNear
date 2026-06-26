import React, { useState, useEffect } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import api, { getImageUrl } from '../services/api';
import { toast } from 'react-hot-toast';

const ProductForm = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    category_id: null,
    price: '',
    stock: '',
    image: null
  });

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch store categories when form opens
  useEffect(() => {
    const fetchCats = async () => {
      setLoadingCategories(true);
      try {
        const response = await categoryService.getCategories();
        if (response.success) {
          setCategories(response.data);
        } else {
          toast.error(response.message || 'Gagal mengambil kategori');
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        toast.error('Gagal memuat kategori.');
      } finally {
        setLoadingCategories(false);
      }
    };

    if (isOpen) {
      fetchCats();
    }
  }, [isOpen]);

  // Set form data when opening modal or changing initialData
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || '',
        category_id: initialData.category_id || null,
        price: initialData.price || '',
        stock: initialData.stock === 0 ? 0 : (initialData.stock || ''),
        image: initialData.image || null
      });
    } else {
      setFormData({
        name: '',
        category: '',
        category_id: null,
        price: '',
        stock: '',
        image: null
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nama produk wajib diisi";
    if (!formData.category_id) newErrors.category_id = "Kategori produk wajib dipilih";
    if (!formData.price || formData.price <= 0) newErrors.price = "Harga harus lebih dari 0";
    if (formData.stock === '' || formData.stock < 0) newErrors.stock = "Stok tidak boleh negatif";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate client-side
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, JPEG, PNG, atau WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file melebihi batas maksimal 5MB.');
      return;
    }

    const uploadPayload = new FormData();
    uploadPayload.append('image', file);

    setUploading(true);
    try {
      const response = await api.post('/upload/product-image', uploadPayload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setFormData(prev => ({ ...prev, image: response.data.data.imageUrl }));
        toast.success('Gambar berhasil diunggah!');
      } else {
        toast.error(response.data.message || 'Gagal mengunggah gambar.');
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error(error.response?.data?.message || 'Gagal mengunggah gambar.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        name: formData.name.trim(),
        category: formData.category,
        category_id: formData.category_id,
        price: Number(formData.price),
        stock: Number(formData.stock),
        image: formData.image
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-150">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? 'Edit Produk' : 'Tambah Produk'}
          </h2>
          <button onClick={onClose} className="text-gray-450 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
            <input 
              type="text" 
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}`}
              value={formData.name}
              placeholder="e.g. Indomie Goreng"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Memuat kategori toko...
              </div>
            ) : (
              <select 
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm ${errors.category_id ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}`}
                value={formData.category_id || ''}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null;
                  const selectedCat = categories.find(c => c.id === id);
                  setFormData({
                    ...formData,
                    category_id: id,
                    category: selectedCat ? selectedCat.name : ''
                  });
                }}
              >
                <option value="">Pilih Kategori</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
            {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>}
            {!loadingCategories && categories.length === 0 && (
              <p className="text-amber-600 text-xs mt-1">
                Belum ada kategori. Buat kategori terlebih dahulu di menu <strong>Categories</strong> di dashboard.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp) *</label>
              <input 
                type="number" 
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm ${errors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}`}
                value={formData.price}
                placeholder="Harga jual"
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stok *</label>
              <input 
                type="number" 
                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm ${errors.stock ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'}`}
                value={formData.stock}
                placeholder="Jumlah stok"
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
              />
              {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
            </div>
          </div>

          {/* Product Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2.5">Foto Produk</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-50 rounded-xl border border-gray-150 overflow-hidden flex items-center justify-center flex-shrink-0 relative shadow-inner">
                {formData.image ? (
                  <img src={getImageUrl(formData.image)} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-2">Belum ada foto</span>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="product-image-upload-input"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('product-image-upload-input').click()}
                    className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-2 px-3.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    disabled={uploading}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {formData.image ? 'Ganti Foto' : 'Pilih File'}
                  </button>
                  {formData.image && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: null })}
                      className="bg-red-50 hover:bg-red-100 text-red-650 font-bold py-2 px-3.5 rounded-xl text-xs transition-colors shadow-xs"
                      disabled={uploading}
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className="text-gray-400 text-[10px] leading-tight max-w-[200px]">
                  Hanya mendukung JPG, JPEG, PNG, atau WEBP. Maksimal 5 MB.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" className="px-5 py-2 bg-primary hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors" disabled={uploading}>
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
