import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, Loader2, Lock, CreditCard } from 'lucide-react';
import useProductStore from '../../store/useProductStore';
import { productOwnerService } from '../../services/productOwnerService';
import { transactionService } from '../../services/transactionService';
import { subscriptionService } from '../../services/subscriptionService';
import ErrorAlert from '../../components/ErrorAlert';
import { getImageUrl } from '../../services/api';

const Transactions = () => {
  const navigate = useNavigate();
  const { products, setProducts, updateProduct } = useProductStore();
  const [cart, setCart] = useState([]);
  const [searchPos, setSearchPos] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Subscription check state
  const [subStatus, setSubStatus] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await productOwnerService.getProducts();
      if (response.success) {
        setProducts(response.data);
      } else {
        setError(response.message || 'Gagal memuat data kasir');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data kasir & produk. Hubungi server backend Anda.');
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    setLoadingSub(true);
    try {
      const res = await subscriptionService.getSubscriptionStatus();
      if (res.success) {
        setSubStatus(res.data);
      }
    } catch (err) {
      console.error('Error fetching subscription status in Transactions:', err);
    } finally {
      setLoadingSub(false);
    }
  };

  useEffect(() => {
    checkSubscription();
    loadData();
  }, []);

  // POS Functions
  const addToCart = (product) => {
    if (product.stock === 0) return alert('Stok produk habis');
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, maxStock: product.stock }];
    });
  };

  const updateCartQty = (productId, change) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + change;
        if (newQty <= 0) return null; // will filter out later
        if (newQty > item.maxStock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const cartTotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    try {
      const response = await transactionService.createTransaction(cart, cartTotal);
      if (response.success) {
        // Update local state stocks
        cart.forEach(item => {
          const newStock = item.maxStock - item.quantity;
          updateProduct(item.productId, { stock: newStock });
        });
        
        setCart([]);
        alert(`Transaksi Sukses! Total: Rp${cartTotal.toLocaleString('id-ID')}`);
      } else {
        alert(`Transaksi Gagal: ${response.message || 'Error tidak diketahui'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Gagal menghubungi server untuk memproses transaksi.');
    }
  };

  const posProducts = products.filter(p => p.name.toLowerCase().includes(searchPos.toLowerCase()));

  if (loadingSub) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-semibold">Memverifikasi status langganan...</p>
      </div>
    );
  }

  // Check if owner is blocked from using POS
  const isBlocked = subStatus && 
    subStatus.status !== 'ACTIVE' && 
    (subStatus.status === 'EXPIRED' || subStatus.status === 'PENDING' || (subStatus.status === 'TRIAL' && subStatus.daysRemaining <= 0));

  if (isBlocked) {
    return (
      <div className="flex items-center justify-center p-4 md:p-12 max-w-xl mx-auto h-full flex-col text-center space-y-6">
        <div className="p-4 bg-red-50 text-red-550 border border-red-100 rounded-full shadow-sm">
          <Lock className="w-16 h-16 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900">Akses Fitur Kasir Terkunci</h2>
          <p className="text-sm text-gray-550 leading-relaxed">
            {subStatus.status === 'PENDING'
              ? 'Bukti pembayaran Anda sedang diverifikasi oleh admin. Harap tunggu hingga akun diaktifkan.'
              : 'Masa percobaan (Free Trial) atau masa aktif langganan Anda telah berakhir. Silakan lakukan pembayaran Rp30.000/bulan untuk mengaktifkan kembali fitur Kasir.'}
          </p>
        </div>
        
        {subStatus.status !== 'PENDING' && (
          <button
            onClick={() => navigate('/dashboard/subscription')}
            className="w-full py-3.5 px-4 bg-primary text-white hover:bg-green-700 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all duration-300"
          >
            <CreditCard className="w-5 h-5" />
            Bayar Sekarang (Rp30.000)
          </button>
        )}
      </div>
    );
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6 h-full flex flex-col p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Kasir & Transaksi</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
        {/* POS Products List */}
        <div className="lg:col-span-2 card flex flex-col p-0 overflow-hidden">
          <div className="p-4 border-b border-border">
            <input 
              type="text" 
              placeholder="Cari produk untuk kasir..." 
              className="input-field text-sm"
              value={searchPos}
              onChange={e => setSearchPos(e.target.value)}
            />
          </div>
          
          {loading ? (
            <div className="flex-1 flex flex-col justify-center items-center py-20 bg-white">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <span className="text-gray-500 font-semibold text-sm animate-pulse">Memuat produk kasir...</span>
            </div>
          ) : (
            <div className="product-list p-4 grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
              {posProducts.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-16">
                  <p className="text-base font-semibold">Produk tidak ditemukan</p>
                  <p className="text-xs text-gray-400 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
                </div>
              ) : (
                posProducts.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => addToCart(p)}
                    className={`border border-border rounded-xl p-3 cursor-pointer transition-all hover:border-primary hover:shadow-md bg-white flex flex-col justify-between ${p.stock === 0 ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div>
                      <img src={getImageUrl(p.image)} alt={p.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                      <h3 className="font-semibold text-sm line-clamp-2 text-text">{p.name}</h3>
                    </div>
                    <div className="mt-2">
                      <p className="text-primary font-bold text-sm">Rp{p.price.toLocaleString('id-ID')}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Stok: {p.stock}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* POS Cart Sidebar */}
        <div className="card flex flex-col p-0 overflow-hidden">
          <div className="p-4 border-b border-border bg-gray-50 flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2 text-primary" />
            <h2 className="font-bold text-base">Keranjang</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-405 py-20 text-sm">Keranjang kosong</div>
            ) : (
              cart.map(item => (
                <div key={item.productId} className="flex justify-between items-center border-b border-border pb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-semibold text-xs truncate text-text">{item.name}</h4>
                    <p className="text-primary text-xs font-bold mt-0.5">Rp{item.price.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button onClick={() => updateCartQty(item.productId, -1)} className="p-1 bg-gray-100 rounded hover:bg-gray-250 transition-colors">
                      <Minus className="w-3.5 h-3.5 text-gray-650" />
                    </button>
                    <span className="text-xs font-bold w-5 text-center text-text">{item.quantity}</span>
                    <button onClick={() => updateCartQty(item.productId, 1)} className="p-1 bg-gray-100 rounded hover:bg-gray-250 transition-colors">
                      <Plus className="w-3.5 h-3.5 text-gray-650" />
                    </button>
                    <button onClick={() => removeFromCart(item.productId)} className="p-1 text-red-550 hover:bg-red-50 rounded transition-colors ml-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-border bg-gray-50">
            <div className="flex justify-between mb-4">
              <span className="font-semibold text-sm text-text">Total</span>
              <span className="font-bold text-lg text-primary">Rp{cartTotal.toLocaleString('id-ID')}</span>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full py-2.5 rounded-xl font-bold text-white transition-colors text-sm ${cart.length === 0 ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-green-700 shadow-sm'}`}
            >
              Bayar Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
