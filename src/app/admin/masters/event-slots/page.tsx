'use client';

import { useEffect, useState } from 'react';
import { Clock, Edit, Plus, Trash2 } from 'lucide-react';
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

interface EventSlot { id: number; name: string; startTime: string; endTime: string; duration: string; status: string; }

const emptySlot: Partial<EventSlot> = { name: '', startTime: '', endTime: '', status: 'Active' };

export default function EventSlotsPage() {
  const [slots, setSlots] = useState<EventSlot[]>([]);
  const [selected, setSelected] = useState<EventSlot | null>(null);
  const [form, setForm] = useState<Partial<EventSlot>>(emptySlot);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const load = () => adminApi.eventSlots.list().then(setSlots).catch(() => toast.error('Failed to load event slots'));
  useEffect(() => { load(); }, []);

  const duration = (start: string, end: string) => {
    if (!start || !end) return '';
    let hours = Number(end.split(':')[0]) - Number(start.split(':')[0]);
    if (hours < 0) hours += 24;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  };

  const columns: Column[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Slot Name', render: (v: string) => <div className="flex items-center gap-2"><Clock size={14} className="text-orange-400" /><span className="font-medium">{v}</span></div> },
    { key: 'startTime', label: 'Start Time' },
    { key: 'endTime', label: 'End Time' },
    { key: 'duration', label: 'Duration' },
    { key: 'status', label: 'Status', render: (v: string, row: EventSlot) => (
      <button onClick={async () => { await adminApi.eventSlots.update(row.id, { status: v === 'Active' ? 'Inactive' : 'Active' }); load(); }} className={`px-2.5 py-1 rounded-full text-xs font-medium ${v === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{v}</button>
    ) },
    { key: 'actions', label: 'Actions', render: (_: unknown, row: EventSlot) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setSelected(row); setForm(row); setModalOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50"><Edit size={14} /></button>
        <button onClick={() => { setSelected(row); setDeleteOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
      </div>
    ) },
  ];

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.startTime || !form.endTime) return toast.error('Please fill all required fields');
    const payload = { ...form, duration: duration(form.startTime, form.endTime) };
    if (selected) await adminApi.eventSlots.update(selected.id, payload);
    else await adminApi.eventSlots.create(payload);
    toast.success(selected ? 'Event slot updated' : 'Event slot created');
    setModalOpen(false);
    load();
  };

  const totalPages = Math.ceil(slots.length / ITEMS_PER_PAGE);
  const paginatedData = slots.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-900">Event Slots Management</h1><p className="text-sm text-gray-500 mt-0.5">{slots.length} slots</p></div>
        <Button onClick={() => { setSelected(null); setForm(emptySlot); setModalOpen(true); }}><Plus size={15} />Add Slot</Button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Table columns={columns} data={paginatedData} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={slots.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Event Slot' : 'Add Event Slot'}>
        <form onSubmit={save}>
          <Input label="Slot Name" value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <SearchableSelect options={[{ id: 'Active', label: 'Active' }, { id: 'Inactive', label: 'Inactive' }]} value={form.status ?? 'Active'} onChange={id => setForm({ ...form, status: String(id) })} searchPlaceholder="Search..." />
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <Input label="Start Time" type="time" value={form.startTime ?? ''} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
            <Input label="End Time" type="time" value={form.endTime ?? ''} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
      </Modal>
      <ConfirmModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={async () => { if (selected) await adminApi.eventSlots.delete(selected.id); setDeleteOpen(false); load(); toast.success('Event slot deleted'); }} title="Delete Event Slot" message={`Delete "${selected?.name}"?`} />
    </div>
  );
}