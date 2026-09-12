'use client';

import { useEffect, useRef, useState } from 'react';
import { Edit, GripVertical, Images, Plus, Trash2, X } from 'lucide-react';
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

interface GalleryImage {
  index: number;
  url: string;
}

interface CategoryOption {
  id: string;
  label: string;
}

interface OurPrevRow {
  id: number | string;
  categoryId: string;
  categoryName: string;
  subcategoryName: string;
  mainImage: string;
  gallery: GalleryImage[];
  status: 'publish' | 'draft';
}

const emptyForm: Omit<OurPrevRow, 'id'> = {
  categoryId: '',
  categoryName: '',
  subcategoryName: '',
  mainImage: '',
  gallery: [],
  status: 'draft',
};

export default function OurPreviousWorkPage() {
  const [rows, setRows] = useState<OurPrevRow[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<OurPrevRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const categoryLabel = (id: string) => categoryOptions.find((c) => c.id === id)?.label ?? '-';

  const loadRows = async () => {
    setLoading(true);
    try {
      const data = await adminApi.ourPreviousWork.list();
      setRows(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load previous work');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await adminApi.categories.list();
      setCategoryOptions(
        (data as any[]).map((c) => ({ id: String(c.id), label: c.name ?? c.categoryName ?? c.label }))
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to load categories');
    }
  };

  useEffect(() => {
    loadRows();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setSelectedRow(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (row: OurPrevRow) => {
    setSelectedRow(row);
    setForm({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      subcategoryName: row.subcategoryName,
      mainImage: row.mainImage,
      // API gallery items may come back as just { url } with no index
      // (order is implied by array position) — re-derive index for the UI.
      gallery: (row.gallery ?? []).map((g, i) => ({ url: g.url, index: g.index ?? i + 1 })),
      status: row.status,
    });
    setModalOpen(true);
  };

  const openDelete = (row: OurPrevRow) => {
    setSelectedRow(row);
    setDeleteOpen(true);
  };

  const handleCategoryChange = (id: string) => {
    const label = categoryOptions.find((c) => c.id === id)?.label ?? '';
    setForm((current) => ({ ...current, categoryId: id, categoryName: label }));
  };

  const handleMainImageChange = async (file?: File) => {
    if (!file) return;
    setUploadingMain(true);
    try {
      const result = await adminApi.uploads.image(file, 'our-previous-work');
      setForm((current) => ({ ...current, mainImage: result.url }));
    } catch (err: any) {
      toast.error(err.message || 'Main image upload failed');
    } finally {
      setUploadingMain(false);
    }
  };

  const handleGalleryFilesChange = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploadingGallery(true);
    try {
      let nextIndex = form.gallery.length
        ? Math.max(...form.gallery.map((g) => g.index)) + 1
        : 1;

      const newImages: GalleryImage[] = [];
      for (const file of Array.from(files)) {
        const result = await adminApi.uploads.image(file, 'our-previous-work/gallery');
        newImages.push({ index: nextIndex, url: result.url });
        nextIndex += 1;
      }

      setForm((current) => ({ ...current, gallery: [...current.gallery, ...newImages] }));
    } catch (err: any) {
      toast.error(err.message || 'Gallery image upload failed');
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setForm((current) => ({
      ...current,
      gallery: current.gallery
        .filter((g) => g.index !== index)
        .map((g, i) => ({ ...g, index: i + 1 })), // re-index after removal
    }));
  };

  const moveGalleryImage = (index: number, direction: -1 | 1) => {
    setForm((current) => {
      const sorted = [...current.gallery].sort((a, b) => a.index - b.index);
      const pos = sorted.findIndex((g) => g.index === index);
      const swapPos = pos + direction;
      if (swapPos < 0 || swapPos >= sorted.length) return current;
      [sorted[pos], sorted[swapPos]] = [sorted[swapPos], sorted[pos]];
      const reindexed = sorted.map((g, i) => ({ ...g, index: i + 1 }));
      return { ...current, gallery: reindexed };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (!form.subcategoryName.trim()) {
      toast.error('Subcategory name is required');
      return;
    }
    if (!form.mainImage) {
      toast.error('Please upload a main image');
      return;
    }

    setSubmitting(true);
    try {
      // Backend gallery DTO only accepts `url` — index isn't a valid field
      // there (order is implied by array position), so strip it before send.
      const payload = {
        ...form,
        gallery: [...form.gallery]
          .sort((a, b) => a.index - b.index)
          .map((g) => ({ url: g.url })),
      };

      if (selectedRow) {
        await adminApi.ourPreviousWork.update(selectedRow.id, payload);
        toast.success('Record updated successfully');
      } else {
        await adminApi.ourPreviousWork.create(payload);
        toast.success('Record created successfully');
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
      await adminApi.ourPreviousWork.delete(selectedRow.id);
      toast.success('Record deleted successfully');
      setDeleteOpen(false);
      setSelectedRow(null);
      await loadRows();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete record');
    }
  };

  const paginatedRows = rows
    .map((row, index) => ({ ...row, sr_no: index + 1 }))
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));

  const columns: Column[] = [
    { key: 'sr_no', label: 'Sr. No.' },
    {
      key: 'mainImage',
      label: 'Main Image',
      render: (value: string) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="main" className="h-10 w-14 rounded-lg object-cover border border-gray-100" />
      ),
    },
    {
      key: 'categoryId',
      label: 'Category',
      render: (value: string, row: OurPrevRow) => row.categoryName || categoryLabel(value),
    },
    { key: 'subcategoryName', label: 'Subcategory Name' },
    {
      key: 'gallery',
      label: 'Gallery',
      render: (value: GalleryImage[]) => (
        <div className="flex items-center gap-1">
          <Images size={14} className="text-gray-400" />
          <span className="text-xs text-gray-600">{value?.length ?? 0} image(s)</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
            value === 'publish' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: OurPrevRow) => (
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
          <h1 className="text-xl font-bold text-gray-900">Our Previous Work</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage portfolio / previous work showcase.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAdd}>
            <Plus size={15} />
            Add Work
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No records found.</div>
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
        title={selectedRow ? 'Edit Previous Work' : 'Add Previous Work'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <SearchableSelect
                options={categoryOptions}
                value={form.categoryId}
                onChange={(id) => handleCategoryChange(String(id))}
                placeholder="Select category"
                searchPlaceholder="Search category..."
              />
            </div>

            <Input
              label="Subcategory Name"
              value={form.subcategoryName}
              onChange={(event) =>
                setForm((current) => ({ ...current, subcategoryName: event.target.value }))
              }
              placeholder="e.g. Destination Wedding"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Main Image</label>
              <div className="flex items-center gap-3">
                {form.mainImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.mainImage}
                    alt="main"
                    className="h-16 w-24 rounded-xl object-cover border border-gray-100"
                  />
                )}
                <input
                  ref={mainImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => void handleMainImageChange(event.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => mainImageInputRef.current?.click()}
                  disabled={uploadingMain}
                >
                  {uploadingMain ? 'Uploading...' : form.mainImage ? 'Change Image' : 'Upload Image'}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Gallery Images (multiple, indexed)
              </label>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => void handleGalleryFilesChange(event.target.files)}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadingGallery}
              >
                <Plus size={14} />
                {uploadingGallery ? 'Uploading...' : 'Add Gallery Images'}
              </Button>

              {form.gallery.length > 0 && (
                <div className="mt-3 space-y-2">
                  {[...form.gallery]
                    .sort((a, b) => a.index - b.index)
                    .map((img) => (
                      <div
                        key={img.index}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-2"
                      >
                        <GripVertical size={14} className="text-gray-300" />
                        <span className="w-6 text-center text-xs font-semibold text-gray-500">
                          {img.index}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={`gallery-${img.index}`}
                          className="h-10 w-14 rounded-lg object-cover border border-gray-100"
                        />
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveGalleryImage(img.index, -1)}
                            className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveGalleryImage(img.index, 1)}
                            className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(img.index)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <SearchableSelect
                options={[
                  { id: 'publish', label: 'Publish' },
                  { id: 'draft', label: 'Draft' },
                ]}
                value={form.status}
                onChange={(id) => setForm((current) => ({ ...current, status: id as 'publish' | 'draft' }))}
                searchPlaceholder="Search..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || uploadingMain || uploadingGallery}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Record"
        message={`Are you sure you want to delete "${selectedRow?.subcategoryName}"?`}
      />
    </div>
  );
}