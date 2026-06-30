import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuthStore();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Memverifikasi sesi...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.map(r => r.toUpperCase()).includes(role?.toUpperCase())) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
