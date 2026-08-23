import { PRODUCT_IMAGE_PLACEHOLDER } from './utils';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const cleanImagePath = (img: any) => {
  if (typeof img !== 'string') return img;
  if (img.startsWith('http')) return img;
  let cleanPath = img;
  if (cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.substring(4);
  } else if (cleanPath.startsWith('api/')) {
    cleanPath = cleanPath.substring(3);
  }
  return `${API_BASE_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

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
      ? images.map(cleanImagePath)
      : [PRODUCT_IMAGE_PLACEHOLDER],
    rejectionReason: product.rejection_reason ?? product.rejectionReason,
    vendor: product.vendor ?? {
      id: product.supplier_id,
      companyName: product.business_name || product.supplier_name || 'Verified Supplier',
      isTopSupplier: product.is_top_supplier,
    },
    // Direct Order (Buy Now) is on by default for every vendor unless they've explicitly opted
    // out — undefined/null (e.g. product list endpoints that don't join this field) must not be
    // read as "off".
    supplierAcceptsDirectOrders: product.supplier_accepts_direct_orders !== false,
  };
};

export const normalizeRfq = (rfq: any) => {
  const images = parseJsonField(rfq.product_images, []);
  const shippingDetails = parseJsonField(rfq.shipping_details, {});
  const responseDetails = parseJsonField(rfq.response_details, {});
  
  return {
    ...rfq,
    product_images: Array.isArray(images) && images.length > 0
      ? images.map(cleanImagePath)
      : [PRODUCT_IMAGE_PLACEHOLDER],
    shipping_details: shippingDetails,
    response_details: responseDetails,
    supplierId: rfq.supplier_id ?? rfq.supplierId,
  };
};

export const normalizeProfile = (profile: any) => {
  if (!profile) return null;
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

  const method = (options.method || 'GET').toUpperCase();

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Hardening: Ensure POST/PUT/PATCH/DELETE requests always have a body if JSON
  const fetchOptions = { ...options, headers };
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !fetchOptions.body && headers['Content-Type'] === 'application/json') {
    fetchOptions.body = JSON.stringify({});
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

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
    sendOtp: (email: string) =>
      apiFetch('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    verifyOtp: (email: string, code: string) =>
      apiFetch('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      }),
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
    list: async () => {
      const rfqs = await apiFetch('/rfqs');
      return Array.isArray(rfqs) ? rfqs.map(normalizeRfq) : [];
    },
    get: async (id: string) => normalizeRfq(await apiFetch(`/rfqs/${id}`)),
    getTimeline: (id: string) => apiFetch(`/rfqs/${id}/timeline`),
    create: (data: any) => apiFetch('/rfqs', { method: 'POST', body: JSON.stringify(data) }),
    forward: (id: string, supplier_id: string) =>
      apiFetch(`/rfqs/${id}/forward`, { method: 'POST', body: JSON.stringify({ supplier_id }) }),
    submitQuote: (id: string, quoteDetails: any) =>
      apiFetch(`/rfqs/${id}/quote`, { method: 'POST', body: JSON.stringify(quoteDetails) }),
    getQuoteEstimate: (id: string, price: number, discountType?: 'percentage' | 'flat', discountValue?: number, discountAbsorbedBy?: 'seller' | 'platform' | 'split') =>
      apiFetch(`/rfqs/${id}/quote-estimate?price=${price}${discountValue ? `&discountType=${discountType || 'percentage'}&discountValue=${discountValue}&discountAbsorbedBy=${discountAbsorbedBy || 'seller'}` : ''}`),
    approveQuote: (id: string, approval: { status: 'approved' | 'rejected', rejection_reason?: string, admin_notes?: string, discountType?: 'percentage' | 'flat', discountValue?: number, discountAbsorbedBy?: 'seller' | 'platform' | 'split' }) =>
      apiFetch(`/rfqs/${id}/approve-quote`, { method: 'POST', body: JSON.stringify(approval) }),
    acceptQuote: (id: string) =>
      apiFetch(`/rfqs/${id}/accept`, { method: 'POST' }),
    updateFulfillment: (id: string, data: any) =>
      apiFetch(`/rfqs/${id}/fulfillment`, { method: 'PATCH', body: JSON.stringify(data) }),
    uploadShippingProof: (id: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiFetch(`/rfqs/${id}/shipping-proof`, { method: 'POST', body: formData, headers: {} });
    },
    togglePrivacy: (id: string, share_buyer_details: boolean) =>
      apiFetch(`/rfqs/${id}/privacy`, { method: 'PATCH', body: JSON.stringify({ share_buyer_details }) }),
    adminModify: (id: string, price: number, quantity: number, notes?: string) =>
      apiFetch(`/rfqs/${id}/admin-modify`, { method: 'POST', body: JSON.stringify({ price, quantity, notes }) }),
    buyerConfirm: (id: string, source: string, price?: number, quantity?: number, notes?: string) =>
      apiFetch(`/rfqs/${id}/buyer-confirm`, { method: 'POST', body: JSON.stringify({ source, price, quantity, notes }) }),
    sellerCounter: (id: string, price: number, quantity: number, notes?: string) =>
      apiFetch(`/rfqs/${id}/seller-counter`, { method: 'POST', body: JSON.stringify({ price, quantity, notes }) }),
    adminApproveCounter: (id: string) =>
      apiFetch(`/rfqs/${id}/admin-approve-counter`, { method: 'POST' }),
    forwardToSeller: (id: string) =>
      apiFetch(`/rfqs/${id}/forward-to-seller`, { method: 'POST' }),
    sellerAccept: (id: string) =>
      apiFetch(`/rfqs/${id}/seller-accept`, { method: 'POST' }),
    sendPaymentRequest: (id: string, discountType?: 'percentage' | 'flat', discountValue?: number, discountAbsorbedBy?: 'seller' | 'platform' | 'split') =>
      apiFetch(`/rfqs/${id}/payment-request`, { method: 'POST', body: JSON.stringify({ discountType, discountValue, discountAbsorbedBy }) }),
    buyerSubmitPayment: (id: string, paymentReference: string) =>
      apiFetch(`/rfqs/${id}/buyer-submit-payment`, { method: 'POST', body: JSON.stringify({ paymentReference }) }),
    adminConfirmPayment: (id: string) =>
      apiFetch(`/rfqs/${id}/admin-confirm-payment`, { method: 'POST' }),
    releasePayment: (id: string) =>
      apiFetch(`/rfqs/${id}/release-payment`, { method: 'POST' }),
    toggleDirectChat: (id: string, active: boolean) =>
      apiFetch(`/rfqs/${id}/toggle-direct-chat`, { method: 'POST', body: JSON.stringify({ active }) }),
    createNegotiatedOffer: (id: string, negotiatedPrice: number, quantity: number, discountPercentage?: number) =>
      apiFetch(`/rfqs/${id}/offer`, { method: 'POST', body: JSON.stringify({ negotiatedPrice, quantity, discountPercentage }) }),
    getActiveOffer: (id: string) => apiFetch(`/rfqs/${id}/offer`),
    // Legacy/Generic actions
    buyerAction: (id: string, action: string, notes?: string) =>
      apiFetch(`/rfqs/${id}/buyer-action`, { method: 'PATCH', body: JSON.stringify({ action, notes }) }),
    vendorAction: (id: string, action: string, notes?: string) =>
      apiFetch(`/rfqs/${id}/vendor-action`, { method: 'PATCH', body: JSON.stringify({ action, notes }) }),
    updateCancellation: (id: string, status: 'approved' | 'rejected', opts?: { fee?: number, liable_party?: 'buyer' | 'seller' | 'none', admin_notes?: string }) =>
      apiFetch(`/rfqs/${id}/cancellation`, { method: 'PATCH', body: JSON.stringify({ status, ...opts }) }),
    // Direct Order (instant Buy Now, no negotiation)
    forwardDirectOrder: (id: string, discountType?: 'percentage' | 'flat', discountValue?: number, discountAbsorbedBy?: 'seller' | 'platform' | 'split') =>
      apiFetch(`/rfqs/${id}/direct-order/forward`, { method: 'POST', body: JSON.stringify({ discountType, discountValue, discountAbsorbedBy }) }),
    acceptDirectOrder: (id: string) =>
      apiFetch(`/rfqs/${id}/direct-order/accept`, { method: 'POST' }),
    declineDirectOrder: (id: string, reason?: string) =>
      apiFetch(`/rfqs/${id}/direct-order/decline`, { method: 'POST', body: JSON.stringify({ reason }) }),
  },
  messages: {
    send: (receiver_id: string | null, content: string, chat_group_id?: string | null, metadata?: any) => 
      apiFetch('/messages', { 
        method: 'POST', 
        body: JSON.stringify({ 
          receiver_id, 
          chat_group_id, 
          content, 
          metadata 
        }) 
      }),
    getConversations: () => apiFetch('/messages/conversations'),
    getHistory: (id: string, isGroup = false) => 
      apiFetch(`/messages/history/${id}${isGroup ? '?isGroup=true' : ''}`),
    markAsRead: (id: string, isGroup = false) => 
      apiFetch(`/messages/read/${id}${isGroup ? '?isGroup=true' : ''}`, { method: 'PATCH', body: JSON.stringify({}) }),
    toggleIntervention: (chatGroupId: string, canIntervene: boolean) =>
      apiFetch(`/messages/group/${chatGroupId}/intervene`, { 
        method: 'PATCH', 
        body: JSON.stringify({ canIntervene }) 
      }),
    getNotifications: () => apiFetch('/messages/notifications'),
    getSystemNotifications: () => apiFetch('/notifications'),
    markSystemAsRead: (id: string) => apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllSystemAsRead: () => apiFetch('/notifications/read-all', { method: 'PATCH' }),
    deleteSystemNotification: (id: string) => apiFetch(`/notifications/${id}`, { method: 'DELETE' }),
    clearAllSystemNotifications: () => apiFetch('/notifications/clear-all', { method: 'DELETE' }),
    getMaintenanceStatus: () => apiFetch('/maintenance-status'),
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
  admin: {
    getSettings: () => apiFetch('/admin/settings'),
    updateSettings: (data: any) => apiFetch('/admin/settings', { method: 'PATCH', body: JSON.stringify(data) }),
    getGlobalConfig: () => apiFetch('/admin/global-config'),
    updateGlobalConfig: (data: any) => apiFetch('/admin/global-config', { method: 'PATCH', body: JSON.stringify(data) }),
    getStats: () => apiFetch('/admin/stats'),
  },
  waitlist: {
    submit: (email: string) => apiFetch('/waitlist', { method: 'POST', body: JSON.stringify({ email }) }),
    list: () => apiFetch('/waitlist/admin/list'),
    remove: (id: string) => apiFetch(`/waitlist/admin/${id}`, { method: 'DELETE' }),
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
    create: (data: any) => apiFetch('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) => apiFetch(`/categories/${id}`, { method: 'DELETE' }),
  },
  genesis: {
    reset: (secret: string) => 
      apiFetch('/genesis/reset', { 
        method: 'POST', 
        headers: { 'x-genesis-secret': secret } 
      }),
    createAdmin: (secret: string) => 
      apiFetch('/genesis/create-admin', { 
        method: 'POST', 
        headers: { 'x-genesis-secret': secret } 
      }),
  },
  orders: {
    listBuyer: async () => {
      const data = await api.rfqs.list();
      return data.filter((r: any) => 
        r.is_direct_order === true || 
        ['ordered', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled'].includes(r.status)
      );
    },
    listVendor: async () => {
      const data = await api.rfqs.list();
      return data.filter((r: any) => 
        r.is_direct_order === true || 
        ['ordered', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled'].includes(r.status)
      );
    },
    getById: (id: string) => apiFetch(`/rfqs/${id}`),
    updateFulfillment: (id: string, status: string, trackingDetails?: any) =>
      api.rfqs.updateFulfillment(id, { status, shipping_details: trackingDetails }),
    submitFeedback: (id: string, data: { rating: number, text: string }) =>
      apiFetch(`/rfqs/${id}/feedback`, { method: 'PATCH', body: JSON.stringify(data) })
  },
  public: {
    getConfig: () => apiFetch('/public/config')
  }
};
