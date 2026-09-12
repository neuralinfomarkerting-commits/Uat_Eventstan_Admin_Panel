"use client";

import { useEffect, useState } from "react";
import { Edit, Globe, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
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

interface Country {
  id: number;
  code: string;
  name: string;
  defaultCurrency: string;
  flag?: string;
  currencySymbol?: string;
  phoneCode?: string;
  status: string;
}

const emptyCountry: Partial<Country> = {
  name: "",
  code: "",
  defaultCurrency: "",
  flag: "",
  currencySymbol: "",
  phoneCode: "",
  status: "Active",
};

const currencySymbols: Record<string, string> = {
  AED: "AED",
  USD: "$",
  EUR: "EUR",
  GBP: "GBP",
  INR: "INR",
  SAR: "SAR",
  QAR: "QAR",
  OMR: "OMR",
  KWD: "KWD",
};

const phoneCodes: Record<string, string> = {
  AE: "+971",
  IN: "+91",
  US: "+1",
  GB: "+44",
  SA: "+966",
  QA: "+974",
  OM: "+968",
  KW: "+965",
};

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selected, setSelected] = useState<Country | null>(null);
  const [pendingStatus, setPendingStatus] = useState("");
  const [form, setForm] = useState<Partial<Country>>(emptyCountry);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      setCountries(await adminApi.countries.list());
    } catch (error) {
      console.error(error);
      toast.error("Failed to load countries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openAdd = () => {
    setSelected(null);
    setForm(emptyCountry);
    setModalOpen(true);
  };

  const openEdit = (country: Country) => {
    setSelected(country);
    setForm(country);
    setModalOpen(true);
  };

  const openStatusModal = (country: Country) => {
    setSelected(country);
    setPendingStatus(country.status === "Active" ? "Inactive" : "Active");
    setStatusOpen(true);
  };

  const updateCode = (code: string) => {
    const upperCode = code.toUpperCase();
    setForm({ ...form, code: upperCode, phoneCode: form.phoneCode || phoneCodes[upperCode] || "" });
  };

  const updateCurrency = (currency: string) => {
    const upperCurrency = currency.toUpperCase();
    setForm({ ...form, defaultCurrency: upperCurrency, currencySymbol: currencySymbols[upperCurrency] || upperCurrency });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.code || !form.defaultCurrency) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      name: form.name,
      code: form.code.toUpperCase(),
      defaultCurrency: form.defaultCurrency.toUpperCase(),
      flag: form.flag || "",
      currencySymbol: form.currencySymbol || currencySymbols[form.defaultCurrency.toUpperCase()] || form.defaultCurrency,
      phoneCode: form.phoneCode || "",
      status: form.status || "Active",
    };

    if (selected) {
      await adminApi.countries.update(selected.id, payload);
      toast.success("Country updated");
    } else {
      await adminApi.countries.create(payload);
      toast.success("Country created");
    }

    setModalOpen(false);
    await load();
  };

  const confirmStatus = async () => {
    if (!selected) return;
    await adminApi.countries.update(selected.id, { status: pendingStatus });
    toast.success("Country status updated");
    setStatusOpen(false);
    setSelected(null);
    await load();
  };

  const confirmDelete = async () => {
    if (!selected) return;
    await adminApi.countries.delete(selected.id);
    toast.success("Country deleted");
    setDeleteOpen(false);
    setSelected(null);
    await load();
  };

  const columns: Column[] = [
    { key: "id", label: "ID" },
    { key: "name", label: "Country", render: (value: string) => <div className="flex items-center gap-2"><Globe size={14} className="text-gray-400" /><span className="font-medium">{value}</span></div> },
    { key: "code", label: "Code", render: (value: string) => <span className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{value}</span> },
    { key: "defaultCurrency", label: "Currency" },
    { key: "currencySymbol", label: "Symbol" },
    { key: "phoneCode", label: "Phone Code" },
    {
      key: "status",
      label: "Status",
      render: (value: string, row: Country) => (
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${value === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{value}</span>
          <button onClick={() => openStatusModal(row)} className="text-gray-500 hover:text-orange-600 transition-colors" title={value === "Active" ? "Deactivate" : "Activate"}>
            {value === "Active" ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: Country) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50" title="Edit"><Edit size={14} /></button>
          <button onClick={() => { setSelected(row); setDeleteOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50" title="Delete"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil(countries.length / ITEMS_PER_PAGE);
  const paginatedData = countries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-gray-500">Loading countries...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Countries Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{countries.length} countries - {countries.filter(country => country.status === "Active").length} active</p>
        </div>
        <Button onClick={openAdd}><Plus size={15} />Add Country</Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Table columns={columns} data={paginatedData} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={countries.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? "Edit Country" : "Add Country"} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-x-4">
            <Input label="Country Name" value={form.name || ""} onChange={event => setForm({ ...form, name: event.target.value })} required />
            <Input label="Country Code" value={form.code || ""} onChange={event => updateCode(event.target.value)} maxLength={3} required />
            <Input label="Currency" value={form.defaultCurrency || ""} onChange={event => updateCurrency(event.target.value)} required />
            <Input label="Currency Symbol" value={form.currencySymbol || ""} onChange={event => setForm({ ...form, currencySymbol: event.target.value })} />
            <Input label="Phone Code" value={form.phoneCode || ""} onChange={event => setForm({ ...form, phoneCode: event.target.value })} />
            <Input label="Flag / Icon" value={form.flag || ""} onChange={event => setForm({ ...form, flag: event.target.value })} />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <SearchableSelect options={[{ id: "Active", label: "Active" }, { id: "Inactive", label: "Inactive" }]} value={form.status || "Active"} onChange={id => setForm({ ...form, status: String(id) })} searchPlaceholder="Search..." />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={statusOpen} onClose={() => setStatusOpen(false)} onConfirm={confirmStatus} title={`${pendingStatus} Country`} message={`Are you sure you want to set "${selected?.name}" as ${pendingStatus}?`} />
      <ConfirmModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} title="Delete Country" message={`Delete "${selected?.name}"?`} />
    </div>
  );
}