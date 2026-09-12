'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/adminApi';
import Button from '@/components/admin/Button';
import Input from '@/components/admin/Input';
import Modal from '@/components/admin/Modal';
import SearchableSelect from '@/components/admin/SearchableSelect';
import Table from '@/components/admin/Table';
import { Column } from '@/lib/types';

interface Notification {
  id: string; channel: string; event: string; recipient: string; payload: { title?: string; message?: string };
  status: string; createdAt: string; sentAt?: string;
}
const empty = { channel: 'IN_APP', event: 'ADMIN_ANNOUNCEMENT', recipient: '', title: '', message: '' };

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const load = async () => { setLoading(true); try { setItems(await adminApi.notifications.list()); } catch (error) { toast.error(error instanceof Error ? error.message : 'Failed to load notifications'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await adminApi.notifications.create({ channel: form.channel, event: form.event, recipient: form.recipient, payload: { title: form.title, message: form.message } });
      toast.success('Notification queued'); setOpen(false); setForm(empty); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to create notification'); }
  };
  const markSent = async (id: string) => { try { await adminApi.notifications.markSent(id); toast.success('Marked as sent'); await load(); } catch (error) { toast.error(error instanceof Error ? error.message : 'Update failed'); } };
  const remove = async (id: string) => { if (!confirm('Delete this notification?')) return; try { await adminApi.notifications.delete(id); toast.success('Notification deleted'); await load(); } catch (error) { toast.error(error instanceof Error ? error.message : 'Delete failed'); } };
  const columns: Column[] = [
    { key: 'event', label: 'Event' }, { key: 'channel', label: 'Channel' }, { key: 'recipient', label: 'Recipient' },
    { key: 'payload', label: 'Message', render: (value: Notification['payload']) => <div><p className="font-medium">{value.title || '-'}</p><p className="max-w-md truncate text-xs text-gray-500">{value.message || '-'}</p></div> },
    { key: 'status', label: 'Status', render: (value: string) => <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs">{value}</span> },
    { key: 'createdAt', label: 'Created', render: (value: string) => new Date(value).toLocaleString() },
    { key: 'actions', label: 'Actions', render: (_: unknown, row: Notification) => <div className="flex gap-2">{row.status !== 'SENT' && <button onClick={() => void markSent(row.id)} className="text-green-600" title="Mark sent"><Send size={15} /></button>}<button onClick={() => void remove(row.id)} className="text-red-500"><Trash2 size={15} /></button></div> },
  ];
  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold">System Notifications</h1><p className="text-sm text-gray-500">{items.length} persisted notifications</p></div><Button onClick={() => setOpen(true)}><Plus size={15} />New Notification</Button></div>
    <div className="rounded-2xl border bg-white shadow-sm">{loading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div> : <Table columns={columns} data={items} />}</div>
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Create Notification"><form onSubmit={create}>
      <Input label="Event Code" value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} required />
      <Input label="Recipient" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder="Email, phone, or audience identifier" required />
      <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      <label className="mb-1.5 block text-sm font-medium">Channel</label><div className="mb-4"><SearchableSelect options={['IN_APP','EMAIL','SMS','WHATSAPP'].map((item) => ({ id: item, label: item }))} value={form.channel} onChange={(id) => setForm({ ...form, channel: String(id) })} searchPlaceholder="Search..." /></div>
      <label className="mb-1.5 block text-sm font-medium">Message</label><textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mb-4 w-full rounded-xl border px-3 py-2.5 text-sm" rows={4} required />
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Create</Button></div>
    </form></Modal>
  </div>;
}
