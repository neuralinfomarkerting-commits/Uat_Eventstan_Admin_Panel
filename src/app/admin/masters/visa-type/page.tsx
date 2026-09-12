'use client';

import { useEffect, useState } from 'react';
import { BadgeCheck, Edit, Plus, Trash2 } from 'lucide-react';
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

interface VisaType { id: number; name: string; status: string; }

const emptyVisaType: Partial<VisaType> = { name: '', status: 'Active' };

export default function VisaTypesPage() {
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [selected, setSelected] = useState<VisaType | null>(null);
  const [form, setForm] = useState<Partial<VisaType>>(emptyVisaType);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const load = () => adminApi.visaTypes.list().then(setVisaTypes).catch(() => toast.error('Failed to load visa types'));
  useEffect(() => { load(); }, []);

  const totalPages = Math.ceil(visaTypes.length / ITEMS_PER_PAGE);
  const paginatedData = visaTypes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const columns: Column[] = [
    { key: 'srNo', label: 'Sr. No.', render: (_: unknown, row: VisaType) => (
      <span className="text-gray-600 font-medium">
        {paginatedData.findIndex(r => r.id === row.id) + 1 + (currentPage - 1) * ITEMS_PER_PAGE}
      </span>
    ) },
    { key: 'name', label: 'Visa Type', render: (v: string) => <div className="flex items-center gap-2"><BadgeCheck size={14} className="text-orange-400" /><span className="font-medium">{v}</span></div> },
    { key: 'status', label: 'Status', render: (v: string, row: VisaType) => (
      <button onClick={() => { setSelected(row); setStatusOpen(true); }} className={`px-2.5 py-1 rounded-full text-xs font-medium ${v === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{v}</button>
    ) },
    { key: 'actions', label: 'Actions', render: (_: unknown, row: VisaType) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setSelected(row); setForm(row); setModalOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50"><Edit size={14} /></button>
        <button onClick={() => { setSelected(row); setDeleteOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
      </div>
    ) },
  ];

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error('Please fill all required fields');
    const payload = { ...form };
    if (selected) await adminApi.visaTypes.update(selected.id, payload);
    else await adminApi.visaTypes.create(payload);
    toast.success(selected ? 'Visa type updated' : 'Visa type created');
    setModalOpen(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Visa Type Management</h1><p className="text-sm text-gray-500 mt-0.5">{visaTypes.length} visa types</p></div>
        <Button onClick={() => { setSelected(null); setForm(emptyVisaType); setModalOpen(true); }}><Plus size={15} />Add Visa Type</Button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Table columns={columns} data={paginatedData} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={visaTypes.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Visa Type' : 'Add Visa Type'}>
        <form onSubmit={save}>
          <Input label="Visa Type Name" value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g., UAE Work Visa" />
          <div className="mb-4"><SearchableSelect options={[{ id: 'Active', label: 'Active' }, { id: 'Inactive', label: 'Inactive' }]} value={form.status ?? 'Active'} onChange={id => setForm({ ...form, status: String(id) })} searchPlaceholder="Search..." /></div>
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
      </Modal>
      <ConfirmModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={async () => { if (selected) await adminApi.visaTypes.delete(selected.id); setDeleteOpen(false); load(); toast.success('Visa type deleted'); }} title="Delete Visa Type" message={`Delete "${selected?.name}"?`} />
      <ConfirmModal
        isOpen={statusOpen}
        onClose={() => setStatusOpen(false)}
        onConfirm={async () => {
          if (selected) {
            const newStatus = selected.status === 'Active' ? 'Inactive' : 'Active';
            await adminApi.visaTypes.update(selected.id, { status: newStatus });
            toast.success(`Visa type marked ${newStatus}`);
          }
          setStatusOpen(false);
          load();
        }}
        title={selected?.status === 'Active' ? 'Deactivate Visa Type' : 'Activate Visa Type'}
        message={`Are you sure you want to mark "${selected?.name}" as ${selected?.status === 'Active' ? 'Inactive' : 'Active'}?`}
      />
    </div>
  );
}