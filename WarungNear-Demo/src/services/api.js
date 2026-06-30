import initialUsers from '../data/users.json';
import initialStores from '../data/stores.json';
import initialProducts from '../data/products.json';

// Initialize mock database in localStorage if not already set
const initMockDB = () => {
  if (!localStorage.getItem('wn_demo_initialized')) {
    localStorage.setItem('wn_users', JSON.stringify(initialUsers));
    localStorage.setItem('wn_stores', JSON.stringify(initialStores));
    localStorage.setItem('wn_products', JSON.stringify(initialProducts));
    localStorage.setItem('wn_orders', JSON.stringify([]));
    localStorage.setItem('wn_messages', JSON.stringify([]));
    localStorage.setItem('wn_conversations', JSON.stringify([]));
    
    // Seed default subscription plans
    localStorage.setItem('wn_subscription_plans', JSON.stringify([
      { "id": 1, "name": "Langganan Bulanan", "duration_type": "MONTHLY", "duration_days": 30, "price": 30000, "description": "Aktif 30 hari premium Kasir POS." },
      { "id": 2, "name": "Langganan Tahunan", "duration_type": "YEARLY", "duration_days": 365, "price": 300000, "description": "Lebih hemat! Aktif 365 hari premium." },
      { "id": 3, "name": "Langganan Permanen", "duration_type": "PERMANENT", "duration_days": null, "price": 1000000, "description": "Sekali bayar untuk selamanya." }
    ]));

    // Seed default subscriptions for budget owners
    // owner@warungnear.com is user id 2. Seed a Trial subscription.
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);
    localStorage.setItem('wn_subscriptions', JSON.stringify([
      {
        "id": 1,
        "owner_id": 2,
        "status": "TRIAL",
        "start_date": new Date().toISOString(),
        "trial_end_date": trialEnd.toISOString(),
        "expired_date": null,
        "plan_id": null
      }
    ]));

    localStorage.setItem('wn_categories', JSON.stringify([
      { "id": 1, "name": "Makanan", "store_id": 1 },
      { "id": 2, "name": "Sembako", "store_id": 1 },
      { "id": 3, "name": "Minuman", "store_id": 2 },
      { "id": 4, "name": "Peralatan Mandi", "store_id": 2 },
      { "id": 5, "name": "Sembako", "store_id": 2 }
    ]));

    localStorage.setItem('wn_demo_initialized', 'true');
  }
};

initMockDB();

// Helper to get logged in user profile from token stored in localstorage
const getLoggedInUser = () => {
  const token = localStorage.getItem('warungnear_token');
  if (!token) return null;
  const users = JSON.parse(localStorage.getItem('wn_users') || '[]');
  // In demo mode, token is user's email
  return users.find(u => u.email === token) || null;
};

// Helper for simulated latency
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

const api = {
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} }
  },
  defaults: { headers: {} },

  post: async (url, data = {}) => {
    await delay();
    const cleanUrl = url.split('?')[0];

    // LOGIN
    if (cleanUrl === '/auth/login') {
      const { email, password } = data;
      let users = JSON.parse(localStorage.getItem('wn_users') || '[]');

      // Check standard mock user account first
      let user = users.find(u => u.email === email);

      // Support fallback demo account definitions
      if (!user) {
        if (email === 'admin@warungnear.com' && password === '123456') {
          user = { id: 1, name: "Admin WarungNear", email, role: "ADMIN", is_active: true, status: "ACTIVE" };
          users.push(user);
          localStorage.setItem('wn_users', JSON.stringify(users));
        } else if (email === 'owner@warungnear.com' && password === '123456') {
          user = { id: 2, name: "Budi Owner", email, role: "OWNER", is_active: true, status: "ACTIVE" };
          users.push(user);
          localStorage.setItem('wn_users', JSON.stringify(users));
          
          // Seed Trial
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + 7);
          const subs = JSON.parse(localStorage.getItem('wn_subscriptions') || '[]');
          if (!subs.some(s => s.owner_id === user.id)) {
            subs.push({
              id: Date.now(),
              owner_id: user.id,
              status: "TRIAL",
              start_date: new Date().toISOString(),
              trial_end_date: trialEnd.toISOString(),
              expired_date: null
            });
            localStorage.setItem('wn_subscriptions', JSON.stringify(subs));
          }
        } else if (email === 'customer@warungnear.com' && password === '123456') {
          user = { id: 3, name: "Syaiful Customer", email, role: "CUSTOMER", is_active: true, status: "ACTIVE" };
          users.push(user);
          localStorage.setItem('wn_users', JSON.stringify(users));
        }
      }

      if (!user || password !== '123456') {
        return { data: { success: false, message: 'Email atau Password salah' } };
      }

      if (user.status === 'SUSPENDED') {
        return { data: { success: false, message: 'Akun Anda dinonaktifkan oleh Admin.' } };
      }

      return {
        data: {
          success: true,
          data: {
            token: user.email, // Use email as token in demo mode
            user
          }
        }
      };
    }

    // REGISTER
    if (cleanUrl === '/auth/register') {
      const { name, email, password, role } = data;
      let users = JSON.parse(localStorage.getItem('wn_users') || '[]');

      if (users.some(u => u.email === email)) {
        return { data: { success: false, message: 'Email sudah terdaftar' } };
      }

      const newUser = {
        id: Date.now(),
        name,
        email,
        role: role.toUpperCase(),
        is_active: true,
        status: 'ACTIVE'
      };

      users.push(newUser);
      localStorage.setItem('wn_users', JSON.stringify(users));

      // Seed free trial if Owner
      if (newUser.role === 'OWNER') {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);
        const subs = JSON.parse(localStorage.getItem('wn_subscriptions') || '[]');
        subs.push({
          id: Date.now(),
          owner_id: newUser.id,
          status: "TRIAL",
          start_date: new Date().toISOString(),
          trial_end_date: trialEnd.toISOString(),
          expired_date: null
        });
        localStorage.setItem('wn_subscriptions', JSON.stringify(subs));
      }

      return {
        data: {
          success: true,
          data: {
            token: newUser.email,
            user: newUser
          }
        }
      };
    }

    const user = getLoggedInUser();
    if (!user) return { data: { success: false, message: 'Not authorized' } };

    // OWNER CREATE/UPDATE STORE
    if (cleanUrl === '/stores/owner/store') {
      let stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');
      let storeIndex = stores.findIndex(s => s.owner_id === user.id);

      const storeData = {
        id: storeIndex !== -1 ? stores[storeIndex].id : Date.now(),
        name: data.name,
        address: data.address,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        open_time: data.open_time,
        close_time: data.close_time,
        phoneNumber: data.phoneNumber,
        owner_id: user.id,
        isActive: true,
        images: storeIndex !== -1 ? (stores[storeIndex].images || []) : [
          { "id": Date.now(), "store_id": Date.now(), "image_url": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800", "is_primary": true }
        ]
      };

      if (storeIndex !== -1) {
        stores[storeIndex] = storeData;
      } else {
        stores.push(storeData);
      }

      localStorage.setItem('wn_stores', JSON.stringify(stores));
      return { data: { success: true, data: storeData } };
    }

    // CREATE PRODUCT
    if (cleanUrl === '/products') {
      const stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');
      const store = stores.find(s => s.owner_id === user.id);
      if (!store) return { data: { success: false, message: 'Store not found' } };

      let products = JSON.parse(localStorage.getItem('wn_products') || '[]');
      const newProduct = {
        id: Date.now(),
        name: data.name,
        category: data.category,
        category_id: data.category_id || null,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        image: data.image || "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300",
        store_id: store.id
      };

      products.push(newProduct);
      localStorage.setItem('wn_products', JSON.stringify(products));
      return { data: { success: true, data: newProduct } };
    }

    // CREATE CATEGORY
    if (cleanUrl === '/categories') {
      const stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');
      const store = stores.find(s => s.owner_id === user.id);
      if (!store) return { data: { success: false, message: 'Store not found' } };

      let categories = JSON.parse(localStorage.getItem('wn_categories') || '[]');
      const newCategory = {
        id: Date.now(),
        name: data.name,
        store_id: store.id
      };
      categories.push(newCategory);
      localStorage.setItem('wn_categories', JSON.stringify(categories));
      return { data: { success: true, data: newCategory } };
    }

    // CUSTOMER CHECKOUT ORDER
    if (cleanUrl === '/orders') {
      const { store_id, items } = data;
      let products = JSON.parse(localStorage.getItem('wn_products') || '[]');
      let orders = JSON.parse(localStorage.getItem('wn_orders') || '[]');
      let stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');

      const targetStore = stores.find(s => s.id === parseInt(store_id));
      if (!targetStore) return { data: { success: false, message: 'Toko tidak ditemukan' } };

      // Calculate total
      let total = 0;
      const orderItems = [];

      for (const item of items) {
        const prod = products.find(p => p.id === parseInt(item.product_id));
        if (!prod) return { data: { success: false, message: 'Produk tidak ditemukan' } };
        if (prod.stock < item.quantity) {
          return { data: { success: false, message: `Stok ${prod.name} tidak cukup` } };
        }
        prod.stock -= item.quantity; // Reduce stock
        total += prod.price * item.quantity;
        orderItems.push({
          id: Date.now() + Math.random(),
          product_id: prod.id,
          quantity: item.quantity,
          price: prod.price,
          product: { id: prod.id, name: prod.name, image: prod.image }
        });
      }

      localStorage.setItem('wn_products', JSON.stringify(products));

      const newOrder = {
        id: orders.length + 100,
        customer_id: user.id,
        store_id: parseInt(store_id),
        status: 'PENDING',
        total,
        is_seen: false,
        customer_is_seen: true,
        createdAt: new Date().toISOString(),
        items: orderItems,
        store: { id: targetStore.id, name: targetStore.name, address: targetStore.address, latitude: targetStore.latitude, longitude: targetStore.longitude },
        customer: { id: user.id, name: user.name }
      };

      orders.push(newOrder);
      localStorage.setItem('wn_orders', JSON.stringify(orders));

      // Trigger chat notification trigger for socket listeners
      const conversations = JSON.parse(localStorage.getItem('wn_conversations') || '[]');
      let conv = conversations.find(c => c.customer_id === user.id && c.store_id === newOrder.store_id);
      if (!conv) {
        conv = { id: Date.now(), customer_id: user.id, store_id: newOrder.store_id, updatedAt: new Date().toISOString() };
        conversations.push(conv);
        localStorage.setItem('wn_conversations', JSON.stringify(conversations));
      }

      return { data: { success: true, data: newOrder } };
    }

    // POS NEW TRANSACTION (OWNER)
    if (cleanUrl === '/transactions') {
      const stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');
      const store = stores.find(s => s.owner_id === user.id);
      if (!store) return { data: { success: false, message: 'Toko tidak ditemukan' } };

      // Standard POS transaction creation (mocked successfully)
      return { data: { success: true, data: { id: Date.now(), total: data.total } } };
    }

    // EXTEND/PAY SUBSCRIPTION
    if (cleanUrl === '/subscription/extend') {
      let subs = JSON.parse(localStorage.getItem('wn_subscriptions') || '[]');
      let sub = subs.find(s => s.owner_id === user.id);

      const updatedSub = {
        id: sub ? sub.id : Date.now(),
        owner_id: user.id,
        status: 'PENDING',
        start_date: sub ? sub.start_date : new Date().toISOString(),
        trial_end_date: sub ? sub.trial_end_date : new Date().toISOString(),
        plan_id: data.plan_id ? parseInt(data.plan_id) : null,
        payment_proof_image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=100'
      };

      if (sub) {
        const idx = subs.findIndex(s => s.owner_id === user.id);
        subs[idx] = updatedSub;
      } else {
        subs.push(updatedSub);
      }

      localStorage.setItem('wn_subscriptions', JSON.stringify(subs));
      return { data: { success: true, data: updatedSub } };
    }

    // UPLOAD STORE IMAGE MOCK
    if (cleanUrl.startsWith('/store/images/')) {
      const storeId = parseInt(cleanUrl.split('/').pop());
      let stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');
      const idx = stores.findIndex(s => s.id === storeId);
      if (idx === -1) return { data: { success: false, message: 'Store not found' } };

      const store = stores[idx];
      store.images = store.images || [];

      // Pick a random image from public stock
      const stockImages = [
        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
        "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800",
        "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=800"
      ];
      const selectedImg = stockImages[store.images.length % stockImages.length];

      const newImg = {
        id: Date.now(),
        store_id: storeId,
        image_url: selectedImg,
        is_primary: store.images.length === 0
      };

      store.images.push(newImg);
      localStorage.setItem('wn_stores', JSON.stringify(stores));
      return { data: { success: true, data: newImg } };
    }

    // UPLOAD PRODUCT IMAGE MOCK
    if (cleanUrl === '/upload/product-image') {
      return { data: { success: true, data: { imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300" } } };
    }

    // CHAT MESSAGE POST
    if (cleanUrl === '/chat/conversations/messages') {
      const { conversationId, message } = data;
      let messages = JSON.parse(localStorage.getItem('wn_messages') || '[]');
      let conversations = JSON.parse(localStorage.getItem('wn_conversations') || '[]');

      const conv = conversations.find(c => c.id === parseInt(conversationId));
      if (!conv) return { data: { success: false, message: 'Conversation not found' } };

      const newMsg = {
        id: Date.now(),
        conversation_id: conv.id,
        sender_id: user.id,
        message,
        is_read: false,
        customer_is_read: false,
        createdAt: new Date().toISOString()
      };

      messages.push(newMsg);
      localStorage.setItem('wn_messages', JSON.stringify(messages));

      // Trigger socket callback simulation
      window.dispatchEvent(new CustomEvent('wn_socket_message', { detail: newMsg }));

      return { data: { success: true, data: newMsg } };
    }

    // CHAT READ MESSAGES
    if (cleanUrl === '/chat/conversations/messages/read') {
      const { conversationId } = data;
      let messages = JSON.parse(localStorage.getItem('wn_messages') || '[]');
      messages = messages.map(m => {
        if (m.conversation_id === parseInt(conversationId)) {
          if (user.role === 'CUSTOMER') {
            m.customer_is_read = true;
          } else {
            m.is_read = true;
          }
        }
        return m;
      });
      localStorage.setItem('wn_messages', JSON.stringify(messages));
      return { data: { success: true } };
    }

    // ADMIN APPROVE SUBSCRIPTION
    if (cleanUrl.startsWith('/admin/subscription/')) {
      const parts = cleanUrl.split('/');
      const action = parts[3]; // approve or reject
      const ownerId = parseInt(parts[4]);

      let subs = JSON.parse(localStorage.getItem('wn_subscriptions') || '[]');
      const idx = subs.findIndex(s => s.owner_id === ownerId);
      if (idx !== -1) {
        if (action === 'approve') {
          subs[idx].status = 'ACTIVE';
          const exp = new Date();
          exp.setDate(exp.getDate() + 30);
          subs[idx].expired_date = exp.toISOString();
        } else {
          subs[idx].status = 'EXPIRED';
        }
        localStorage.setItem('wn_subscriptions', JSON.stringify(subs));
      }
      return { data: { success: true } };
    }

    return { data: { success: false, message: 'Mock endpoint not found' } };
  },

  get: async (url, config = {}) => {
    await delay();
    const cleanUrl = url.split('?')[0];
    const user = getLoggedInUser();

    // GET NEARBY STORES
    if (cleanUrl === '/stores/nearby') {
      let stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');
      let subs = JSON.parse(localStorage.getItem('wn_subscriptions') || '[]');
      let users = JSON.parse(localStorage.getItem('wn_users') || '[]');

      // Filter: Store must be active, owner must NOT be suspended, subscription must NOT be expired
      const now = new Date();
      const filteredStores = stores.filter(store => {
        const owner = users.find(u => u.id === store.owner_id);
        if (!owner || owner.status === 'SUSPENDED') return false;

        const sub = subs.find(s => s.owner_id === store.owner_id);
        const isSubActive = sub && (
          sub.status === 'ACTIVE' || 
          (sub.status === 'TRIAL' && new Date(sub.trial_end_date) >= now)
        );

        return store.isActive && isSubActive;
      }).map(store => {
        const owner = users.find(u => u.id === store.owner_id);
        return {
          store,
          distance: 1.2, // mock haversine distance
          owner: { id: owner.id, name: owner.name }
        };
      });

      return { data: { success: true, data: filteredStores } };
    }

    // GET STORE DETAILS
    if (cleanUrl.startsWith('/stores/')) {
      const storeId = parseInt(cleanUrl.split('/').pop());
      const stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');
      const store = stores.find(s => s.id === storeId);
      if (!store) return { data: { success: false, message: 'Store not found' } };

      const products = JSON.parse(localStorage.getItem('wn_products') || '[]');
      const storeProducts = products.filter(p => p.store_id === storeId);

      const users = JSON.parse(localStorage.getItem('wn_users') || '[]');
      const owner = users.find(u => u.id === store.owner_id);

      const fullStore = {
        ...store,
        products: storeProducts,
        owner: { id: owner?.id, name: owner?.name }
      };

      return { data: { success: true, data: fullStore } };
    }

    if (!user) return { data: { success: false, message: 'Not authorized' } };

    // GET OWNER'S STORE PROFILE
    if (cleanUrl === '/stores/owner/store') {
      const stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');
      const store = stores.find(s => s.owner_id === user.id) || null;
      return { data: { success: true, data: store } };
    }

    // GET PRODUCTS LIST
    if (cleanUrl === '/products') {
      let products = JSON.parse(localStorage.getItem('wn_products') || '[]');
      if (user.role === 'OWNER') {
        const stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');
        const store = stores.find(s => s.owner_id === user.id);
        if (!store) return { data: { success: true, data: [] } };
        products = products.filter(p => p.store_id === store.id);
      }
      return { data: { success: true, data: products } };
    }

    // GET CATEGORIES
    if (cleanUrl === '/categories') {
      let categories = JSON.parse(localStorage.getItem('wn_categories') || '[]');
      if (user.role === 'OWNER') {
        const stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');
        const store = stores.find(s => s.owner_id === user.id);
        if (!store) return { data: { success: true, data: [] } };
        categories = categories.filter(c => c.store_id === store.id);
      }
      return { data: { success: true, data: categories } };
    }

    // GET USER ORDERS
    if (cleanUrl === '/orders') {
      let orders = JSON.parse(localStorage.getItem('wn_orders') || '[]');
      if (user.role === 'CUSTOMER') {
        orders = orders.filter(o => o.customer_id === user.id);
      } else if (user.role === 'OWNER') {
        const stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');
        const store = stores.find(s => s.owner_id === user.id);
        if (!store) return { data: { success: true, data: [] } };
        orders = orders.filter(o => o.store_id === store.id);
      }
      return { data: { success: true, data: orders } };
    }

    // GET SUBSCRIPTION STATUS (OWNER)
    if (cleanUrl === '/subscription/status') {
      const subs = JSON.parse(localStorage.getItem('wn_subscriptions') || '[]');
      let sub = subs.find(s => s.owner_id === user.id);

      if (!sub) {
        // Auto seed default trial on read
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);
        sub = {
          id: Date.now(),
          owner_id: user.id,
          status: "TRIAL",
          start_date: new Date().toISOString(),
          trial_end_date: trialEnd.toISOString(),
          expired_date: null
        };
        subs.push(sub);
        localStorage.setItem('wn_subscriptions', JSON.stringify(subs));
      }

      return { data: { success: true, data: sub } };
    }

    // GET PLANS
    if (cleanUrl === '/subscription/plans') {
      const plans = JSON.parse(localStorage.getItem('wn_subscription_plans') || '[]');
      return { data: { success: true, data: plans } };
    }

    // GET CHAT CONVERSATIONS
    if (cleanUrl === '/chat/conversations') {
      let conversations = JSON.parse(localStorage.getItem('wn_conversations') || '[]');
      let stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');
      let users = JSON.parse(localStorage.getItem('wn_users') || '[]');
      let messages = JSON.parse(localStorage.getItem('wn_messages') || '[]');

      if (user.role === 'CUSTOMER') {
        conversations = conversations.filter(c => c.customer_id === user.id);
      } else if (user.role === 'OWNER') {
        const store = stores.find(s => s.owner_id === user.id);
        if (!store) return { data: { success: true, data: [] } };
        conversations = conversations.filter(c => c.store_id === store.id);
      }

      const formatted = conversations.map(c => {
        const store = stores.find(s => s.id === c.store_id);
        const customer = users.find(u => u.id === c.customer_id);
        const convMessages = messages.filter(m => m.conversation_id === c.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return {
          id: c.id,
          customer_id: c.customer_id,
          store_id: c.store_id,
          store: store ? { id: store.id, name: store.name, address: store.address } : null,
          customer: customer ? { id: customer.id, name: customer.name, email: customer.email } : null,
          messages: convMessages
        };
      });

      return { data: { success: true, data: formatted } };
    }

    // GET MESSAGES
    if (cleanUrl.startsWith('/chat/conversations/')) {
      const convId = parseInt(cleanUrl.split('/').pop());
      const messages = JSON.parse(localStorage.getItem('wn_messages') || '[]');
      const filtered = messages.filter(m => m.conversation_id === convId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return { data: { success: true, data: filtered } };
    }

    // ADMIN OVERVIEW METRICS
    if (cleanUrl === '/admin/overview') {
      const users = JSON.parse(localStorage.getItem('wn_users') || '[]');
      const stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');
      const orders = JSON.parse(localStorage.getItem('wn_orders') || '[]');

      const customers = users.filter(u => u.role === 'CUSTOMER');
      const owners = users.filter(u => u.role === 'OWNER');
      const totalIncome = orders.reduce((sum, o) => o.status === 'COMPLETED' ? sum + o.total : sum, 0);

      return {
        data: {
          success: true,
          data: {
            metrics: {
              totalUsers: users.length,
              totalCustomers: customers.length,
              totalOwners: owners.length,
              totalStores: stores.length,
              totalOrders: orders.length,
              totalIncome
            }
          }
        }
      };
    }

    // ADMIN USERS LIST
    if (cleanUrl === '/admin/users') {
      const users = JSON.parse(localStorage.getItem('wn_users') || '[]');
      return { data: { success: true, data: users } };
    }

    // ADMIN OWNERS LIST
    if (cleanUrl === '/admin/owners') {
      const users = JSON.parse(localStorage.getItem('wn_users') || '[]');
      const owners = users.filter(u => u.role === 'OWNER');
      const stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');
      const subs = JSON.parse(localStorage.getItem('wn_subscriptions') || '[]');

      const formatted = owners.map(o => {
        const store = stores.find(s => s.owner_id === o.id);
        const sub = subs.find(s => s.owner_id === o.id);
        return {
          ...o,
          store: store ? { name: store.name } : null,
          subscription: sub ? { status: sub.status, expired_date: sub.expired_date } : null
        };
      });

      return { data: { success: true, data: formatted } };
    }

    // ADMIN STORES LIST
    if (cleanUrl === '/admin/stores') {
      const stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');
      const users = JSON.parse(localStorage.getItem('wn_users') || '[]');
      const subs = JSON.parse(localStorage.getItem('wn_subscriptions') || '[]');

      const formatted = stores.map(s => {
        const owner = users.find(u => u.id === s.owner_id);
        const sub = subs.find(s => s.owner_id === s.owner_id);
        return {
          ...s,
          owner: owner ? { name: owner.name, status: owner.status } : null,
          subscription: sub ? { status: sub.status } : null
        };
      });

      return { data: { success: true, data: formatted } };
    }

    // ADMIN REPORTS
    if (cleanUrl === '/admin/reports') {
      const orders = JSON.parse(localStorage.getItem('wn_orders') || '[]');
      const completed = orders.filter(o => o.status === 'COMPLETED');
      return { data: { success: true, data: { transactions: completed } } };
    }

    return { data: { success: false, message: 'Mock endpoint not found' } };
  },

  put: async (url, data = {}) => {
    await delay();
    const cleanUrl = url.split('?')[0];
    const user = getLoggedInUser();
    if (!user) return { data: { success: false, message: 'Not authorized' } };

    // UPDATE PRODUCT
    if (cleanUrl.startsWith('/products/')) {
      const prodId = parseInt(cleanUrl.split('/').pop());
      let products = JSON.parse(localStorage.getItem('wn_products') || '[]');
      const idx = products.findIndex(p => p.id === prodId);
      if (idx === -1) return { data: { success: false, message: 'Product not found' } };

      products[idx] = {
        ...products[idx],
        name: data.name,
        category: data.category,
        category_id: data.category_id || null,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        image: data.image || products[idx].image
      };

      localStorage.setItem('wn_products', JSON.stringify(products));
      return { data: { success: true, data: products[idx] } };
    }

    // UPDATE ORDER STATUS (CONFIRMED -> READY -> COMPLETED / CANCELLED)
    if (cleanUrl.startsWith('/orders/') && cleanUrl.endsWith('/status')) {
      const orderId = parseInt(cleanUrl.split('/')[2]);
      let orders = JSON.parse(localStorage.getItem('wn_orders') || '[]');
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx === -1) return { data: { success: false, message: 'Order not found' } };

      const order = orders[idx];
      const newStatus = data.status;
      order.status = newStatus;
      order.customer_is_seen = false;

      // Handle socket order:update trigger simulation
      window.dispatchEvent(new CustomEvent('wn_socket_order_update', { detail: order }));

      // If status is READY, send auto system notification message
      if (newStatus === 'READY') {
        const systemMessageKey = `[READY_NOTIFICATION_ORDER_${order.id}]`;
        let messages = JSON.parse(localStorage.getItem('wn_messages') || '[]');
        const existing = messages.find(m => m.message.includes(systemMessageKey));

        if (!existing) {
          const conversations = JSON.parse(localStorage.getItem('wn_conversations') || '[]');
          let conv = conversations.find(c => c.customer_id === order.customer_id && c.store_id === order.store_id);
          if (!conv) {
            conv = { id: Date.now(), customer_id: order.customer_id, store_id: order.store_id, updatedAt: new Date().toISOString() };
            conversations.push(conv);
            localStorage.setItem('wn_conversations', JSON.stringify(conversations));
          }

          const itemDetails = order.items.map(item => `- ${item.product.name} x${item.quantity}`).join('\n');
          const messageText = `${systemMessageKey}Halo ${order.customer.name}, pesanan #ORD-${order.id} dari ${order.store.name} sudah siap diambil.\n\nDetail:\n${itemDetails}\n\nSilakan datang ke toko untuk mengambil pesanan Anda.\nTerima kasih.`;

          const sysMsg = {
            id: Date.now() + Math.random(),
            conversation_id: conv.id,
            sender_id: order.store_id, // Store owner
            message: messageText,
            is_system: true,
            latitude: order.store.latitude,
            longitude: order.store.longitude,
            is_read: false,
            customer_is_read: false,
            createdAt: new Date().toISOString()
          };

          messages.push(sysMsg);
          localStorage.setItem('wn_messages', JSON.stringify(messages));

          // Trigger realtime event
          window.dispatchEvent(new CustomEvent('wn_socket_message', { detail: sysMsg }));
        }
      }

      localStorage.setItem('wn_orders', JSON.stringify(orders));
      return { data: { success: true, data: order } };
    }

    // ADMIN SUSPEND OWNER
    if (cleanUrl.startsWith('/admin/suspend/')) {
      const ownerId = parseInt(cleanUrl.split('/').pop());
      let users = JSON.parse(localStorage.getItem('wn_users') || '[]');
      const idx = users.findIndex(u => u.id === ownerId);
      if (idx !== -1) {
        const nextStatus = users[idx].status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        users[idx].status = nextStatus;
        users[idx].is_active = (nextStatus === 'ACTIVE');
        users[idx].suspend_reason = data.reason || 'Melanggar Kebijakan';
        localStorage.setItem('wn_users', JSON.stringify(users));

        // Socket simulation trigger to force logout the owner instantly
        if (nextStatus === 'SUSPENDED') {
          window.dispatchEvent(new CustomEvent('wn_socket_suspend', { detail: { ownerId, reason: users[idx].suspend_reason } }));
        }
      }
      return { data: { success: true } };
    }

    return { data: { success: false, message: 'Mock endpoint not found' } };
  },

  delete: async (url, config = {}) => {
    await delay();
    const cleanUrl = url.split('?')[0];
    const user = getLoggedInUser();
    if (!user) return { data: { success: false, message: 'Not authorized' } };

    // DELETE PRODUCT
    if (cleanUrl.startsWith('/products/')) {
      const prodId = parseInt(cleanUrl.split('/').pop());
      let products = JSON.parse(localStorage.getItem('wn_products') || '[]');
      products = products.filter(p => p.id !== prodId);
      localStorage.setItem('wn_products', JSON.stringify(products));
      return { data: { success: true } };
    }

    // DELETE CATEGORY
    if (cleanUrl.startsWith('/categories/')) {
      const catId = parseInt(cleanUrl.split('/').pop());
      let categories = JSON.parse(localStorage.getItem('wn_categories') || '[]');
      categories = categories.filter(c => c.id !== catId);
      localStorage.setItem('wn_categories', JSON.stringify(categories));
      return { data: { success: true } };
    }

    // DELETE STORE IMAGE MOCK
    if (cleanUrl.startsWith('/store/images/')) {
      const imageId = parseInt(cleanUrl.split('/').pop());
      let stores = JSON.parse(localStorage.getItem('wn_stores') || '[]');
      stores = stores.map(store => {
        if (store.images) {
          store.images = store.images.filter(img => img.id !== imageId);
        }
        return store;
      });
      localStorage.setItem('wn_stores', JSON.stringify(stores));
      return { data: { success: true } };
    }

    return { data: { success: false, message: 'Mock endpoint not found' } };
  }
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500&q=60';
  return imagePath;
};

export default api;
