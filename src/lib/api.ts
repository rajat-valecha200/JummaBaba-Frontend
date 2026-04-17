const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('jb_token');
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

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
    logout: () => localStorage.removeItem('jb_token'),
  },
  products: {
    list: (status?: string) => apiFetch(`/products?status=${status || ''}`),
    create: (data: any) => apiFetch('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string, rejection_reason?: string) => 
      apiFetch(`/products/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, rejection_reason }) }),
  },
  rfqs: {
    list: () => apiFetch('/rfqs'),
    create: (data: any) => apiFetch('/rfqs', { method: 'POST', body: JSON.stringify(data) }),
  },
  messages: {
    send: (data: any) => apiFetch('/messages', { method: 'POST', body: JSON.stringify(data) }),
    list: (rfqId: string) => apiFetch(`/messages/${rfqId}`),
  },
  profiles: {
    list: (role?: string, status?: string) => apiFetch(`/profiles?role=${role || ''}&status=${status || ''}`),
    updateStatus: (id: string, status: string) => 
      apiFetch(`/profiles/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },
  stats: {
    get: (role: string) => apiFetch(`/stats/${role}`),
  }
};
