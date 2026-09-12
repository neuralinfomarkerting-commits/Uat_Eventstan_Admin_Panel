'use client';

import { useEffect, useState } from 'react';
import { Edit, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '@/api/adminApi';
import Button from '@/components/admin/Button';
import ConfirmModal from '@/components/admin/ConfirmModal';
import Input from '@/components/admin/Input';
import Modal from '@/components/admin/Modal';
import Pagination from '@/components/admin/Pagination';
import SearchableSelect from '@/components/admin/SearchableSelect';
import Table from '@/components/admin/Table';
import { Column } from '@/lib/types';
import toast from 'react-hot-toast';

interface VendorService { id: string; title: string; vendor_name?: string; }
interface VendorSubService {
  id: string;
  serviceId: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  imageUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  service?: { id: string; title: string; vendor?: { companyName: string; contactPerson: string } };
}

const emptyForm = {
  serviceId: '',
  title: '',
  description: '',
  amount: '',
  currency: 'AED',
  imageUrl: '',
  status: 'ACTIVE',
};

export default function SubservicesPage() {
  const [items, setItems] = useState<VendorSubService[]>([]);
  const [services, setServices] = useState<VendorService[]>([]);
  const [selected, setSelected] = useState<VendorSubService | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const load = async () => {
    const [svc, subs] = await Promise.all([adminApi.services.list(), adminApi.subServices.list()]);
    setServices(svc);
    setItems(subs);
  };

  useEffect(() => { load().catch(() => toast.error('Failed to load subservices')); }, []);

  const serviceName = (row: VendorSubService) => row.service?.title ?? services.find(s => s.id === row.serviceId)?.title ?? '-';

  const columns: Column[] = [
    { key: 'imageUrl', label: 'Image', render: (v: string) => v ? <img src={v} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><ImageIcon size={16} className="text-gray-400" /></div> },
    { key: 'title', label: 'Subservice' },
    { key: 'serviceId', label: 'Parent Service', render: (_: unknown, row: VendorSubService) => serviceName(row) },
    { key: 'amount', label: 'Price', render: (_: unknown, row: VendorSubService) => `${row.amount ?? 0} ${row.currency ?? 'AED'}` },
    { key: 'status', label: 'Status', render: (v: string, row: VendorSubService) => <button onClick={async () => { await adminApi.subServices.update(row.id, { status: v === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }); await load(); }} className={`px-2.5 py-1 rounded-full text-xs font-medium ${v === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{v}</button> },
    { key: 'actions', label: 'Actions', render: (_: unknown, row: VendorSubService) => <div className="flex gap-1"><button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50"><Edit size={14} /></button><button onClick={() => { setSelected(row); setDeleteOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button></div> },
  ];

  const openAdd = () => {
    setSelected(null);
    setForm({ ...emptyForm, serviceId: services[0]?.id ?? '' });
    setModalOpen(true);
  };

  const openEdit = (sub: VendorSubService) => {
    setSelected(sub);
    setForm({
      serviceId: sub.serviceId,
      title: sub.title,
      description: sub.description,
      amount: String(sub.amount ?? ''),
      currency: sub.currency ?? 'AED',
      imageUrl: sub.imageUrl ?? '',
      status: sub.status,
    });
    setModalOpen(true);
  };

  const upload = async (file?: File) => {
    if (!file) return;
    const result = await adminApi.uploads.image(file, 'subservices');
    setForm(prev => ({ ...prev, imageUrl: result.url }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceId || !form.title || !form.amount) return toast.error('Please fill parent service, title and price');
    const payload = {
      title: form.title,
      description: form.description || form.title,
      price: { amount: Number(form.amount), currency: form.currency },
      imageUrl: form.imageUrl,
      status: form.status,
    };
    if (selected) await adminApi.subServices.update(selected.id, payload);
    else await adminApi.subServices.create(form.serviceId, payload);
    toast.success(selected ? 'Subservice updated' : 'Subservice created');
    setModalOpen(false);
    await load();
  };

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const paginatedData = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-gray-900">Vendor Subservices</h1><p className="text-sm text-gray-500 mt-0.5">{items.length} subservices</p></div><Button onClick={openAdd}><Plus size={15} />Add Subservice</Button></div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Table columns={columns} data={paginatedData} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={items.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Subservice' : 'Add Subservice'} size="lg">
        <form onSubmit={save} className="space-y-4">
          <SearchableSelect options={services.map(s => ({ id: s.id, label: s.title }))} value={form.serviceId} onChange={id => setForm({ ...form, serviceId: String(id) })} disabled={!!selected} searchPlaceholder="Search services..." />
          <Input label="Subservice Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <Input label="Price" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 min-h-24" />
          <input type="file" accept="image/*" onChange={e => upload(e.target.files?.[0])} className="text-sm" />
          {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="w-20 h-20 rounded-xl object-cover" />}
          <SearchableSelect options={[{ id: 'ACTIVE', label: 'ACTIVE' }, { id: 'INACTIVE', label: 'INACTIVE' }]} value={form.status} onChange={id => setForm({ ...form, status: String(id) })} searchPlaceholder="Search..." />
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
      </Modal>
      <ConfirmModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={async () => { if (selected) await adminApi.subServices.delete(selected.id); setDeleteOpen(false); await load(); toast.success('Subservice deleted'); }} title="Delete Subservice" message={`Delete "${selected?.title}"?`} />
    </div>
  );
}