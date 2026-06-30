import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerLayout from '../layouts/CustomerLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';

// Customer Pages
import Home from '../pages/Home';
import SearchResult from '../pages/SearchResult';
import MapPage from '../pages/MapPage';
import StoreDetail from '../pages/StoreDetail';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import CustomerOrders from '../pages/CustomerOrders';
import CustomerChat from '../pages/CustomerChat';

// Dashboard Pages
import Overview from '../pages/Dashboard/Overview';
import Products from '../pages/Dashboard/Products';
import Categories from '../pages/Dashboard/Categories';
import SalesHistory from '../pages/Dashboard/SalesHistory';
import Inventory from '../pages/Dashboard/Inventory';
import Transactions from '../pages/Dashboard/Transactions';
import OwnerOrders from '../pages/Dashboard/OwnerOrders';
import Register from '../pages/Register';
import Login from '../pages/Login';
import Settings from '../pages/Dashboard/Settings';
import Chat from '../pages/Dashboard/Chat';
import Subscription from '../pages/Dashboard/Subscription';
import SubscriptionManagement from '../pages/Dashboard/SubscriptionManagement';
import useAuthStore from '../store/useAuthStore';

// Admin Pages
import AdminOverview from '../pages/Dashboard/AdminOverview';
import AdminUsers from '../pages/Dashboard/AdminUsers';
import AdminOwners from '../pages/Dashboard/AdminOwners';
import AdminStores from '../pages/Dashboard/AdminStores';
import AdminReports from '../pages/Dashboard/AdminReports';

const AppRoutes = () => {
  const role = useAuthStore(state => state.role);

  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Routes (Public) */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResult />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/store/:id" element={<StoreDetail />} />
          <Route path="/cart" element={<Cart />} />
        </Route>

        {/* Customer Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
          <Route element={<CustomerLayout />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<CustomerOrders />} />
            <Route path="/chat" element={<CustomerChat />} />
          </Route>
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard Routes (Protected) */}
        <Route element={<ProtectedRoute allowedRoles={['owner', 'admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route 
              path="/dashboard" 
              element={role?.toUpperCase() === 'ADMIN' ? <AdminOverview /> : <Overview />} 
            />
            <Route path="/dashboard/products" element={<Products />} />
            <Route path="/dashboard/categories" element={<Categories />} />
            <Route path="/dashboard/sales-history" element={<SalesHistory />} />
            <Route path="/dashboard/inventory" element={<Inventory />} />
            <Route path="/dashboard/transactions" element={<Transactions />} />
            <Route path="/dashboard/orders" element={<OwnerOrders />} />
            <Route path="/dashboard/chat" element={<Chat />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/subscription" element={<Subscription />} />
            <Route path="/dashboard/admin/subscriptions" element={<SubscriptionManagement />} />
            <Route path="/dashboard/users" element={<AdminUsers />} />
            <Route path="/dashboard/owners" element={<AdminOwners />} />
            <Route path="/dashboard/stores" element={<AdminStores />} />
            <Route path="/dashboard/reports" element={<AdminReports />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
