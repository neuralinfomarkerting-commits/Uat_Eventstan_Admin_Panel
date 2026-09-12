"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Check,
  MapPin,
  Image as ImageIcon,
  X,
  User,
  Briefcase,
  ShieldCheck,
  BadgePercent,
  Landmark,
  ExternalLink,
} from "lucide-react";
import Button from "@/components/admin/Button";
import Input from "@/components/admin/Input";
import toast from "react-hot-toast";
import { adminApi } from "@/api/adminApi";

interface CountryOption {
  name: string;
  cca2: string;
  flag: string;
  dialCode: string;
}

interface SearchableSelectProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  loading?: boolean;
  loadingLabel?: string;
  icon?: React.ReactNode;
  error?: string;
  disabled?: boolean;
}

interface Country {
  id: number;
  name: string;
  code: string;
  flag: string;
  phoneCode: string;
  status: string;
}

interface State {
  id: string;
  countryId: number;
  name: string;
  code: string;
  status: string;
}

interface City {
  id: string;
  countryId: number;
  stateId: string;
  name: string;
  code: string;
  status: string;
}

function SectionIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 text-orange-600 shrink-0">
      {children}
    </span>
  );
}

function CollapsibleSection({
  title,
  subtitle,
  icon,
  defaultOpen = true,
  children,
  badge,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 text-left rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-inset"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && <SectionIcon>{icon}</SectionIcon>}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {title}
              </h2>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <span className="p-1.5 rounded-full bg-gray-50 text-gray-400 shrink-0">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <div className="px-5 sm:px-6 pb-6 pt-0 border-t border-gray-100">
          <div className="pt-5">{children}</div>
        </div>
      )}
    </div>
  );
}

function SearchableSelect({
  label,
  required,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  loading = false,
  loadingLabel = "Loading...",
  icon,
  error,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateScrollState = () => {
    const el = listRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  };

  useEffect(() => {
    if (open) {
      const t = setTimeout(updateScrollState, 0);
      return () => clearTimeout(t);
    }
  }, [open, filtered.length]);

  const scrollBy = (amount: number) => {
    listRef.current?.scrollBy({ top: amount, behavior: "smooth" });
  };

  const showError = (required && !value) || !!error;

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <button
        type="button"
        onClick={() => !loading && !disabled && setOpen((o) => !o)}
        disabled={loading || disabled}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 border rounded-xl bg-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400 ${
          open
            ? "border-orange-500 ring-2 ring-orange-100"
            : showError
              ? "border-red-300"
              : "border-gray-300 hover:border-orange-400"
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
          <span
            className={`truncate text-sm ${value ? "text-gray-900" : "text-gray-400"}`}
          >
            {loading ? loadingLabel : value || placeholder}
          </span>
        </span>
        {open ? (
          <ChevronUp size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </button>

      {open && !loading && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-orange-300 focus:ring-1 focus:ring-orange-300"
            />
          </div>

          <div className="relative">
            {canScrollUp && (
              <button
                type="button"
                onClick={() => scrollBy(-80)}
                className="absolute top-0 right-0 z-10 w-full flex justify-center py-1 bg-gradient-to-b from-white to-transparent"
              >
                <ChevronUp size={16} className="text-gray-400" />
              </button>
            )}

            <div
              ref={listRef}
              onScroll={updateScrollState}
              className="max-h-56 overflow-y-auto py-1"
            >
              {filtered.length === 0 && (
                <div className="px-3 py-3 text-sm text-gray-400 text-center">
                  No matches found
                </div>
              )}
              {filtered.map((opt) => {
                const selected = opt === value;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left transition-colors ${
                      selected
                        ? "bg-orange-50 text-orange-600 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {selected && (
                      <Check size={16} className="text-orange-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {canScrollDown && (
              <button
                type="button"
                onClick={() => scrollBy(80)}
                className="absolute bottom-0 right-0 z-10 w-full flex justify-center py-1 bg-gradient-to-t from-white to-transparent"
              >
                <ChevronDown size={16} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {error ? <p className="text-xs text-red-500 mt-1.5">{error}</p> : null}

      {required && (
        <input
          type="text"
          value={value}
          required
          readOnly
          tabIndex={-1}
          className="sr-only"
        />
      )}
    </div>
  );
}

function CountryCodeSelect({
  countries,
  loading,
  value,
  onChange,
}: {
  countries: CountryOption[];
  loading: boolean;
  value: string;
  onChange: (dialCode: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search),
  );

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white hover:border-orange-400 transition-all min-w-[110px] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        disabled={loading}
      >
        {loading ? (
          <span className="text-sm text-gray-400">Loading...</span>
        ) : (
          <>
            <span className="text-lg leading-none">
              {countries.find((c) => c.dialCode === value)?.flag || "🏳️"}
            </span>
            <span className="text-sm text-gray-700">{value || "+971"}</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-72 bg-white border border-gray-200 rounded-xl shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code..."
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-orange-300"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.map((c) => (
              <button
                key={c.cca2}
                type="button"
                onClick={() => {
                  onChange(c.dialCode);
                  setOpen(false);
                  setSearch("");
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg leading-none">{c.flag}</span>
                <span className="flex-1 text-gray-700 truncate">{c.name}</span>
                <span className="text-gray-400">{c.dialCode}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-sm text-gray-400 text-center">
                No matches found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function isoToFlagEmoji(iso2: string) {
  if (!iso2 || iso2.length !== 2) return "";
  const code = iso2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  const base = 127397;
  return String.fromCodePoint(
    code.charCodeAt(0) + base,
    code.charCodeAt(1) + base,
  );
}

const PHONE_MIN_DIGITS = 7;
const PHONE_MAX_DIGITS = 15;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditVendorPage() {
  const router = useRouter();
  const params = useParams();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [visaTypes, setVisaTypes] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [visaTypesLoading, setVisaTypesLoading] = useState(true);

  const [countryList, setCountryList] = useState<Country[]>([]);
  const [stateList, setStateList] = useState<State[]>([]);
  const [cityList, setCityList] = useState<City[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const [uaeCountry, setUaeCountry] = useState<Country | null>(null);
  const [serviceStateList, setServiceStateList] = useState<State[]>([]);
  const [serviceStatesLoading, setServiceStatesLoading] = useState(false);

  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [vendorRaw, setVendorRaw] = useState<any>(null);

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    primaryEmail: "",
    telephone: "",
    primaryMobile: "",
    countryCode: "",
    telephoneCountryCode: "",
    vendorType: "freelancer",
    password: "",
    businessName: "",
    contactPerson: "",
    businessDescription: "",
    specialization: "",
    businessLocation: "",
    serviceCities: [] as string[],
    visaType: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    poBox: "",
    vatNumber: "",
    inviteCode: "",
    tradeLicenseExpiry: "",
    tradeLicenseNumber: "",
    tradeLicenseFile: null as File | null,
    tradeLicenseFileUrl: "" as string,
    passportFile: null as File | null,
    passportFileUrl: "" as string,
    passportExpiry: "",
    emiratesIdExpiry: "",
    vendorProfileImage: "" as string,
    capacityPerDay: "",
    commissionPercent: "",
    planDetail: "",
    planExpiry: "",
    agreementFile: null as File | null,
    agreementFileUrl: "" as string,
    bankName: "",
    accountFullName: "",
    ibanNo: "",
    accountNumber: "",
    swift: "",
    branchAddress: "",
  });

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [vendorLoaded, setVendorLoaded] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setCountriesLoading(true);
        const countriesData = await adminApi.countries.list();
        const parsed: CountryOption[] = (countriesData || [])
          .map((c: any) => {
            const rawDial =
              c.dialCode ??
              c.phoneCode ??
              c.callingCode ??
              c.code2 ??
              c.isdCode ??
              "";
            const cleanedDial = String(rawDial).trim().replace(/\++/g, "+");
            const digitsOnly = cleanedDial.replace(/[^0-9]/g, "");
            const dialCode = digitsOnly ? `+${digitsOnly}` : "";
            const cca2 = String(
              c.iso2 ?? c.code ?? c.countryCode ?? c.id ?? "",
            ).toUpperCase();
            return {
              name: c.name ?? c.countryName ?? "",
              cca2,
              flag: c.flag ?? c.emoji ?? isoToFlagEmoji(cca2),
              dialCode,
            };
          })
          .filter((c: CountryOption) => c.dialCode)
          .sort((a: CountryOption, b: CountryOption) =>
            a.name.localeCompare(b.name),
          );
        setCountries(parsed);
        setCountryList(countriesData || []);

        const uae = (countriesData || []).find(
          (c: Country) =>
            c.code?.toUpperCase() === "AE" ||
            c.name.toLowerCase().includes("united arab emirates"),
        );
        setUaeCountry(uae || null);
      } catch (error) {
        console.error("Failed to load countries:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not load country codes.",
        );
      } finally {
        setCountriesLoading(false);
      }

      try {
        setCategoriesLoading(true);
        const categoriesData = await adminApi.categories.list();
        const parsed = (categoriesData || []).map((c: any) => ({
          id: String(c.id ?? c._id ?? c.categoryId ?? c.name),
          name: c.name ?? c.categoryName ?? c.title ?? "",
        }));
        setCategories(parsed);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not load categories.",
        );
      } finally {
        setCategoriesLoading(false);
      }

      try {
        setVisaTypesLoading(true);
        const visaData = await adminApi.visaTypes.list();
        const parsed = (visaData || []).map((v: any) => ({
          id: String(v.id ?? v._id ?? v.name),
          name: v.name ?? v.visaTypeName ?? v.title ?? "",
        }));
        setVisaTypes(parsed);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not load visa types.",
        );
      } finally {
        setVisaTypesLoading(false);
      }

      setInitialDataLoaded(true);
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const id = params.id as string;
    if (!id || !initialDataLoaded || vendorLoaded) return;

    const loadVendor = async () => {
      try {
        const vendor = await adminApi.vendors.getById(id);

        const businessLocation = vendor.businessLocation || "";
        const locationParts = businessLocation
          .split(", ")
          .map((s: string) => s.trim());
        let country = locationParts[0] || "";
        const state = locationParts[1] || "";
        const city = locationParts[2] || "";

        let matchedCountry = countryList.find((c) => c.name === country);
        if (!matchedCountry && country) {
          matchedCountry = countryList.find(
            (c) =>
              c.name.toLowerCase().includes(country.toLowerCase()) ||
              country.toLowerCase().includes(c.name.toLowerCase()),
          );
        }
        const finalCountry = matchedCountry ? matchedCountry.name : country;

        const [fallbackFirst, ...fallbackLastParts] = (
          vendor.contactPerson || ""
        ).split(" ");
        const fallbackLast = fallbackLastParts.join(" ");

        setForm((prev) => ({
          ...prev,
          firstName: vendor.firstName ?? fallbackFirst ?? "",
          lastName: vendor.lastName ?? fallbackLast ?? "",
          userName: vendor.userName ?? "",
          primaryEmail: vendor.primaryEmail ?? vendor.email ?? "",
          primaryMobile: vendor.primaryMobile ?? "",
          countryCode:
            vendor.primaryMobileCountryCode ?? vendor.phoneCountryCode ?? "",
          vendorType:
            (vendor.vendorType ?? "FREELANCER").toString().toLowerCase() ===
            "permanent"
              ? "permanent"
              : "freelancer",
          businessName: vendor.businessName ?? vendor.companyName ?? "",
          contactPerson: vendor.contactPerson ?? "",
          businessDescription: vendor.businessDescription ?? vendor.about ?? "",
          specialization: vendor.specialization ?? "",
          businessLocation: businessLocation,
          serviceCities: vendor.cities ?? [],
          visaType: vendor.visaType ?? "",
          addressLine1: vendor.addressLine1 ?? vendor.address ?? "",
          addressLine2: vendor.addressLine2 ?? "",
          landmark: vendor.landmark ?? "",
          poBox: vendor.poBox ?? "",
          vatNumber: vendor.vatNumber ?? "",
          inviteCode: vendor.inviteCode ?? "",
          tradeLicenseExpiry: vendor.tradeLicenseExpiry
            ? vendor.tradeLicenseExpiry.slice(0, 10)
            : "",
          tradeLicenseNumber: vendor.tradeLicenseNumber ?? "",
          tradeLicenseFileUrl: vendor.tradeLicenseFileUrl ?? "",
          passportFileUrl: vendor.passportFileUrl ?? "",
          passportExpiry: vendor.passportExpiry
            ? vendor.passportExpiry.slice(0, 10)
            : "",
          agreementFileUrl: vendor.agreementFileUrl ?? "",
          emiratesIdExpiry: vendor.emiratesIdExpiry
            ? vendor.emiratesIdExpiry.slice(0, 10)
            : "",
          vendorProfileImage: vendor.vendorProfileImage ?? "",
          capacityPerDay: vendor.capacityPerDay?.toString() ?? "",
          commissionPercent: vendor.commissionPercent?.toString() ?? "",
          planDetail: vendor.planDetails ?? vendor.planDetail ?? "",
          planExpiry: vendor.planExpiry ? vendor.planExpiry.slice(0, 10) : "",
          bankName: vendor.bankName ?? "",
          accountFullName: vendor.accountFullName ?? "",
          ibanNo: vendor.ibanNo ?? "",
          accountNumber: vendor.accountNumber ?? "",
          swift: vendor.swift ?? "",
          branchAddress: vendor.branchAddress ?? "",
        }));

        setSelectedCountry(finalCountry);
        setSelectedState(state);
        setSelectedCity(city);

        if (vendor.vendorProfileImage) {
          setProfileImagePreview(vendor.vendorProfileImage);
        }

        setIsActive(vendor.status ? vendor.status !== "REJECTED" : true);
        setVendorRaw(vendor);
        setVendorLoaded(true);
        setFetching(false);
      } catch (error) {
        console.error("Error loading vendor:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to load vendor",
        );
        setFetching(false);
      }
    };

    loadVendor();
  }, [params.id, initialDataLoaded, countryList, vendorLoaded]);

  useEffect(() => {
    if (!vendorLoaded || !selectedCountry || !countryList.length) return;

    const loadStates = async () => {
      const selectedCountryObj = countryList.find(
        (c) => c.name === selectedCountry,
      );
      if (!selectedCountryObj) {
        setStateList([]);
        return;
      }

      try {
        setStatesLoading(true);
        const data = await adminApi.states.list(selectedCountryObj.id);
        setStateList(data || []);
      } catch (error) {
        console.error("Failed to load states:", error);
        toast.error("Could not load states.");
        setStateList([]);
      } finally {
        setStatesLoading(false);
      }
    };

    loadStates();
  }, [selectedCountry, countryList, vendorLoaded]);

  useEffect(() => {
    if (
      !vendorLoaded ||
      !selectedState ||
      !selectedCountry ||
      !countryList.length ||
      !stateList.length
    )
      return;

    const loadCities = async () => {
      const selectedCountryObj = countryList.find(
        (c) => c.name === selectedCountry,
      );
      if (!selectedCountryObj) return;

      const selectedStateObj = stateList.find((s) => s.name === selectedState);
      if (!selectedStateObj) return;

      try {
        setCitiesLoading(true);
        const data = await adminApi.cities.list(
          selectedCountryObj.id,
          selectedStateObj.id,
        );
        setCityList(data || []);
      } catch (error) {
        console.error("Failed to load cities:", error);
        toast.error("Could not load cities.");
        setCityList([]);
      } finally {
        setCitiesLoading(false);
      }
    };

    loadCities();
  }, [selectedState, selectedCountry, countryList, stateList, vendorLoaded]);

  useEffect(() => {
    if (selectedCountry && selectedState && selectedCity) {
      setForm((prev) => ({
        ...prev,
        businessLocation: `${selectedCountry}, ${selectedState}, ${selectedCity}`,
      }));
    }
  }, [selectedCountry, selectedState, selectedCity]);

  useEffect(() => {
    if (!vendorRaw || countriesLoading || !vendorLoaded) return;

    const raw: string = vendorRaw.telephone ?? "";
    if (!raw) return;

    const match = countries
      .filter((c) => raw.startsWith(c.dialCode))
      .sort((a, b) => b.dialCode.length - a.dialCode.length)[0];

    const dial =
      match?.dialCode ??
      vendorRaw.phoneCountryCode ??
      vendorRaw.countryCode ??
      "+971";
    const local = match
      ? raw.slice(match.dialCode.length)
      : raw.replace(/^\+/, "").replace(/[^0-9]/g, "");

    setForm((prev) => ({
      ...prev,
      telephone: local,
      telephoneCountryCode: dial,
    }));
  }, [vendorRaw, countries, countriesLoading, vendorLoaded]);

  useEffect(() => {
    if (!uaeCountry) {
      setServiceStateList([]);
      return;
    }

    const loadServiceStates = async () => {
      try {
        setServiceStatesLoading(true);
        const data = await adminApi.states.list(uaeCountry.id);
        setServiceStateList(data || []);
      } catch (error) {
        console.error("Failed to load service states:", error);
        toast.error("Could not load service states.");
        setServiceStateList([]);
      } finally {
        setServiceStatesLoading(false);
      }
    };

    loadServiceStates();
  }, [uaeCountry]);

  const handleProfileImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setProfileImagePreview(localPreview);

    setUploadingProfileImage(true);
    try {
      const result = await adminApi.uploads.image(file, "vendors");
      setForm((prev) => ({ ...prev, vendorProfileImage: result.url }));
      setProfileImagePreview(result.url);
    } catch (error: any) {
      toast.error(error?.message || "Profile image upload failed");
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const removeProfileImage = () => {
    setProfileImagePreview("");
    setForm((prev) => ({ ...prev, vendorProfileImage: "" }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!form.firstName.trim()) errors.firstName = "First Name is required";
    if (!form.lastName.trim()) errors.lastName = "Last Name is required";

    if (!form.primaryEmail.trim()) {
      errors.primaryEmail = "Email is required";
    } else if (!EMAIL_REGEX.test(form.primaryEmail)) {
      errors.primaryEmail = "Enter a valid email address";
    }

    if (!form.primaryMobile.trim()) {
      errors.primaryMobile = "Phone Number is required";
    } else if (
      form.primaryMobile.length < PHONE_MIN_DIGITS ||
      form.primaryMobile.length > PHONE_MAX_DIGITS
    ) {
      errors.primaryMobile = `Number must be ${PHONE_MIN_DIGITS}-${PHONE_MAX_DIGITS} digits`;
    }

    if (
      form.telephone &&
      (form.telephone.length < PHONE_MIN_DIGITS ||
        form.telephone.length > PHONE_MAX_DIGITS)
    ) {
      errors.telephone = `Number must be ${PHONE_MIN_DIGITS}-${PHONE_MAX_DIGITS} digits`;
    }

    if (form.password) {
      if (
        form.password.length < 9 ||
        !/[A-Z]/.test(form.password) ||
        !/[a-z]/.test(form.password) ||
        !/[0-9]/.test(form.password) ||
        !/[^A-Za-z0-9]/.test(form.password)
      ) {
        errors.password =
          "Min 9 characters with an uppercase, lowercase, number, and special character";
      }
    }

    if (!form.businessName.trim())
      errors.businessName = "Business Name is required";
    if (!form.contactPerson.trim())
      errors.contactPerson = "Contact Person is required";
    if (!form.specialization)
      errors.specialization = "Specialization is required";
    if (!selectedCountry) errors.selectedCountry = "Country is required";
    if (!selectedState) errors.selectedState = "State is required";
    if (!selectedCity) errors.selectedCity = "City is required";
    if (!form.addressLine1.trim())
      errors.addressLine1 = "Address Line 1 is required";
    if (!form.poBox.trim()) errors.poBox = "PO Box is required";
    if (form.serviceCities.length === 0)
      errors.serviceCities = "At least one Service State is required";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadingProfileImage) {
      toast.error("Please wait for the profile image to finish uploading");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setLoading(true);
    try {
      const vendorType =
        form.vendorType === "permanent" ? "PERMANENT" : "FREELANCER";
      const id = params.id as string;

      const fullTelephone = form.telephone
        ? `${form.telephoneCountryCode}${form.telephone}`
        : "";
      const fullMobile = form.primaryMobile
        ? `${form.countryCode}${form.primaryMobile}`
        : "";

      const [tradeLicenseUpload, passportUpload, agreementUpload] =
        await Promise.all([
          form.tradeLicenseFile
            ? adminApi.uploads.file(
                form.tradeLicenseFile,
                "vendor-docs/trade-license",
              )
            : null,
          form.passportFile
            ? adminApi.uploads.file(form.passportFile, "vendor-docs/passport")
            : null,
          form.agreementFile
            ? adminApi.uploads.file(
                form.agreementFile,
                "vendor-docs/agreements",
              )
            : null,
        ]);

      const combinedAddress = [form.addressLine1, form.addressLine2]
        .filter(Boolean)
        .join(", ");

      const businessLocation = `${selectedCountry}, ${selectedState}, ${selectedCity}`;

      const payload: Record<string, unknown> = {
        companyName: form.businessName,
        contactPerson: form.contactPerson,
        email: form.primaryEmail,
        primaryEmail: form.primaryEmail,
        primaryMobile: form.primaryMobile,
        primaryMobileCountryCode: form.countryCode || undefined,
        phone: fullMobile,
        phoneCountryCode: form.countryCode || "",
        telephone: fullTelephone,
        firstName: form.firstName,
        lastName: form.lastName,
        userName: form.userName,
        about: form.businessDescription || undefined,
        vendorType,
        specialization: form.specialization,
        businessLocation: businessLocation,
        address: combinedAddress,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || undefined,
        landmark: form.landmark || undefined,
        poBox: form.poBox || undefined,
        visaType: form.visaType || undefined,
        vatNumber: form.vatNumber || undefined,
        inviteCode: form.inviteCode || undefined,
        cities: form.serviceCities,
        capacityPerDay: form.capacityPerDay ? Number(form.capacityPerDay) : 1,
        commissionPercent: form.commissionPercent
          ? Number(form.commissionPercent)
          : 10,
        planDetails: form.planDetail,
        planExpiry: form.planExpiry || undefined,
        tradeLicenseExpiry: form.tradeLicenseExpiry || undefined,
        tradeLicenseNumber: form.tradeLicenseNumber || undefined,
        passportExpiry: form.passportExpiry || undefined,
        emiratesIdExpiry: form.emiratesIdExpiry || undefined,
        bankName: form.bankName,
        accountFullName: form.accountFullName,
        ibanNo: form.ibanNo,
        accountNumber: form.accountNumber,
        swift: form.swift,
        branchAddress: form.branchAddress,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (form.vendorProfileImage)
        payload.vendorProfileImage = form.vendorProfileImage;
      if (tradeLicenseUpload) {
        payload.tradeLicenseFileUrl = tradeLicenseUpload.url;
        payload.tradeLicenseFileKey = tradeLicenseUpload.key;
      }
      if (passportUpload) {
        payload.passportFileUrl = passportUpload.url;
        payload.passportFileKey = passportUpload.key;
      }
      if (agreementUpload) {
        payload.agreementFileUrl = agreementUpload.url;
        payload.agreementFileKey = agreementUpload.key;
      }

      delete (payload as Record<string, unknown>).countryCode;
      delete (payload as Record<string, unknown>).telephoneCountryCode;

      await adminApi.vendors.update(id, payload);
      toast.success("Vendor updated successfully!");
      router.push("/admin/vendors");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update vendor",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = () => {
    setIsActive(!isActive);
    toast.success(`Vendor will be ${!isActive ? "Active" : "Inactive"}`);
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading vendor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              aria-label="Go back"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Edit Vendor
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Update the vendor profile and account
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full pl-4 pr-1.5 py-1.5">
            <span className="text-sm font-medium text-gray-600">Status</span>
            <button
              type="button"
              onClick={handleStatusToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                isActive ? "bg-orange-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm font-semibold pr-2 ${isActive ? "text-orange-600" : "text-gray-500"}`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">
            <CollapsibleSection
              title="Personal Information"
              subtitle="Basic details and login credentials"
              icon={<User size={18} />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Profile Image
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="relative flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-orange-400 hover:bg-orange-50/40 transition-colors bg-gray-50 overflow-hidden">
                      {profileImagePreview ? (
                        <img
                          src={profileImagePreview}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <ImageIcon size={22} className="text-gray-400" />
                          <span className="text-xs text-gray-500">Upload</span>
                        </div>
                      )}
                      {uploadingProfileImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                          <span className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        className="hidden"
                      />
                    </label>
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-gray-500">
                        JPG, PNG or WEBP. Upload a new image to replace the
                        existing one.
                      </p>
                      {profileImagePreview && !uploadingProfileImage && (
                        <button
                          type="button"
                          onClick={removeProfileImage}
                          className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <X size={13} />
                          Remove image
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Input
                    label="First Name *"
                    value={form.firstName}
                    onChange={(e) => {
                      setForm({ ...form, firstName: e.target.value });
                      if (validationErrors.firstName)
                        setValidationErrors((p) => ({ ...p, firstName: "" }));
                    }}
                    required
                  />
                  {validationErrors.firstName ? (
                    <p className="text-xs text-red-500 mt-1.5">
                      {validationErrors.firstName}
                    </p>
                  ) : null}
                </div>

                <div>
                  <Input
                    label="Last Name *"
                    value={form.lastName}
                    onChange={(e) => {
                      setForm({ ...form, lastName: e.target.value });
                      if (validationErrors.lastName)
                        setValidationErrors((p) => ({ ...p, lastName: "" }));
                    }}
                    required
                  />
                  {validationErrors.lastName ? (
                    <p className="text-xs text-red-500 mt-1.5">
                      {validationErrors.lastName}
                    </p>
                  ) : null}
                </div>

                <div>
                  <Input
                    label="Email *"
                    type="email"
                    value={form.primaryEmail}
                    onChange={(e) => {
                      setForm({ ...form, primaryEmail: e.target.value });
                      if (validationErrors.primaryEmail)
                        setValidationErrors((p) => ({
                          ...p,
                          primaryEmail: "",
                        }));
                    }}
                    required
                  />
                  {validationErrors.primaryEmail ? (
                    <p className="text-xs text-red-500 mt-1.5">
                      {validationErrors.primaryEmail}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Contact Number
                  </label>
                  <div className="flex gap-2">
                    <CountryCodeSelect
                      countries={countries}
                      loading={countriesLoading}
                      value={form.telephoneCountryCode}
                      onChange={(dialCode) =>
                        setForm({ ...form, telephoneCountryCode: dialCode })
                      }
                    />
                    <input
                      type="tel"
                      value={form.telephone}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          telephone: e.target.value.replace(/[^0-9]/g, ""),
                        });
                        if (validationErrors.telephone)
                          setValidationErrors((p) => ({ ...p, telephone: "" }));
                      }}
                      placeholder="e.g., 43001234"
                      className={`flex-1 px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        validationErrors.telephone
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-gray-300 focus:border-orange-500 focus:ring-orange-100"
                      }`}
                    />
                  </div>
                  {validationErrors.telephone ? (
                    <p className="text-xs text-red-500 mt-1.5">
                      {validationErrors.telephone}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => {
                        setForm({ ...form, password: e.target.value });
                        if (validationErrors.password)
                          setValidationErrors((p) => ({ ...p, password: "" }));
                      }}
                      className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 pr-10 transition-all ${
                        validationErrors.password
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-gray-300 focus:border-orange-500 focus:ring-orange-100"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {validationErrors.password ? (
                    <p className="text-xs text-red-500 mt-1.5">
                      {validationErrors.password}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1.5">
                      Leave blank to keep the existing password. Min 9
                      characters with an uppercase, lowercase, number and
                      special character.
                    </p>
                  )}
                </div>

                <Input
                  label="Invite Code"
                  value={form.inviteCode}
                  onChange={(e) =>
                    setForm({ ...form, inviteCode: e.target.value })
                  }
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Business Information"
              subtitle="Where and how the vendor operates"
              icon={<Briefcase size={18} />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Input
                    label="Business Name *"
                    value={form.businessName}
                    onChange={(e) => {
                      setForm({ ...form, businessName: e.target.value });
                      if (validationErrors.businessName)
                        setValidationErrors((p) => ({
                          ...p,
                          businessName: "",
                        }));
                    }}
                    required
                  />
                  {validationErrors.businessName ? (
                    <p className="text-xs text-red-500 mt-1.5">
                      {validationErrors.businessName}
                    </p>
                  ) : null}
                </div>

                <div>
                  <Input
                    label="Contact Person *"
                    value={form.contactPerson}
                    onChange={(e) => {
                      setForm({ ...form, contactPerson: e.target.value });
                      if (validationErrors.contactPerson)
                        setValidationErrors((p) => ({
                          ...p,
                          contactPerson: "",
                        }));
                    }}
                    required
                  />
                  {validationErrors.contactPerson ? (
                    <p className="text-xs text-red-500 mt-1.5">
                      {validationErrors.contactPerson}
                    </p>
                  ) : null}
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <CountryCodeSelect
                      countries={countries}
                      loading={countriesLoading}
                      value={form.countryCode}
                      onChange={(dialCode) =>
                        setForm({ ...form, countryCode: dialCode })
                      }
                    />
                    <input
                      type="tel"
                      value={form.primaryMobile}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          primaryMobile: e.target.value.replace(/[^0-9]/g, ""),
                        });
                        if (validationErrors.primaryMobile)
                          setValidationErrors((p) => ({
                            ...p,
                            primaryMobile: "",
                          }));
                      }}
                      required
                      placeholder="e.g., 501234567"
                      className={`flex-1 px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        validationErrors.primaryMobile
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-gray-300 focus:border-orange-500 focus:ring-orange-100"
                      }`}
                    />
                  </div>
                  {validationErrors.primaryMobile ? (
                    <p className="text-xs text-red-500 mt-1.5">
                      {validationErrors.primaryMobile}
                    </p>
                  ) : null}
                </div>

                <SearchableSelect
                  label="Specialization"
                  required
                  value={form.specialization}
                  onChange={(val) => {
                    setForm({ ...form, specialization: val });
                    if (validationErrors.specialization)
                      setValidationErrors((p) => ({
                        ...p,
                        specialization: "",
                      }));
                  }}
                  options={categories.map((c) => c.name)}
                  loading={categoriesLoading}
                  loadingLabel="Loading categories..."
                  placeholder="Select a category"
                  error={validationErrors.specialization}
                />

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Business Location <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SearchableSelect
                      label="Country"
                      required
                      value={selectedCountry}
                      onChange={(val) => {
                        setSelectedCountry(val);
                        setSelectedState("");
                        setSelectedCity("");
                        setStateList([]);
                        setCityList([]);
                        if (validationErrors.selectedCountry)
                          setValidationErrors((p) => ({
                            ...p,
                            selectedCountry: "",
                          }));
                      }}
                      options={countryList.map((c) => c.name)}
                      placeholder="Select country"
                      icon={<MapPin size={16} />}
                      error={validationErrors.selectedCountry}
                    />

                    <SearchableSelect
                      label="State"
                      required
                      value={selectedState}
                      onChange={(val) => {
                        setSelectedState(val);
                        setSelectedCity("");
                        setCityList([]);
                        if (validationErrors.selectedState)
                          setValidationErrors((p) => ({
                            ...p,
                            selectedState: "",
                          }));
                      }}
                      options={stateList.map((s) => s.name)}
                      loading={statesLoading}
                      loadingLabel="Loading states..."
                      placeholder="Select state"
                      icon={<MapPin size={16} />}
                      error={validationErrors.selectedState}
                      disabled={!selectedCountry}
                    />

                    <SearchableSelect
                      label="City"
                      required
                      value={selectedCity}
                      onChange={(val) => {
                        setSelectedCity(val);
                        if (validationErrors.selectedCity)
                          setValidationErrors((p) => ({
                            ...p,
                            selectedCity: "",
                          }));
                      }}
                      options={cityList.map((c) => c.name)}
                      loading={citiesLoading}
                      loadingLabel="Loading cities..."
                      placeholder="Select city"
                      icon={<MapPin size={16} />}
                      error={validationErrors.selectedCity}
                      disabled={!selectedState}
                    />
                  </div>
                </div>

                <div>
                  <Input
                    label="Address Line 1 *"
                    value={form.addressLine1}
                    onChange={(e) => {
                      setForm({ ...form, addressLine1: e.target.value });
                      if (validationErrors.addressLine1)
                        setValidationErrors((p) => ({
                          ...p,
                          addressLine1: "",
                        }));
                    }}
                    required
                  />
                  {validationErrors.addressLine1 ? (
                    <p className="text-xs text-red-500 mt-1.5">
                      {validationErrors.addressLine1}
                    </p>
                  ) : null}
                </div>

                <Input
                  label="Address Line 2"
                  value={form.addressLine2}
                  onChange={(e) =>
                    setForm({ ...form, addressLine2: e.target.value })
                  }
                />

                <Input
                  label="Landmark"
                  value={form.landmark}
                  onChange={(e) =>
                    setForm({ ...form, landmark: e.target.value })
                  }
                />

                <div>
                  <Input
                    label="PO Box *"
                    value={form.poBox}
                    onChange={(e) => {
                      setForm({ ...form, poBox: e.target.value });
                      if (validationErrors.poBox) {
                        setValidationErrors((p) => ({ ...p, poBox: "" }));
                      }
                    }}
                    required
                  />
                  {validationErrors.poBox ? (
                    <p className="text-xs text-red-500 mt-1.5">
                      {validationErrors.poBox}
                    </p>
                  ) : null}
                </div>

                <div className="md:col-span-2">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
                    <label className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
                      Service Cities <span className="text-red-500">*</span>
                    </label>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <SearchableSelect
                        label="Country"
                        value="United Arab Emirates"
                        onChange={() => {}}
                        options={["United Arab Emirates"]}
                        placeholder="United Arab Emirates"
                        disabled
                      />
                      <SearchableSelect
                        label="State"
                        value=""
                        onChange={(stateName) => {
                          if (!form.serviceCities.includes(stateName)) {
                            setForm({
                              ...form,
                              serviceCities: [
                                ...form.serviceCities,
                                stateName,
                              ],
                            });
                          }
                          if (validationErrors.serviceCities)
                            setValidationErrors((p) => ({
                              ...p,
                              serviceCities: "",
                            }));
                        }}
                        options={serviceStateList
                          .filter(
                            (s) => !form.serviceCities.includes(s.name),
                          )
                          .map((s) => s.name)}
                        placeholder={
                          serviceStatesLoading
                            ? "Loading..."
                            : serviceStateList.filter(
                                  (s) => !form.serviceCities.includes(s.name),
                                ).length === 0
                              ? "No states found"
                              : "Select state to add"
                        }
                        loading={serviceStatesLoading}
                        disabled={serviceStatesLoading}
                      />
                    </div>

                    <p className="text-xs text-gray-400 mt-2 mb-3">
                      Select a state to add it — repeat to add more states.
                    </p>

                    <div
                      className={
                        "flex flex-wrap items-center gap-2 w-full px-3 py-2.5 border rounded-xl bg-white min-h-[48px] " +
                        (form.serviceCities.length === 0
                          ? "border-red-300"
                          : "border-gray-200")
                      }
                    >
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      {form.serviceCities.length === 0 ? (
                        <span className="text-sm text-red-400">
                          At least one service state is required
                        </span>
                      ) : null}
                      {form.serviceCities.map((stateName) => (
                        <span
                          key={stateName}
                          className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-xs font-medium"
                        >
                          {stateName}
                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                serviceCities: form.serviceCities.filter(
                                  (s) => s !== stateName,
                                ),
                              })
                            }
                            className="text-orange-400 hover:text-orange-600 hover:bg-orange-100 rounded-full p-0.5 transition-colors"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>

                    {validationErrors.serviceCities ? (
                      <p className="text-xs text-red-500 mt-1.5">
                        {validationErrors.serviceCities}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2.5">
                    Vendor Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {(
                      [
                        { value: "freelancer", label: "Professional" },
                        { value: "permanent", label: "Service Provider" },
                      ] as const
                    ).map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                          form.vendorType === opt.value
                            ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500"
                            : "border-gray-200 hover:border-orange-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="vendorType"
                          value={opt.value}
                          checked={form.vendorType === opt.value}
                          onChange={(e) =>
                            setForm({ ...form, vendorType: e.target.value })
                          }
                          className="sr-only"
                        />
                        <span
                          className={`flex items-center justify-center w-4.5 h-4.5 rounded-full border-2 shrink-0 ${
                            form.vendorType === opt.value
                              ? "border-orange-500"
                              : "border-gray-300"
                          }`}
                        >
                          {form.vendorType === opt.value && (
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                          )}
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            form.vendorType === opt.value
                              ? "text-orange-700"
                              : "text-gray-700"
                          }`}
                        >
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Business Description
                  </label>
                  <textarea
                    value={form.businessDescription}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        businessDescription: e.target.value,
                      })
                    }
                    rows={3}
                    maxLength={500}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                    placeholder="Short bio / description of the business"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {form.businessDescription.length}/500 characters
                  </p>
                </div>
              </div>
            </CollapsibleSection>

            {form.vendorType === "freelancer" && (
              <CollapsibleSection
                title="Legal & Compliance"
                subtitle="Visa and identity documentation"
                icon={<ShieldCheck size={18} />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="VAT Number"
                    value={form.vatNumber}
                    onChange={(e) =>
                      setForm({ ...form, vatNumber: e.target.value })
                    }
                  />
                  <Input
                    label="Emirates ID Expiry"
                    type="date"
                    value={form.emiratesIdExpiry}
                    onChange={(e) =>
                      setForm({ ...form, emiratesIdExpiry: e.target.value })
                    }
                  />
                  <Input
                    label="Passport Expiry"
                    type="date"
                    value={form.passportExpiry}
                    onChange={(e) =>
                      setForm({ ...form, passportExpiry: e.target.value })
                    }
                  />
                  <SearchableSelect
                    label="Visa Type"
                    value={form.visaType}
                    onChange={(val) => setForm({ ...form, visaType: val })}
                    options={visaTypes.map((v) => v.name)}
                    loading={visaTypesLoading}
                    loadingLabel="Loading visa types..."
                    placeholder="Select a visa type"
                  />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Passport File Upload
                    </label>
                    <input
                      type="file"
                      onChange={(e) =>
                        setForm({
                          ...form,
                          passportFile: e.target.files?.[0] || null,
                        })
                      }
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 transition-colors"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400">
                        Leave empty to keep the existing passport file
                      </p>
                      {form.passportFileUrl && (
                        <a
                          href={form.passportFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 shrink-0"
                        >
                          View current file
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {form.vendorType === "permanent" && (
              <CollapsibleSection
                title="Legal & Compliance"
                subtitle="Trade license and business registration"
                icon={<ShieldCheck size={18} />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="VAT Number"
                    value={form.vatNumber}
                    onChange={(e) =>
                      setForm({ ...form, vatNumber: e.target.value })
                    }
                  />
                  <Input
                    label="Trade License Number"
                    value={form.tradeLicenseNumber}
                    onChange={(e) =>
                      setForm({ ...form, tradeLicenseNumber: e.target.value })
                    }
                    placeholder="e.g., DXB-TL-10001"
                  />
                  <Input
                    label="Trade License Expiry"
                    type="date"
                    value={form.tradeLicenseExpiry}
                    onChange={(e) =>
                      setForm({ ...form, tradeLicenseExpiry: e.target.value })
                    }
                  />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Trade License File Upload
                    </label>
                    <input
                      type="file"
                      onChange={(e) =>
                        setForm({
                          ...form,
                          tradeLicenseFile: e.target.files?.[0] || null,
                        })
                      }
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 transition-colors"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400">
                        Leave empty to keep the existing trade license file
                      </p>
                      {form.tradeLicenseFileUrl && (
                        <a
                          href={form.tradeLicenseFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 shrink-0"
                        >
                          View current file
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            )}

            <CollapsibleSection
              title="Plan & Commission"
              subtitle="Payout terms and agreement"
              icon={<BadgePercent size={18} />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Capacity Per Day (events)"
                  type="number"
                  value={form.capacityPerDay}
                  onChange={(e) =>
                    setForm({ ...form, capacityPerDay: e.target.value })
                  }
                  placeholder="e.g., 3"
                />
                <Input
                  label="Commission Percent (%)"
                  type="number"
                  value={form.commissionPercent}
                  onChange={(e) =>
                    setForm({ ...form, commissionPercent: e.target.value })
                  }
                  placeholder="e.g., 10"
                />
                <Input
                  label="Detail of Plan"
                  value={form.planDetail}
                  onChange={(e) =>
                    setForm({ ...form, planDetail: e.target.value })
                  }
                />
                <Input
                  label="Plan Expiry"
                  type="date"
                  value={form.planExpiry}
                  onChange={(e) =>
                    setForm({ ...form, planExpiry: e.target.value })
                  }
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Agreement File Upload
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        agreementFile: e.target.files?.[0] || null,
                      })
                    }
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 transition-colors"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">
                      Leave empty to keep the existing agreement file
                    </p>
                    {form.agreementFileUrl && (
                      <a
                        href={form.agreementFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 shrink-0"
                      >
                        View current file
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Bank Details"
              subtitle="For vendor payouts (optional)"
              icon={<Landmark size={18} />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Bank Name"
                  value={form.bankName}
                  onChange={(e) =>
                    setForm({ ...form, bankName: e.target.value })
                  }
                />
                <Input
                  label="Account Name"
                  value={form.accountFullName}
                  onChange={(e) =>
                    setForm({ ...form, accountFullName: e.target.value })
                  }
                />
                <Input
                  label="Account Number"
                  value={form.accountNumber}
                  onChange={(e) =>
                    setForm({ ...form, accountNumber: e.target.value })
                  }
                />
                <Input
                  label="IBAN"
                  value={form.ibanNo}
                  onChange={(e) => setForm({ ...form, ibanNo: e.target.value })}
                />

                <div>
                  <Input
                    label="SWIFT / BIC"
                    value={form.swift}
                    onChange={(e) =>
                      setForm({ ...form, swift: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Branch Address
                  </label>
                  <textarea
                    value={form.branchAddress}
                    onChange={(e) =>
                      setForm({ ...form, branchAddress: e.target.value })
                    }
                    rows={2}
                    maxLength={500}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {form.branchAddress.length}/500 characters
                  </p>
                </div>
              </div>
            </CollapsibleSection>
          </div>

          <div className="sticky bottom-0 z-40 mt-6 border-t border-gray-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
            <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={loading || uploadingProfileImage}>
                {loading ? "Updating..." : "Update Vendor"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}