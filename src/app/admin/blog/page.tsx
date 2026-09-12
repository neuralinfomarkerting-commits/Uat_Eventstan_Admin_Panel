"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  Star,
  StarOff,
  Clock,
  Image as ImageIcon,
  CheckCircle,
} from "lucide-react";
import Table from "@/components/admin/Table";
import ConfirmModal from "@/components/admin/ConfirmModal";
import Pagination from "@/components/admin/Pagination";
import Button from "@/components/admin/Button";
import StatsCard from "@/components/admin/StatsCard";
import SearchableSelect from "@/components/admin/SearchableSelect";
import { Column } from "@/lib/types";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi } from "@/api/adminApi";
import { BlogPost, mapBlogFromApi } from "@/lib/blog";

export default function BlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ post: BlogPost; newStatus: string } | null>(null);
  const [pendingFeaturedToggle, setPendingFeaturedToggle] = useState<BlogPost | null>(null);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await adminApi.blogs.list();
      setPosts((data ?? []).map(mapBlogFromApi));
    } catch (error: any) {
      toast.error(error?.message || "Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const deletePost = async (postId: string) => {
    try {
      await adminApi.blogs.delete(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      toast.success("Blog post deleted successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete blog post");
    }
  };

  const requestToggleFeatured = (post: BlogPost) => {
    setPendingFeaturedToggle(post);
  };

  const confirmToggleFeatured = async () => {
    const post = pendingFeaturedToggle;
    if (!post) return;
    try {
      await adminApi.blogs.update(post.id, { isFeatured: !post.is_featured });
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, is_featured: !p.is_featured } : p)),
      );
      toast.success(
        `${post.is_featured ? "Removed from" : "Added to"} featured posts`,
      );
    } catch (error: any) {
      toast.error(error?.message || "Failed to update post");
    } finally {
      setPendingFeaturedToggle(null);
    }
  };

  const requestStatusChange = (post: BlogPost, newStatus: string) => {
    if (newStatus.toUpperCase() === post.status) return;
    setPendingStatusChange({ post, newStatus });
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    const { post, newStatus } = pendingStatusChange;
    try {
      await adminApi.blogs.update(post.id, { status: newStatus.toUpperCase() });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, status: newStatus.toUpperCase() as BlogPost["status"] } : p,
        ),
      );
      toast.success(`Post status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update status");
    } finally {
      setPendingStatusChange(null);
    }
  };

  const openDelete = (post: BlogPost) => {
    setSelectedPost(post);
    setIsDeleteOpen(true);
  };

  // Stats
  const published = posts.filter((p) => p.status === "PUBLISHED").length;
  const drafts = posts.filter((p) => p.status === "DRAFT").length;
  const archived = posts.filter((p) => p.status === "ARCHIVED").length;
  const featured = posts.filter((p) => p.is_featured).length;

  const columns: Column[] = [
    {
      key: "cover_image",
      label: "Image",
      render: (v: string) =>
        v ? (
          <img
            src={v}
            alt="Cover"
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
            <ImageIcon size={20} className="text-gray-400" />
          </div>
        ),
    },
    {
      key: "title",
      label: "Title",
      render: (v: string) => <span className="font-medium">{v}</span>,
    },
    {
      key: "category",
      label: "Category",
      render: (v: string) => (
        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{v}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (v: string, row: BlogPost) => (
        <div className="w-32">
          <SearchableSelect
            options={[
              { id: "DRAFT", label: "Draft" },
              { id: "PUBLISHED", label: "Published" },
              { id: "ARCHIVED", label: "Archived" },
            ]}
            value={v}
            onChange={(id) => requestStatusChange(row, String(id))}
            searchPlaceholder="Search..."
            className={`!py-1 !px-2 rounded-full text-xs font-medium border-0 ${
              v === "PUBLISHED"
                ? "!bg-green-100 text-green-700"
                : v === "DRAFT"
                  ? "!bg-yellow-100 text-yellow-700"
                  : "!bg-gray-100 text-gray-700"
            }`}
          />
        </div>
      ),
    },
    {
      key: "is_featured",
      label: "Featured",
      render: (v: boolean, row: BlogPost) => (
        <button
          onClick={() => requestToggleFeatured(row)}
          className={`p-1.5 rounded-lg transition-all ${
            v
              ? "text-yellow-500 bg-yellow-50"
              : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
          }`}
          title={v ? "Remove from featured" : "Add to featured"}
        >
          {v ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
        </button>
      ),
    },
    {
      key: "read_time",
      label: "Read Time",
      render: (v: number) => (
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {v} min
        </span>
      ),
    },
    {
      key: "published_at",
      label: "Published",
      render: (v: string) => (v ? new Date(v).toLocaleDateString() : "-"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: BlogPost) => (
        <div className="flex items-center gap-1">
          <Link href={`/admin/blog/view/${row.id}`}>
            <button
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
              title="Preview"
            >
              <Eye size={14} />
            </button>
          </Link>
          <Link href={`/admin/blog/edit/${row.id}`}>
            <button
              className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
              title="Edit"
            >
              <Edit size={14} />
            </button>
          </Link>
          <button
            onClick={() => openDelete(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const refreshData = async () => {
    await loadPosts();
    toast.success("Data refreshed!");
  };

  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const paginatedData = posts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {posts.length} total posts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={refreshData}>
            <RefreshCw size={15} />
            Refresh
          </Button>
          <Link href="/admin/blog/add">
            <Button>
              <Plus size={15} />
              Write New Post
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Posts"
          value={posts.length}
          icon={<FileText size={18} />}
          color="blue"
        />
        <StatsCard
          title="Published"
          value={published}
          icon={<CheckCircle size={18} />}
          color="green"
        />
        <StatsCard
          title="Drafts"
          value={drafts}
          icon={<FileText size={18} />}
          color="yellow"
        />
        <StatsCard
          title="Featured"
          value={featured}
          icon={<Star size={18} />}
          color="purple"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Table columns={columns} data={paginatedData} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={posts.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          if (selectedPost && selectedPost.id) {
            deletePost(selectedPost.id);
          }
          setIsDeleteOpen(false);
        }}
        title="Delete Post"
        message={`Are you sure you want to delete "${selectedPost?.title}"? This action cannot be undone.`}
      />

      <ConfirmModal
        isOpen={!!pendingStatusChange}
        onClose={() => setPendingStatusChange(null)}
        onConfirm={confirmStatusChange}
        title="Change Status"
        message={`Are you sure you want to change the status of "${pendingStatusChange?.post.title}" to ${pendingStatusChange?.newStatus}?`}
        confirmText="Yes, Update"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={!!pendingFeaturedToggle}
        onClose={() => setPendingFeaturedToggle(null)}
        onConfirm={confirmToggleFeatured}
        title={pendingFeaturedToggle?.is_featured ? "Remove from Featured" : "Add to Featured"}
        message={
          pendingFeaturedToggle?.is_featured
            ? `Are you sure you want to remove "${pendingFeaturedToggle?.title}" from featured posts?`
            : `Are you sure you want to mark "${pendingFeaturedToggle?.title}" as featured?`
        }
        confirmText="Yes, Update"
        cancelText="Cancel"
      />
    </div>
  );
}
