import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, LayoutDashboard, History, User, MessageSquare, HelpCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import useTourStore from '../store/useTourStore';
import useNotificationStore from '../store/useNotificationStore';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, user, logout } = useAuthStore();
  const { cartItems } = useCartStore();
  const { customerUnreadChatCount, customerUnreadOrderCount } = useNotificationStore();

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
                    <button 
                      onClick={() => useTourStore.getState().triggerTour('CUSTOMER')}
                      className="text-[#16A34A] hover:text-[#15803D] flex items-center gap-1.5 text-xs font-bold transition-all duration-300 cursor-pointer bg-[#F0FDF4] px-2.5 py-1.5 rounded-lg border border-[#16A34A]/25 shadow-2xs"
                    >
                      <HelpCircle className="w-4 h-4 shrink-0" />
                      <span className="hidden sm:inline">Panduan Website</span>
                    </button>
                    <Link id="tour-orders-link" to="/orders" className="text-gray-500 hover:text-primary flex items-center gap-1.5 text-sm font-semibold transition-colors">
                      <History className="w-4 h-4" />
                      <span className="hidden sm:inline">Pesanan Saya</span>
                      {customerUnreadOrderCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[16px] h-4 leading-none">
                          {customerUnreadOrderCount}
                        </span>
                      )}
                    </Link>
                    <Link id="tour-chat-link" to="/chat" className="text-gray-500 hover:text-primary flex items-center gap-1.5 text-sm font-semibold transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      <span className="hidden sm:inline">Chat</span>
                      {customerUnreadChatCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[16px] h-4 leading-none">
                          {customerUnreadChatCount}
                        </span>
                      )}
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
