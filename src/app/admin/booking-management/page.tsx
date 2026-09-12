'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/adminApi';
import Button from '@/components/admin/Button';
import Modal from '@/components/admin/Modal';
import Pagination from '@/components/admin/Pagination';
import SearchableSelect from '@/components/admin/SearchableSelect';
import Table from '@/components/admin/Table';
import { Column } from '@/lib/types';

interface Booking {
  id: string; status: string; totalAmount: number; currency: string; eventAddress: string;
  notes?: string; createdAt: string; customer: { name: string; email: string; phone?: string };
  items: Array<{ id: string; title: string; vendorId: string; eventDate: string; quantity: number; unitAmount: number }>;
  payments: Array<{ id: string; amount: number; status: string; paymentType: string }>;
  refunds: Array<{ id: string; amount: number; status: string }>;
}

export default function BookingManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const load = async () => {
    setLoading(true);
    try { setBookings(await adminApi.bookings.list(status || undefined)); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Failed to load bookings'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [status]);

  const cancel = async (booking: Booking) => {
    const reason = window.prompt('Cancellation reason');
    if (!reason) return;
    try { await adminApi.bookings.cancel(booking.id, reason); toast.success('Booking cancelled'); setSelected(null); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to cancel booking'); }
  };
  const complete = async (booking: Booking) => {
    try { await adminApi.bookings.complete(booking.id); toast.success('Booking completed'); setSelected(null); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to complete booking'); }
  };
  const paid = (booking: Booking) => booking.payments.filter((item) => item.status === 'SUCCEEDED').reduce((sum, item) => sum + item.amount, 0);
  const columns: Column[] = [
    { key: 'id', label: 'Booking', render: (value: string) => value.slice(-10) },
    { key: 'customer', label: 'Customer', render: (value: Booking['customer']) => <div><p className="font-medium">{value.name}</p><p className="text-xs text-gray-400">{value.email}</p></div> },
    { key: 'items', label: 'Service', render: (value: Booking['items']) => value.map((item) => item.title).join(', ') || '-' },
    { key: 'totalAmount', label: 'Total', render: (value: number, row: Booking) => `${row.currency} ${value.toLocaleString()}` },
    { key: 'payments', label: 'Paid', render: (_: unknown, row: Booking) => `${row.currency} ${paid(row).toLocaleString()}` },
    { key: 'status', label: 'Status', render: (value: string) => <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs">{value.replaceAll('_', ' ')}</span> },
    { key: 'createdAt', label: 'Created', render: (value: string) => new Date(value).toLocaleDateString() },
    { key: 'actions', label: 'Actions', render: (_: unknown, row: Booking) => <button onClick={() => setSelected(row)} className="text-blue-500"><Eye size={15} /></button> },
  ];
  const paged = useMemo(() => bookings.slice((page - 1) * perPage, page * perPage), [bookings, page]);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-bold">Booking Management</h1><p className="text-sm text-gray-500">{bookings.length} live bookings</p></div>
      <div className="flex gap-2"><div className="w-56"><SearchableSelect options={[{ id: '', label: 'All statuses' }, ...['PENDING_PAYMENT','VENDOR_REVIEW','CUSTOMER_CONFIRMATION','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','REFUNDED'].map((item) => ({ id: item, label: item }))]} value={status} onChange={(id) => { setStatus(String(id)); setPage(1); }} placeholder="All statuses" searchPlaceholder="Search..." /></div><Button variant="secondary" onClick={() => void load()}><RefreshCw size={15} />Refresh</Button></div>
    </div>
    <div className="rounded-2xl border bg-white shadow-sm">{loading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div> : <Table columns={columns} data={paged} />}<Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(bookings.length / perPage))} totalItems={bookings.length} itemsPerPage={perPage} onPageChange={setPage} /></div>
    <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Booking Details" size="lg">{selected && <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-4"><p><strong>Customer:</strong><br />{selected.customer.name}<br />{selected.customer.email}</p><p><strong>Status:</strong><br />{selected.status}</p><p><strong>Address:</strong><br />{selected.eventAddress}</p><p><strong>Total:</strong><br />{selected.currency} {selected.totalAmount.toLocaleString()}</p></div>
      <div><strong>Items</strong>{selected.items.map((item) => <div key={item.id} className="mt-2 rounded-xl bg-gray-50 p-3">{item.title} · {new Date(item.eventDate).toLocaleDateString()} · Qty {item.quantity}</div>)}</div>
      <div className="flex justify-end gap-2">{['CONFIRMED','IN_PROGRESS'].includes(selected.status) && <Button onClick={() => void complete(selected)}>Mark Completed</Button>}{!['COMPLETED','CANCELLED','REFUNDED'].includes(selected.status) && <Button variant="secondary" onClick={() => void cancel(selected)}>Cancel Booking</Button>}</div>
    </div>}</Modal>
  </div>;
}
