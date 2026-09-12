"use client";

import { useEffect, useState } from "react";
import { Building2, Edit, Plus, RotateCcw, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { adminApi } from "@/api/adminApi";
import Button from "@/components/admin/Button";
import ConfirmModal from "@/components/admin/ConfirmModal";
import Input from "@/components/admin/Input";
import Modal from "@/components/admin/Modal";
import Pagination from "@/components/admin/Pagination";
import Table from "@/components/admin/Table";
import SearchableSelect, { SearchOption } from "@/components/admin/SearchableSelect";
import { Column } from "@/lib/types";
import toast from "react-hot-toast";

interface City {
  id: string;
  name: string;
  countryId: number;
  stateId: string;
  status: string;
  country?: Country;
  state?: StateItem;
}

interface StateItem {
  id: string;
  name: string;
  code: string;
  countryId: number;
}

interface Country {
  id: number;
  name: string;
  code: string;
}

const emptyCity: Partial<City> = {
  name: "",
  countryId: 0,
  stateId: "",
  status: "Active",
};

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selected, setSelected] = useState<City | null>(null);
  const [pendingStatus, setPendingStatus] = useState("");
  const [form, setForm] = useState<Partial<City>>(emptyCity);

  const [countryFilter, setCountryFilter] = useState<number | "">("");
  const [stateFilter, setStateFilter] = useState<string | "">("");

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const loadCountries = async () => {
    try {
      const countriesData = await adminApi.countries.list();
      setCountries(countriesData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load countries");
    }
  };

  const load = async () => {
    if (!countryFilter || !stateFilter) {
      setCities([]);
      return;
    }
    setLoading(true);
    try {
      const [citiesData, statesData] = await Promise.all([
        adminApi.cities.list(Number(countryFilter), stateFilter),
        adminApi.states.list(Number(countryFilter)),
      ]);
      setCities(citiesData);
      setStates(statesData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load cities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCountries();
  }, []);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryFilter, stateFilter]);

  // Load states for the state filter dropdown as soon as a country is picked,
  // even before a state is chosen (so the state dropdown has options).
  useEffect(() => {
    if (!countryFilter) {
      setStates([]);
      return;
    }
    adminApi.states.list(Number(countryFilter)).then(setStates).catch(() => setStates([]));
  }, [countryFilter]);

  // States available for the form's selected country
  const [formStates, setFormStates] = useState<StateItem[]>([]);
  useEffect(() => {
    if (!form.countryId) {
      setFormStates([]);
      return;
    }
    adminApi.states.list(form.countryId).then(setFormStates).catch(() => setFormStates([]));
  }, [form.countryId]);

  const openAdd = () => {
    setSelected(null);
    setForm(emptyCity);
    setModalOpen(true);
  };

  const openEdit = (city: City) => {
    setSelected(city);
    setForm(city);
    setModalOpen(true);
  };

  const openStatusModal = (city: City) => {
    setSelected(city);
    setPendingStatus(city.status === "Active" ? "Inactive" : "Active");
    setStatusOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.countryId || !form.stateId) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      name: form.name,
      countryId: form.countryId,
      stateId: form.stateId,
      status: form.status || "Active",
    };

    try {
      if (selected) {
        await adminApi.cities.update(selected.id, payload);
        toast.success("City updated");
      } else {
        await adminApi.cities.create(payload);
        toast.success("City created");
      }
      setModalOpen(false);
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save city");
    }
  };

  const confirmStatus = async () => {
    if (!selected) return;
    try {
      await adminApi.cities.update(selected.id, { status: pendingStatus });
      toast.success("City status updated");
      setStatusOpen(false);
      setSelected(null);
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update city status");
    }
  };

  const confirmDelete = async () => {
    if (!selected) return;
    try {
      await adminApi.cities.delete(selected.id);
      toast.success("City deleted");
      setDeleteOpen(false);
      setSelected(null);
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete city");
    }
  };

  const columns: Column[] = [
    {
      key: "name",
      label: "City Name",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-gray-400" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "state",
      label: "State",
      render: (_: unknown, row: City) => row.state?.name || "-",
    },
    {
      key: "country",
      label: "Country",
      render: (_: unknown, row: City) => row.country?.name || "-",
    },
    {
      key: "status",
      label: "Status",
      render: (value: string, row: City) => (
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
      render: (_: unknown, row: City) => (
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

  const totalPages = Math.ceil(cities.length / ITEMS_PER_PAGE);
  const paginatedData = cities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const countryOptions: SearchOption[] = countries.map(country => ({
    id: country.id,
    label: country.name,
    sublabel: country.code,
  }));

  const stateOptionsForFilter: SearchOption[] = states.map(state => ({
    id: state.id,
    label: state.name,
    sublabel: state.code,
  }));

  const stateOptionsForForm: SearchOption[] = formStates.map(state => ({
    id: state.id,
    label: state.name,
    sublabel: state.code,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cities Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {!countryFilter || !stateFilter
              ? "Select country and state to load cities"
              : `${cities.length} cities - ${cities.filter(city => city.status === "Active").length} active`}
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={15} />
          Add City
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-gray-700 shrink-0">Filter by Country</label>
        <div className="w-64">
          <SearchableSelect
            options={countryOptions}
            value={countryFilter}
            onChange={id => {
              setCountryFilter(Number(id));
              setStateFilter("");
              setCurrentPage(1);
            }}
            placeholder="All Countries"
          />
        </div>

        <label className="text-sm font-medium text-gray-700 shrink-0">Filter by State</label>
        <div className="w-64">
          <SearchableSelect
            options={stateOptionsForFilter}
            value={stateFilter}
            onChange={id => {
              setStateFilter(String(id));
              setCurrentPage(1);
            }}
            placeholder={countryFilter ? "All States" : "Select country first"}
            disabled={!countryFilter}
          />
        </div>

        {(countryFilter !== "" || stateFilter !== "") && (
          <button
            onClick={() => {
              setCountryFilter("");
              setStateFilter("");
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-orange-600 border border-gray-200 hover:border-orange-200 rounded-xl bg-white hover:bg-orange-50 transition-colors"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {!countryFilter || !stateFilter ? (
          <div className="flex h-48 flex-col items-center justify-center gap-1 text-center text-sm text-gray-500">
            <Building2 size={22} className="text-gray-300 mb-1" />
            <p className="font-medium text-gray-600">Select a country and state to view cities</p>
            <p className="text-xs text-gray-400">Use the filters above to get started</p>
          </div>
        ) : loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-500">Loading cities...</div>
        ) : (
          <>
            <Table columns={columns} data={paginatedData} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={cities.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? "Edit City" : "Add City"} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-x-4">
            <div className="col-span-2">
              <Input
                label="City Name"
                value={form.name || ""}
                onChange={event => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Country <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={countryOptions}
                value={form.countryId || ""}
                onChange={id => setForm({ ...form, countryId: Number(id), stateId: "" })}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                State <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={stateOptionsForForm}
                value={form.stateId || ""}
                onChange={id => setForm({ ...form, stateId: String(id) })}
                placeholder={form.countryId ? "Select State" : "Select country first"}
                disabled={!form.countryId}
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
        title={`${pendingStatus} City`}
        message={`Are you sure you want to set "${selected?.name}" as ${pendingStatus}?`}
      />

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete City"
        message={`Delete "${selected?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}