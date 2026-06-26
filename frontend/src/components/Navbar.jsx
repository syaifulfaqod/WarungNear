import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, LayoutDashboard, History, User, MessageSquare } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import useTourStore from '../store/useTourStore';

const Navbar = () => {
  const [showTourMenu, setShowTourMenu] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTourMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const navigate = useNavigate();
  const { isAuthenticated, role, user, logout } = useAuthStore();
  const { cartItems } = useCartStore();

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav id="tour-navbar" className="bg-white border-b border-gray-150 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-primary font-bold text-xl tracking-tight">WarungNear</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/" className="border-transparent text-gray-500 hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Home
              </Link>
              <Link id="tour-search-link" to="/search" className="border-transparent text-gray-500 hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Cari Barang
              </Link>
              <Link id="tour-maps-link" to="/map" className="border-transparent text-gray-500 hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Toko Terdekat
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Shopping Cart Icon with Badge */}
            {(!isAuthenticated || role?.toUpperCase() === 'CUSTOMER') && (
              <Link id="tour-cart-link" to="/cart" className="relative p-2 text-gray-500 hover:text-primary transition-colors font-medium flex items-center" aria-label="Keranjang Belanja">
                <ShoppingCart className="w-5.5 h-5.5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[9px] font-extrabold w-4.5 h-4.5 flex items-center justify-center border-2 border-white animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                {role?.toUpperCase() === 'CUSTOMER' && (
                  <>
                    <div className="relative" ref={dropdownRef}>
                      <button 
                        onClick={() => setShowTourMenu(!showTourMenu)}
                        className="text-[#16A34A] hover:text-[#15803D] flex items-center gap-1.5 text-xs font-bold transition-all duration-300 cursor-pointer bg-[#F0FDF4] px-2.5 py-1.5 rounded-lg border border-[#16A34A]/25 shadow-2xs"
                      >
                        <span className="text-sm shrink-0">❓</span>
                        <span className="hidden sm:inline">Panduan Website</span>
                      </button>
                      {showTourMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-250 rounded-xl shadow-lg py-1 z-50 animate-fade-in">
                          <button
                            onClick={() => {
                              setShowTourMenu(false);
                              useTourStore.getState().triggerTour();
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-primary font-semibold transition-colors cursor-pointer"
                          >
                            Mulai Tour Customer
                          </button>
                        </div>
                      )}
                    </div>
                    <Link id="tour-orders-link" to="/orders" className="text-gray-500 hover:text-primary flex items-center gap-1.5 text-sm font-semibold transition-colors">
                      <History className="w-4 h-4" />
                      <span className="hidden sm:inline">Pesanan Saya</span>
                    </Link>
                    <Link id="tour-chat-link" to="/chat" className="text-gray-500 hover:text-primary flex items-center gap-1.5 text-sm font-semibold transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      <span className="hidden sm:inline">Chat</span>
                    </Link>
                  </>
                )}

                {(role?.toUpperCase() === 'OWNER' || role?.toUpperCase() === 'ADMIN') && (
                  <Link to="/dashboard" className="text-gray-500 hover:text-primary flex items-center gap-1.5 text-sm font-semibold transition-colors">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                )}

                <div className="h-6 w-px bg-gray-250 hidden md:block"></div>

                <div id="tour-profile-menu" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-primary font-bold border border-green-200">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 hidden lg:inline">
                    {user?.name}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="py-2 px-3 border border-gray-200 text-gray-500 hover:text-red-650 hover:border-red-200 rounded-xl transition-all flex items-center gap-1.5 text-sm font-semibold"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-primary hover:bg-green-700 text-white font-bold py-2 px-5 rounded-xl transition-colors text-sm shadow-sm">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
