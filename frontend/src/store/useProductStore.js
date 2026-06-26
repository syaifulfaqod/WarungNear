import { create } from 'zustand';

const useProductStore = create((set) => ({
  products: [],
  loading: false,

  setProducts: (products) => set({ products }),
  setLoading: (loading) => set({ loading }),
  
  addProduct: (product) => set((state) => ({
    products: [product, ...state.products]
  })),
  
  updateProduct: (id, updatedProduct) => set((state) => ({
    products: state.products.map(p => p.id === id ? { ...p, ...updatedProduct } : p)
  })),
  
  deleteProduct: (id) => set((state) => ({
    products: state.products.filter(p => p.id !== id)
  })),

  updateStock: (id, quantity) => set((state) => ({
    products: state.products.map(p => {
      if (p.id === id) {
        const newStock = Math.max(0, p.stock - quantity);
        let newStatus = 'Tersedia';
        if (newStock === 0) newStatus = 'Habis';
        else if (newStock <= 5) newStatus = 'Stok menipis';
        
        return { ...p, stock: newStock, status: newStatus };
      }
      return p;
    })
  })),

  updateProductStock: (id, stock) => set((state) => ({
    products: state.products.map(p => p.id === id ? { ...p, stock } : p)
  }))
}));

export default useProductStore;
