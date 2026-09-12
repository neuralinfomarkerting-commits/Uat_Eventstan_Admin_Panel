'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/admin/Button';
import Input from '@/components/admin/Input';
import SearchableSelect from '@/components/admin/SearchableSelect';
import { adminApi } from '@/api/adminApi';
import type { RolePermission } from '@/lib/types';
import toast from 'react-hot-toast';

interface PermissionDefinition {
  key: string;
  label: string;
  panel: 'ADMIN' | 'VENDOR' | 'CUSTOMER';
  routes: string[];
  description: string;
  actions: string[];
}

interface RolePermissionRow {
  role: string;
  name: string;
  description?: string | null;
  status: string;
  permissions: RolePermission[];
}

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const role = String(params?.id ?? 'ADMIN');
  const [definitions, setDefinitions] = useState<PermissionDefinition[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'Active',
  });
  const [perms, setPerms] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [defs, current] = await Promise.all([
        adminApi.rolePermissions.definitions<PermissionDefinition[]>(),
        adminApi.rolePermissions.get<RolePermissionRow>(role),
      ]);
      setDefinitions(defs);
      setForm({
        name: current.name,
        description: current.description ?? '',
        status: current.status,
      });
      setPerms(current.permissions);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to load role');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [role]);

  const filteredDefinitions = useMemo(
    () => definitions.filter((definition) => definition.panel === panelForRole(role)),
    [definitions, role],
  );

  const togglePerm = (module: string, key: PermissionToggleKey) => {
    setPerms(perms.map((permission) => (permission.key === module ? { ...permission, [key]: !permission[key] } : permission)));
  };

  const toggleAll = (key: PermissionToggleKey, value: boolean) => {
    setPerms(perms.map((permission) => ({ ...permission, [key]: value })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error('Please enter role name');
      return;
    }

    try {
      await adminApi.rolePermissions.update(role, {
        name: form.name,
        description: form.description,
        isActive: form.status === 'Active',
        permissions: perms,
      });
      toast.success('Role updated successfully!');
      router.push('/admin/role-permission');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to update role');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/role-permission">
          <button className="p-2 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Role</h1>
          <p className="text-sm text-gray-500 mt-0.5">Edit role and assign permissions</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Role Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              disabled={role === 'SUPER_ADMIN'}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <SearchableSelect
                options={[{ id: 'Active', label: 'Active' }, { id: 'Inactive', label: 'Inactive' }]}
                value={form.status}
                onChange={(id) => setForm({ ...form, status: String(id) })}
                searchPlaceholder="Search..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/admin/role-permission">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button type="submit">
                <Save size={15} />
                Update Role
              </Button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">Module Permissions</label>
            <div className="flex gap-2">
              {(['view', 'create', 'edit', 'delete'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleAll(key, true)}
                  className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded hover:bg-orange-100 transition capitalize"
                >
                  All {key}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPerms(perms.map((permission) => ({ ...permission, view: false, create: false, edit: false, delete: false })))}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 transition"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold text-xs uppercase">Module</th>
                  {(['view', 'create', 'edit', 'delete'] as const).map((key) => (
                    <th key={key} className="px-3 py-3 text-gray-600 font-semibold text-xs uppercase capitalize">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDefinitions.map((definition) => {
                  const permission = perms.find((item) => item.key === definition.key) ?? {
                    ...definition,
                    view: false,
                    create: false,
                    edit: false,
                    delete: false,
                  };
                  return (
                    <tr key={definition.key} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700 font-medium">{definition.label}</td>
                      {(['view', 'create', 'edit', 'delete'] as const).map((key) => (
                        <td key={key} className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(permission[key])}
                            onChange={() => togglePerm(definition.key, key)}
                            className="accent-orange-500 w-4 h-4 cursor-pointer"
                            disabled={role === 'SUPER_ADMIN'}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function panelForRole(role: string): 'ADMIN' | 'VENDOR' | 'CUSTOMER' {
  if (role === 'VENDOR') return 'VENDOR';
  if (role === 'CUSTOMER') return 'CUSTOMER';
  return 'ADMIN';
}

type PermissionToggleKey = 'view' | 'create' | 'edit' | 'delete';
