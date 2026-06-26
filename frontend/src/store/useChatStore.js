import { create } from 'zustand';
import { chatService } from '../services/chatService';

const useChatStore = create((set, get) => ({
  isOpen: false,
  activeConversationId: null,
  activeStoreId: null,
  activeOrderId: null,
  activeStoreName: '',
  conversations: [],
  messages: [],
  unreadCount: 0,

  setIsOpen: (isOpen) => set({ isOpen }),
  
  setActiveConversationId: (id) => {
    set({ activeConversationId: id, activeStoreId: null, activeOrderId: null });
    if (id) {
      get().fetchMessages(id);
    } else {
      set({ messages: [] });
    }
  },

  openChatWithStore: async (storeId, storeName) => {
    set({ isOpen: true, activeStoreId: storeId, activeStoreName: storeName });
    
    // Check if we already have a conversation with this store in our list
    const existing = get().conversations.find(c => c.store_id === storeId);
    if (existing) {
      set({ activeConversationId: existing.id, activeStoreId: null, activeOrderId: null });
      get().fetchMessages(existing.id);
    } else {
      set({ activeConversationId: null, messages: [] });
    }
  },

  openChatWithOrder: async (orderId, storeName) => {
    set({ isOpen: true, activeOrderId: orderId, activeStoreName: storeName });
    
    // Check if we already have a conversation with this orderId
    const existing = get().conversations.find(c => c.order_id === orderId);
    if (existing) {
      set({ activeConversationId: existing.id, activeOrderId: null, activeStoreId: null });
      get().fetchMessages(existing.id);
    } else {
      set({ activeConversationId: null, activeStoreId: null, messages: [] });
    }
  },

  fetchConversations: async () => {
    try {
      const response = await chatService.getConversations();
      if (response.success) {
        set({ conversations: response.data });
      }
    } catch (error) {
      console.error('fetchConversations error:', error);
    }
  },

  fetchMessages: async (conversationId) => {
    try {
      const response = await chatService.getMessages(conversationId);
      if (response.success) {
        set({ messages: response.data });
      }
    } catch (error) {
      console.error('fetchMessages error:', error);
    }
  },

  sendMessage: async (text) => {
    const { activeConversationId, activeStoreId, activeOrderId } = get();
    try {
      const payload = { message: text };
      if (activeConversationId) {
        payload.conversationId = activeConversationId;
      } else if (activeOrderId) {
        payload.orderId = activeOrderId;
      } else if (activeStoreId) {
        payload.storeId = activeStoreId;
      } else {
        return { success: false, message: 'No active recipient' };
      }

      const response = await chatService.sendMessage(payload);
      if (response.success) {
        const msg = response.data;
        
        // Append message to active list if matched
        if (!activeConversationId && msg.conversation_id) {
          // A new conversation was created on backend
          set({ activeConversationId: msg.conversation_id, activeStoreId: null, activeOrderId: null });
        }
        
        set(state => ({
          messages: [...state.messages, msg]
        }));
        
        // Refresh conversations list to show last message
        get().fetchConversations();
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('sendMessage error:', error);
      return { success: false, message: 'Gagal mengirim pesan' };
    }
  },

  handleIncomingMessage: (msg) => {
    const { activeConversationId, conversations } = get();
    
    // If message is for currently open conversation, append it
    if (activeConversationId === msg.conversation_id) {
      set(state => ({
        messages: [...state.messages.filter(m => m.id !== msg.id), msg]
      }));
    }
    
    // Refresh conversations list to update previews
    get().fetchConversations();
  }
}));

export default useChatStore;
