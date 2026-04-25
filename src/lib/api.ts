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

  return {
    ...product,
    shortDescription: product.short_description ?? product.shortDescription,
    supplierId: product.supplier_id ?? product.supplierId,
    categoryId: product.category_id ?? product.categoryId,
    pricing_slabs: pricingSlabs,
    pricingSlabs,
    minPrice: Number(product.min_price ?? product.minPrice ?? 0),
    images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1582234057117-9c9ae625b035?w=600'],
    vendor: product.vendor ?? {
      id: product.supplier_id,
      companyName: product.business_name || product.supplier_name || 'Verified Supplier',
      isTopSupplier: product.is_top_supplier,
    },
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
    getMe: () => apiFetch('/auth/me'),
    changePassword: (currentPassword: string, newPassword: string) =>
      apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
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
    forward: (id: string) => apiFetch(`/rfqs/${id}/forward`, { method: 'PATCH' }),
    update: (id: string, data: any) => apiFetch(`/rfqs/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  messages: {
    send: (data: any) => apiFetch('/messages', { method: 'POST', body: JSON.stringify(data) }),
    list: (rfqId: string) => apiFetch(`/messages/${rfqId}`),
  },
  profiles: {
    me: () => apiFetch('/profiles/me'),
    meStats: () => apiFetch('/profiles/me/stats'),
    meActivity: () => apiFetch('/profiles/me/activity'),
    mePayouts: () => apiFetch('/profiles/me/payouts'),
    list: (role?: string, status?: string) => apiFetch(`/profiles?role=${role || ''}&status=${status || ''}`),
    updateStatus: (id: string, status: string) => 
      apiFetch(`/profiles/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    update: (id: string, data: any) => 
      apiFetch(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  stats: {
    get: (role: string) => apiFetch(`/public/stats/${role}`),
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
