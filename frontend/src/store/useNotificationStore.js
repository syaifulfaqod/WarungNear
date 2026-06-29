import { create } from 'zustand';
import { chatService } from '../services/chatService';
import { orderService } from '../services/orderService';
import useAuthStore from './useAuthStore';

const useNotificationStore = create((set, get) => ({
  unreadChatCount: 0,
  unreadOrderCount: 0,
  unreadChatsList: [],
  unreadOrdersList: [],
  customerUnreadChatCount: 0,
  customerUnreadOrderCount: 0,

  fetchUnreadCounts: async () => {
    const { isAuthenticated, role } = useAuthStore.getState();
    if (!isAuthenticated || role !== 'OWNER') return;

    try {
      const [chatRes, orderRes] = await Promise.all([
        chatService.getUnreadCount(),
        orderService.getUnreadCount()
      ]);

      if (chatRes.success) {
        set({
          unreadChatCount: chatRes.data.count,
          unreadChatsList: chatRes.data.unreadConversations || []
        });
      }

      if (orderRes.success) {
        set({
          unreadOrderCount: orderRes.data.count,
          unreadOrdersList: orderRes.data.unreadOrders || []
        });
      }
    } catch (error) {
      console.error('fetchUnreadCounts error:', error);
    }
  },

  fetchCustomerNotifications: async () => {
    const { isAuthenticated, role } = useAuthStore.getState();
    if (!isAuthenticated || role !== 'CUSTOMER') return;

    try {
      const [chatRes, orderRes] = await Promise.all([
        chatService.getCustomerUnreadCount(),
        orderService.getCustomerUnreadCount()
      ]);

      if (chatRes.success) {
        set({
          customerUnreadChatCount: chatRes.data.unreadChatCount
        });
      }

      if (orderRes.success) {
        set({
          customerUnreadOrderCount: orderRes.data.unreadOrderCount
        });
      }
    } catch (error) {
      console.error('fetchCustomerNotifications error:', error);
    }
  },

  resetChatBadge: () => {
    set({
      unreadChatCount: 0,
      unreadChatsList: []
    });
  },

  resetOrderBadge: () => {
    set({
      unreadOrderCount: 0,
      unreadOrdersList: []
    });
  },

  resetCustomerChatBadge: () => {
    set({
      customerUnreadChatCount: 0
    });
  },

  resetCustomerOrderBadge: () => {
    set({
      customerUnreadOrderCount: 0
    });
  }
}));

export default useNotificationStore;
