import React, { useEffect } from 'react';
import AppRoutes from './routes';
import useAuthStore from './store/useAuthStore';
import useProductStore from './store/useProductStore';
import { initiateSocketConnection, disconnectSocket } from './services/socket';
import { Toaster, toast } from 'react-hot-toast';

import useSearchStore from './store/useSearchStore';
import useChatStore from './store/useChatStore';

function App() {
  const { checkAuth, isAuthenticated, token, role } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(`📍 Geolocation obtained: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
          useSearchStore.getState().setUserLocation({
            lat: latitude,
            lng: longitude,
            latitude,
            longitude,
            accuracy
          });
        },
        (error) => {
          console.warn('⚠️ Geolocation access denied or failed. Fallback to Surabaya coordinates.', error);
          useSearchStore.getState().setUserLocation({
            lat: -7.250445,
            lng: 112.768845,
            latitude: -7.250445,
            longitude: 112.768845,
            accuracy: null,
            fallback: true
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      const socket = initiateSocketConnection(token);

      // Handle stock updates globally
      socket.on('stock:update', (data) => {
        console.log('📶 Realtime stock update received:', data);
        // Update product store
        useProductStore.getState().updateProductStock(data.product_id, data.stock);
        // Dispatch global event for local component states
        window.dispatchEvent(new CustomEvent('stock:update', { detail: data }));
      });

      // Handle new order alerts (for Owners)
      socket.on('order:new', (order) => {
        console.log('📶 Realtime new order received:', order);
        window.dispatchEvent(new CustomEvent('order:new', { detail: order }));
        
        toast.success(
          <div>
            <p className="font-bold text-emerald-400">Pesanan Baru Masuk!</p>
            <p className="text-xs text-slate-300">Dari: {order.customer?.name}</p>
            <p className="text-xs text-slate-300">Total: Rp {order.total.toLocaleString('id-ID')}</p>
          </div>,
          {
            duration: 6000,
            position: 'top-right',
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #10b981',
            },
          }
        );
      });

      // Handle order status updates (for Customers)
      socket.on('order:update', (order) => {
        console.log('📶 Realtime order status update received:', order);
        window.dispatchEvent(new CustomEvent('order:update', { detail: order }));

        const statusLabelMap = {
          PENDING: 'Menunggu Konfirmasi',
          CONFIRMED: 'Dikonfirmasi & Diproses',
          READY: 'Siap Diambil',
          COMPLETED: 'Selesai',
        };

        const statusColorMap = {
          PENDING: '#eab308', // yellow
          CONFIRMED: '#a855f7', // purple
          READY: '#3b82f6', // blue
          COMPLETED: '#10b981', // green
        };

        toast.success(
          <div>
            <p className="font-bold" style={{ color: statusColorMap[order.status] }}>
              Update Status Pesanan!
            </p>
            <p className="text-xs text-slate-300">Toko: {order.store?.name}</p>
            <p className="text-xs text-slate-300 font-semibold">
              Status: {statusLabelMap[order.status]}
            </p>
          </div>,
          {
            duration: 5000,
            position: 'top-right',
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              border: `1px solid ${statusColorMap[order.status] || '#3b82f6'}`,
            },
          }
        );
      });

      // Handle real-time chat messages
      socket.on('chat:message', (message) => {
        console.log('📶 Realtime chat message received:', message);
        useChatStore.getState().handleIncomingMessage(message);
        window.dispatchEvent(new CustomEvent('chat:message', { detail: message }));
      });

      socket.on('chat:new', (message) => {
        console.log('📶 Realtime chat:new received:', message);
        useChatStore.getState().handleIncomingMessage(message);
        window.dispatchEvent(new CustomEvent('chat:message', { detail: message }));
      });

      socket.on('chat:update', (message) => {
        console.log('📶 Realtime chat:update received:', message);
        useChatStore.getState().handleIncomingMessage(message);
        window.dispatchEvent(new CustomEvent('chat:message', { detail: message }));
      });

      return () => {
        disconnectSocket();
      };
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, token, role]);

  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
}

export default App;
