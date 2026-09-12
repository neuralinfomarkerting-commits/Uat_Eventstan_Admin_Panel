"use client";

import { useEffect, useState } from "react";
import { Edit, Eye, Image as ImageIcon, Search, Trash2, X, RefreshCw, MapPin, DollarSign, Building, User, Mail, Phone, Calendar, Star, CheckCircle, Home, Tag } from "lucide-react";
import { adminApi } from "@/api/adminApi";
import Button from "@/components/admin/Button";
import ConfirmModal from "@/components/admin/ConfirmModal";
import Input from "@/components/admin/Input";
import Modal from "@/components/admin/Modal";
import Pagination from "@/components/admin/Pagination";
import SearchableSelect from "@/components/admin/SearchableSelect";
import Table from "@/components/admin/Table";
import { Column } from "@/lib/types";
import toast from "react-hot-toast";

interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string;
  city?: string;
  email?: string;
  phone?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface VendorService {
  id: string;
  vendorId: string;
  categoryId: string;
  title: string;
  category?: string;
  description: string;
  city: string;
  image_url?: string;
  gallery?: string[];
  price: { amount: number; currency: string };
  price_min?: number;
  price_max?: number;
  price_unit?: string;
  status: "ACTIVE" | "INACTIVE" | string;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED" | string;
  showOnHomepage: boolean;
  vendor_name?: string;
  vendor_email?: string;
  vendor_phone?: string;
  rejectionReason?: string;
  tags?: string[];
  features?: string[];
  rating?: number;
  review_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface RelatedPackage {
  id: string;
  title?: string;
  name?: string;
  status: string;
  service_id?: string;
  itemIds?: string[];
  items?: Array<{ serviceId?: string; service?: { id: string; title: string } }>;
}

const emptyForm = {
  vendorId: "",
  categoryId: "",
  title: "",
  description: "",
  city: "",
  amount: "",
  currency: "AED",
  imageUrl: "",
  status: "ACTIVE",
  verificationStatus: "APPROVED",
  showOnHomepage: false,
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatServiceRange = (service: VendorService) => {
  const minAmount = service.price_min ?? service.price?.amount ?? 0;
  const maxAmount = service.price_max ?? minAmount;
  const currency = service.price?.currency ?? "AED";
  return `${minAmount.toLocaleString()} - ${maxAmount.toLocaleString()} ${currency}`;
};

export default function ServicesPage() {
  const [services, setServices] = useState<VendorService[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<VendorService | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [homepageModalOpen, setHomepageModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    service: VendorService;
    newStatus: "ACTIVE" | "INACTIVE";
  } | null>(null);
  const [publishPackagesModalOpen, setPublishPackagesModalOpen] = useState(false);
  const [relatedPackages, setRelatedPackages] = useState<RelatedPackage[]>([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [pendingHomepageChange, setPendingHomepageChange] = useState<{
    service: VendorService;
    newValue: boolean;
  } | null>(null);

  // Filter states
  const [filterVendor, setFilterVendor] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterHomepage, setFilterHomepage] = useState("ALL");

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Get unique cities from vendors and services
  const allCities = Array.from(
    new Set(
      [
        ...vendors.filter((v) => v.city).map((v) => v.city),
        ...services.map((s) => s.city),
      ].filter(Boolean),
    ),
  ).sort();

  const load = async (showToast = false) => {
    setLoading(true);
    try {
      const [svc, ven, cat] = await Promise.all([
        adminApi.services.list(),
        adminApi.vendors.list(),
        adminApi.categories.list(),
      ]);

      const servicesWithData = svc.map((service: VendorService & { showOnPromotionalPage?: boolean }) => ({
        ...service,
        verificationStatus: "APPROVED",
        showOnHomepage: service.showOnPromotionalPage || false,
        tags: service.tags || [],
        features: service.features || [],
        gallery: service.gallery || [],
      }));
      setServices(servicesWithData);
      setVendors(ven);
      setCategories(cat);
      
      if (showToast) {
        toast.success("Services loaded successfully!");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      if (showToast) {
        toast.error("Failed to load services");
      }
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    load(false);
  }, []);

  const handleRefresh = () => {
    load(true);
  };

  const vendorName = (id: string) =>
    vendors.find((v) => v.id === id)?.companyName ?? "-";
  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? "-";

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            Rejected
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            Pending
          </span>
        );
    }
  };

  // Apply filters
  const filteredServices = services.filter((service) => {
    const vendorMatch =
      filterVendor === "" || service.vendorId === filterVendor;
    const cityMatch =
      filterCity === "" ||
      service.city.toLowerCase().includes(filterCity.toLowerCase());
    const statusMatch =
      filterStatus === "ALL" || service.status === filterStatus;
    const homepageMatch =
      filterHomepage === "ALL" ||
      (filterHomepage === "YES" && service.showOnHomepage === true) ||
      (filterHomepage === "NO" && service.showOnHomepage === false);
    return vendorMatch && cityMatch && statusMatch && homepageMatch;
  });

  const handleStatusClick = (service: VendorService, newStatus: "ACTIVE" | "INACTIVE") => {
    setPendingStatusChange({ service, newStatus });
    setStatusModalOpen(true);
  };

  const confirmStatusChange = async () => {
    if (pendingStatusChange) {
      const { service, newStatus } = pendingStatusChange;
      try {
        if (newStatus === "ACTIVE") {
          const packages = await adminApi.packages.list();
          const servicePackages = (packages as RelatedPackage[]).filter((pkg) => {
            const relatedServiceIds = [
              ...(pkg.service_id ? [pkg.service_id] : []),
              ...(pkg.itemIds ?? []),
              ...((pkg.items ?? []).map((item) => item.serviceId || item.service?.id).filter(Boolean) as string[]),
            ];
            return relatedServiceIds.includes(service.id);
          });

          if (servicePackages.length > 0) {
            setRelatedPackages(servicePackages);
            setSelectedPackageIds(servicePackages.map((pkg) => pkg.id));
            setPublishPackagesModalOpen(true);
            setStatusModalOpen(false);
            return;
          }
        }

        await adminApi.services.update(service.id, { status: newStatus });
        setServices(services.map(s => 
          s.id === service.id ? { ...s, status: newStatus } : s
        ));
        toast.success(`Service ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`);
        setStatusModalOpen(false);
        setPendingStatusChange(null);
      } catch (error) {
        toast.error("Failed to update status");
      }
    }
  };

  const activateServiceWithPackages = async (packageIds: string[] = []) => {
    if (!pendingStatusChange) return;

    const { service, newStatus } = pendingStatusChange;
    try {
      await adminApi.services.update(service.id, { status: newStatus });
      await Promise.all(
        packageIds.map((packageId) => adminApi.packages.update(packageId, { status: "ACTIVE" })),
      );
      setServices(services.map((item) =>
        item.id === service.id ? { ...item, status: newStatus } : item,
      ));
      toast.success(
        packageIds.length > 0
          ? `Service approved and ${packageIds.length} package(s) published`
          : "Service approved",
      );
      setPublishPackagesModalOpen(false);
      setPendingStatusChange(null);
      setRelatedPackages([]);
      setSelectedPackageIds([]);
      await load(false);
    } catch (error) {
      toast.error("Failed to update service or packages");
    }
  };

  const handleHomepageClick = (service: VendorService, newValue: boolean) => {
    setPendingHomepageChange({ service, newValue });
    setHomepageModalOpen(true);
  };

  const confirmHomepageChange = async () => {
    if (pendingHomepageChange) {
      const { service, newValue } = pendingHomepageChange;
      try {
        await adminApi.services.update(service.id, { showOnPromotionalPage: newValue });
        setServices(services.map(s => 
          s.id === service.id ? { ...s, showOnHomepage: newValue } : s
        ));
        toast.success(`Service ${newValue ? "added to" : "removed from"} homepage`);
        setHomepageModalOpen(false);
        setPendingHomepageChange(null);
      } catch (error) {
        toast.error("Failed to update homepage status");
      }
    }
  };

  const openViewModal = (service: VendorService) => {
    setSelected(service);
    setViewModalOpen(true);
  };

  const columns: Column[] = [
    {
      key: "image_url",
      label: "Image",
      render: (v: string) =>
        v ? (
          <img src={v} alt="" className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <ImageIcon size={16} className="text-gray-400" />
          </div>
        ),
    },
    { key: "title", label: "Service" },
    { key: "vendorId", label: "Vendor", render: (v: string) => vendorName(v) },
    {
      key: "categoryId",
      label: "Category",
      render: (v: string) => categoryName(v),
    },
    { key: "city", label: "City" },
    {
      key: "price",
      label: "Price",
      render: (_: unknown, row: VendorService) =>
        formatServiceRange(row),
    },
    {
      key: "showOnHomepage",
      label: "Home Page",
      render: (_: unknown, row: VendorService) => (
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={row.showOnHomepage}
              onChange={() => handleHomepageClick(row, !row.showOnHomepage)}
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
          <span className="text-xs text-gray-500">
            {row.showOnHomepage ? 'Yes' : 'No'}
          </span>
        </div>
      ),
    },
    {
      key: "verificationStatus",
      label: "Verification",
      render: (v: string) => getVerificationStatusBadge(v),
    },
    {
      key: "status",
      label: "Status",
      render: (v: string, row: VendorService) => (
        <button
          onClick={() => handleStatusClick(row, v === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            v === "ACTIVE"
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-red-100 text-red-700 hover:bg-red-200"
          }`}
        >
          {v}
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: VendorService) => (
        <div className="flex gap-1">
          <button
            onClick={() => openViewModal(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50"
            title="View Details"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50"
            title="Edit Service"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => {
              setSelected(row);
              setDeleteOpen(true);
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
            title="Delete Service"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const openEdit = (service: VendorService) => {
    setSelected(service);
    setForm({
      vendorId: service.vendorId,
      categoryId: service.categoryId,
      title: service.title,
      description: service.description,
      city: service.city,
      amount: String(service.price?.amount ?? ""),
      currency: service.price?.currency ?? "AED",
      imageUrl: service.image_url ?? "",
      status: service.status,
      verificationStatus: "APPROVED",
      showOnHomepage: service.showOnHomepage || false,
    });
    setModalOpen(true);
  };

  const upload = async (file?: File) => {
    if (!file) return;
    const result = await adminApi.uploads.image(file, "services");
    setForm((prev) => ({ ...prev, imageUrl: result.url }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.vendorId ||
      !form.categoryId ||
      !form.title ||
      !form.city ||
      !form.amount
    ) {
      return toast.error("Please fill all required fields");
    }

    setLoading(true);
    const payload = {
      vendorId: form.vendorId,
      categoryId: form.categoryId,
      title: form.title,
      description: form.description || form.title,
      city: form.city,
      price: { amount: Number(form.amount), currency: form.currency },
      imageUrl: form.imageUrl,
      status: form.status,
      verificationStatus: "APPROVED",
      showOnPromotionalPage: form.showOnHomepage,
    };

    try {
      if (selected) {
        await adminApi.services.update(selected.id, payload);
        toast.success("Service updated successfully");
      }
      setModalOpen(false);
      await load(false);
    } catch (error) {
      toast.error("Failed to update service");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterVendor("");
    setFilterCity("");
    setFilterStatus("ALL");
    setFilterHomepage("ALL");
  };

  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
  const paginatedData = filteredServices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterVendor, filterCity, filterStatus, filterHomepage]);

  const servicesOnHomepage = services.filter(s => s.showOnHomepage).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vendor Services</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filteredServices.length} services total • 
            <span className="text-orange-600 ml-1">
              {servicesOnHomepage} on homepage
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
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>

          {(filterVendor || filterCity || filterStatus !== "ALL" || filterHomepage !== "ALL") && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              <X size={14} />
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor
            </label>
            <SearchableSelect
              options={[{ id: "", label: "All Vendors" }, ...vendors.map((vendor) => ({ id: vendor.id, label: `${vendor.companyName}${vendor.city ? ` (${vendor.city})` : ""}` }))]}
              value={filterVendor}
              onChange={(id) => setFilterVendor(String(id))}
              placeholder="All Vendors"
              searchPlaceholder="Search vendors..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <SearchableSelect
              options={[{ id: "", label: "All Cities" }, ...allCities.filter((city): city is string => !!city).map((city) => ({ id: city, label: city }))]}
              value={filterCity}
              onChange={(id) => setFilterCity(String(id))}
              placeholder="All Cities"
              searchPlaceholder="Search cities..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <SearchableSelect
              options={[{ id: "ALL", label: "All Status" }, { id: "ACTIVE", label: "Active" }, { id: "INACTIVE", label: "Inactive" }]}
              value={filterStatus}
              onChange={(id) => setFilterStatus(String(id))}
              searchPlaceholder="Search..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Show on Homepage
            </label>
            <SearchableSelect
              options={[{ id: "ALL", label: "All" }, { id: "YES", label: "Yes" }, { id: "NO", label: "No" }]}
              value={filterHomepage}
              onChange={(id) => setFilterHomepage(String(id))}
              searchPlaceholder="Search..."
            />
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {isInitialLoad ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-500">Loading services...</p>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No services found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <>
            <Table columns={columns} data={paginatedData} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredServices.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>

      {/* View Details Modal - Complete Details */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Service Details"
        size="lg"
      >
        {selected && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
            {/* Header with Image and Title */}
            <div className="flex items-center gap-4">
              {selected.image_url ? (
                <img
                  src={selected.image_url}
                  alt={selected.title}
                  className="w-24 h-24 rounded-xl object-cover border border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
                  <ImageIcon size={32} className="text-gray-400" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selected.title}</h3>
                <div className="flex gap-2 mt-2">
                  {getVerificationStatusBadge(selected.verificationStatus)}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    selected.status === "ACTIVE" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700"
                  }`}>
                    {selected.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Home size={14} className="text-gray-400" />
                  <p className="text-xs font-medium text-gray-500">Homepage</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {selected.showOnHomepage ? "Yes" : "No"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Tag size={14} className="text-gray-400" />
                  <p className="text-xs font-medium text-gray-500">Category</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{categoryName(selected.categoryId)}</p>
              </div>
            </div>

            {/* Price and Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={14} className="text-gray-400" />
                  <p className="text-xs font-medium text-gray-500">Service Price Range</p>
                </div>
                <p className="text-lg font-bold text-orange-600">
                  {formatServiceRange(selected)}
                </p>
                {selected.price_unit && (
                  <p className="text-xs text-gray-400 mt-1">Per {selected.price_unit}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={14} className="text-gray-400" />
                  <p className="text-xs font-medium text-gray-500">Location</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{selected.city}</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{selected.description}</p>
            </div>

            {/* Rating */}
            {selected.rating !== undefined && selected.rating > 0 && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Star size={14} className="text-yellow-500" />
                  <p className="text-xs font-medium text-gray-500">Rating</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">{selected.rating}</span>
                  {selected.review_count !== undefined && (
                    <span className="text-sm text-gray-500">({selected.review_count} reviews)</span>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {selected.tags && selected.tags.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {selected.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-white text-gray-600 text-xs rounded-full border">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* What's Included */}
            {selected.features && selected.features.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-medium text-gray-500 mb-2">What's Included</p>
                <div className="flex flex-wrap gap-2">
                  {selected.features.map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rejection Reason */}
            {selected.rejectionReason && (
              <div className="bg-red-50 rounded-xl p-3 border border-red-200">
                <p className="text-xs font-medium text-red-600 mb-1">Rejection Reason</p>
                <p className="text-sm text-red-700">{selected.rejectionReason}</p>
              </div>
            )}

            {/* Vendor Information */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Building size={14} className="text-gray-400" />
                <p className="text-xs font-medium text-gray-500">Vendor Information</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User size={14} className="text-gray-400" />
                  <span className="text-gray-600">Name:</span>
                  <span className="text-gray-900">{vendorName(selected.vendorId)}</span>
                </div>
                {selected.vendor_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-900">{selected.vendor_email}</span>
                  </div>
                )}
                {selected.vendor_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-gray-600">Phone:</span>
                    <span className="text-gray-900">{selected.vendor_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              {selected.created_at && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={14} className="text-gray-400" />
                    <p className="text-xs font-medium text-gray-500">Created At</p>
                  </div>
                  <p className="text-sm text-gray-900">{formatDate(selected.created_at)}</p>
                </div>
              )}
              {selected.updated_at && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={14} className="text-gray-400" />
                    <p className="text-xs font-medium text-gray-500">Last Updated</p>
                  </div>
                  <p className="text-sm text-gray-900">{formatDate(selected.updated_at)}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setViewModalOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setViewModalOpen(false);
                  openEdit(selected);
                }}
              >
                Edit Service
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit Vendor Service"
        size="lg"
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor *
            </label>
            <SearchableSelect
              options={vendors.map((v) => ({ id: v.id, label: `${v.companyName}${v.city ? ` (${v.city})` : ""}` }))}
              value={form.vendorId}
              onChange={(id) => setForm({ ...form, vendorId: String(id) })}
              placeholder="Select vendor"
              searchPlaceholder="Search vendors..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <SearchableSelect
              options={categories.map((c) => ({ id: c.id, label: c.name }))}
              value={form.categoryId}
              onChange={(id) => setForm({ ...form, categoryId: String(id) })}
              placeholder="Select category"
              searchPlaceholder="Search categories..."
              disabled={loading}
            />
          </div>

          <Input
            label="Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            disabled={loading}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Enter city name"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
              list="citySuggestions"
              disabled={loading}
            />
            <datalist id="citySuggestions">
              {allCities.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>

          <Input
            label="Price *"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
            disabled={loading}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Description"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 min-h-24 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => upload(e.target.files?.[0])}
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              disabled={loading}
            />
          </div>

          {form.imageUrl && (
            <div>
              <img
                src={form.imageUrl}
                alt="Preview"
                className="w-20 h-20 rounded-xl object-cover border border-gray-200"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <SearchableSelect
              options={[{ id: "ACTIVE", label: "ACTIVE" }, { id: "INACTIVE", label: "INACTIVE" }]}
              value={form.status}
              onChange={(id) => setForm({ ...form, status: String(id) })}
              searchPlaceholder="Search..."
              disabled={loading}
            />
          </div>

          {/* Show on Homepage Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Show on Homepage
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Display this service on the homepage
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.showOnHomepage}
                onChange={(e) => setForm({ ...form, showOnHomepage: e.target.checked })}
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          {/* Verification Status Info Box */}
          <div className="bg-green-50 p-3 rounded-xl">
            <p className="text-sm text-green-700 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-600"></span>
              Verification Status: <strong>APPROVED</strong>
            </p>
            <p className="text-xs text-green-600 mt-1">
              All services are automatically approved
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Update Service"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Status Change Confirmation Modal */}
      <ConfirmModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setPendingStatusChange(null);
        }}
        onConfirm={confirmStatusChange}
        title={pendingStatusChange?.newStatus === "ACTIVE" ? "Activate Service" : "Deactivate Service"}
        message={
          pendingStatusChange?.newStatus === "ACTIVE"
            ? `Are you sure you want to activate "${pendingStatusChange?.service.title}"?`
            : `Are you sure you want to deactivate "${pendingStatusChange?.service.title}"?`
        }
        confirmText={pendingStatusChange?.newStatus === "ACTIVE" ? "Activate" : "Deactivate"}
        cancelText="Cancel"
      />

      {/* Homepage Change Confirmation Modal */}
      <ConfirmModal
        isOpen={homepageModalOpen}
        onClose={() => {
          setHomepageModalOpen(false);
          setPendingHomepageChange(null);
        }}
        onConfirm={confirmHomepageChange}
        title={pendingHomepageChange?.newValue ? "Show on Homepage" : "Hide from Homepage"}
        message={
          pendingHomepageChange?.newValue
            ? `Are you sure you want to show "${pendingHomepageChange?.service.title}" on the homepage?`
            : `Are you sure you want to hide "${pendingHomepageChange?.service.title}" from the homepage?`
        }
        confirmText={pendingHomepageChange?.newValue ? "Show" : "Hide"}
        cancelText="Cancel"
      />

      <Modal
        isOpen={publishPackagesModalOpen}
        onClose={() => {
          setPublishPackagesModalOpen(false);
          setPendingStatusChange(null);
          setRelatedPackages([]);
          setSelectedPackageIds([]);
        }}
        title="Publish Related Packages"
        size="lg"
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-600">
            This service already has {relatedPackages.length} package(s). Do you want to publish package(s) also while activating the service?
          </p>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {relatedPackages.map((pkg) => {
              const title = pkg.title || pkg.name || "Untitled Package";
              const checked = selectedPackageIds.includes(pkg.id);
              return (
                <label
                  key={pkg.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 cursor-pointer hover:border-orange-300"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setSelectedPackageIds((current) =>
                        e.target.checked
                          ? [...current, pkg.id]
                          : current.filter((id) => id !== pkg.id),
                      );
                    }}
                    className="accent-orange-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500">Current status: {pkg.status}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void activateServiceWithPackages([])}
            >
              Activate Service Only
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSelectedPackageIds(relatedPackages.map((pkg) => pkg.id))}
            >
              Select All
            </Button>
            <Button
              type="button"
              onClick={() => void activateServiceWithPackages(selectedPackageIds)}
            >
              Activate and Publish Selected
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          if (selected) {
            setLoading(true);
            try {
              await adminApi.services.delete(selected.id);
              toast.success("Service deleted successfully");
              setDeleteOpen(false);
              await load(false);
            } catch (error) {
              toast.error("Failed to delete service");
            } finally {
              setLoading(false);
            }
          }
        }}
        title="Delete Service"
        message={`Are you sure you want to delete "${selected?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
