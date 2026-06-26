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
  }
};
