'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit, Eye, Loader2, Plus, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/adminApi';
import Button from '@/components/admin/Button';
import Input from '@/components/admin/Input';
import Modal from '@/components/admin/Modal';
import Pagination from '@/components/admin/Pagination';
import SearchableSelect from '@/components/admin/SearchableSelect';
import Table from '@/components/admin/Table';
import { Column } from '@/lib/types';

type UserRole = 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'SUPER_ADMIN';
interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = { name: '', email: '', phone: '', role: 'CUSTOMER' as UserRole, password: '' };

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminUserRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const perPage = 10;

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (role) params.set('role', role);
      setUsers(await adminApi.users.list(params.toString()));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [search, role]);

  const paged = useMemo(
    () => users.slice((page - 1) * perPage, page * perPage),
    [users, page],
  );

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (selected) {
        await adminApi.users.update(selected.id, {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          role: form.role,
        });
        toast.success('User updated');
      } else {
        await adminApi.users.create({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          role: form.role,
          password: form.password,
        });
        toast.success('User created');
      }
      setFormOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save user');
    }
  };

  const toggle = async (user: AdminUserRecord) => {
    try {
      await adminApi.users.update(user.id, { isActive: !user.isActive });
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update user');
    }
  };

  const columns: Column[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (value: string | null) => value || '-' },
    { key: 'role', label: 'Role', render: (value: string) => value.replace('_', ' ') },
    {
      key: 'isActive',
      label: 'Status',
      render: (value: boolean, user: AdminUserRecord) => (
        <button onClick={() => void toggle(user)} className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {value ? 'Active' : 'Inactive'}
          </span>
          {value ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
        </button>
      ),
    },
    { key: 'createdAt', label: 'Joined', render: (value: string) => new Date(value).toLocaleDateString() },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, user: AdminUserRecord) => (
        <div className="flex gap-2">
          <button onClick={() => { setSelected(user); setViewOpen(true); }} className="text-blue-500 hover:text-blue-700"><Eye size={15} /></button>
          <button onClick={() => {
            setSelected(user);
            setForm({ name: user.name, email: user.email, phone: user.phone || '', role: user.role, password: '' });
            setFormOpen(true);
          }} className="text-orange-500 hover:text-orange-700"><Edit size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users Management</h1>
          <p className="text-sm text-gray-500">{users.length} accounts from the live database</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void load()}><RefreshCw size={15} />Refresh</Button>
          <Button onClick={() => { setSelected(null); setForm(emptyForm); setFormOpen(true); }}><Plus size={15} />Add User</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, email, or phone" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm" />
        <SearchableSelect
          options={[{ id: '', label: 'All roles' }, ...['CUSTOMER', 'VENDOR', 'ADMIN', 'SUPER_ADMIN'].map((item) => ({ id: item, label: item }))]}
          value={role}
          onChange={(id) => { setRole(String(id)); setPage(1); }}
          placeholder="All roles"
          searchPlaceholder="Search roles..."
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin text-orange-500" /></div> : <Table columns={columns} data={paged} />}
        <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(users.length / perPage))} totalItems={users.length} itemsPerPage={perPage} onPageChange={setPage} />
      </div>

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={selected ? 'Edit User' : 'Add User'}>
        <form onSubmit={save}>
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {!selected && <Input label="Temporary Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />}
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Role</label>
          <div className="mb-5">
            <SearchableSelect
              options={['CUSTOMER', 'VENDOR', 'ADMIN', 'SUPER_ADMIN'].map((item) => ({ id: item, label: item }))}
              value={form.role}
              onChange={(id) => setForm({ ...form, role: String(id) as UserRole })}
              searchPlaceholder="Search roles..."
            />
          </div>
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
      </Modal>

      <Modal isOpen={viewOpen} onClose={() => setViewOpen(false)} title="User Details">
        {selected && <div className="space-y-3 text-sm">
          <p><strong>Name:</strong> {selected.name}</p><p><strong>Email:</strong> {selected.email}</p>
          <p><strong>Phone:</strong> {selected.phone || '-'}</p><p><strong>Role:</strong> {selected.role}</p>
          <p><strong>Status:</strong> {selected.isActive ? 'Active' : 'Inactive'}</p>
          <p><strong>Created:</strong> {new Date(selected.createdAt).toLocaleString()}</p>
        </div>}
      </Modal>
    </div>
  );
}
