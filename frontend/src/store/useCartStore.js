import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [], // format: { id, name, price, image, quantity, store_id }
      storeId: null,
      storeName: null,

      addItem: (product, quantity = 1) => {
        const { cartItems, storeId } = get();
        const productStoreId = product.store_id;

        // If cart has items from a different store, return warning indicator
        if (storeId !== null && storeId !== productStoreId) {
          return { error: 'different_store', existingStoreName: get().storeName };
        }

        let updatedItems;
        const existingItem = cartItems.find((item) => item.id === product.id);

        if (existingItem) {
          updatedItems = cartItems.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          updatedItems = [...cartItems, { ...product, quantity }];
        }

        set({
          cartItems: updatedItems,
          storeId: productStoreId,
          storeName: product.store?.name || product.storeName || 'Toko',
        });

        return { success: true };
      },

      removeItem: (productId) => {
        const { cartItems } = get();
        const updatedItems = cartItems.filter((item) => item.id !== productId);
        
        set({
          cartItems: updatedItems,
          storeId: updatedItems.length === 0 ? null : get().storeId,
          storeName: updatedItems.length === 0 ? null : get().storeName,
        });
      },

      updateQuantity: (productId, quantity) => {
        const { cartItems } = get();
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const updatedItems = cartItems.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        );

        set({ cartItems: updatedItems });
      },

      clearCart: () => {
        set({
          cartItems: [],
          storeId: null,
          storeName: null,
        });
      },

      getTotal: () => {
        const { cartItems } = get();
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'warungnear_cart', // unique name for localStorage persistence
    }
  )
);

export default useCartStore;
