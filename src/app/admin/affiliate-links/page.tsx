'use client';

import { useState } from 'react';
import { Plus, Copy } from 'lucide-react';
import Table from '@/components/admin/Table';
import Modal from '@/components/admin/Modal';
import ConfirmModal from '@/components/admin/ConfirmModal';
import Button from '@/components/admin/Button';
import Input from '@/components/admin/Input';
import SearchableSelect from '@/components/admin/SearchableSelect';
import StatsCard from '@/components/admin/StatsCard';
import Pagination from '@/components/admin/Pagination';
import { affiliateLinksData } from '@/lib/dummyData';
import { Column } from '@/lib/types';
import toast from 'react-hot-toast';

interface AffiliateLink { id: number; name: string; link: string; clicks: number; conversions: number; earnings: number; status: string; }

export default function AffiliateLinksPage() {
  const [links, setLinks] = useState<AffiliateLink[]>(affiliateLinksData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<AffiliateLink | null>(null);
  const [form, setForm] = useState<Partial<AffiliateLink>>({ name: '', link: '', status: 'Active' });

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
  const totalConversions = links.reduce((s, l) => s + l.conversions, 0);
  const totalEarnings = links.reduce((s, l) => s + l.earnings, 0);
  const convRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0.0';

  const columns: Column[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Campaign Name' },
    {
      key: 'link', label: 'Affiliate Link',
      render: (v: string) => (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 truncate max-w-[200px]">{v}</span>
          <button onClick={() => { navigator.clipboard.writeText(v); toast.success('Link copied!'); }} className="p-1 rounded text-orange-400 hover:text-orange-600 hover:bg-orange-50 transition">
            <Copy size={13} />
          </button>
        </div>
      ),
    },
    { key: 'clicks', label: 'Clicks' },
    { key: 'conversions', label: 'Conversions' },
    { key: 'earnings', label: 'Earnings', render: (v: number) => `₹${v.toLocaleString()}` },
    { key: 'status', label: 'Status', render: (v: string) => <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${v === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{v}</span> },
  ];

  const openAdd = () => { setSelected(null); setForm({ name: '', link: '', status: 'Active' }); setIsModalOpen(true); };
  const openEdit = (l: AffiliateLink) => { setSelected(l); setForm(l); setIsModalOpen(true); };
  const openDelete = (l: AffiliateLink) => { setSelected(l); setIsDeleteOpen(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected) {
      setLinks(links.map(l => l.id === selected.id ? { ...l, ...form } as AffiliateLink : l));
      toast.success('Link updated!');
    } else {
      setLinks([...links, { id: links.length + 1, name: form.name ?? '', link: form.link ?? '', clicks: 0, conversions: 0, earnings: 0, status: form.status ?? 'Active' }]);
      toast.success('Affiliate link created!');
    }
    setIsModalOpen(false);
  };

  const totalPages = Math.ceil(links.length / ITEMS_PER_PAGE);
  const paginatedData = links.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Affiliate Links</h1>
          <p className="text-sm text-gray-500 mt-0.5">{links.length} active campaigns</p>
        </div>
        <Button onClick={openAdd}><Plus size={15} />Create Link</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Clicks" value={totalClicks.toLocaleString()} icon={<Copy size={18} />} color="blue" />
        <StatsCard title="Conversions" value={totalConversions.toLocaleString()} icon={<Copy size={18} />} color="green" />
        <StatsCard title="Total Earnings" value={`₹${totalEarnings.toLocaleString()}`} icon={<Copy size={18} />} color="purple" />
        <StatsCard title="Conversion Rate" value={`${convRate}%`} icon={<Copy size={18} />} color="orange" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Table columns={columns} data={paginatedData} onEdit={openEdit} onDelete={openDelete} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={links.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selected ? 'Edit Affiliate Link' : 'Create Affiliate Link'}>
        <form onSubmit={handleSubmit}>
          <Input label="Campaign Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <Input label="Destination URL" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://eventstan.com/" required />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <SearchableSelect options={[{ id: 'Active', label: 'Active' }, { id: 'Inactive', label: 'Inactive' }]} value={form.status || 'Active'} onChange={id => setForm({ ...form, status: String(id) })} searchPlaceholder="Search..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={() => { if (selected) { setLinks(links.filter(l => l.id !== selected.id)); toast.success('Link deleted!'); } setIsDeleteOpen(false); }} title="Delete Affiliate Link" message={`Delete campaign "${selected?.name}"?`} />
    </div>
  );
}