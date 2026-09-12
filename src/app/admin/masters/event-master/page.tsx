'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Edit, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/admin/Button';
import ConfirmModal from '@/components/admin/ConfirmModal';
import Input from '@/components/admin/Input';
import Modal from '@/components/admin/Modal';
import Pagination from '@/components/admin/Pagination';
import SearchableSelect from '@/components/admin/SearchableSelect';
import Table from '@/components/admin/Table';
import { Column } from '@/lib/types';
import { adminApi } from '@/api/adminApi'; 

interface EventRow {
  id: number;
  eventName: string;
  status: 'active' | 'inactive';
}

const emptyForm: Omit<EventRow, 'id'> = {
  eventName: '',
  status: 'active',
};

export default function EventMasterPage() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<EventRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await adminApi.eventMasters.list();
      setRows(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setSelectedRow(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row: EventRow) => {
    setSelectedRow(row);
    setForm({ eventName: row.eventName, status: row.status });
    setModalOpen(true);
  };

  const openDelete = (row: EventRow) => {
    setSelectedRow(row);
    setDeleteOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.eventName.trim()) {
      toast.error('Event name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (selectedRow) {
        await adminApi.eventMasters.update(selectedRow.id, form);
        toast.success('Event updated successfully');
      } else {
        await adminApi.eventMasters.create(form);
        toast.success('Event created successfully');
      }
      setModalOpen(false);
      await loadEvents();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) return;
    try {
      await adminApi.eventMasters.delete(selectedRow.id);
      toast.success('Event deleted successfully');
      setDeleteOpen(false);
      setSelectedRow(null);
      await loadEvents();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete event');
    }
  };

  const paginatedRows = rows
    .map((row, index) => ({ ...row, sr_no: index + 1 }))
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));

  const columns: Column[] = [
    { key: 'sr_no', label: 'Sr. No.' },
    {
      key: 'eventName',
      label: 'Event Name',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-gray-400" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
            value === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: EventRow) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEdit(row)}
            className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-orange-50 hover:text-orange-500"
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => openDelete(row)}
            className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Event Master</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage all events from one place.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAdd}>
            <Plus size={15} />
            Add Event
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading events...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No events found.</div>
        ) : (
          <>
            <Table columns={columns} data={paginatedRows} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={rows.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedRow ? 'Edit Event' : 'Add Event'}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Event Name"
              value={form.eventName}
              onChange={(event) => setForm((current) => ({ ...current, eventName: event.target.value }))}
              placeholder="e.g. Wedding"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <SearchableSelect
                options={[
                  { id: 'active', label: 'Active' },
                  { id: 'inactive', label: 'Inactive' },
                ]}
                value={form.status}
                onChange={(id) => setForm((current) => ({ ...current, status: id as 'active' | 'inactive' }))}
                searchPlaceholder="Search..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${selectedRow?.eventName}"?`}
      />
    </div>
  );
}