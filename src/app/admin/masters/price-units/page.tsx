'use client';

import { useEffect, useState } from 'react';
import { Edit, Plus, RefreshCw, Ruler, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/admin/Button';
import ConfirmModal from '@/components/admin/ConfirmModal';
import Input from '@/components/admin/Input';
import Modal from '@/components/admin/Modal';
import Pagination from '@/components/admin/Pagination';
import SearchableSelect from '@/components/admin/SearchableSelect';
import Table from '@/components/admin/Table';
import { adminApi } from '@/api/adminApi';
import { Column } from '@/lib/types';

interface PriceUnitRow {
  id: string;
  code: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
  requireRange: boolean;
}

const emptyForm: Omit<PriceUnitRow, 'id'> = {
  code: '',
  label: '',
  isActive: true,
  sortOrder: 0,
  requireRange: false,
};

export default function PriceUnitsPage() {
  const [rows, setRows] = useState<PriceUnitRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PriceUnitRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRows = async (showToast = false) => {
    setLoading(true);
    try {
      const data = await adminApi.priceUnits.list();
      setRows(data);
      if (showToast) toast.success('Price units loaded successfully');
    } catch (error) {
      toast.error('Failed to load price units');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRows(false);
  }, []);

  const openAdd = () => {
    setSelectedRow(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row: PriceUnitRow) => {
    setSelectedRow(row);
    setForm({
      code: row.code,
      label: row.label,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      requireRange: row.requireRange,
    });
    setModalOpen(true);
  };

  const openDelete = (row: PriceUnitRow) => {
    setSelectedRow(row);
    setDeleteOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.code.trim() || !form.label.trim()) {
      toast.error('Code and label are required');
      return;
    }

    setLoading(true);
    try {
      if (selectedRow) {
        await adminApi.priceUnits.update(selectedRow.id, form);
        toast.success('Price unit updated successfully');
      } else {
        await adminApi.priceUnits.create(form);
        toast.success('Price unit created successfully');
      }
      setModalOpen(false);
      await fetchRows(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save price unit');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) return;
    setLoading(true);
    try {
      await adminApi.priceUnits.delete(selectedRow.id);
      toast.success('Price unit deleted successfully');
      setDeleteOpen(false);
      setSelectedRow(null);
      await fetchRows(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete price unit');
    } finally {
      setLoading(false);
    }
  };

  const paginatedRows = rows
    .map((row, index) => ({ ...row, sr_no: index + 1 }))
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(rows.length / itemsPerPage);

  const columns: Column[] = [
    { key: 'sr_no', label: 'Sr. No.' },
    {
      key: 'label',
      label: 'Label',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Ruler size={14} className="text-gray-400" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'code',
      label: 'Code',
      render: (value: string) => <span className="font-mono text-sm text-gray-600">{value}</span>,
    },
    {
      key: 'sortOrder',
      label: 'Order',
    },
    {
      key: 'requireRange',
      label: 'Range',
      render: (_: unknown, row: PriceUnitRow) => {
        return (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              row.requireRange ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {row.requireRange ? 'Required' : 'Optional'}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value: boolean) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${value ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: PriceUnitRow) => (
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
          <h1 className="text-xl font-bold text-gray-900">Price Units Master</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage all service and package units from one place.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void fetchRows(true)} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button onClick={openAdd}>
            <Plus size={15} />
            Add Price Unit
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <Table columns={columns} data={paginatedRows} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={rows.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedRow ? 'Edit Price Unit' : 'Add Price Unit'}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Code"
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              placeholder="e.g. per event"
              required
              disabled={loading}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <SearchableSelect
                options={[{ id: 'Active', label: 'Active' }, { id: 'Inactive', label: 'Inactive' }]}
                value={form.isActive ? 'Active' : 'Inactive'}
                onChange={(id) => setForm((current) => ({ ...current, isActive: id === 'Active' }))}
                searchPlaceholder="Search..."
                disabled={loading}
              />
            </div>
            <Input
              label="Label"
              value={form.label}
              onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
              placeholder="e.g. Per Event"
              required
              disabled={loading}
            />
            <Input
              label="Sort Order"
              type="number"
              value={String(form.sortOrder)}
              onChange={(event) =>
                setForm((current) => ({ ...current, sortOrder: Number(event.target.value || 0) }))
              }
              disabled={loading}
            />
            <label className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.requireRange}
                onChange={(event) => setForm((current) => ({ ...current, requireRange: event.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
              />
              Required range
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Price Unit"
        message={`Are you sure you want to delete "${selectedRow?.label}"?`}
      />
    </div>
  );
}