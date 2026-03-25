const API_URL = import.meta.env.PUBLIC_API_URL;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers: optHeaders, ...restOptions } = options ?? {};
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...optHeaders },
    ...restOptions,
  });
  if (!res.ok) {
    if (res.status === 401) {
      // Token expired or invalid — clear session and redirect to login
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('nh_token');
        sessionStorage.removeItem('nh_user');
        window.location.href = '/admin-nh-7x9k2m/login';
      }
    }
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || 'Error desconocido');
  }
  return res.json();
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// --- Public ---
export const publicApi = {
  getConfig: () => request('/api/public/config'),
  getServices: () => request('/api/public/services'),
  getGallery: () => request('/api/public/gallery'),
  getSchedule: (week: string) => request(`/api/public/schedule?week=${week}`),
  getAvailability: (date: string, serviceId?: string) =>
    request(`/api/public/availability?date=${date}${serviceId ? `&service_id=${serviceId}` : ''}`),
  createAppointment: (data: unknown) =>
    request('/api/public/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// --- Auth ---
export const authApi = {
  login: (email: string, password: string) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: (token: string) =>
    request('/api/auth/logout', {
      method: 'POST',
      headers: authHeaders(token),
    }),
};

// --- Services ---
export const servicesApi = {
  list: (token: string) => request('/api/services/', { headers: authHeaders(token) }),
  create: (token: string, data: unknown) =>
    request('/api/services/', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),
  update: (token: string, id: string, data: unknown) =>
    request(`/api/services/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),
  delete: (token: string, id: string) =>
    request(`/api/services/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),
};

// --- Appointments ---
export const appointmentsApi = {
  list: (token: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/api/appointments/${qs}`, { headers: authHeaders(token) });
  },
  create: (token: string, data: unknown) =>
    request('/api/appointments/', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),
  update: (token: string, id: string, data: unknown) =>
    request(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),
  updateStatus: (token: string, id: string, status: string) =>
    request(`/api/appointments/${id}/status`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ status }),
    }),
  delete: (token: string, id: string) =>
    request(`/api/appointments/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),
};

// --- Gallery ---
export const galleryApi = {
  list: (token: string) => request('/api/gallery/', { headers: authHeaders(token) }),
  create: (token: string, data: unknown) =>
    request('/api/gallery/', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),
  update: (token: string, id: string, data: unknown) =>
    request(`/api/gallery/${id}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),
  delete: (token: string, id: string) =>
    request(`/api/gallery/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),
};

// --- Schedule ---
export const scheduleApi = {
  get: (token: string, week: string) =>
    request(`/api/schedule/?week=${week}`, { headers: authHeaders(token) }),
  upsert: (token: string, data: unknown) =>
    request('/api/schedule/', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),
};

// --- Config ---
export const configApi = {
  get: (token: string) => request('/api/config/', { headers: authHeaders(token) }),
  update: (token: string, data: unknown) =>
    request('/api/config/', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(data),
    }),
};

// --- Upload ---
export const uploadApi = {
  upload: async (token: string, file: File, folder: string, name: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
    form.append('name', name);
    const res = await fetch(`${API_URL}/api/upload/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) throw new Error('Error subiendo imagen');
    return res.json();
  },
  delete: (token: string, image_url: string) =>
    request('/api/upload/image', {
      method: 'DELETE',
      headers: authHeaders(token),
      body: JSON.stringify({ image_url }),
    }),
};

// --- Dashboard ---
export const dashboardApi = {
  summary: (token: string) =>
    request('/api/dashboard/summary', { headers: authHeaders(token) }),
  revenue: (token: string, period: string, date?: string) =>
    request(`/api/dashboard/revenue?period=${period}${date ? `&date=${date}` : ''}`, {
      headers: authHeaders(token),
    }),
  appointmentsStats: (token: string, period: string, date?: string) =>
    request(`/api/dashboard/appointments-stats?period=${period}${date ? `&date=${date}` : ''}`, {
      headers: authHeaders(token),
    }),
  servicesStats: (token: string, period: string, date?: string) =>
    request(`/api/dashboard/services-stats?period=${period}${date ? `&date=${date}` : ''}`, {
      headers: authHeaders(token),
    }),
};
