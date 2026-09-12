'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Building, Calendar,
  CreditCard, CheckCircle, XCircle, AlertCircle, FileText, Image as ImageIcon,
  ShieldCheck, User, Info, Globe, ExternalLink, Percent, Layers,
  Landmark, Sparkles, Link2
} from 'lucide-react';
import Button from '@/components/admin/Button';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { adminApi } from '@/api/adminApi';

interface Vendor {
  id: string;
  userId?: string;
  oldVendorId?: string | null;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  primaryEmail?: string;
  phone?: string;
  primaryMobile?: string;
  phoneCountryCode?: string;
  primaryMobileCountryCode?: string;
  about?: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  telephone?: string;
  status?: string;
  vendorType?: string;
  vendorProfileImage?: string;
  tradeLicenseNumber?: string;
  tradeLicenseExpiry?: string;
  tradeLicenseFileUrl?: string;
  tradeLicenseFileKey?: string;
  passportExpiry?: string;
  passportFileUrl?: string;
  passportFileKey?: string;
  emiratesIdExpiry?: string;
  vatNumber?: string;
  updatedProfile?: boolean;
  specialization?: string;
  businessLocation?: string;
  location?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  poBox?: string;
  visaType?: string;
  cities?: string[];
  capacityPerDay?: number;
  commissionPercent?: number | string;
  planDetails?: string;
  planExpiry?: string;
  agreementFileUrl?: string;
  agreementFileKey?: string;
  bankName?: string;
  accountFullName?: string;
  ibanNo?: string;
  accountNumber?: string;
  swift?: string;
  branchAddress?: string;
  appleId?: string | null;
  countryCode?: string | null;
  deviceToken?: string | null;
  estCardExpiry?: string | null;
  facebookId?: string | null;
  googleId?: string | null;
  imageUrl?: string | null;
  inviteCode?: string | null;
  isBlocked?: boolean | null;
  isDeleted?: boolean | null;
  isPremium?: boolean | null;
  isVerified?: boolean | null;
  noOfPartners?: number | null;
  tradeExpiry?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

function Card({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 shrink-0">
            <Icon size={15} />
          </span>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        {action}
      </div>
      <div className="px-5 sm:px-6 py-5">{children}</div>
    </div>
  );
}

function Item({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-900">
        {value === undefined || value === null || value === '' ? (
          <span className="text-gray-400">Not provided</span>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

export default function ViewVendorPage() {
  const router = useRouter();
  const params = useParams();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [fetching, setFetching] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');

  useEffect(() => {
    const id = params.id as string;
    if (!id) return;

    (async () => {
      try {
        setFetching(true);
        const data = await adminApi.vendors.getById(id);
        setVendor(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load vendor');
      } finally {
        setFetching(false);
      }
    })();
  }, [params.id]);

  const statusColors: Record<string, { bg: string; text: string; icon: any; dot: string }> = {
    APPROVED: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle, dot: 'bg-green-500' },
    PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: AlertCircle, dot: 'bg-yellow-500' },
    REJECTED: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle, dot: 'bg-red-500' },
  };

  const openStatusModal = () => {
    if (!vendor) return;
    const newStatus = vendor.status === 'APPROVED' ? 'REJECTED' : 'APPROVED';
    setPendingStatus(newStatus);
    setIsStatusModalOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!vendor || !pendingStatus) return;
    try {
      await adminApi.vendors.updateStatus(vendor.id, pendingStatus);
      setVendor({ ...vendor, status: pendingStatus });
      toast.success(`Vendor ${pendingStatus === 'APPROVED' ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update vendor status');
    } finally {
      setIsStatusModalOpen(false);
      setPendingStatus('');
    }
  };

  const confirmDelete = async () => {
    if (!vendor) return;
    try {
      await adminApi.vendors.delete(vendor.id);
      toast.success('Vendor deleted successfully!');
      router.push('/admin/vendors');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete vendor');
    } finally {
      setIsDeleteOpen(false);
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const BoolBadge = ({ value }: { value?: boolean | null }) => (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${value ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
      {value ? 'Yes' : 'No'}
    </span>
  );

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <span className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          Loading vendor...
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Vendor not found.</div>
      </div>
    );
  }

  const status = vendor.status || 'PENDING';
  const StatusColor = statusColors[status] || statusColors.PENDING;
  const StatusIcon = StatusColor.icon;
  const email = vendor.primaryEmail || vendor.email || '';
  const primaryMobileCode = vendor.primaryMobileCountryCode || vendor.countryCode || '';
  const primaryMobileNumber = vendor.primaryMobile || '';
  const phone = primaryMobileNumber
    ? (primaryMobileCode ? `${primaryMobileCode} ${primaryMobileNumber}` : primaryMobileNumber)
    : (vendor.phone || '');
  const businessLocation = vendor.businessLocation || vendor.location || '';

  const getLocationParts = (location: string) => {
    if (!location) return { country: '', state: '', city: '' };
    const parts = location.split(', ').map(s => s.trim());
    return {
      country: parts[0] || '',
      state: parts[1] || '',
      city: parts[2] || ''
    };
  };

  const locationParts = getLocationParts(businessLocation);

  const getVendorTypeLabel = (type?: string) => {
    if (type === 'PERMANENT') return 'Service Provider';
    if (type === 'FREELANCER') return 'Professional';
    return type || '';
  };

  const vendorTypeLabel = getVendorTypeLabel(vendor.vendorType);
  const isServiceProvider = vendor.vendorType === 'PERMANENT';
  const isProfessional = vendor.vendorType === 'FREELANCER';

  const planExpired = vendor.planExpiry ? new Date(vendor.planExpiry) < new Date() : false;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Vendor Details</h1>
            <p className="text-sm text-gray-500 mt-0.5">View complete vendor information</p>
          </div>
        </div>
        <div className="flex gap-2.5">
          {status !== 'PENDING' && (
            <Button variant="secondary" onClick={openStatusModal}>
              {status === 'APPROVED' ? (
                <> <XCircle size={15} /> Reject</>
              ) : (
                <> <CheckCircle size={15} /> Approve</>
              )}
            </Button>
          )}
          <Button variant="secondary" onClick={() => router.push(`/admin/vendors/edit/${vendor.id}`)}>
            <Edit size={15} />
            Edit
          </Button>
          <Button variant="secondary" onClick={() => setIsDeleteOpen(true)} className="text-red-600 hover:bg-red-50">
            <Trash2 size={15} />
            Delete
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {vendor.vendorProfileImage ? (
            <img
              src={vendor.vendorProfileImage}
              alt={vendor.companyName || 'Vendor'}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow shrink-0"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
              {vendor.companyName?.charAt(0).toUpperCase() || 'V'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {vendor.companyName || 'Unnamed Vendor'}
              </h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${StatusColor.bg} ${StatusColor.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${StatusColor.dot}`} />
                {status}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {vendor.vendorType && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {vendorTypeLabel}
                </span>
              )}
              {vendor.isVerified && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 flex items-center gap-1">
                  <ShieldCheck size={11} /> Verified
                </span>
              )}
              {vendor.isPremium && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 flex items-center gap-1">
                  <Sparkles size={11} /> Premium
                </span>
              )}
              {vendor.isBlocked && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                  Blocked
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {vendor.contactPerson || 'Contact person not provided'}
              {vendor.userName ? (
                <span className="text-gray-400"> · @{vendor.userName}</span>
              ) : null}
            </p>
            <div className="flex items-center gap-4 mt-2.5 text-sm text-gray-500 flex-wrap">
              {email && (
                <span className="flex items-center gap-1.5">
                  <Mail size={14} className="text-gray-400" />
                  {email}
                </span>
              )}
              {phone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-gray-400" />
                  {phone}
                </span>
              )}
              {vendor.telephone && (
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-gray-400" />
                  {vendor.telephone}
                  <span className="text-xs text-gray-400">(office)</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Personal Information" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <Item label="First Name" value={vendor.firstName} />
              <Item label="Last Name" value={vendor.lastName} />
              {isProfessional && (
                <>
                  <Item label="Visa Type" value={vendor.visaType} />
                  <Item label="Emirates ID Expiry" value={formatDate(vendor.emiratesIdExpiry)} />
                </>
              )}
              {vendor.about ? (
                <div className="sm:col-span-2">
                  <Item label="About" value={vendor.about} />
                </div>
              ) : null}
            </div>
          </Card>

          <Card title="Business Information" icon={Building}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                {isServiceProvider && (
                  <>
                    <Item label="Trade License Number" value={vendor.tradeLicenseNumber} />
                    <Item label="Trade License Expiry" value={formatDate(vendor.tradeLicenseExpiry)} />
                  </>
                )}
                <Item label="VAT Number" value={vendor.vatNumber} />
                <Item label="Specialization" value={vendor.specialization} />
                {isProfessional && (
                  <Item label="Passport Expiry" value={formatDate(vendor.passportExpiry)} />
                )}
              </div>

              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Business Location
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-3.5 py-2.5">
                    <p className="text-[11px] text-gray-400 mb-0.5">Country</p>
                    <p className="text-sm text-gray-900 font-medium">{locationParts.country || '—'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-3.5 py-2.5">
                    <p className="text-[11px] text-gray-400 mb-0.5">State</p>
                    <p className="text-sm text-gray-900 font-medium">{locationParts.state || '—'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-3.5 py-2.5">
                    <p className="text-[11px] text-gray-400 mb-0.5">City</p>
                    <p className="text-sm text-gray-900 font-medium">{locationParts.city || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <Item label="Address Line 1" value={vendor.addressLine1 || vendor.address} />
                <Item label="Address Line 2" value={vendor.addressLine2} />
                <Item label="Landmark" value={vendor.landmark} />
                <Item label="PO Box" value={vendor.poBox} />
              </div>

              {vendor.cities && vendor.cities.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                    Service States
                  </p>
                  <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2.5">
                      <Globe size={12} className="text-gray-400" />
                      United Arab Emirates
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {vendor.cities.map((stateName: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-xs font-medium"
                        >
                          <MapPin size={11} className="text-orange-400" />
                          {stateName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {(vendor.tradeLicenseFileUrl || vendor.passportFileUrl || vendor.agreementFileUrl) && (
            <Card title="Documents" icon={FileText}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {vendor.tradeLicenseFileUrl && (
                  <a
                    href={vendor.tradeLicenseFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3.5 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/60 transition-colors text-sm text-gray-700 group"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-500 shrink-0">
                      <ImageIcon size={15} />
                    </span>
                    <span className="flex-1 min-w-0 truncate">Trade License</span>
                    <ExternalLink size={13} className="text-gray-300 group-hover:text-orange-400 shrink-0" />
                  </a>
                )}
                {vendor.passportFileUrl && (
                  <a
                    href={vendor.passportFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3.5 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/60 transition-colors text-sm text-gray-700 group"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-500 shrink-0">
                      <ImageIcon size={15} />
                    </span>
                    <span className="flex-1 min-w-0 truncate">Passport</span>
                    <ExternalLink size={13} className="text-gray-300 group-hover:text-orange-400 shrink-0" />
                  </a>
                )}
                {vendor.agreementFileUrl && (
                  <a
                    href={vendor.agreementFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3.5 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/60 transition-colors text-sm text-gray-700 group"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-500 shrink-0">
                      <ImageIcon size={15} />
                    </span>
                    <span className="flex-1 min-w-0 truncate">Agreement</span>
                    <ExternalLink size={13} className="text-gray-300 group-hover:text-orange-400 shrink-0" />
                  </a>
                )}
              </div>
            </Card>
          )}

          {(vendor.bankName || vendor.accountFullName || vendor.ibanNo || vendor.accountNumber || vendor.swift) && (
            <Card title="Bank Details" icon={CreditCard}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <Item label="Bank Name" value={vendor.bankName} />
                <Item label="Account Full Name" value={vendor.accountFullName} />
                <Item label="IBAN No." value={vendor.ibanNo} />
                <Item label="Account Number" value={vendor.accountNumber} />
                <Item label="Swift Code" value={vendor.swift} />
                {vendor.branchAddress ? (
                  <div className="sm:col-span-2">
                    <Item label="Branch Address" value={vendor.branchAddress} />
                  </div>
                ) : null}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Plan & Commission" icon={Calendar}>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-gray-50/70 border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Layers size={14} className="text-gray-400" />
                  Capacity / day
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {vendor.capacityPerDay || 0} events
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50/70 border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Percent size={14} className="text-gray-400" />
                  Commission
                </div>
                <span className="text-sm font-semibold text-green-600">
                  {vendor.commissionPercent || 0}%
                </span>
              </div>
              <Item label="Plan Details" value={vendor.planDetails} />
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">
                  Plan Expiry
                </p>
                <p className={`text-sm font-medium ${planExpired ? 'text-red-500' : 'text-gray-900'}`}>
                  {formatDate(vendor.planExpiry) || 'Not provided'}
                  {planExpired ? ' · Expired' : ''}
                </p>
              </div>
            </div>
          </Card>

          <Card title="Account & System" icon={Info}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Item label="Invite Code" value={vendor.inviteCode} />
                <Item label="Partners" value={vendor.noOfPartners ?? undefined} />
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <Link2 size={11} /> Linked Accounts
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Google</span>
                  <BoolBadge value={!!vendor.googleId} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Facebook</span>
                  <BoolBadge value={!!vendor.facebookId} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Apple</span>
                  <BoolBadge value={!!vendor.appleId} />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Profile Updated</span>
                  <BoolBadge value={vendor.updatedProfile} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Verified</span>
                  <BoolBadge value={vendor.isVerified} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Premium</span>
                  <BoolBadge value={vendor.isPremium} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Blocked</span>
                  <BoolBadge value={vendor.isBlocked} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Deleted</span>
                  <BoolBadge value={vendor.isDeleted} />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-3">
                <Item label="Created At" value={formatDateTime(vendor.createdAt)} />
                <Item label="Updated At" value={formatDateTime(vendor.updatedAt)} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setPendingStatus('');
        }}
        onConfirm={confirmStatusChange}
        title={pendingStatus === 'APPROVED' ? 'Approve Vendor' : 'Reject Vendor'}
        message={`Are you sure you want to ${pendingStatus === 'APPROVED' ? 'approve' : 'reject'} vendor "${vendor.companyName}"?`}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Vendor"
        message={`Are you sure you want to delete vendor "${vendor.companyName}"? This action cannot be undone.`}
      />
    </div>
  );
}