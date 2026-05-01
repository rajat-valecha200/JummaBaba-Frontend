const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const parseJsonField = (value: any, fallback: any) => {
  if (typeof value !== 'string') return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const normalizeCategory = (category: any) => ({
  ...category,
  productCount: Number(category.productCount ?? category.product_count ?? 0),
  subcategories: Array.isArray(category.subcategories) ? category.subcategories : [],
});

export const normalizeProduct = (product: any) => {
  const pricingSlabs = parseJsonField(product.pricing_slabs ?? product.pricingSlabs, []);
  const images = parseJsonField(product.images, []);
  const specifications = parseJsonField(product.specifications, {});

  return {
    ...product,
    shortDescription: product.short_description ?? product.shortDescription,
    supplierId: product.supplier_id ?? product.supplierId,
    categoryId: product.category_id ?? product.categoryId,
    pricing_slabs: pricingSlabs,
    pricingSlabs,
    specifications,
    logistics: product.logistics || '',
    hasSample: product.has_sample ?? product.hasSample ?? false,
    samplePrice: Number(product.sample_price ?? product.samplePrice ?? 0),
    sampleMOQ: Number(product.sample_moq ?? product.sampleMOQ ?? 1),
    minPrice: Number(product.min_price ?? product.minPrice ?? 0),
    images: Array.isArray(images) && images.length > 0 
      ? images.map((img: any) => typeof img === 'string' && !img.startsWith('http') ? `${API_BASE_URL}${img.startsWith('/') ? '' : '/'}${img}` : img)
      : ['https://images.unsplash.com/photo-1582234057117-9c9ae625b035?w=600'],
    rejectionReason: product.rejection_reason ?? product.rejectionReason,
    vendor: product.vendor ?? {
      id: product.supplier_id,
      companyName: product.business_name || product.supplier_name || 'Verified Supplier',
      isTopSupplier: product.is_top_supplier,
    },
  };
};

export const normalizeProfile = (profile: any) => {
  const docs = profile.document_paths || profile.documents || {};
  const logo = profile.logo_url || profile.logo || docs.logo;
  
  const normalizedDocs: any = {};
  Object.keys(docs).forEach(key => {
    const val = docs[key];
    normalizedDocs[key] = val && typeof val === 'string' && !val.startsWith('http') 
      ? `${API_BASE_URL}${val.startsWith('/') ? '' : '/'}${val}` 
      : val;
  });

  return {
    ...profile,
    rejectionReason: profile.rejection_reason ?? profile.rejectionReason,
    logo: logo && typeof logo === 'string' 
      ? (logo.startsWith('http') ? logo : `${API_BASE_URL}${logo.startsWith('/') ? '' : '/'}${logo}`) 
      : 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
    companyName: profile.business_name || profile.full_name,
    documents: normalizedDocs,
    document_paths: normalizedDocs
  };
};

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('jb_token');
  const headers: any = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }
  return data;
}

export const api = {
  auth: {
    login: async (credentials: any) => {
      const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
      if (data.token) localStorage.setItem('jb_token', data.token);
      return data;
    },
    register: async (details: any) => {
      const data = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(details) });
      if (data.token) localStorage.setItem('jb_token', data.token);
      return data;
    },
    getMe: async () => {
      const data = await apiFetch('/auth/me');
      return normalizeProfile(data);
    },
    changePassword: (currentPassword: string, newPassword: string) =>
      apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    checkAvailability: (email?: string, phone?: string) =>
      apiFetch('/auth/check-availability', {
        method: 'POST',
        body: JSON.stringify({ email, phone }),
      }),
    logout: () => localStorage.removeItem('jb_token'),
  },
  products: {
    list: async (status?: string, supplierId?: string) => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (supplierId) params.set('supplier_id', supplierId);
      const suffix = params.toString() ? `?${params.toString()}` : '';
      const products = await apiFetch(`/products${suffix}`);
      return Array.isArray(products) ? products.map(normalizeProduct) : [];
    },
    publicList: async () => {
      const products = await apiFetch('/products/public');
      return Array.isArray(products) ? products.map(normalizeProduct) : [];
    },
    getById: async (id: string) => {
      const product = await apiFetch(`/products/${id}`);
      return normalizeProduct(product);
    },
    getBySlug: async (slug: string) => {
      const product = await apiFetch(`/products/slug/${slug}`);
      return normalizeProduct(product);
    },
    create: (data: any) => apiFetch('/products', { method: 'POST', body: JSON.stringify(data) }),
    createForm: (formData: FormData) => apiFetch('/products', { method: 'POST', body: formData, headers: {} }),
    update: (id: string, data: any) => apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateForm: (id: string, formData: FormData) => apiFetch(`/products/${id}`, { method: 'PUT', body: formData, headers: {} }),
    remove: (id: string) => apiFetch(`/products/${id}`, { method: 'DELETE' }),
    updateStatus: (id: string, status: string, rejection_reason?: string) =>
      apiFetch(`/products/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, rejection_reason }) }),
  },
  rfqs: {
    list: () => apiFetch('/rfqs'),
    create: (data: any) => apiFetch('/rfqs', { method: 'POST', body: JSON.stringify(data) }),
    forward: (id: string, supplier_id?: string) => 
      apiFetch(`/rfqs/${id}/forward`, { method: 'PATCH', body: JSON.stringify({ supplier_id }) }),
    update: (id: string, data: any) => apiFetch(`/rfqs/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
    updateQuoteStatus: (id: string, status: string, rejection_reason?: string, admin_notes?: string) =>
      apiFetch(`/rfqs/${id}/quote-status`, { method: 'PATCH', body: JSON.stringify({ status, rejection_reason, admin_notes }) }),
    buyerAction: (id: string, action: string, notes?: string) =>
      apiFetch(`/rfqs/${id}/buyer-action`, { method: 'PATCH', body: JSON.stringify({ action, notes }) }),
    vendorAction: (id: string, action: string, notes?: string) =>
      apiFetch(`/rfqs/${id}/vendor-action`, { method: 'PATCH', body: JSON.stringify({ action, notes }) }),
    updateCancellation: (id: string, status: 'approved' | 'rejected', admin_notes?: string) =>
      apiFetch(`/rfqs/${id}/cancellation`, { method: 'PATCH', body: JSON.stringify({ status, admin_notes }) }),
  },
  messages: {
    send: (receiver_id: string, content: string) => 
      apiFetch('/messages', { method: 'POST', body: JSON.stringify({ receiver_id, content }) }),
    getConversations: () => apiFetch('/messages/conversations'),
    getHistory: (otherUserId: string) => apiFetch(`/messages/history/${otherUserId}`),
    markAsRead: (otherUserId: string) => apiFetch(`/messages/read/${otherUserId}`, { method: 'PATCH', body: JSON.stringify({}) }),
    getNotifications: () => apiFetch('/messages/notifications'),
    getSystemNotifications: () => apiFetch('/notifications'),
    markSystemAsRead: (id: string) => apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllSystemAsRead: () => apiFetch('/notifications/read-all', { method: 'PATCH' }),
    deleteSystemNotification: (id: string) => apiFetch(`/notifications/${id}`, { method: 'DELETE' }),
    clearAllSystemNotifications: () => apiFetch('/notifications/clear-all', { method: 'DELETE' }),
  },
  profiles: {
    me: () => apiFetch('/profiles/me'),
    meStats: () => apiFetch('/profiles/me/stats'),
    meActivity: () => apiFetch('/profiles/me/activity'),
    mePayouts: () => apiFetch('/profiles/me/payouts'),
    list: (role?: string, status?: string) => apiFetch(`/profiles?role=${role || ''}&status=${status || ''}`),
    getPublicById: (id: string) => apiFetch(`/profiles/${id}/public`),
    updateStatus: (id: string, status: string, rejection_reason?: string) =>
      apiFetch(`/profiles/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, rejection_reason }) }),
    update: (id: string, data: any) =>
      apiFetch(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  stats: {
    get: async () => {
      return apiFetch('/profiles/me/stats');
    },
  },
  categories: {
    list: async () => {
      const categories = await apiFetch('/categories');
      return Array.isArray(categories) ? categories.map(normalizeCategory) : [];
    },
    publicList: async () => {
      const categories = await apiFetch('/categories/public');
      return Array.isArray(categories) ? categories.map(normalizeCategory) : [];
    },
  }
};
