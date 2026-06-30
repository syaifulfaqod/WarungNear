let socketInstance = null;

class MockSocket {
  constructor() {
    this.listeners = {};
    this.connected = true;

    // Listen to simulated browser events and trigger active socket callbacks
    this.messageHandler = (e) => {
      const msg = e.detail;
      this.trigger('chat:message', msg);
      this.trigger('chat:new', msg);
      this.trigger('chat:update', msg);
      
      // If it's a system message or a message from owner, trigger chat:new-customer
      // which handles badge counts update
      const token = localStorage.getItem('warungnear_token');
      const users = JSON.parse(localStorage.getItem('wn_users') || '[]');
      const user = users.find(u => u.email === token);
      if (user && user.role === 'CUSTOMER' && msg.sender_id !== user.id) {
        this.trigger('chat:new-customer', {
          customerId: user.id,
          conversationId: msg.conversation_id,
          message: msg.message
        });
      }
    };

    this.orderUpdateHandler = (e) => {
      const order = e.detail;
      this.trigger('order:update', order);
      if (order.status === 'CANCELLED') {
        this.trigger('order:cancelled', { orderId: order.id, status: 'CANCELLED', cancelledBy: 'OWNER' });
      }
    };

    this.suspendHandler = (e) => {
      const { ownerId, reason } = e.detail;
      this.trigger('admin:suspend-owner', { ownerId, reason, status: 'SUSPENDED' });
    };

    window.addEventListener('wn_socket_message', this.messageHandler);
    window.addEventListener('wn_socket_order_update', this.orderUpdateHandler);
    window.addEventListener('wn_socket_suspend', this.suspendHandler);
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    if (callback) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    } else {
      delete this.listeners[event];
    }
  }

  emit(event, data) {
    console.log(`[MockSocket] Emit event: ${event}`, data);
  }

  trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in socket listener for ${event}:`, err);
        }
      });
    }
  }

  disconnect() {
    this.connected = false;
    window.removeEventListener('wn_socket_message', this.messageHandler);
    window.removeEventListener('wn_socket_order_update', this.orderUpdateHandler);
    window.removeEventListener('wn_socket_suspend', this.suspendHandler);
  }
}

export const initiateSocketConnection = (token) => {
  if (!socketInstance) {
    socketInstance = new MockSocket();
    console.log('🔌 Mock Socket.IO Connection initiated.');
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log('🔌 Mock Socket.IO Disconnected.');
  }
};

export const getSocket = () => {
  return socketInstance;
};
