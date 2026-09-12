'use client';

import { AdminUser, UserData } from './types';

const TOKEN_KEY = 'admin-token';
const USER_KEY = 'admin-user';

export function saveSession(data: UserData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function getSession(): UserData | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);
  if (!token || !userStr) return null;
  try {
    return { token, user: JSON.parse(userStr) };
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string {
  return getSession()?.token ?? '';
}

export function getUser(): AdminUser | null {
  return getSession()?.user ?? null;
}
