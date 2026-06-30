import api from './api';

export const chatService = {
  getConversations: async () => {
    try {
      const response = await api.get('/chat/conversations');
      return response.data;
    } catch (error) {
      console.error('getConversations service error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat daftar chat' };
    }
  },

  getMessages: async (conversationId) => {
    try {
      const response = await api.get(`/chat/${conversationId}/messages`);
      return response.data;
    } catch (error) {
      console.error('getMessages service error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat pesan' };
    }
  },

  sendMessage: async (data) => {
    try {
      const response = await api.post('/chat/send', data);
      return response.data;
    } catch (error) {
      console.error('sendMessage service error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal mengirim pesan' };
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get('/chat/unread-count');
      return response.data;
    } catch (error) {
      console.error('getUnreadCount service error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat unread count' };
    }
  },

  getOrCreateConversation: async (params) => {
    try {
      const response = await api.get('/chat/get-or-create', { params });
      return response.data;
    } catch (error) {
      console.error('getOrCreateConversation service error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat/membuat percakapan' };
    }
  },

  getCustomerUnreadCount: async () => {
    try {
      const response = await api.get('/chat/customer/unread-count');
      return response.data;
    } catch (error) {
      console.error('getCustomerUnreadCount service error:', error);
      return { success: false, message: error.response?.data?.message || 'Gagal memuat unread count customer' };
    }
  }
};
