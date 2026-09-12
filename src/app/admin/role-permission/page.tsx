'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Shield, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/admin/Button';
import ConfirmModal from '@/components/admin/ConfirmModal';
import Pagination from '@/components/admin/Pagination';
import { adminApi } from '@/api/adminApi';
import { canAccessPermission } from '@/lib/permissions';
import { getUser } from '@/lib/auth';
import type { RolePermission } from '@/lib/types';
import toast from 'react-hot-toast';

interface RolePermissionRow {
  role: string;
  name: string;
  description?: string | null;
  usersCount: number;
  status: string;
  permissions: RolePermission[];
}

export default function RolePermissionPage() {
  const [roles, setRoles] = useState<RolePermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selected, setSelected] = useState<RolePermissionRow | null>(null);
  const [pendingStatus, setPendingStatus] = useState<'Active' | 'Inactive'>('Inactive');
  const [currentPage, setCurrentPage] = useState(1);

  const currentUser = getUser();
  const permissions = currentUser?.permissions ?? [];

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await adminApi.rolePermissions.list<RolePermissionRow[]>();
      setRoles(data);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRoles();
  }, []);

  const rows = useMemo(() => roles, [roles]);
  const activeRoles = rows.filter((role) => role.status === 'Active').length;
  const totalUsers = rows.reduce((sum, role) => sum + role.usersCount, 0);

  const openStatusModal = (role: RolePermissionRow) => {
    setSelected(role);
    setPendingStatus(role.status === 'Active' ? 'Inactive' : 'Active');
    setIsStatusModalOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selected) return;
    try {
      const permissionsPayload = selected.permissions.map((permission) => ({ ...permission, view: permission.view, create: permission.create, edit: permission.edit, delete: permission.delete }));
      await adminApi.rolePermissions.update(selected.role, {
        name: selected.name,
        description: selected.description ?? '',
        isActive: pendingStatus === 'Active',
        permissions: permissionsPayload,
      });
      toast.success(`Role ${pendingStatus === 'Active' ? 'activated' : 'deactivated'} successfully!`);
      setIsStatusModalOpen(false);
      setSelected(null);
      await fetchRoles();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to update role');
    }
  };

  const totalPages = Math.max(1, Math.ceil(rows.length / 10));
  const paginatedData = rows.slice((currentPage - 1) * 10, currentPage * 10);

  if (loading) {
    return <div className="min-h-[40vh] flex items-center justify-center text-gray-500">Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Role & Permission Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {rows.length} roles · {activeRoles} active · {totalUsers} total users
          </p>
        </div>
        {canAccessPermission('role-permission', permissions) && (
          <Link href="/admin/role-permission/add">
            <Button>
              <Plus size={15} />
              Configure Role
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Roles" value={rows.length} tone="purple" icon={<Shield size={20} className="text-purple-500" />} />
        <StatCard label="Active Roles" value={activeRoles} tone="green" valueClass="text-green-600" icon={<Shield size={20} className="text-green-500" />} />
        <StatCard label="Inactive Roles" value={rows.length - activeRoles} tone="red" valueClass="text-red-600" icon={<Shield size={20} className="text-red-500" />} />
        <StatCard label="Total Users" value={totalUsers} tone="orange" valueClass="text-orange-600" icon={<Shield size={20} className="text-orange-500" />} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-left px-4 py-3">Permissions</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((role) => {
                const visiblePermissions = role.permissions.filter((permission) => permission.view);
                return (
                  <tr key={role.role} className="hover:bg-gray-50/70">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                          <Shield size={14} className="text-orange-500" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{role.name}</div>
                          <div className="text-xs text-gray-400">{role.usersCount} users</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{role.description}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {visiblePermissions.slice(0, 4).map((permission) => (
                          <span key={permission.key} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                            {permission.label}
                          </span>
                        ))}
                        {visiblePermissions.length > 4 && (
                          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-600">
                            +{visiblePermissions.length - 4} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${role.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {role.status}
                        </span>
                        {role.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => openStatusModal(role)}
                            className="text-gray-500 hover:text-orange-600 transition-colors"
                            title={role.status === 'Active' ? 'Deactivate' : 'Activate'}
                          >
                            {role.status === 'Active' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <Link href={`/admin/role-permission/edit/${role.role}`}>
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all" title="Edit">
                            <Edit size={14} />
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={rows.length}
          itemsPerPage={10}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <ConfirmModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelected(null);
        }}
        onConfirm={confirmStatusChange}
        title={pendingStatus === 'Active' ? 'Activate Role' : 'Deactivate Role'}
        message={`Are you sure you want to ${pendingStatus === 'Active' ? 'activate' : 'deactivate'} role "${selected?.name}"?`}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
  valueClass = 'text-gray-900',
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: 'purple' | 'green' | 'red' | 'orange';
  valueClass?: string;
}) {
  const toneClass: Record<'purple' | 'green' | 'red' | 'orange', string> = {
    purple: 'bg-purple-50',
    green: 'bg-green-50',
    red: 'bg-red-50',
    orange: 'bg-orange-50',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${toneClass[tone]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
