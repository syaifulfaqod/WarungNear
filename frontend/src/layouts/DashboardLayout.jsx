import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Tags, Boxes, ShoppingCart, Calculator, 
  MessageCircle, TrendingUp, Settings, LogOut, Users, Store, CreditCard, BarChart3 
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import TourGuide from '../components/TourGuide';
import useTourStore from '../store/useTourStore';
import { subscriptionService } from '../services/subscriptionService';

const DashboardLayout = () => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const navigate = useNavigate();
  const location = useLocation();
  const [subStatus, setSubStatus] = useState(null);
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
              <Link id="tour-owner-orders" to="/dashboard/orders" className={getLinkClass('/dashboard/orders')}>
                <ShoppingCart className="h-5 w-5 shrink-0" />
                Pesanan Masuk
              </Link>
              <Link id="tour-owner-pos" to="/dashboard/transactions" className={getLinkClass('/dashboard/transactions')}>
                <Calculator className="h-5 w-5 shrink-0" />
                Kasir POS
              </Link>
              <Link id="tour-owner-chat" to="/dashboard/chat" className={getLinkClass('/dashboard/chat')}>
                <MessageCircle className="h-5 w-5 shrink-0" />
                Chat Customer
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
          <div className="relative w-full" ref={dropdownRef}>
            <button 
              onClick={() => setShowTourMenu(!showTourMenu)}
              className="flex w-full items-center px-4 py-2.5 text-sm font-semibold text-[#16A34A] rounded-xl hover:bg-[#F0FDF4] transition-all duration-300 gap-3 border border-[#16A34A]/25 cursor-pointer shadow-2xs"
            >
              <span className="text-base shrink-0">❓</span>
              Panduan Website
            </button>
            {showTourMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-250 rounded-xl shadow-lg py-1 z-50 animate-fade-in">
                <button
                  onClick={() => {
                    setShowTourMenu(false);
                    useTourStore.getState().triggerTour();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-primary font-semibold transition-colors cursor-pointer"
                >
                  {role === 'ADMIN' ? 'Mulai Tour Admin' : 'Mulai Tour Owner'}
                </button>
              </div>
            )}
          </div>
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
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-gray-700">
              {role === 'ADMIN' ? 'Admin Dashboard' : 'Owner Dashboard'}
            </span>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-extrabold shadow-sm">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-gray-50/50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
