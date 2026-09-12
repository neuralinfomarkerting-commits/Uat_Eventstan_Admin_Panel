export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  joined?: string;
}

export interface Vendor {
  id: number;
  name: string;
  email: string;
  category: string;
  status: string;
  rating: number;
}

export interface Service {
  id: number;
  name: string;
  category?: string;
  price?: number;
  status: string;
  image?: string;
}

export interface Booking {
  id: string;
  customer: string;
  vendor: string;
  amount: number;
  payment: '50%' | '100%';
  status: string;
  date: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  totalBookings: number;
  totalRevenue: number;
  pendingApprovals?: number;
  completedEvents?: number;
  avgRating?: number;
  growth?: number;
}

export interface AdminUser {
  id: string | number;
  name: string;
  email: string;
  role: string;
  permissions?: RolePermission[];
}

export interface UserData {
  token: string;
  user: AdminUser;
}

export interface RolePermission {
  key: string;
  label: string;
  panel: 'ADMIN' | 'VENDOR' | 'CUSTOMER';
  routes: string[];
  description: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}
