'use client';

import { Check, Package, Eye, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminApi } from '@/api/adminApi';

interface ServiceItem {
  name: string;
  category: string;
}

interface MarketingPackage {
  id: string;
  name: string;
  price: number;
  duration: string;
  popular?: boolean;
  color: string;
  services: ServiceItem[];
  description?: string;
  vendorId?: string;
  status?: string;
}

interface ApiPackage {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  itemIds: string[];
  price: {
    amount: number;
    currency: string;
  };
  status: string;
}

// Helper function to map item IDs to actual service details
const getServiceDetails = (itemId: string): ServiceItem => {
  const serviceMap: Record<string, ServiceItem> = {
    'svc_decoration': { name: 'Decoration Services', category: 'Decoration' },
    'svc_1780287637213_anpp8u': { name: 'Birthday Cake', category: 'Catering' },
  };
  
  return serviceMap[itemId] || { name: `Service ${itemId}`, category: 'Other' };
};

const categoryColors: Record<string, string> = {
  Photography: 'bg-blue-50 text-blue-600',
  Catering: 'bg-green-50 text-green-600',
  Entertainment: 'bg-purple-50 text-purple-600',
  Decoration: 'bg-pink-50 text-pink-600',
  Beauty: 'bg-yellow-50 text-yellow-600',
  Venue: 'bg-orange-50 text-orange-600',
  Other: 'bg-gray-50 text-gray-600',
};

export default function MarketingPackagesPage() {
  const [packages, setPackages] = useState<MarketingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<MarketingPackage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const data: ApiPackage[] = await adminApi.packages.list();
      
      const transformedPackages: MarketingPackage[] = data.map((pkg, index) => {
        const colors = ['border-gray-200', 'border-blue-200', 'border-orange-300', 'border-purple-200'];
        const color = colors[index % colors.length];
        const services = pkg.itemIds.map(itemId => getServiceDetails(itemId));
        const isPopular = pkg.title.toLowerCase().includes('gold') || pkg.price.amount > 30000;
        
        return {
          id: pkg.id,
          name: pkg.title,
          price: pkg.price.amount,
          duration: 'Custom',
          color: color,
          services: services,
          popular: isPopular,
          description: pkg.description,
          vendorId: pkg.vendorId,
          status: pkg.status,
        };
      });
      
      setPackages(transformedPackages);
      setError(null);
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (pkg: MarketingPackage) => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPackage(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Marketing Packages</h1>
          <p className="text-sm text-gray-500 mt-0.5">Loading packages...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Marketing Packages</h1>
          <p className="text-sm text-red-500 mt-0.5">Error loading packages</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p>Failed to load packages: {error}</p>
          <button 
            onClick={fetchPackages}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Marketing Packages</h1>
          <p className="text-sm text-gray-500 mt-0.5">No packages available at the moment</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No packages found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Marketing Packages</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {packages.length} packages available — each combines vendor services into a ready-to-sell bundle
          </p>
        </div>

        {/* Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {packages.map(pkg => (
            <div
              key={pkg.id}
              className={`relative bg-white rounded-2xl border-2 shadow-sm flex flex-col ${pkg.color}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow">
                  Most Popular
                </div>
              )}

              {/* Top */}
              <div className={`px-5 pt-6 pb-4 border-b ${pkg.popular ? 'border-orange-100' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pkg.popular ? 'bg-orange-50' : 'bg-gray-50'}`}>
                      <Package size={16} className={pkg.popular ? 'text-orange-500' : 'text-gray-400'} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-base">{pkg.name}</h3>
                  </div>
                  <button
                    onClick={() => openModal(pkg)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={16} className="text-gray-500" />
                  </button>
                </div>
                <div>
                  <span className="text-2xl font-extrabold text-gray-900">₹{pkg.price.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm ml-1">/ {pkg.duration}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{pkg.services.length} services included</p>
                {pkg.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{pkg.description}</p>
                )}
              </div>

              {/* Services list */}
              <div className="px-5 py-4 flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Included Services</p>
                <ul className="space-y-2">
                  {pkg.services.slice(0, 3).map((svc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check size={13} className="text-green-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-700 leading-snug">{svc.name}</p>
                        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-0.5 font-medium ${categoryColors[svc.category] ?? 'bg-gray-100 text-gray-500'}`}>
                          {svc.category}
                        </span>
                      </div>
                    </li>
                  ))}
                  {pkg.services.length > 3 && (
                    <li className="text-xs text-gray-500 pl-5">
                      +{pkg.services.length - 3} more services
                    </li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Package Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Package', 'Price', 'Duration', 'Services Count', 'Categories', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {packages.map(pkg => {
                  const cats = pkg.services.map(s => s.category).filter((c, i, a) => a.indexOf(c) === i);
                  return (
                    <tr key={pkg.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{pkg.name}</span>
                          {pkg.popular && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Popular</span>}
                        </div>
                        {pkg.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{pkg.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-3 font-bold text-orange-600">₹{pkg.price.toLocaleString()}</td>
                      <td className="px-6 py-3 text-gray-600">{pkg.duration}</td>
                      <td className="px-6 py-3">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">{pkg.services.length} services</span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-1">
                          {cats.map(c => (
                            <span key={c} className={`text-[10px] px-2 py-0.5 rounded font-medium ${categoryColors[c] ?? 'bg-gray-100 text-gray-500'}`}>{c}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                          pkg.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {pkg.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => openModal(pkg)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} className="text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeModal}
          />
          
          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedPackage.popular ? 'bg-orange-50' : 'bg-gray-50'}`}>
                    <Package size={20} className={selectedPackage.popular ? 'text-orange-500' : 'text-gray-400'} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedPackage.name}</h2>
                    {selectedPackage.vendorId && (
                      <p className="text-xs text-gray-500">Vendor ID: {selectedPackage.vendorId}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              {/* Body */}
              <div className="px-6 py-6 space-y-6">
                {/* Price & Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Price</p>
                    <p className="text-3xl font-bold text-orange-600">₹{selectedPackage.price.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">per {selectedPackage.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedPackage.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedPackage.status}
                    </span>
                  </div>
                </div>
                
                {/* Description */}
                {selectedPackage.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-sm text-gray-600">{selectedPackage.description}</p>
                  </div>
                )}
                
                {/* All Services */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">All Included Services</h3>
                    <span className="text-xs text-gray-500">{selectedPackage.services.length} services</span>
                  </div>
                  
                  {/* Group services by category */}
                  {Object.entries(
                    selectedPackage.services.reduce((acc, service) => {
                      if (!acc[service.category]) acc[service.category] = [];
                      acc[service.category].push(service);
                      return acc;
                    }, {} as Record<string, ServiceItem[]>)
                  ).map(([category, services]) => (
                    <div key={category} className="mb-4">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${categoryColors[category]?.split(' ')[1] || 'bg-gray-500'}`}></span>
                        {category}
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        {services.map((service, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <Check size={14} className="text-green-500 shrink-0 mt-0.5" />
                            <span className="text-gray-700">{service.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Package ID */}
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Package ID: {selectedPackage.id}</p>
                </div>
              </div>
              
              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
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
    </>
  );
}
