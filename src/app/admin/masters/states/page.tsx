"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Edit, MapPin, Plus, RotateCcw, Search, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
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

interface State {
  id: string;
  name: string;
  code: string;
  countryId: number;
  status: string;
  country?: Country;
}

interface Country {
  id: number;
  name: string;
  code: string;
}

const emptyState: Partial<State> = {
  name: "",
  code: "",
  countryId: 0,
  status: "Active",
};

function CountrySearchSelect({
  countries,
  value,
  onChange,
  placeholder = "Select Country",
}: {
  countries: Country[];
  value: number | "";
  onChange: (id: number) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedCountry = countries.find(country => country.id === value);
  const filtered = countries.filter(country =>
    `${country.name} ${country.code}`.toLowerCase().includes(query.toLowerCase())
  );

  const updateCoords = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < 260 && rect.top > 260;
    setCoords({
      top: openUpward ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
    (buttonRef.current as any).__openUpward = openUpward;
  };

  const toggleOpen = () => {
    if (!open) updateCoords();
    setOpen(prev => !prev);
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
        panelRef.current && !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    };
    const handleReposition = () => updateCoords();

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open]);

  const openUpward = (buttonRef.current as any)?.__openUpward;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className="w-full flex items-center justify-between px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400 text-left"
      >
        <span className={selectedCountry ? "text-gray-900" : "text-gray-400"}>
          {selectedCountry ? `${selectedCountry.name} (${selectedCountry.code})` : placeholder}
        </span>
        <ChevronDown size={16} className="text-gray-400 shrink-0" />
      </button>

      {open && coords && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: openUpward ? undefined : coords.top,
              bottom: openUpward ? window.innerHeight - coords.top : undefined,
              left: coords.left,
              width: coords.width,
            }}
            className="z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search country..."
                className="w-full text-sm outline-none bg-transparent placeholder:text-gray-400"
              />
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <p className="px-3.5 py-2.5 text-sm text-gray-400">No countries found</p>
              )}
              {filtered.map(country => (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => {
                    onChange(country.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-left hover:bg-orange-50 transition-colors"
                >
                  <span className="text-gray-800">
                    {country.name} <span className="text-gray-400 font-mono text-xs">({country.code})</span>
                  </span>
                  {country.id === value && <Check size={14} className="text-orange-600" />}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default function StatesPage() {
  const [states, setStates] = useState<State[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selected, setSelected] = useState<State | null>(null);
  const [pendingStatus, setPendingStatus] = useState("");
  const [form, setForm] = useState<Partial<State>>(emptyState);
  const [countryFilter, setCountryFilter] = useState<number | "">("");

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const [statesData, countriesData] = await Promise.all([
        adminApi.states.list(countryFilter ? Number(countryFilter) : undefined),
        adminApi.countries.list(),
      ]);
      setStates(statesData);
      setCountries(countriesData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load states");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryFilter]);

  const openAdd = () => {
    setSelected(null);
    setForm(emptyState);
    setModalOpen(true);
  };

  const openEdit = (state: State) => {
    setSelected(state);
    setForm(state);
    setModalOpen(true);
  };

  const openStatusModal = (state: State) => {
    setSelected(state);
    setPendingStatus(state.status === "Active" ? "Inactive" : "Active");
    setStatusOpen(true);
  };

  const updateCode = (code: string) => {
    setForm({ ...form, code: code.toUpperCase() });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.code || !form.countryId) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      name: form.name,
      code: form.code.toUpperCase(),
      countryId: form.countryId,
      status: form.status || "Active",
    };

    try {
      if (selected) {
        await adminApi.states.update(selected.id, payload);
        toast.success("State updated");
      } else {
        await adminApi.states.create(payload);
        toast.success("State created");
      }
      setModalOpen(false);
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save state");
    }
  };

  const confirmStatus = async () => {
    if (!selected) return;
    try {
      await adminApi.states.update(selected.id, { status: pendingStatus });
      toast.success("State status updated");
      setStatusOpen(false);
      setSelected(null);
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update state status");
    }
  };

  const confirmDelete = async () => {
    if (!selected) return;
    try {
      await adminApi.states.delete(selected.id);
      toast.success("State deleted");
      setDeleteOpen(false);
      setSelected(null);
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete state");
    }
  };

  const columns: Column[] = [
    {
      key: "name",
      label: "State Name",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-gray-400" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "code",
      label: "Code",
      render: (value: string) => (
        <span className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{value}</span>
      ),
    },
    {
      key: "country",
      label: "Country",
      render: (_: unknown, row: State) => row.country?.name || "-",
    },
    {
      key: "status",
      label: "Status",
      render: (value: string, row: State) => (
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${value === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {value}
          </span>
          <button
            onClick={() => openStatusModal(row)}
            className="text-gray-500 hover:text-orange-600 transition-colors"
            title={value === "Active" ? "Deactivate" : "Activate"}
          >
            {value === "Active" ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: State) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50"
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => { setSelected(row); setDeleteOpen(true); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil(states.length / ITEMS_PER_PAGE);
  const paginatedData = states.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-gray-500">Loading states...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">States Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {states.length} states - {states.filter(state => state.status === "Active").length} active
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={15} />
          Add State
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 shrink-0">Filter by Country</label>
        <div className="w-72">
          <CountrySearchSelect
            countries={countries}
            value={countryFilter}
            onChange={id => {
              setCountryFilter(id);
              setCurrentPage(1);
            }}
            placeholder="All Countries"
          />
        </div>
        {countryFilter !== "" && (
          <button
            onClick={() => setCountryFilter("")}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-orange-600 border border-gray-200 hover:border-orange-200 rounded-xl bg-white hover:bg-orange-50 transition-colors"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Table columns={columns} data={paginatedData} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={states.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? "Edit State" : "Add State"} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-x-4">
            <Input
              label="State Name"
              value={form.name || ""}
              onChange={event => setForm({ ...form, name: event.target.value })}
              required
            />
            <Input
              label="State Code"
              value={form.code || ""}
              onChange={event => updateCode(event.target.value)}
              maxLength={5}
              required
            />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Country <span className="text-red-500">*</span>
              </label>
              <CountrySearchSelect
                countries={countries}
                value={form.countryId || ""}
                onChange={id => setForm({ ...form, countryId: id })}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <SearchableSelect
                options={[{ id: "Active", label: "Active" }, { id: "Inactive", label: "Inactive" }]}
                value={form.status || "Active"}
                onChange={id => setForm({ ...form, status: String(id) })}
                searchPlaceholder="Search..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={statusOpen}
        onClose={() => setStatusOpen(false)}
        onConfirm={confirmStatus}
        title={`${pendingStatus} State`}
        message={`Are you sure you want to set "${selected?.name}" as ${pendingStatus}?`}
      />

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete State"
        message={`Delete "${selected?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}