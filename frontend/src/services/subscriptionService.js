import api from './api.js';

export const subscriptionService = {
  // Owner subscription APIs
  getSubscriptionStatus: async () => {
    const response = await api.get('/subscription/status');
    return response.data;
  },

  getSubscriptionPlans: async () => {
    const response = await api.get('/subscription/plans');
    return response.data;
  },

  submitPayment: async (planId, imageFile) => {
    const formData = new FormData();
    formData.append('plan_id', planId);
    formData.append('image', imageFile);

    const response = await api.post('/subscription/payment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Admin subscription APIs
  getAdminSubscriptions: async () => {
    const response = await api.get('/admin/subscriptions');
    return response.data;
  },

  approveSubscription: async (id) => {
    const response = await api.patch(`/admin/subscription/${id}/approve`);
    return response.data;
  },

  rejectSubscription: async (id) => {
    const response = await api.patch(`/admin/subscription/${id}/reject`);
    return response.data;
  }
};
