import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Tags, Boxes, ShoppingCart, Calculator, 
  MessageCircle, TrendingUp, Settings, LogOut, Users, Store, CreditCard, BarChart3, Bell, HelpCircle, AlertTriangle
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import TourGuide from '../components/TourGuide';
import useTourStore from '../store/useTourStore';
import { subscriptionService } from '../services/subscriptionService';
import useNotificationStore from '../store/useNotificationStore';

const DashboardLayout = () => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const navigate = useNavigate();
  const location = useLocation();
  const [subStatus, setSubStatus] = useState(null);

  const [showBellMenu, setShowBellMenu] = useState(false);
  const bellDropdownRef = useRef(null);

  const { unreadChatCount, unreadOrderCount, unreadChatsList, unreadOrdersList } = useNotificationStore();
  const totalNotifications = unreadChatCount + unreadOrderCount;

  useEffect(() => {
    const handleClickOutsideBell = (event) => {
      if (bellDropdownRef.current && !bellDropdownRef.current.contains(event.target)) {
        setShowBellMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideBell);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideBell);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (role === 'OWNER') {
      subscriptionService.getSubscriptionStatus()
        .then(res => {
          if (res.success) {
            setSubStatus(res.data);
          }
        })
        .catch(err => console.error('Gagal mengambil status langganan:', err));
    }
  }, [role]);

  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    const baseClass = "flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 gap-3 border-l-4";
    if (isActive) {
      return `${baseClass} bg-[#DCFCE7] text-[#16A34A] border-[#16A34A] shadow-xs`;
    }
    return `${baseClass} text-gray-550 border-transparent hover:bg-[#F0FDF4] hover:text-[#16A34A]`;
  };

  const renderSubscriptionBadge = () => {
    if (!subStatus || role !== 'OWNER') return null;
    
    let badgeText = '';
    let badgeClass = '';
    
    switch (subStatus.status) {
      case 'TRIAL':
        badgeText = subStatus.daysRemaining > 0 
          ? `Trial aktif - ${subStatus.daysRemaining} hari lagi` 
          : 'Trial Berakhir';
        badgeClass = 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200';
        break;
      case 'ACTIVE':
        if (subStatus.plan && subStatus.plan.duration_type === 'PERMANENT') {
          badgeText = 'Langganan Permanen';
          badgeClass = 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 font-extrabold shadow-2xs';
        } else {
          const expiredDateFormatted = subStatus.expiredDate 
            ? new Date(subStatus.expiredDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            : '';
          badgeText = `${subStatus.plan ? subStatus.plan.name : 'Langganan'} - Aktif sampai ${expiredDateFormatted}`;
          badgeClass = 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
        }
        break;
      case 'PENDING':
        badgeText = 'Menunggu Verifikasi';
        badgeClass = 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
        break;
      case 'EXPIRED':
        badgeText = 'Langganan habis';
        badgeClass = 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
        break;
      default:
        return null;
    }
    
    return (
      <Link 
        id="tour-owner-subscription"
        to="/dashboard/subscription" 
        className={`px-3 py-1 text-xs font-bold rounded-full border transition-all duration-300 cursor-pointer ${badgeClass}`}
      >
        {badgeText}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {(role === 'OWNER' || role === 'ADMIN') && <TourGuide role={role} />}
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border flex flex-col shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="text-primary font-black text-xl tracking-tight">
            {role === 'ADMIN' ? 'WarungNear Admin' : 'WarungNear POS'}
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {role === 'ADMIN' ? (
            // Admin Sidebar Menu
            <>
              <Link id="tour-admin-dashboard" to="/dashboard" className={getLinkClass('/dashboard')}>
                <LayoutDashboard className="h-5 w-5 shrink-0" />
                Dashboard
              </Link>
              <Link id="tour-admin-users" to="/dashboard/users" className={getLinkClass('/dashboard/users')}>
                <Users className="h-5 w-5 shrink-0" />
                Users
              </Link>
              <Link id="tour-admin-owners" to="/dashboard/owners" className={getLinkClass('/dashboard/owners')}>
                <Users className="h-5 w-5 shrink-0" />
                Owner Management
              </Link>
              <Link id="tour-admin-stores" to="/dashboard/stores" className={getLinkClass('/dashboard/stores')}>
                <Store className="h-5 w-5 shrink-0" />
                Stores
              </Link>
              <Link id="tour-admin-payments" to="/dashboard/admin/subscriptions" className={getLinkClass('/dashboard/admin/subscriptions')}>
                <CreditCard className="h-5 w-5 shrink-0" />
                Subscription Payment
              </Link>
              <Link id="tour-admin-reports" to="/dashboard/reports" className={getLinkClass('/dashboard/reports')}>
                <BarChart3 className="h-5 w-5 shrink-0" />
                Reports
              </Link>
            </>
          ) : (
            // Owner Sidebar Menu
            <>
              <Link id="tour-owner-dashboard" to="/dashboard" className={getLinkClass('/dashboard')}>
                <LayoutDashboard className="h-5 w-5 shrink-0" />
                Dashboard
              </Link>
              <Link id="tour-owner-products" to="/dashboard/products" className={getLinkClass('/dashboard/products')}>
                <Package className="h-5 w-5 shrink-0" />
                Produk
              </Link>
              <Link id="tour-owner-categories" to="/dashboard/categories" className={getLinkClass('/dashboard/categories')}>
                <Tags className="h-5 w-5 shrink-0" />
                Kategori
              </Link>
              <Link id="tour-owner-inventory" to="/dashboard/inventory" className={getLinkClass('/dashboard/inventory')}>
                <Boxes className="h-5 w-5 shrink-0" />
                Inventory
              </Link>
              <Link id="tour-owner-orders" to="/dashboard/orders" className={`${getLinkClass('/dashboard/orders')} justify-between flex-1`}>
                <span className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 shrink-0" />
                  Pesanan Masuk
                </span>
                {unreadOrderCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center animate-pulse shrink-0">
                    {unreadOrderCount}
                  </span>
                )}
              </Link>
              <Link id="tour-owner-pos" to="/dashboard/transactions" className={getLinkClass('/dashboard/transactions')}>
                <Calculator className="h-5 w-5 shrink-0" />
                Kasir POS
              </Link>
              <Link id="tour-owner-chat" to="/dashboard/chat" className={`${getLinkClass('/dashboard/chat')} justify-between flex-1`}>
                <span className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 shrink-0" />
                  Chat Customer
                </span>
                {unreadChatCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center animate-pulse shrink-0">
                    {unreadChatCount}
                  </span>
                )}
              </Link>
              <Link id="tour-owner-reports" to="/dashboard/sales-history" className={getLinkClass('/dashboard/sales-history')}>
                <TrendingUp className="h-5 w-5 shrink-0" />
                Laporan Penjualan
              </Link>
              <Link id="tour-owner-settings" to="/dashboard/settings" className={getLinkClass('/dashboard/settings')}>
                <Settings className="h-5 w-5 shrink-0" />
                Pengaturan Toko
              </Link>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <button 
            onClick={() => useTourStore.getState().triggerTour(role)}
            className="flex w-full items-center px-4 py-2.5 text-sm font-semibold text-[#16A34A] rounded-xl hover:bg-[#F0FDF4] transition-all duration-300 gap-3 border border-[#16A34A]/25 cursor-pointer shadow-2xs"
          >
            <HelpCircle className="h-5 w-5 shrink-0" />
            Panduan Website
          </button>
          <button onClick={handleLogout} className="flex w-full items-center px-4 py-2.5 text-sm font-bold text-red-650 rounded-xl hover:bg-red-50 transition-colors gap-3 cursor-pointer">
            <LogOut className="h-5 w-5 shrink-0" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-border flex items-center px-6 justify-between shadow-xs">
          <div className="flex-1">
            {renderSubscriptionBadge()}
          </div>
          <div className="flex items-center space-x-5">
            {role?.toUpperCase() === 'OWNER' && (
              <div className="relative flex items-center" ref={bellDropdownRef}>
                <button
                  onClick={() => setShowBellMenu(!showBellMenu)}
                  className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition-colors relative cursor-pointer"
                  aria-label="Notifikasi"
                >
                  <Bell className="w-5.5 h-5.5" />
                  {totalNotifications > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full text-[9px] font-extrabold h-4 w-4 flex items-center justify-center border-2 border-white animate-pulse">
                      {totalNotifications}
                    </span>
                  )}
                </button>
                {showBellMenu && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-250 rounded-xl shadow-lg py-2 z-50 animate-fade-in max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-150 font-bold text-xs text-gray-700 uppercase tracking-wider text-left">
                      Notifikasi Baru
                    </div>
                    {totalNotifications === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-gray-400">
                        Tidak ada notifikasi baru
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {unreadChatsList.map(chat => (
                          <div
                            key={`bell-chat-${chat.id}`}
                            onClick={() => {
                              setShowBellMenu(false);
                              navigate('/dashboard/chat');
                            }}
                            className="px-4 py-3 hover:bg-green-50/50 cursor-pointer transition-colors text-left"
                          >
                            <p className="text-xs text-gray-800">
                              💬 Chat baru dari <span className="font-bold text-primary">{chat.customerName}</span>
                            </p>
                          </div>
                        ))}
                        {unreadOrdersList.map(order => (
                          <div
                            key={`bell-order-${order.id}`}
                            onClick={() => {
                              setShowBellMenu(false);
                              navigate('/dashboard/orders');
                            }}
                            className="px-4 py-3 hover:bg-green-50/50 cursor-pointer transition-colors text-left"
                          >
                            <p className="text-xs text-gray-800 font-medium">
                              🛒 Pesanan baru: <span className="font-bold text-primary">Order #{order.id}</span>
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              Dari: {order.customer?.name || 'Customer'} • Rp {order.total?.toLocaleString('id-ID')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center space-x-3">
              <span className="text-sm font-semibold text-gray-700">
                {role === 'ADMIN' ? 'Admin Dashboard' : 'Owner Dashboard'}
              </span>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-extrabold shadow-sm">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>
        {/* EXPIRED warning banner for OWNER */}
        {role === 'OWNER' && subStatus?.status === 'EXPIRED' && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-semibold">
                Toko Anda sedang tidak tampil karena masa langganan telah berakhir. Silakan perpanjang langganan untuk mengaktifkan kembali toko.
              </p>
            </div>
            <Link 
              to="/dashboard/subscription"
              className="bg-red-650 hover:bg-red-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition-colors shadow-3xs self-start sm:self-auto"
            >
              Perpanjang Langganan
            </Link>
          </div>
        )}

        <div className="flex-1 overflow-auto bg-gray-50/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
