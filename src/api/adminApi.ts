import { BASE_API_URL } from '@/lib/constants';
import { clearSession, getToken } from '@/lib/auth';

type JsonBody = Record<string, unknown> | unknown[];

function authHeaders(token?: string | null): HeadersInit {
  const accessToken = token ?? getToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken.replace(/^Bearer\s+/i, '')}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_API_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      clearSession();
      if (!window.location.pathname.endsWith('/admin/login')) {
        window.location.replace('/admin/login');
      }
    }
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.message || errorBody?.error || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function jsonOptions(method: string, body?: JsonBody, token?: string | null): RequestInit {
  return {
    method,
    headers: authHeaders(token),
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
}

// Helper function to generate a public asset URL with a date-based folder
// structure. Used for BOTH images and videos so that every uploaded asset
// (cover images, in-content images, in-content videos) ends up with the
// same consistent, production-safe URL — regardless of what host the
// upload API itself happens to be running on (e.g. localhost in dev).
function generateAssetUrl(filename: string, folder: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `https://api.eventstan.com/api/v1/uploads/images/${folder}/${today}/${filename}`;
}

// Extracts a filename from an upload API response, falling back to a
// generated unique name if the response doesn't give us one.
function resolveUploadedFilename(
  result: { url?: string; key?: string },
  file: File,
): string {
  if (result.url) {
    const urlParts = result.url.split('/');
    return urlParts[urlParts.length - 1];
  }
  if (result.key) {
    const keyParts = result.key.split('/');
    return keyParts[keyParts.length - 1];
  }
  const extension = file.name.split('.').pop();
  const uniqueId = crypto.randomUUID?.() || Date.now().toString();
  return `${uniqueId}.${extension}`;
}

export const adminApi = {
  uploads: {
    image: async (file: File, folder = 'admin') => {
      const body = new FormData();
      body.append('file', file);

      const response = await fetch(`${BASE_API_URL}uploads/images?folder=${encodeURIComponent(folder)}`, {
        method: 'POST',
        body,
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : undefined,
      });

      if (!response.ok) throw new Error(`Image upload failed: ${response.status}`);

      const result = await response.json() as { bucket: string; key: string; url: string; contentType: string; size: number };

      const filename = resolveUploadedFilename(result, file);
      const imageUrl = generateAssetUrl(filename, folder);

      return {
        ...result,
        url: imageUrl,
        filename,
      };
    },

    // Dedicated video uploader. Mirrors `image()` so that in-content videos
    // (e.g. from RichTextEditor's onVideoUpload) get the same consistent,
    // production-safe URL rewrite as images do.
    video: async (file: File, folder = 'blogs/videos') => {
      const body = new FormData();
      body.append('file', file);

      const response = await fetch(`${BASE_API_URL}uploads/files?folder=${encodeURIComponent(folder)}`, {
        method: 'POST',
        body,
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : undefined,
      });

      if (!response.ok) throw new Error(`Video upload failed: ${response.status}`);

      const result = await response.json() as { bucket: string; key: string; url: string; contentType: string; size: number };

      const filename = resolveUploadedFilename(result, file);
      const videoUrl = generateAssetUrl(filename, folder);

      return {
        ...result,
        url: videoUrl,
        filename,
      };
    },

    file: async (file: File, folder = 'files') => {
      const body = new FormData();
      body.append('file', file);

      const response = await fetch(`${BASE_API_URL}uploads/files?folder=${encodeURIComponent(folder)}`, {
        method: 'POST',
        body,
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : undefined,
      });

      if (!response.ok) throw new Error(`File upload failed: ${response.status}`);
      return response.json() as Promise<{ bucket: string; key: string; url: string; contentType: string; size: number }>;
    },
  },

  login: (payload: { email: string; password: string }) =>
    request<any>('auth/login', jsonOptions('POST', payload)),

  dashboard: (token?: string | null) =>
    request<any>('dashboard', jsonOptions('GET', undefined, token)),

  profile: () => request<any>('auth/me', { headers: authHeaders() }),
  logout: () => request<any>('auth/logout', jsonOptions('POST')),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request<any>('auth/change-password', jsonOptions('POST', payload)),

  userLeads: {
    list: () => request<any[]>('user-leads'),
  },

  vendorLeads: {
    list: () => request<any[]>('vendor-leads'),
  },

  vendors: {
    list: () => request<any[]>('vendors'),
    getById: (id: string) => request<any>(`vendors/${encodeURIComponent(id)}`),
    create: (payload: JsonBody) => request<any>('vendors', jsonOptions('POST', payload)),
    update: (id: string, payload: JsonBody) => request<any>(`vendors/${id}`, jsonOptions('PUT', payload)),
    updateStatus: (id: string, status: string) =>
      request<any>(`vendors/${id}/status`, jsonOptions('PATCH', { status })),
    delete: (id: string) => request<void>(`vendors/${id}`, { method: 'DELETE' }),
  },

  categories: {
    list: () => request<any[]>('master-data/categories'),
    create: (payload: JsonBody) => request<any>('master-data/categories', jsonOptions('POST', payload)),
    update: (id: string, payload: JsonBody) =>
      request<any>(`master-data/categories/${id}`, jsonOptions('PUT', payload)),
    delete: (id: string) => request<void>(`master-data/categories/${id}`, { method: 'DELETE' }),
  },

  countries: {
    list: () => request<any[]>('master-data/countries'),
    create: (payload: JsonBody) => request<any>('master-data/countries', jsonOptions('POST', payload)),
    update: (id: number, payload: JsonBody) =>
      request<any>(`master-data/countries/${id}`, jsonOptions('PUT', payload)),
    delete: (id: number) => request<void>(`master-data/countries/${id}`, { method: 'DELETE' }),
  },

  states: {
    list: (countryId?: number) =>
      request<any[]>(`master-data/states${countryId ? `?countryId=${countryId}` : ''}`),
    create: (payload: JsonBody) => request<any>('master-data/states', jsonOptions('POST', payload)),
    update: (id: string, payload: JsonBody) =>
      request<any>(`master-data/states/${id}`, jsonOptions('PUT', payload)),
    delete: (id: string) => request<void>(`master-data/states/${id}`, { method: 'DELETE' }),
  },

  cities: {
    list: (countryId?: number, stateId?: string) => {
      const params = new URLSearchParams();
      if (countryId) params.set('countryId', String(countryId));
      if (stateId) params.set('stateId', stateId);
      const query = params.toString();
      return request<any[]>(`master-data/cities${query ? `?${query}` : ''}`);
    },
    create: (payload: JsonBody) => request<any>('master-data/cities', jsonOptions('POST', payload)),
    update: (id: string, payload: JsonBody) =>
      request<any>(`master-data/cities/${id}`, jsonOptions('PUT', payload)),
    delete: (id: string) => request<void>(`master-data/cities/${id}`, { method: 'DELETE' }),
  },

  coupons: {
    list: () => request<any[]>('coupons'),
    create: (payload: JsonBody) => request<any>('coupons', jsonOptions('POST', payload)),
    update: (id: string, payload: JsonBody) => request<any>(`coupons/${id}`, jsonOptions('PUT', payload)),
    validate: (code: string, amount: number) =>
      request<any>(`coupons/${code}/validate?amount=${amount}`),
    updateStatus: (id: string, active: boolean) =>
      request<any>(`coupons/${id}`, jsonOptions('PATCH', { active })),
    delete: (id: string) => request<void>(`coupons/${id}`, { method: 'DELETE' }),
  },

  packages: {
    list: () => request<any[]>('packages'),
    get: (id: string) => request<any>(`packages/${id}`),
    update: (id: string, payload: JsonBody) => request<any>(`packages/${id}`, jsonOptions('PATCH', payload)),
    delete: (id: string) => request<void>(`packages/${id}`, jsonOptions('DELETE')),
  },

  services: {
    list: () => request<any[]>('services?includeAll=true'),
    create: (payload: JsonBody) => request<any>('services', jsonOptions('POST', payload)),
    update: (id: string, payload: JsonBody) => request<any>(`services/${id}`, jsonOptions('PUT', payload)),
    delete: (id: string) => request<void>(`services/${id}`, { method: 'DELETE' }),
  },

  subServices: {
    list: () => request<any[]>('services/sub-services'),
    create: (serviceId: string, payload: JsonBody) =>
      request<any>(`services/${serviceId}/sub-services`, jsonOptions('POST', payload)),
    update: (id: string, payload: JsonBody) =>
      request<any>(`services/sub-services/${id}`, jsonOptions('PUT', payload)),
    delete: (id: string) => request<void>(`services/sub-services/${id}`, { method: 'DELETE' }),
  },

  // Event Master (top-level events e.g. Wedding, Birthday Party, Corporate Event).
  // Endpoint: POST/GET/PUT/PATCH/DELETE /api/v1/event-masters
  eventMasters: {
    list: () => request<any[]>('event-masters'),
    get: (id: string | number) => request<any>(`event-masters/${id}`),
    create: (payload: JsonBody) => request<any>('event-masters', jsonOptions('POST', payload)),
    update: (id: string | number, payload: JsonBody) =>
      request<any>(`event-masters/${id}`, jsonOptions('PUT', payload)),
    updateStatus: (id: string | number, status: string) =>
      request<any>(`event-masters/${id}/status`, jsonOptions('PATCH', { status })),
    delete: (id: string | number) => request<void>(`event-masters/${id}`, { method: 'DELETE' }),
  },

  // Our Previous Work (portfolio showcase items).
  // Endpoint: POST/GET/PUT/PATCH/DELETE /api/v1/our-previous-work
  ourPreviousWork: {
    list: () => request<any[]>('our-previous-work'),
    get: (id: string | number) => request<any>(`our-previous-work/${id}`),
    create: (payload: JsonBody) => request<any>('our-previous-work', jsonOptions('POST', payload)),
    update: (id: string | number, payload: JsonBody) =>
      request<any>(`our-previous-work/${id}`, jsonOptions('PUT', payload)),
    updateStatus: (id: string | number, status: string) =>
      request<any>(`our-previous-work/${id}/status`, jsonOptions('PATCH', { status })),
    delete: (id: string | number) => request<void>(`our-previous-work/${id}`, { method: 'DELETE' }),
  },

  // Customer testimonials.
  // Endpoint: POST/GET/PUT/PATCH/DELETE /api/v1/testimonials
  testimonials: {
    list: () => request<any[]>('testimonials'),
    get: (id: string | number) => request<any>(`testimonials/${id}`),
    create: (payload: JsonBody) => request<any>('testimonials', jsonOptions('POST', payload)),
    update: (id: string | number, payload: JsonBody) =>
      request<any>(`testimonials/${id}`, jsonOptions('PUT', payload)),
    updateStatus: (id: string | number, status: string) =>
      request<any>(`testimonials/${id}/status`, jsonOptions('PATCH', { status })),
    delete: (id: string | number) => request<void>(`testimonials/${id}`, { method: 'DELETE' }),
  },

  eventSlots: {
    list: () => request<any[]>('master-data/event-slots'),
    create: (payload: JsonBody) => request<any>('master-data/event-slots', jsonOptions('POST', payload)),
    update: (id: number, payload: JsonBody) =>
      request<any>(`master-data/event-slots/${id}`, jsonOptions('PUT', payload)),
    delete: (id: number) => request<void>(`master-data/event-slots/${id}`, { method: 'DELETE' }),
  },

  priceUnits: {
    list: () => request<any[]>('master-data/price-units'),
    create: (payload: JsonBody) => request<any>('master-data/price-units', jsonOptions('POST', payload)),
    update: (id: string, payload: JsonBody) =>
      request<any>(`master-data/price-units/${id}`, jsonOptions('PUT', payload)),
    delete: (id: string) => request<void>(`master-data/price-units/${id}`, { method: 'DELETE' }),
  },

  visaTypes: {
    list: () => request<any[]>('master-data/visa-types'),
    create: (payload: JsonBody) => request<any>('master-data/visa-types', jsonOptions('POST', payload)),
    update: (id: number, payload: JsonBody) =>
      request<any>(`master-data/visa-types/${id}`, jsonOptions('PUT', payload)),
    delete: (id: number) => request<void>(`master-data/visa-types/${id}`, { method: 'DELETE' }),
  },

  emailTemplates: {
    list: () => request<any[]>('master-data/email-templates'),
    get: (id: number) => request<any>(`master-data/email-templates/${id}`),
    create: (payload: JsonBody) => request<any>('master-data/email-templates', jsonOptions('POST', payload)),
    update: (id: number, payload: JsonBody) =>
      request<any>(`master-data/email-templates/${id}`, jsonOptions('PUT', payload)),
    delete: (id: number) => request<void>(`master-data/email-templates/${id}`, { method: 'DELETE' }),
  },

  rolePermissions: {
    definitions: <T = unknown[]>() => request<T>('role-permission/definitions'),
    list: <T = unknown[]>() => request<T>('role-permission'),
    get: <T = unknown>(role: string) => request<T>(`role-permission/${encodeURIComponent(role)}`),
    update: <T = unknown>(role: string, payload: JsonBody) =>
      request<T>(`role-permission/${encodeURIComponent(role)}`, jsonOptions('PUT', payload)),
    patch: <T = unknown>(role: string, payload: JsonBody) =>
      request<T>(`role-permission/${encodeURIComponent(role)}`, jsonOptions('PATCH', payload)),
  },

  support: {
    list: <T = unknown[]>() => request<T>('support/tickets'),
    get: <T = unknown>(id: string) => request<T>(`support/tickets/${encodeURIComponent(id)}`),
    reply: <T = unknown>(id: string, payload: JsonBody) =>
      request<T>(`support/tickets/${encodeURIComponent(id)}/replies`, jsonOptions('POST', payload)),
    updateStatus: <T = unknown>(id: string, status: string) =>
      request<T>(`support/tickets/${encodeURIComponent(id)}/status`, jsonOptions('PATCH', { status })),
  },

  users: {
    list: (query = '') => request<any[]>(`users${query ? `?${query}` : ''}`),
    get: (id: string) => request<any>(`users/${id}`),
    create: (payload: JsonBody) => request<any>('users', jsonOptions('POST', payload)),
    update: (id: string, payload: JsonBody) => request<any>(`users/${id}`, jsonOptions('PATCH', payload)),
    delete: (id: string) => request<any>(`users/${id}`, jsonOptions('DELETE')),
  },

  bookings: {
    list: (status?: string) => request<any[]>(`bookings${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    get: (id: string) => request<any>(`bookings/${id}`),
    cancel: (id: string, reason: string) =>
      request<any>(`bookings/${id}/cancel`, jsonOptions('PATCH', { reason })),
    complete: (id: string) => request<any>(`bookings/${id}/complete`, jsonOptions('PATCH')),
  },

  reviews: {
    list: () => request<any[]>('reviews/admin/all'),
    approve: (id: string) => request<any>(`reviews/${id}/approve`, jsonOptions('PATCH')),
    reject: (id: string) => request<any>(`reviews/${id}/reject`, jsonOptions('PATCH')),
  },

  blogs: {
    list: () => request<any[]>('blogs?includeAll=true'),
    get: (id: string) => request<any>(`blogs/${id}`),
    create: (payload: JsonBody) => request<any>('blogs', jsonOptions('POST', payload)),
    update: (id: string, payload: JsonBody) => request<any>(`blogs/${id}`, jsonOptions('PATCH', payload)),
    delete: (id: string) => request<void>(`blogs/${id}`, jsonOptions('DELETE')),
  },

  notifications: {
    list: (status?: string) => request<any[]>(`notifications${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    create: (payload: JsonBody) => request<any>('notifications', jsonOptions('POST', payload)),
    markSent: (id: string) => request<any>(`notifications/${id}/sent`, jsonOptions('PATCH')),
    delete: (id: string) => request<void>(`notifications/${id}`, jsonOptions('DELETE')),
  },
};