'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Truck, Package, BookOpen, Star,
  Bell, Tag, Grid3X3, LogOut, Menu, Loader2, X, ChevronDown, Share2, UserCog,
  Newspaper, LifeBuoy, KeyRound, Eye, EyeOff
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getSession, getUser, clearSession } from '@/lib/auth';
import { adminApi } from '@/api/adminApi';
import { AdminUser } from '@/lib/types';
import { canAccessPermission, canAccessRoute } from '@/lib/permissions';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  permissionKey?: string;
  children?: { href: string; label: string }[];
}

const navItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permissionKey: 'dashboard' },
  {
    href: '#masters',
    label: 'Masters',
    icon: Grid3X3,
    permissionKey: 'masters',
    children: [
      { href: '/admin/masters/services', label: 'Services' },
      // { href: '/admin/masters/pending-service-approvals', label: 'Pending Services' },
      { href: '/admin/masters/event-slots', label: 'Event Slots' },
      { href: '/admin/masters/price-units', label: 'Price Units' },
      { href: '/admin/masters/coupons', label: 'Coupons' },
      { href: '/admin/masters/countries', label: 'Countries' },
      { href: '/admin/masters/states', label: 'States' },
      { href: '/admin/masters/cities', label: 'Cities' },
      { href: '/admin/masters/categories', label: 'Categories' },
      { href: '/admin/masters/visa-type', label: 'Visa Type' },
      { href: '/admin/masters/email-templates', label: 'Email Templates' },
      { href: '/admin/masters/event-master', label: 'Event Master' },
      { href: '/admin/masters/our-previous-work', label: 'Our Previous Work' },
    ],
  },
  { href: '/admin/role-permission', label: 'Role-Permission', icon: UserCog, permissionKey: 'role-permission' },
  {
    href: '#userManagement',
    label: 'User Management',
    icon: Users,
    permissionKey: 'users',
    children: [
      { href: '/admin/users', label: 'User List' },
      { href: '/admin/users-lead', label: 'User Leads' },
    ],
  },
  {
    href: '#vendors',
    label: 'Vendors',
    icon: Truck,
    permissionKey: 'vendors',
    children: [
      { href: '/admin/vendors', label: 'Vendor List' },
      { href: '/admin/lead-vendor', label: 'Lead Vendor' },
    ],
  },
  { href: '/admin/vendor-services', label: 'Vendor Services', icon: Package, permissionKey: 'vendor-services' },
  {
    href: '#packages',
    label: 'Packages',
    icon: Tag,
    permissionKey: 'packages',
    children: [
      { href: '/admin/packages/all-packages', label: 'All Packages' },
      { href: '/admin/packages/promotion-packages', label: 'Promotion Packages' },
    ],
  },
  { href: '/admin/booking-management', label: 'Booking Management', icon: BookOpen, permissionKey: 'bookings' },
  { href: '/admin/support', label: 'Help & Support', icon: LifeBuoy, permissionKey: 'support' },
  { href: '/admin/feedback-testimonial', label: 'Feedback & Testimonial', icon: Star, permissionKey: 'feedback' },
  { href: '/admin/system-notifications', label: 'System Notifications', icon: Bell, permissionKey: 'notifications' },
  { href: '/admin/affiliate-links', label: 'Affiliate-Links', icon: Share2, permissionKey: 'affiliate-links' },
  { href: '/admin/blog', label: 'Blogs', icon: Newspaper, permissionKey: 'blog' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [mastersOpen, setMastersOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [vendorsOpen, setVendorsOpen] = useState(false);
  const [packagesOpen, setPackagesOpen] = useState(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const permissions = admin?.permissions ?? [];

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (pathname !== '/admin/login' && !getSession()) {
      router.replace('/admin/login');
      return;
    }
    const currentUser = getUser();
    setAdmin(currentUser);
    if (pathname.startsWith('/admin/masters')) setMastersOpen(true);
    if (pathname.startsWith('/admin/users') || pathname.startsWith('/admin/users-lead')) setUserManagementOpen(true);
    if (pathname.startsWith('/admin/vendors') || pathname.startsWith('/admin/lead-vendor')) setVendorsOpen(true);
    if (pathname.startsWith('/admin/packages')) setPackagesOpen(true);
    if (pathname !== '/admin/login' && currentUser?.permissions?.length && !canAccessRoute(pathname, currentUser.permissions)) {
      const fallback = currentUser.permissions.find((permission) => permission.view && permission.routes.length > 0)?.routes[0] ?? '/admin/dashboard';
      router.replace(fallback);
    }
  }, [pathname, router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = admin
    ? `${admin.name?.split(' ')[0]?.charAt(0) ?? ''}${admin.name?.split(' ')[1]?.charAt(0) ?? ''}`.toUpperCase()
    : 'A';

  async function confirmLogout() {
    setLoggingOut(true);
    await adminApi.logout().catch(() => undefined);
    clearSession();
    router.replace('/admin/login');
  }

  function closeChangePasswordModal() {
    setShowChangePassword(false);
    setPasswordError('');
    setPasswordSuccess(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswords({ current: false, new: false, confirm: false });
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setPasswordLoading(true);
    try {
      await adminApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        closeChangePasswordModal();
      }, 1500);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  }

  if (pathname === '/admin/login') return <>{children}</>;

  const activeLabel =
    navItems.find(n => n.href === pathname)?.label ??
    navItems.flatMap(n => n.children ?? []).find(c => c.href === pathname)?.label ??
    'Admin Panel';

  const visibleNavItems = navItems.filter((item) => {
    if (!item.permissionKey || !permissions.length) return true;
    if (item.children?.length) {
      return canAccessPermission(item.permissionKey, permissions) || item.children.some((child) => canAccessRoute(child.href, permissions));
    }
    return canAccessPermission(item.permissionKey, permissions) || canAccessRoute(item.href, permissions);
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="h-14 flex items-center px-5 border-b border-gray-100 shrink-0">
          <Link href="https://event-stan.vercel.app" target="_blank" className="flex items-center gap-1">
            <span className="text-lg font-bold text-gray-900">Event</span>
            <span className="text-lg font-bold text-orange-500">Stan</span>
          </Link>
          <span className="ml-2 text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">Admin</span>
        </div>

        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{admin?.name ?? 'Admin User'}</p>
              <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">{admin?.email ?? 'admin@eventstan.com'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2.5 overflow-y-auto custom-scrollbar">
          <div className="space-y-0.5">
            {visibleNavItems.map(({ href, label, icon: Icon, badge, children, permissionKey }) => {
              const active = pathname === href;
              const isMastersActive = pathname.startsWith('/admin/masters');
              const isUserManagementActive = pathname.startsWith('/admin/users') || pathname.startsWith('/admin/users-lead');
              const isVendorsActive = pathname.startsWith('/admin/vendors') || pathname.startsWith('/admin/lead-vendor');
              const isPackagesActive = pathname.startsWith('/admin/packages');
              const visibleChildren = children?.filter((child) => !permissions.length || canAccessRoute(child.href, permissions)) ?? [];

              if (children && label === 'Masters' && visibleChildren.length) {
                return (
                  <div key={href}>
                    <button
                      onClick={() => setMastersOpen(o => !o)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${isMastersActive 
                          ? 'text-orange-600 font-semibold' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      <Icon
                        size={16}
                        className={`shrink-0 ${isMastersActive ? 'text-orange-500' : 'text-gray-400'}`}
                      />
                      <span className="flex-1 text-left truncate">{label}</span>
                      <ChevronDown
                        size={13}
                        className={`shrink-0 transition-transform duration-200 ${mastersOpen ? 'rotate-180' : ''} ${isMastersActive ? 'text-orange-400' : 'text-drak'}`}
                      />
                    </button>

                    {mastersOpen && (
                      <div className="ml-7 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2.5">
                        {visibleChildren.map(child => {
                          const isChildActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className={`block px-2.5 py-1.5 text-xs rounded-md transition-all font-medium
                                ${isChildActive
                                  ? 'text-orange-600 bg-transparent font-semibold'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              if (children && label === 'User Management' && visibleChildren.length) {
                return (
                  <div key={href}>
                    <button
                      onClick={() => setUserManagementOpen(o => !o)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${isUserManagementActive 
                          ? 'text-orange-600 font-semibold' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      <Icon
                        size={16}
                        className={`shrink-0 ${isUserManagementActive ? 'text-orange-500' : 'text-gray-400'}`}
                      />
                      <span className="flex-1 text-left truncate">{label}</span>
                      <ChevronDown
                        size={13}
                        className={`shrink-0 transition-transform duration-200 ${userManagementOpen ? 'rotate-180' : ''} ${isUserManagementActive ? 'text-orange-400' : 'text-drak'}`}
                      />
                    </button>

                    {userManagementOpen && (
                      <div className="ml-7 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2.5">
                        {visibleChildren.map(child => {
                          const isChildActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className={`block px-2.5 py-1.5 text-xs rounded-md transition-all font-medium
                                ${isChildActive
                                  ? 'text-orange-600 bg-transparent font-semibold'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              if (children && label === 'Vendors' && visibleChildren.length) {
                return (
                  <div key={href}>
                    <button
                      onClick={() => setVendorsOpen(o => !o)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${isVendorsActive 
                          ? 'text-orange-600 font-semibold' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      <Icon
                        size={16}
                        className={`shrink-0 ${isVendorsActive ? 'text-orange-500' : 'text-gray-400'}`}
                      />
                      <span className="flex-1 text-left truncate">{label}</span>
                      <ChevronDown
                        size={13}
                        className={`shrink-0 transition-transform duration-200 ${vendorsOpen ? 'rotate-180' : ''} ${isVendorsActive ? 'text-orange-400' : 'text-drak'}`}
                      />
                    </button>

                    {vendorsOpen && (
                      <div className="ml-7 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2.5">
                        {visibleChildren.map(child => {
                          const isChildActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className={`block px-2.5 py-1.5 text-xs rounded-md transition-all font-medium
                                ${isChildActive
                                  ? 'text-orange-600 bg-transparent font-semibold'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              if (children && label === 'Packages' && visibleChildren.length) {
                return (
                  <div key={href}>
                    <button
                      onClick={() => setPackagesOpen(o => !o)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${isPackagesActive 
                          ? 'text-orange-600 font-semibold' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      <Icon
                        size={16}
                        className={`shrink-0 ${isPackagesActive ? 'text-orange-500' : 'text-gray-400'}`}
                      />
                      <span className="flex-1 text-left truncate">{label}</span>
                      <ChevronDown
                        size={13}
                        className={`shrink-0 transition-transform duration-200 ${packagesOpen ? 'rotate-180' : ''} ${isPackagesActive ? 'text-orange-400' : 'text-drak'}`}
                      />
                    </button>

                    {packagesOpen && (
                      <div className="ml-7 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2.5">
                        {visibleChildren.map(child => {
                          const isChildActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className={`block px-2.5 py-1.5 text-xs rounded-md transition-all font-medium
                                ${isChildActive
                                  ? 'text-orange-600 bg-transparent font-semibold'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              if (permissionKey && permissions.length && !canAccessPermission(permissionKey, permissions) && !canAccessRoute(href, permissions)) {
                return null;
              }

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${active
                      ? 'text-orange-600 font-semibold bg-transparent'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <Icon
                    size={16}
                    className={`shrink-0 ${active ? 'text-orange-500' : 'text-gray-400'}`}
                  />
                  <span className="truncate">{label}</span>
                  {badge && (
                    <span className="ml-auto bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen min-w-0">

        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-30">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </button>

          <div className="flex-1">
            <h1 className="text-sm font-semibold text-gray-800">{activeLabel}</h1>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-all focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                {initials}
              </div>
              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{admin?.name ?? 'Admin User'}</p>
                      <p className="text-xs text-gray-500 truncate">{admin?.email ?? 'admin@eventstan.com'}</p>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowChangePassword(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <KeyRound size={16} />
                    <span>Change Password</span>
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowLogout(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto overflow-x-hidden custom-scrollbar min-w-0">
          {children}
        </main>
      </div>

      {showLogout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogout(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col items-center gap-4">
            <button onClick={() => setShowLogout(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <LogOut size={24} className="text-red-500" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900">Sign out?</h2>
              <p className="text-sm text-gray-500 mt-1">You will be logged out of the admin panel.</p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowLogout(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                disabled={loggingOut}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loggingOut ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
                {loggingOut ? 'Signing out…' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangePassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!passwordLoading) closeChangePasswordModal();
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <button
              onClick={closeChangePasswordModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              disabled={passwordLoading}
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center gap-2 mb-5">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                <KeyRound size={22} className="text-orange-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
              <p className="text-sm text-gray-500 text-center">Update your account password</p>
            </div>

            {passwordSuccess ? (
              <div className="py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                  <KeyRound size={20} className="text-green-500" />
                </div>
                <p className="text-sm font-medium text-green-600">Password changed successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                {passwordError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-9 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="Enter current password"
                      disabled={passwordLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(s => ({ ...s, current: !s.current }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPasswords.current ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-9 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="Enter new password"
                      disabled={passwordLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(s => ({ ...s, new: !s.new }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPasswords.new ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-9 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="Re-enter new password"
                      disabled={passwordLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(s => ({ ...s, confirm: !s.confirm }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPasswords.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full mt-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {passwordLoading ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                  {passwordLoading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
}