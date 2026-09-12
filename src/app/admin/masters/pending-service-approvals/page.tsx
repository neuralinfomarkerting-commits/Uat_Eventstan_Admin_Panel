'use client';

import { useEffect, useState } from 'react';
import { Check, Eye, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/adminApi';
import Button from '@/components/admin/Button';
import Modal from '@/components/admin/Modal';
import Table from '@/components/admin/Table';
import { Column } from '@/lib/types';

interface Service {
  id: string;
  vendorId: string;
  category: string;
  title: string;
  description: string;
  city: string;
  price: { amount: number; currency: string };
  price_min?: number;
  price_max?: number;
  price_unit?: string;
  image_url: string;
  vendor_name: string;
  status: string;
}

const formatServiceRange = (service: Service) => {
  const minAmount = service.price_min ?? service.price.amount ?? 0;
  const maxAmount = service.price_max ?? minAmount;
  return `${service.price.currency} ${minAmount.toLocaleString()} - ${maxAmount.toLocaleString()}`;
};

export default function PendingServiceApprovalsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Service | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setServices((await adminApi.services.list()).filter((item: Service) => item.status === 'DRAFT'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load pending services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const update = async (service: Service, status: 'ACTIVE' | 'INACTIVE') => {
    try {
      await adminApi.services.update(service.id, { status });
      toast.success(status === 'ACTIVE' ? 'Service approved' : 'Service rejected');
      setSelected(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update service');
    }
  };

  const columns: Column[] = [
    { key: 'title', label: 'Service' },
    { key: 'vendor_name', label: 'Vendor' },
    { key: 'category', label: 'Category' },
    { key: 'city', label: 'City' },
    { key: 'price', label: 'Price Range', render: (_: Service['price'], row: Service) => formatServiceRange(row) },
    {
      key: 'status',
      label: 'Status',
      render: () => <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs text-yellow-700">Pending</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: Service) => (
        <div className="flex gap-2">
          <button onClick={() => setSelected(row)} className="text-blue-500"><Eye size={15} /></button>
          <button onClick={() => void update(row, 'ACTIVE')} className="text-green-600"><Check size={16} /></button>
          <button onClick={() => void update(row, 'INACTIVE')} className="text-red-500"><X size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Pending Service Approvals</h1>
        <p className="text-sm text-gray-500">{services.length} services awaiting review</p>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <Table columns={columns} data={services} />
        )}
      </div>

      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Review Service" size="lg">
        {selected && (
          <div className="space-y-4">
            {selected.image_url && <img src={selected.image_url} alt={selected.title} className="h-48 w-full rounded-xl object-cover" />}
            <div>
              <h3 className="text-lg font-bold">{selected.title}</h3>
              <p className="text-sm text-gray-500">{selected.vendor_name} · {selected.category} · {selected.city}</p>
            </div>
            <p>{selected.description}</p>
            <p className="font-semibold">
              {formatServiceRange(selected)}
              {selected.price_unit ? ` / ${selected.price_unit}` : ''}
            </p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => void update(selected, 'ACTIVE')}>Approve</Button>
              <Button variant="secondary" onClick={() => void update(selected, 'INACTIVE')}>Reject</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
