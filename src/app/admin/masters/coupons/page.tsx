'use client';

import { useState, useEffect } from 'react';
import { Plus, Tag, ToggleLeft, ToggleRight, Edit, Trash2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import Table from '@/components/admin/Table';
import Modal from '@/components/admin/Modal';
import ConfirmModal from '@/components/admin/ConfirmModal';
import Pagination from '@/components/admin/Pagination';
import Button from '@/components/admin/Button';
import Input from '@/components/admin/Input';
import SearchableSelect from '@/components/admin/SearchableSelect';
import StatsCard from '@/components/admin/StatsCard';
import { Column } from '@/lib/types';
import { adminApi } from '@/api/adminApi';
import toast from 'react-hot-toast';

interface Coupon { 
  id?: string;
  sr_no: number;
  code: string;
  type: string;
  value: number;
  maxDiscountAmount: number;
  currency: string;
  minOrderAmount: number;
  expiresAt: string;
  active: boolean;
  coupon_title?: string;
  applying_to?: string;
  start_date?: string;
  status?: string;
}

interface ValidationResult {
  valid: boolean;
  message?: string;
  discountAmount?: number;
  finalAmount?: number;
}

const applyingToOptions = ['All Services', 'Wedding Photography', 'Catering Services', 'DJ & Music', 'Decoration', 'Venue', 'Makeup & Beauty'];

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
  const [selected, setSelected] = useState<Coupon | null>(null);
  const [validationCode, setValidationCode] = useState('');
  const [validationAmount, setValidationAmount] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [form, setForm] = useState<Partial<Coupon>>({ 
    code: '',
    type: 'PERCENTAGE',
    value: 0,
    maxDiscountAmount: 0,
    currency: 'AED',
    minOrderAmount: 0,
    expiresAt: '',
    active: true
  });

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const apiData = await adminApi.coupons.list();
      
      const convertedApiData: Coupon[] = apiData.map((apiCoupon: any, index: number) => ({
        id: apiCoupon.id,
        sr_no: index + 1,
        code: apiCoupon.code,
        type: apiCoupon.type,
        value: apiCoupon.value,
        maxDiscountAmount: apiCoupon.maxDiscountAmount,
        currency: apiCoupon.currency,
        minOrderAmount: apiCoupon.minOrderAmount,
        expiresAt: apiCoupon.expiresAt,
        active: apiCoupon.active,
        coupon_title: `${apiCoupon.code} - ${apiCoupon.type === 'PERCENTAGE' ? `${apiCoupon.value}% OFF` : `${apiCoupon.currency} ${apiCoupon.value} OFF`}`,
        applying_to: 'All Services',
        start_date: new Date().toISOString().split('T')[0],
        status: apiCoupon.active ? 'Active' : 'Inactive'
      }));
      
      setCoupons(convertedApiData);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to fetch coupons from API');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const couponPayload = (couponData: Partial<Coupon>) => ({
    code: couponData.code,
    type: couponData.type,
    value: Number(couponData.value),
    maxDiscountAmount: Number(couponData.maxDiscountAmount ?? 0),
    currency: couponData.currency,
    minOrderAmount: Number(couponData.minOrderAmount ?? 0),
    expiresAt: couponData.expiresAt,
    active: couponData.active
  });

  const createCoupon = async (couponData: Partial<Coupon>) => {
    try {
      const newCoupon = await adminApi.coupons.create(couponPayload(couponData));
      toast.success('Coupon created successfully!');
      fetchCoupons();
      return newCoupon;
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast.error('Failed to create coupon');
      return null;
    }
  };

  const updateCoupon = async (couponId: string, couponData: Partial<Coupon>) => {
    try {
      const updatedCoupon = await adminApi.coupons.update(couponId, couponPayload(couponData));
      toast.success('Coupon updated successfully!');
      fetchCoupons();
      return updatedCoupon;
    } catch (error) {
      console.error('Error updating coupon:', error);
      toast.error('Failed to update coupon');
      return null;
    }
  };

  const validateCoupon = async (code: string, amount: number) => {
    setValidating(true);
    setValidationResult(null);
    try {
      const data = await adminApi.coupons.validate(code, amount);
      setValidationResult({
        valid: true,
        message: 'Coupon is valid!',
        discountAmount: data.discountAmount,
        finalAmount: data.finalAmount
      });
      toast.success('Coupon validated successfully!');
    } catch (error) {
      console.error('Error validating coupon:', error);
      setValidationResult({
        valid: false,
        message: 'Error validating coupon'
      });
      toast.error('Error validating coupon');
    } finally {
      setValidating(false);
    }
  };

  const updateCouponStatus = async (coupon: Coupon, newStatus: boolean) => {
    try {
      await adminApi.coupons.updateStatus(coupon.id!, newStatus);
      toast.success(`Coupon ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchCoupons();
      return true;
    } catch (error) {
      console.error('Error updating coupon status:', error);
      toast.error('Failed to update coupon status');
      return false;
    }
  };

  const deleteCoupon = async (couponId: string) => {
    try {
      await adminApi.coupons.delete(couponId);
      toast.success('Coupon deleted successfully!');
      fetchCoupons();
      return true;
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
      return false;
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const active = coupons.filter(c => c.active === true).length;
  const inactive = coupons.filter(c => c.active === false).length;
  const expired = coupons.filter(c => new Date(c.expiresAt) < new Date()).length;

  const openStatusModal = (coupon: Coupon) => {
    setSelected(coupon);
    setIsStatusModalOpen(true);
  };

  const confirmStatusChange = async () => {
    if (selected) {
      const newStatus = !selected.active;
      await updateCouponStatus(selected, newStatus);
      setIsStatusModalOpen(false);
      setSelected(null);
    }
  };

  const openValidateModal = () => {
    setValidationCode('');
    setValidationAmount('');
    setValidationResult(null);
    setIsValidateModalOpen(true);
  };

  const handleValidate = () => {
    if (!validationCode) {
      toast.error('Please enter coupon code');
      return;
    }
    if (!validationAmount || Number(validationAmount) <= 0) {
      toast.error('Please enter valid amount');
      return;
    }
    validateCoupon(validationCode, Number(validationAmount));
  };

  const openEdit = (coupon: Coupon) => {
    setSelected(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      maxDiscountAmount: coupon.maxDiscountAmount,
      currency: coupon.currency,
      minOrderAmount: coupon.minOrderAmount,
      expiresAt: coupon.expiresAt.split('T')[0],
      active: coupon.active
    });
    setIsModalOpen(true);
  };

  const openDelete = (coupon: Coupon) => {
    setSelected(coupon);
    setIsDeleteOpen(true);
  };

  const columns: Column[] = [
    { key: 'sr_no', label: 'S.No', render: (v: number) => <span className="font-medium text-gray-600">{v}</span> },
    { key: 'code', label: 'Coupon Code', render: (v: string) => <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">{v}</span> },
    { key: 'coupon_title', label: 'Title' },
    { key: 'type', label: 'Type', render: (v: string) => v === 'PERCENTAGE' ? 'Percentage' : 'Flat' },
    { key: 'value', label: 'Discount', render: (v: number, row: Coupon) => row.type === 'PERCENTAGE' ? `${v}%` : `${row.currency} ${v}` },
    { key: 'minOrderAmount', label: 'Min Order', render: (v: number, row: Coupon) => `${row.currency} ${v.toLocaleString()}` },
    { key: 'maxDiscountAmount', label: 'Max Discount', render: (v: number, row: Coupon) => v > 0 ? `${row.currency} ${v.toLocaleString()}` : '-' },
    { key: 'expiresAt', label: 'Expiry Date', render: (v: string) => new Date(v).toLocaleDateString() },
    { 
      key: 'active', 
      label: 'Status', 
      render: (v: boolean, row: Coupon) => (
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            v ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {v ? 'Active' : 'Inactive'}
          </span>
          {new Date(row.expiresAt) > new Date() && (
            <button
              onClick={() => openStatusModal(row)}
              className="text-gray-500 hover:text-orange-600 transition-colors"
              title={v ? 'Deactivate' : 'Activate'}
            >
              {v ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            </button>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: Coupon) => (
        <div className="flex items-center gap-1">
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
      )
    }
  ];

  const openAdd = () => { 
    setSelected(null); 
    setForm({ 
      code: '',
      type: 'PERCENTAGE',
      value: 0,
      maxDiscountAmount: 0,
      currency: 'AED',
      minOrderAmount: 0,
      expiresAt: '',
      active: true
    }); 
    setIsModalOpen(true); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.code || !form.expiresAt) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (Number(form.minOrderAmount ?? 0) < 0) {
      toast.error('Minimum order amount must not be less than 0');
      return;
    }
    
    if (!Number.isInteger(Number(form.minOrderAmount))) {
      toast.error('Minimum order amount must be an integer number');
      return;
    }
    
    const isoDate = new Date(form.expiresAt).toISOString();
    const submitData = { ...form, expiresAt: isoDate };
    
    if (selected) {
      if (selected.id) await updateCoupon(selected.id, submitData);
      setIsModalOpen(false);
    } else {
      await createCoupon(submitData);
      setIsModalOpen(false);
    }
  };

  const totalPages = Math.ceil(coupons.length / ITEMS_PER_PAGE);
  const paginatedData = coupons.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading coupons from API...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Coupons Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {coupons.length} coupons from API
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={openValidateModal}>
            <CheckCircle size={15} />
            Validate Coupon
          </Button>
          <Button variant="secondary" onClick={fetchCoupons}>
            <RefreshCw size={15} />
            Refresh
          </Button>
          <Button onClick={openAdd}>
            <Plus size={15} />
            Create Coupon
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Coupons" value={coupons.length} icon={<Tag size={18} />} color="orange" />
        <StatsCard title="Active Coupons" value={active} icon={<Tag size={18} />} color="green" />
        <StatsCard title="Inactive" value={inactive} icon={<Tag size={18} />} color="orange" />
        <StatsCard title="Expired" value={expired} icon={<Tag size={18} />} color="purple" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Table columns={columns} data={paginatedData} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={coupons.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selected ? 'Edit Coupon' : 'Create Coupon'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Input 
              label="Coupon Code" 
              value={form.code} 
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} 
              placeholder="e.g. EVENT10"
              required 
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Coupon Type</label>
              <SearchableSelect
                options={[{ id: 'PERCENTAGE', label: 'Percentage (%)' }, { id: 'FLAT', label: 'Flat (AED)' }]}
                value={form.type || 'PERCENTAGE'}
                onChange={id => setForm({ ...form, type: String(id) })}
                searchPlaceholder="Search..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
              <SearchableSelect
                options={[{ id: 'AED', label: 'AED' }, { id: 'SAR', label: 'SAR' }, { id: 'USD', label: 'USD' }]}
                value={form.currency || 'AED'}
                onChange={id => setForm({ ...form, currency: String(id) })}
                searchPlaceholder="Search..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <SearchableSelect
                options={[{ id: 'Active', label: 'Active' }, { id: 'Inactive', label: 'Inactive' }]}
                value={form.active ? 'Active' : 'Inactive'}
                onChange={id => setForm({ ...form, active: id === 'Active' })}
                searchPlaceholder="Search..."
              />
            </div>

            <Input 
              label={form.type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount (AED)'} 
              type="number" 
              value={form.value} 
              onChange={e => setForm({ ...form, value: Number(e.target.value) })} 
              required 
            />

            <Input 
              label="Minimum Order Amount (AED)" 
              type="number" 
              value={form.minOrderAmount} 
              onChange={e => setForm({ ...form, minOrderAmount: Number(e.target.value) })} 
              required 
              step="1"
            />

            <Input 
              label="Maximum Discount Amount (AED)" 
              type="number" 
              value={form.maxDiscountAmount} 
              onChange={e => setForm({ ...form, maxDiscountAmount: Number(e.target.value) })} 
              placeholder="0 for no maximum"
            />

            <Input 
              label="Expiry Date" 
              type="date" 
              value={form.expiresAt} 
              onChange={e => setForm({ ...form, expiresAt: e.target.value })} 
              required 
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {selected ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isValidateModalOpen} onClose={() => setIsValidateModalOpen(false)} title="Validate Coupon" size="md">
        <div className="space-y-4">
          <Input 
            label="Coupon Code" 
            value={validationCode} 
            onChange={e => setValidationCode(e.target.value.toUpperCase())} 
            placeholder="Enter coupon code"
            required 
          />
          
          <Input 
            label="Order Amount (AED)" 
            type="number" 
            value={validationAmount} 
            onChange={e => setValidationAmount(e.target.value)} 
            placeholder="Enter order amount"
            required 
          />

          <Button onClick={handleValidate} disabled={validating} className="w-full">
            {validating ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle size={15} />}
            Validate
          </Button>

          {validationResult && (
            <div className={`p-4 rounded-xl ${validationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {validationResult.valid ? <CheckCircle className="text-green-600" size={20} /> : <XCircle className="text-red-600" size={20} />}
                <span className={`font-semibold ${validationResult.valid ? 'text-green-700' : 'text-red-700'}`}>
                  {validationResult.valid ? 'Coupon Valid!' : 'Invalid Coupon'}
                </span>
              </div>
              <p className={`text-sm ${validationResult.valid ? 'text-green-600' : 'text-red-600'}`}>
                {validationResult.message}
              </p>
              {validationResult.valid && validationResult.discountAmount && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-sm text-green-700">
                    Discount Amount: <span className="font-bold">{validationResult.discountAmount} AED</span>
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Final Amount: <span className="font-bold">{validationResult.finalAmount} AED</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmModal 
        isOpen={isStatusModalOpen} 
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelected(null);
        }} 
        onConfirm={confirmStatusChange} 
        title={selected?.active ? 'Deactivate Coupon' : 'Activate Coupon'} 
        message={`Are you sure you want to ${selected?.active ? 'deactivate' : 'activate'} coupon "${selected?.code}"?`}
      />

      <ConfirmModal 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        onConfirm={() => { 
          if (selected && selected.id) { 
            deleteCoupon(selected.id); 
          } 
          setIsDeleteOpen(false); 
        }} 
        title="Delete Coupon" 
        message={`Are you sure you want to delete coupon "${selected?.code}"? This action cannot be undone.`} 
      />
    </div>
  );
}