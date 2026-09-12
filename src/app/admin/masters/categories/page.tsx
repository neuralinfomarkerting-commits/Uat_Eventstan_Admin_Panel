"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Tag, RefreshCw } from "lucide-react";
import Table from "@/components/admin/Table";
import Modal from "@/components/admin/Modal";
import ConfirmModal from "@/components/admin/ConfirmModal";
import Pagination from "@/components/admin/Pagination";
import Button from "@/components/admin/Button";
import Input from "@/components/admin/Input";
import { Column } from "@/lib/types";
import { adminApi } from "@/api/adminApi";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  showInHomePage?: boolean;
  isActive?: boolean;
  parentId?: string | null;
  createdAt?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategoryDeleteOpen, setIsCategoryDeleteOpen] = useState(false);
  const [isHomepageConfirmOpen, setIsHomepageConfirmOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [pendingHomepageToggle, setPendingHomepageToggle] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
    name: "",
    slug: "",
    image: "",
    showInHomePage: false,
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCategories = async (showToast = false) => {
    setLoading(true);
    try {
      const data = await adminApi.categories.list();
      setCategories(data);
      if (showToast) {
        toast.success('Categories loaded successfully!');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      if (showToast) {
        toast.error('Failed to fetch categories');
      }
    } finally {
      setLoading(false);
    }
  };

  const addCategoryToAPI = async (category: Omit<Category, 'id'>) => {
    try {
      const data = await adminApi.categories.create(category);
      return data;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategoryInAPI = async (id: string, category: Partial<Category>) => {
    try {
      const data = await adminApi.categories.update(id, category);
      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategoryFromAPI = async (id: string) => {
    try {
      await adminApi.categories.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchCategories(false);
  }, []);

  const handleRefresh = () => {
    fetchCategories(true);
  };

  const openAddCategory = () => {
    setSelectedCategory(null);
    setCategoryForm({ name: "", slug: "", image: "", showInHomePage: false });
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setCategoryForm({
      ...category,
      image: category.image || "",
      showInHomePage: category.showInHomePage || false,
    });
    setIsCategoryModalOpen(true);
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await adminApi.uploads.image(file, "categories");
      setCategoryForm((prev) => ({ ...prev, image: result.url }));
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const openDeleteCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsCategoryDeleteOpen(true);
  };

  // Show confirmation before toggling homepage
  const handleHomepageToggleClick = (category: Category) => {
    setPendingHomepageToggle(category);
    setIsHomepageConfirmOpen(true);
  };

  // Actually toggle the homepage status after confirmation
  const confirmHomepageToggle = async () => {
    if (!pendingHomepageToggle) return;

    const categoryId = pendingHomepageToggle.id;
    const categoryName = pendingHomepageToggle.name;
    const newValue = !pendingHomepageToggle.showInHomePage;

    setLoading(true);
    try {
      await updateCategoryInAPI(categoryId, { showInHomePage: newValue });

      setCategories(categories.map(c =>
        c.id === categoryId ? { ...c, showInHomePage: newValue } : c
      ));

      toast.success(newValue ? `${categoryName} added to homepage` : `${categoryName} removed from homepage`);
    } catch (error) {
      toast.error("Failed to update homepage status");
    } finally {
      setLoading(false);
      setPendingHomepageToggle(null);
      setIsHomepageConfirmOpen(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryForm.name) {
      toast.error("Please fill category name");
      return;
    }

    const slug = categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-');
    
    setLoading(true);
    
    try {
      if (selectedCategory) {
        await updateCategoryInAPI(selectedCategory.id, {
          name: categoryForm.name,
          slug: slug,
          image: categoryForm.image || null,
          showInHomePage: categoryForm.showInHomePage || false,
        });
        
        setCategories(categories.map(c => 
          c.id === selectedCategory.id 
            ? { ...c, name: categoryForm.name!, slug: slug, image: categoryForm.image || null, showInHomePage: categoryForm.showInHomePage || false }
            : c
        ));
        
        toast.success("Category updated successfully!");
      } else {
        const newCategory = await addCategoryToAPI({
          name: categoryForm.name,
          slug: slug,
          image: categoryForm.image || null,
          showInHomePage: categoryForm.showInHomePage || false,
        });
        
        setCategories([...categories, newCategory]);
        toast.success("Category added successfully!");
      }
      
      setIsCategoryModalOpen(false);
    } catch (error) {
      toast.error(selectedCategory ? "Failed to update category" : "Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    setLoading(true);
    
    try {
      await deleteCategoryFromAPI(selectedCategory.id);
      setCategories(categories.filter(c => c.id !== selectedCategory.id));
      toast.success("Category deleted successfully!");
      setIsCategoryDeleteOpen(false);
    } catch (error) {
      toast.error("Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const handleCategoryNameChange = (name: string) => {
    setCategoryForm({ 
      ...categoryForm, 
      name, 
      slug: generateSlug(name) 
    });
  };

  const categoriesWithSrNo = categories.map((category, index) => ({
    ...category,
    sr_no: index + 1
  }));

  const totalPages = Math.ceil(categoriesWithSrNo.length / ITEMS_PER_PAGE);
  const paginatedData = categoriesWithSrNo.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const categoryColumns: Column[] = [
    { 
      key: "sr_no", 
      label: "Sr. No.",
      render: (v: number) => (
        <span className="text-gray-600 font-medium">{v}</span>
      )
    },
    {
      key: "image",
      label: "Image",
      render: (_: any, row: Category) => (
        row.image ? (
          <img
            src={row.image}
            alt={row.name}
            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Tag size={14} className="text-gray-300" />
          </div>
        )
      )
    },
    { 
      key: "name", 
      label: "Category Name",
      render: (v: string) => (
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-gray-400" />
          <span className="font-medium">{v}</span>
        </div>
      )
    },
    { 
      key: "slug", 
      label: "Slug", 
      render: (v: string) => (
        <span className="font-mono text-sm text-gray-600">{v}</span>
      )
    },
    {
      key: "homepage",
      label: "Home Page",
      render: (_: any, row: Category) => (
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={!!row.showInHomePage}
              onChange={() => handleHomepageToggleClick(row)}
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
          <span className="text-xs text-gray-500">
            {row.showInHomePage ? 'Yes' : 'No'}
          </span>
        </div>
      )
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: Category) => (
        <div className="flex items-center gap-1">
          <button 
            onClick={() => openEditCategory(row)} 
            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all" 
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button 
            onClick={() => openDeleteCategory(row)} 
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" 
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Categories Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {categories.length} categories total • 
            <span className="text-orange-600 ml-1">
              {categories.filter(c => c.showInHomePage).length} on homepage
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button onClick={openAddCategory}>
            <Plus size={15} />
            Add Category
          </Button>
        </div>
      </div>

      {loading && categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-500">Loading categories...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Table
            columns={categoryColumns}
            data={paginatedData}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={categoriesWithSrNo.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={selectedCategory ? "Edit Category" : "Add Category"}
        size="md"
      >
        <form onSubmit={handleCategorySubmit}>
          <div className="space-y-4">
            <Input
              label="Category Name"
              value={categoryForm.name || ""}
              onChange={(e) => handleCategoryNameChange(e.target.value)}
              placeholder="e.g. Wedding, Corporate Event, Birthday"
              required
              disabled={loading}
            />

            <div>
              <Input
                label="Slug (URL friendly)"
                value={categoryForm.slug || ""}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                placeholder="e.g. wedding, corporate-event, birthday"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Auto-generated from name if left empty
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                disabled={loading || uploadingImage}
              />
              {uploadingImage && (
                <p className="mt-1 text-xs text-gray-500">Uploading...</p>
              )}
              {categoryForm.image && (
                <img
                  src={categoryForm.image}
                  alt="Preview"
                  className="mt-2 w-20 h-20 rounded-xl object-cover border border-gray-200"
                />
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Show on Homepage
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Display this category on the homepage
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={!!categoryForm.showInHomePage}
                  onChange={(e) => setCategoryForm({ ...categoryForm, showInHomePage: e.target.checked })}
                  disabled={loading}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCategoryModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isCategoryDeleteOpen}
        onClose={() => setIsCategoryDeleteOpen(false)}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete category "${selectedCategory?.name}"? This action cannot be undone.`}
      />

      <ConfirmModal
        isOpen={isHomepageConfirmOpen}
        onClose={() => {
          setIsHomepageConfirmOpen(false);
          setPendingHomepageToggle(null);
        }}
        onConfirm={confirmHomepageToggle}
        title={pendingHomepageToggle?.showInHomePage ? "Remove from Homepage" : "Add to Homepage"}
        message={
          pendingHomepageToggle?.showInHomePage
            ? `Are you sure you want to remove "${pendingHomepageToggle?.name}" from the homepage?`
            : `Are you sure you want to add "${pendingHomepageToggle?.name}" to the homepage?`
        }
      />
    </div>
  );
}