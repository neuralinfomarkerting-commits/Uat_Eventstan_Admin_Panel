"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Mail,
  Briefcase,
  Phone,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Table from "@/components/admin/Table";
import Modal from "@/components/admin/Modal";
import ConfirmModal from "@/components/admin/ConfirmModal";
import Button from "@/components/admin/Button";
import Pagination from "@/components/admin/Pagination";
import { adminApi } from "@/api/adminApi";
import toast from "react-hot-toast";

interface Vendor {
  id: string;
  companyName: string;
  businessName?: string;
  firstName?: string;
  lastName?: string;
  contactPerson: string;
  email: string;
  primaryEmail?: string;
  phone: string;
  primaryMobile?: string;
  primaryMobileCountryCode?: string;
  phoneCountryCode?: string;
  telephone?: string;
  telephoneCountryCode?: string;
  status: string;
  vendorType?: string;
  tradeLicenseNumber: string;
  vatNumber: string;
  cities: string[];
  capacityPerDay: number;
  commissionPercent: number;
  srNo?: number;
}

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string>("");

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await adminApi.vendors.list();
      const vendorsWithSrNo = data.map((vendor: Vendor, index: number) => ({
        ...vendor,
        srNo: index + 1,
        companyName: vendor.businessName || vendor.companyName || '',
      }));
      setVendors(vendorsWithSrNo);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    APPROVED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  const getVendorTypeLabel = (type?: string) => {
    if (type === 'PERMANENT') return 'Service Provider';
    if (type === 'FREELANCER') return 'Professional';
    return type || 'Not specified';
  };

  const getVendorFullName = (vendor: Vendor) => {
    const firstName = vendor.firstName || '';
    const lastName = vendor.lastName || '';
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return vendor.contactPerson || 'Not provided';
  };

  const getVendorPhone = (vendor: Vendor) => {
    if (vendor.primaryMobile) {
      const code = vendor.primaryMobileCountryCode || vendor.phoneCountryCode || '';
      return code ? `${code} ${vendor.primaryMobile}` : vendor.primaryMobile;
    }
    if (vendor.telephone) {
      const code = vendor.telephoneCountryCode || '';
      return code ? `${code} ${vendor.telephone}` : vendor.telephone;
    }
    return vendor.phone || 'Not provided';
  };

  const getVendorEmail = (vendor: Vendor) => {
    return vendor.primaryEmail || vendor.email || 'Not provided';
  };

  const openStatusModal = (vendor: Vendor) => {
    setSelected(vendor);
    const newStatus = vendor.status === "APPROVED" ? "REJECTED" : "APPROVED";
    setPendingStatus(newStatus);
    setIsStatusModalOpen(true);
  };

  const confirmStatusChange = async () => {
    if (selected && pendingStatus) {
      try {
        await adminApi.vendors.updateStatus(selected.id, pendingStatus);
        setVendors(
          vendors.map((v) =>
            v.id === selected.id ? { ...v, status: pendingStatus } : v,
          ),
        );
        toast.success(
          `Vendor ${pendingStatus === "APPROVED" ? "approved" : "rejected"} successfully!`,
        );
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update vendor status");
      }

      setIsStatusModalOpen(false);
      setSelected(null);
      setPendingStatus("");
    }
  };

  const openView = (vendor: Vendor) => {
    router.push(`/admin/vendors/view/${vendor.id}`);
  };

  const openEdit = (vendor: Vendor) => {
    router.push(`/admin/vendors/edit/${vendor.id}`);
  };

  const openDelete = (vendor: Vendor) => {
    setSelected(vendor);
    setIsDeleteOpen(true);
  };

  const columns = [
    { key: "srNo", label: "SR No" },
    { 
      key: "companyName", 
      label: "Business Name",
      render: (value: string, row: Vendor) => (
        <span className="font-medium text-gray-900">{value || 'Not provided'}</span>
      )
    },
    { 
      key: "contactPerson", 
      label: "Vendor Name",
      render: (_: any, row: Vendor) => (
        <span className="text-gray-700">{getVendorFullName(row)}</span>
      )
    },
    { 
      key: "vendorType", 
      label: "Vendor Type",
      render: (_: any, row: Vendor) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          {getVendorTypeLabel(row.vendorType)}
        </span>
      )
    },
    { 
      key: "email", 
      label: "Email",
      render: (_: any, row: Vendor) => (
        <span className="text-gray-700">{getVendorEmail(row)}</span>
      )
    },
    { 
      key: "phone", 
      label: "Contact Number",
      render: (_: any, row: Vendor) => (
        <span className="text-gray-700">{getVendorPhone(row)}</span>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (v: string, row: Vendor) => (
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[v] ?? "bg-gray-100 text-gray-600"}`}
          >
            {v}
          </span>
          {v !== "PENDING" && (
            <button
              onClick={() => openStatusModal(row)}
              className="text-gray-500 hover:text-orange-600 transition-colors"
              title={v === "APPROVED" ? "Reject" : "Approve"}
            >
              {v === "APPROVED" ? (
                <ToggleRight size={20} />
              ) : (
                <ToggleLeft size={20} />
              )}
            </button>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: Vendor) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openView(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
            title="View Details"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
            title="Edit"
          >
            <Edit size={14} />
          </button>
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

  const openAdd = () => {
    router.push("/admin/vendors/add");
  };

  const confirmDelete = async () => {
    if (selected) {
      try {
        await adminApi.vendors.delete(selected.id);
        setVendors(vendors.filter((v) => v.id !== selected.id));
        toast.success("Vendor deleted successfully!");
      } catch (error) {
        console.error("Error deleting vendor:", error);
        toast.error("Failed to delete vendor");
      }
    }
    setIsDeleteOpen(false);
  };

  const totalPages = Math.ceil(vendors.length / ITEMS_PER_PAGE);
  const paginatedData = vendors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading vendors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Vendors Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {vendors.length} total vendors ·{" "}
            {vendors.filter((v) => v.status === "APPROVED").length} approved ·{" "}
            {vendors.filter((v) => v.status === "PENDING").length} pending
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={15} />
          Add Vendor
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Table columns={columns} data={paginatedData} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={vendors.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <ConfirmModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelected(null);
          setPendingStatus("");
        }}
        onConfirm={confirmStatusChange}
        title={
          pendingStatus === "APPROVED" ? "Approve Vendor" : "Reject Vendor"
        }
        message={`Are you sure you want to ${pendingStatus === "APPROVED" ? "approve" : "reject"} vendor "${selected?.companyName}"?`}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Vendor"
        message={`Are you sure you want to delete vendor "${selected?.companyName}"? This action cannot be undone.`}
      />
    </div>
  );
}