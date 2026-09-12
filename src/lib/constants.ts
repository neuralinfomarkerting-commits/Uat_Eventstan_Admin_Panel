// Use proxy in browser (avoids CORS), direct URL on server
const isServer = typeof window === 'undefined';

export const BASE_URL = isServer
  ? (process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? 'https://api.eventstan.com')
  // ? (process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? 'https://uatapi.eventstan.com')
  : '';

export const BASE_API_URL = isServer
  ? `${BASE_URL}/api/v1/`
  : '/api/proxy/';

const API_URL = BASE_API_URL.replace(/\/$/, '');

export const API_ENDPOINTS = {
  DASHBOARD: `${API_URL}/dashboard`,
  USERS: `${API_URL}/users`,
  VENDORS: `${API_URL}/vendors`,
  SERVICES: `${API_URL}/services`,
  SUBSERVICES: `${API_URL}/subservices`,
  EVENT_SLOTS: `${API_URL}/event-slots`,
  COUPONS: `${API_URL}/coupons`,
  COUNTRIES: `${API_URL}/countries`,
  EMAIL_TEMPLATES: `${API_URL}/email-templates`,
  ROLE_PERMISSION: `${API_URL}/role-permission`,
  VENDOR_SERVICES: `${API_URL}/vendor-services`,
  MARKETING_PACKAGES: `${API_URL}/marketing-packages`,
  BOOKINGS: `${API_URL}/bookings`,
  FEEDBACK: `${API_URL}/feedback`,
  NOTIFICATIONS: `${API_URL}/notifications`,
  AFFILIATE_LINKS: `${API_URL}/affiliate-links`,
  BLOGS: `${API_URL}/blogs`,
} as const;
