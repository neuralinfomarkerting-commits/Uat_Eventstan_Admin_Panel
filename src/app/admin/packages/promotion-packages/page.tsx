"use client";

import { useState, useEffect } from "react";
import { Eye, RefreshCw, Package, Check, X, Megaphone } from "lucide-react";
import Button from "@/components/admin/Button";
import Pagination from "@/components/admin/Pagination";
import SearchableSelect from "@/components/admin/SearchableSelect";
import { adminApi } from "@/api/adminApi";
import toast from "react-hot-toast";

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  categoryName?: string;
}

interface Vendor {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  status: string;
}

interface MarketingPackage {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: string;
  popular: boolean;
  services: ServiceItem[];
  description: string;
  vendorId: string;
  vendorName: string;
  status: string;
  maxGuests: number;
  durationHours: number;
  inclusions: string[];
  features: string[];
  showOnPromotionalPage: boolean;
  serviceIds: string[];
  isPromotional: boolean;
  imageUrl: string | null;
  originalPrice: number | null;
  promotionDiscountType: string | null;
  promotionDiscountValue: number | null;
  promotionStartDate: string | null;
  promotionEndDate: string | null;
  minDays: number | null;
  maxDays: number | null;
  rentalLocation: string | null;
  serviceArea: string | null;
  deliveryFee: number | null;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
}

interface ApiPackage {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  amount: number;
  price?: number;
  exactPrice?: number;
  currency: string;
  priceUnit: string;
  inclusions: string[];
  features: string[];
  maxGuests: number | null;
  durationHours: number | null;
  isPopular: boolean;
  showOnPromotionalPage?: boolean;
  show_on_promotional_page?: boolean;
  isPromotional?: boolean;
  imageUrl?: string | null;
  image_url?: string | null;
  exact_price?: number;
  promotionDiscountType?: string | null;
  promotionDiscountValue?: number | null;
  promotionStartDate?: string | null;
  promotionEndDate?: string | null;
  minDays?: number | null;
  maxDays?: number | null;
  rentalLocation?: string | null;
  serviceArea?: string | null;
  deliveryFee?: number | null;
  pickupAvailable?: boolean;
  deliveryAvailable?: boolean;
  status: string;
  items: Array<{
    service: {
      id: string;
      title: string;
      category: {
        name: string;
      };
    };
  }>;
}

const formatPrice = (price: number | undefined | null, currency: string = "USD"): string => {
  if (price === undefined || price === null || isNaN(price)) {
    return "0";
  }
  const symbol = currency === "AED" ? "AED" : "$";
  return `${symbol}${price.toLocaleString()}`;
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export default function PromotionPackagesPage() {
  const [packages, setPackages] = useState<MarketingPackage[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<MarketingPackage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (showToast = false) => {
    setLoading(true);
    try {
      const [packagesData, vendorsData] = await Promise.all([
        adminApi.packages.list(),
        adminApi.vendors.list()
      ]);

      setVendors(vendorsData);

      const vendorMap = new Map<string, string>();
      vendorsData.forEach((vendor: Vendor) => {
        vendorMap.set(vendor.id, vendor.companyName);
      });

      const transformedPackages: MarketingPackage[] = packagesData.map((pkg: ApiPackage) => {
        const services: ServiceItem[] = pkg.items.map((item) => ({
          id: item.service.id,
          name: item.service.title,
          category: item.service.category.name,
          categoryName: item.service.category.name,
        }));

        return {
          id: pkg.id,
          name: pkg.title,
          price: pkg.price ?? pkg.amount ?? pkg.exactPrice ?? 0,
          currency: pkg.currency,
          duration: pkg.durationHours ? `${pkg.durationHours} hours` : "Custom",
          popular: pkg.isPopular,
          services: services,
          description: pkg.description,
          vendorId: pkg.vendorId,
          vendorName: vendorMap.get(pkg.vendorId) || "Unknown Vendor",
          status: pkg.status,
          maxGuests: pkg.maxGuests || 0,
          durationHours: pkg.durationHours || 0,
          inclusions: pkg.inclusions || [],
          features: pkg.features || [],
          showOnPromotionalPage:
            pkg.showOnPromotionalPage ??
            pkg.show_on_promotional_page ??
            pkg.isPromotional ??
            false,
          serviceIds: pkg.items.map((item) => item.service.id),
          isPromotional: pkg.isPromotional ?? false,
          imageUrl: pkg.imageUrl ?? pkg.image_url ?? null,
          originalPrice: pkg.exact_price ?? pkg.exactPrice ?? null,
          promotionDiscountType: pkg.promotionDiscountType ?? null,
          promotionDiscountValue: pkg.promotionDiscountValue ?? null,
          promotionStartDate: pkg.promotionStartDate ?? null,
          promotionEndDate: pkg.promotionEndDate ?? null,
          minDays: pkg.minDays ?? null,
          maxDays: pkg.maxDays ?? null,
          rentalLocation: pkg.rentalLocation ?? null,
          serviceArea: pkg.serviceArea ?? null,
          deliveryFee: pkg.deliveryFee ?? null,
          pickupAvailable: pkg.pickupAvailable ?? false,
          deliveryAvailable: pkg.deliveryAvailable ?? false,
        };
      });

      setPackages(transformedPackages);

      if (showToast) {
        toast.success("Packages loaded successfully!");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (showToast) {
        toast.error("Failed to load packages");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  const openModal = (pkg: MarketingPackage) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPackage(null);
    document.body.style.overflow = 'unset';
  };

  // Only show promotional packages
  const promotionalPackages = packages.filter((pkg) => pkg.showOnPromotionalPage);

  const filteredPackages = selectedVendorId === ""
    ? promotionalPackages
    : promotionalPackages.filter(pkg => pkg.vendorId === selectedVendorId);

  const totalPages = Math.ceil(filteredPackages.length / ITEMS_PER_PAGE);
  const paginatedData = filteredPackages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const uniqueVendors = Array.from(
    new Map(promotionalPackages.map(pkg => [pkg.vendorId, { id: pkg.vendorId, name: pkg.vendorName }]))
  ).map(([_, value]) => value);

  if (loading && packages.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Promotion Packages</h1>
          <p className="text-sm text-gray-500 mt-0.5">Loading packages...</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-500">Loading packages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Promotion Packages</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {promotionalPackages.length} promotional packages •
            <span className="text-gray-400 ml-1">out of {packages.length} total</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-full sm:w-64">
          <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Vendor</label>
          <SearchableSelect
            options={[{ id: "", label: "All Vendors" }, ...uniqueVendors.map(vendor => ({ id: vendor.id, label: vendor.name }))]}
            value={selectedVendorId}
            onChange={(id) => {
              setSelectedVendorId(String(id));
              setCurrentPage(1);
            }}
            placeholder="All Vendors"
            searchPlaceholder="Search vendors..."
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">Package</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">Vendor</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">Price</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">Services</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">Guests</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">Promotion</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedData.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-gray-50/50 transition-colors bg-orange-50/30">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 min-w-[150px]">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        <Package size={16} className="text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="font-semibold text-gray-900 truncate max-w-[120px]">{pkg.name}</span>
                          {pkg.popular && (
                            <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium shrink-0">Popular</span>
                          )}
                          <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 shrink-0">
                            <Megaphone size={10} />
                            Promoted
                          </span>
                        </div>
                        {pkg.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[150px]">{pkg.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-orange-600">
                          {pkg.vendorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]" title={pkg.vendorName}>
                        {pkg.vendorName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-orange-600">{formatPrice(pkg.price, pkg.currency)}</span>
                      {pkg.originalPrice && pkg.originalPrice !== pkg.price && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(pkg.originalPrice, pkg.currency)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 max-w-[220px]">
                    {pkg.services.length === 0 ? (
                      <span className="text-gray-400">--</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {pkg.services.slice(0, 2).map((service, idx) => (
                          <span
                            key={idx}
                            className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 max-w-[80px] truncate"
                            title={service.name}
                          >
                            {service.name}
                          </span>
                        ))}
                        {pkg.services.length > 2 && (
                          <span className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 shrink-0">
                            +{pkg.services.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-600">
                    {pkg.maxGuests > 0 ? pkg.maxGuests : "∞"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {/* Just display - NOT clickable */}
                    {pkg.showOnPromotionalPage ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                        <Megaphone size={12} />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-block text-xs px-2 py-1 rounded-full ${getStatusColor(pkg.status)}`}>
                      {pkg.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => openModal(pkg)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPackages.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredPackages.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>

      {filteredPackages.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No promotional packages found</p>
          <p className="text-xs text-gray-400 mt-1">Go to Marketing Packages page to add packages to promotions</p>
        </div>
      )}

      {isModalOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeModal}
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {selectedPackage.imageUrl && (
                <div className="relative w-full h-56 bg-gray-100">
                  <img
                    src={selectedPackage.imageUrl}
                    alt={selectedPackage.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(selectedPackage.status)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {selectedPackage.status.charAt(0) + selectedPackage.status.slice(1).toLowerCase()}
                    </span>
                    {selectedPackage.showOnPromotionalPage && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-600">
                        <Megaphone size={12} />
                        Promotional
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${selectedPackage.popular ? 'bg-orange-50' : 'bg-gray-50'}`}>
                    <Package size={24} className={selectedPackage.popular ? 'text-orange-500' : 'text-gray-400'} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900 truncate">{selectedPackage.name}</h2>
                      {selectedPackage.popular && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium shrink-0">Popular</span>
                      )}
                      {selectedPackage.showOnPromotionalPage && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium flex items-center gap-1 shrink-0">
                          <Megaphone size={12} />
                          Promotion Page
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-300">•</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-orange-600">
                            {selectedPackage.vendorName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 font-medium truncate">{selectedPackage.vendorName}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0 ml-2"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Price</p>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="text-2xl font-bold text-orange-600">{formatPrice(selectedPackage.price, selectedPackage.currency)}</p>
                      {selectedPackage.originalPrice && selectedPackage.originalPrice !== selectedPackage.price && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(selectedPackage.originalPrice, selectedPackage.currency)}
                        </span>
                      )}
                    </div>
                    {selectedPackage.promotionDiscountValue && (
                      <span className="inline-block mt-1 text-[10px] font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        {selectedPackage.promotionDiscountType === "PERCENTAGE"
                          ? `${selectedPackage.promotionDiscountValue}% OFF`
                          : `${formatPrice(selectedPackage.promotionDiscountValue, selectedPackage.currency)} OFF`}
                      </span>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Max Guests</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedPackage.maxGuests > 0 ? selectedPackage.maxGuests : "Unlimited"}</p>
                    <p className="text-xs text-gray-500">people</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPackage.status)}`}>
                      {selectedPackage.status}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Promotion</p>
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                      <Megaphone size={12} />
                      Promoted
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Manage from Marketing Packages page</p>
                  </div>
                </div>

                {(selectedPackage.promotionStartDate || selectedPackage.promotionEndDate) && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl flex-wrap">
                    <Megaphone size={16} className="shrink-0" />
                    <span>
                      Promotion valid from {formatDate(selectedPackage.promotionStartDate)} to {formatDate(selectedPackage.promotionEndDate)}
                    </span>
                  </div>
                )}

                {selectedPackage.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-sm text-gray-600 leading-relaxed break-words">{selectedPackage.description}</p>
                  </div>
                )}

                {selectedPackage.features && selectedPackage.features.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedPackage.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Check size={14} className="text-green-500 shrink-0 mt-0.5" />
                          <span className="text-gray-700 break-words">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPackage.inclusions && selectedPackage.inclusions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">What's Included</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedPackage.inclusions.map((inclusion, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Check size={14} className="text-green-500 shrink-0 mt-0.5" />
                          <span className="text-gray-700 break-words">{inclusion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Services Included</h3>
                    <span className="text-xs text-gray-500">{selectedPackage.services.length} services</span>
                  </div>

                  <div className="space-y-3">
                    {selectedPackage.services.length === 0 ? (
                      <p className="text-sm text-gray-400">--</p>
                    ) : (
                      selectedPackage.services.map((service, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Check size={14} className="text-green-500 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 break-words">{service.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">Category: {service.category}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mt-1 break-all">Vendor: {selectedPackage.vendorName}</p>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}