'use client';

import { useEffect, useRef, useState } from 'react';
import { Edit, Eye, Plus, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/admin/Button';
import ConfirmModal from '@/components/admin/ConfirmModal';
import Input from '@/components/admin/Input';
import Modal from '@/components/admin/Modal';
import Pagination from '@/components/admin/Pagination';
import SearchableSelect from '@/components/admin/SearchableSelect';
import Table from '@/components/admin/Table';
import { Column } from '@/lib/types';
import { adminApi } from '@/api/adminApi'; // adjust this import path to match your project

interface TestimonialRow {
  id: number | string;
  customerName: string;
  image: string;
  rating: number;
  comment: string;
  status: 'active' | 'inactive';
}

const emptyForm: Omit<TestimonialRow, 'id'> = {
  customerName: '',
  image: '',
  rating: 5,
  comment: '',
  status: 'active',
};

// When there's no uploaded photo, fall back to the first letter of the
// customer's first name + the first letter of their last name (e.g.
// "Pooja Solanki" -> "PS", "Rahul Sharma" -> "RS").
function getAvatarInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = words[0][0] ?? '';
  const last = words.length > 1 ? words[words.length - 1][0] ?? '' : '';
  return `${first}${last}`.toUpperCase();
}

function AvatarCircle({
  image,
  name,
  sizeClassName = 'h-10 w-10',
  textClassName = 'text-xs',
}: {
  image?: string;
  name: string;
  sizeClassName?: string;
  textClassName?: string;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        className={`${sizeClassName} rounded-full object-cover border border-gray-100`}
      />
    );
  }
  return (
    <div
      className={`${sizeClassName} rounded-full bg-orange-50 border border-orange-100 text-orange-600 font-semibold flex items-center justify-center ${textClassName}`}
    >
      {getAvatarInitials(name) || '?'}
    </div>
  );
}

export default function TestimonialsPage() {
  const [rows, setRows] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<TestimonialRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const imageInputRef = useRef<HTMLInputElement>(null);

  const loadRows = async () => {
    setLoading(true);
    try {
      const data = await adminApi.testimonials.list();
      setRows(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const openAdd = () => {
    setSelectedRow(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row: TestimonialRow) => {
    setSelectedRow(row);
    setForm({
      customerName: row.customerName,
      image: row.image,
      rating: row.rating,
      comment: row.comment,
      status: row.status,
    });
    setModalOpen(true);
  };

  const openView = (row: TestimonialRow) => {
    setSelectedRow(row);
    setViewOpen(true);
  };

  const openDelete = (row: TestimonialRow) => {
    setSelectedRow(row);
    setDeleteOpen(true);
  };

  const handleImageChange = async (file?: File) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await adminApi.uploads.image(file, 'testimonials');
      setForm((current) => ({ ...current, image: result.url }));
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!form.comment.trim()) {
      toast.error('Comment is required');
      return;
    }

    setSubmitting(true);
    try {
      if (selectedRow) {
        await adminApi.testimonials.update(selectedRow.id, form);
        toast.success('Testimonial updated successfully');
      } else {
        await adminApi.testimonials.create(form);
        toast.success('Testimonial created successfully');
      }
      setModalOpen(false);
      await loadRows();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) return;
    try {
      await adminApi.testimonials.delete(selectedRow.id);
      toast.success('Testimonial deleted successfully');
      setDeleteOpen(false);
      setSelectedRow(null);
      await loadRows();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete testimonial');
    }
  };

  const paginatedRows = rows
    .map((row, index) => ({ ...row, sr_no: index + 1 }))
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));

  const columns: Column[] = [
    { key: 'sr_no', label: 'Sr. No.' },
    {
      key: 'image',
      label: 'Image',
      render: (value: string, row: TestimonialRow) => (
        <AvatarCircle image={value} name={row.customerName} />
      ),
    },
    {
      key: 'customerName',
      label: 'Customer Name',
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (value: number) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={13}
              className={i < value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
            />
          ))}
        </div>
      ),
    },
    {
      key: 'comment',
      label: 'Comment',
      render: (value: string) => (value.length > 60 ? `${value.slice(0, 60)}...` : value),
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
      render: (_: unknown, row: TestimonialRow) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openView(row)}
            className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-blue-50 hover:text-blue-500"
            title="View"
          >
            <Eye size={14} />
          </button>
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
          <h1 className="text-xl font-bold text-gray-900">Testimonial Master</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage customer testimonials.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAdd}>
            <Plus size={15} />
            Add Testimonial
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No testimonials found.</div>
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
        title={selectedRow ? 'Edit Testimonial' : 'Add Testimonial'}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Customer Name"
              value={form.customerName}
              onChange={(event) =>
                setForm((current) => ({ ...current, customerName: event.target.value }))
              }
              placeholder="e.g. Rahul Sharma"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Image</label>
              <div className="flex items-center gap-3">
                <AvatarCircle
                  image={form.image}
                  name={form.customerName || 'Preview'}
                  sizeClassName="h-14 w-14"
                  textClassName="text-base"
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void handleImageChange(event.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? 'Uploading...' : form.image ? 'Change Image' : 'Upload Image'}
                </Button>
              </div>
              {!form.image && (
                <p className="mt-1.5 text-xs text-gray-400">
                  No image uploaded — the customer&apos;s initials will be shown instead.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating</label>
              <SearchableSelect
                options={[1, 2, 3, 4, 5].map((n) => ({ id: n, label: `${n} Star${n > 1 ? 's' : ''}` }))}
                value={form.rating}
                onChange={(id) => setForm((current) => ({ ...current, rating: Number(id) }))}
                searchPlaceholder="Search..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Comment</label>
              <textarea
                value={form.comment}
                onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
                placeholder="Customer feedback..."
                rows={4}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
              />
            </div>

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
            <Button type="submit" disabled={submitting || uploadingImage}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        title="Testimonial Details"
        size="md"
      >
        {selectedRow && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <AvatarCircle
                image={selectedRow.image}
                name={selectedRow.customerName}
                sizeClassName="h-16 w-16"
                textClassName="text-lg"
              />
              <div>
                <p className="text-base font-semibold text-gray-900">{selectedRow.customerName}</p>
                <div className="mt-1 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < selectedRow.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1.5">Comment</p>
              <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                {selectedRow.comment}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1.5">Status</p>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                  selectedRow.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {selectedRow.status}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" variant="secondary" onClick={() => setViewOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Testimonial"
        message={`Are you sure you want to delete "${selectedRow?.customerName}"?`}
      />
    </div>
  );
}