"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Loader2,
  RotateCcw,
  Search,
  Wallet,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/api/adminApi";
import Button from "@/components/admin/Button";
import Pagination from "@/components/admin/Pagination";
import { getBookingStatus } from "@/lib/bookingUtils";

const pad = (n: number) => String(n).padStart(2, "0");

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
};

const parseDdMmYyyy = (value: string): Date | null => {
  if (!value) return null;
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return isNaN(d.getTime()) ? null : d;
};

const toInputDate = (ddmmyyyy: string): string => {
  const d = parseDdMmYyyy(ddmmyyyy);
  if (!d) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const fromInputDate = (yyyymmdd: string): string => {
  if (!yyyymmdd) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyymmdd);
  if (!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
};

const formatTimeValue = (value?: string | null) => {
  if (!value) return "";
  const hm = /^(\d{1,2}):(\d{2})/.exec(value);
  let h: number;
  let m: number;
  if (hm && !value.includes("T")) {
    h = Number(hm[1]);
    m = Number(hm[2]);
  } else {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    h = d.getHours();
    m = d.getMinutes();
  }
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};

const getEventTime = (item: Record<string, any>): string => {
  const start = item.startTime ?? item.eventStartTime ?? item.slot?.startTime;
  const end = item.endTime ?? item.eventEndTime ?? item.slot?.endTime;
  if (start && end) return `${formatTimeValue(start)} – ${formatTimeValue(end)}`;
  if (start) return formatTimeValue(start);
  const label = item.timeSlot ?? item.slotName ?? item.slot?.name;
  return label ? String(label) : "";
};

const getEventType = (b: Record<string, any>): string => {
  const first = b.items?.[0] || {};
  const raw =
    b.eventType ?? b.eventTypeName ?? b.event?.name ??
    first.eventType ?? first.eventTypeName ?? first.event?.name;
  if (raw && typeof raw === "object") return raw.name || raw.title || "-";
  return raw ? String(raw) : "-";
};

const getGuests = (b: Record<string, any>): string => {
  const first = b.items?.[0] || {};
  const v =
    b.guestCount ?? b.guests ?? b.numberOfGuests ??
    first.guestCount ?? first.guests ?? first.numberOfGuests;
  return v === undefined || v === null || v === "" ? "-" : String(v);
};

const paidAmount = (b: Record<string, any>) =>
  (b.payments || [])
    .filter((p: any) => p.status === "SUCCEEDED")
    .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

const getPaymentStatus = (b: Record<string, any>): "Paid" | "Partial" | "Pending" => {
  const paid = paidAmount(b);
  if (paid <= 0) return "Pending";
  return paid >= Number(b.totalAmount || 0) ? "Paid" : "Partial";
};

const money = (currency: string | undefined, v: number) =>
  `${currency || "AED"} ${Number(v || 0).toLocaleString()}`;

const escapeHtml = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const EVENT_TONES = [
  "bg-red-50 text-red-500",
  "bg-blue-50 text-blue-500",
  "bg-pink-50 text-pink-500",
  "bg-purple-50 text-purple-500",
  "bg-teal-50 text-teal-600",
  "bg-orange-50 text-orange-500",
];
const eventTone = (name: string) => {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 997;
  return EVENT_TONES[h % EVENT_TONES.length];
};

const Chip = ({ text, cls }: { text: string; cls: string }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
    {text}
  </span>
);

const STATUS_CLS: Record<string, string> = {
  Confirmed: "bg-green-100 text-green-600",
  "In Process": "bg-blue-100 text-blue-600",
  Rejected: "bg-red-100 text-red-600",
  Completed: "bg-purple-100 text-purple-600",
};
const PAY_CLS: Record<string, string> = {
  Paid: "bg-green-100 text-green-600",
  Partial: "bg-orange-100 text-orange-600",
  Pending: "bg-yellow-100 text-yellow-700",
};

const Select = ({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) => (
  <div className={className}>
    {label && <label className="mb-1 block text-xs text-gray-500">{label}</label>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-orange-400"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

const StatCard = ({
  icon,
  tone,
  title,
  value,
  sub,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  tone: string;
  title: string;
  value: React.ReactNode;
  sub: string;
  onClick?: () => void;
  active?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition-all ${
      active
        ? "border-orange-400 ring-2 ring-orange-100"
        : "border-gray-100 hover:border-gray-200 hover:shadow-md"
    } ${onClick ? "cursor-pointer" : "cursor-default"}`}
  >
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-700">{title}</p>
      <p className="text-2xl font-bold leading-tight text-gray-900">{value}</p>
      <p className="truncate text-xs text-gray-400">{sub}</p>
    </div>
  </button>
);

type BookingRow = Record<string, any> & { sr: number };

export default function BookingManagementPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [bookingFilter, setBookingFilter] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.bookings.list();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromD = parseDdMmYyyy(fromDate);
    const toD = parseDdMmYyyy(toDate);
    const from = fromD ? fromD.getTime() : null;
    const to = toD ? toD.getTime() + 86399999 : null;
    return bookings.filter((b) => {
      const status = getBookingStatus(b);
      if (bookingFilter && status !== bookingFilter) return false;
      if (paymentFilter && getPaymentStatus(b) !== paymentFilter) return false;
      if (from !== null || to !== null) {
        const t = new Date(b.createdAt).getTime();
        if (isNaN(t)) return false;
        if (from !== null && t < from) return false;
        if (to !== null && t > to) return false;
      }
      if (q) {
        const hay = [b.orderId, b.id, b.customer?.name, b.customer?.email]
          .map((v) => String(v ?? "").toLowerCase());
        if (!hay.some((v) => v.includes(q))) return false;
      }
      return true;
    });
  }, [bookings, search, fromDate, toDate, paymentFilter, bookingFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paged: BookingRow[] = useMemo(
    () =>
      filtered
        .slice((page - 1) * perPage, page * perPage)
        .map((b, i) => ({ ...b, sr: (page - 1) * perPage + i + 1 })),
    [filtered, page],
  );

  const total = bookings.length;
  const countStatus = (s: string) => bookings.filter((b) => getBookingStatus(b) === s).length;
  const confirmedCount = countStatus("Confirmed");
  const inProcessCount = countStatus("In Process");
  const rejectedCount = countStatus("Rejected");
  const completedCount = countStatus("Completed");
  const pct = (n: number) => (total ? `${((n / total) * 100).toFixed(1)}% of total` : "0% of total");

  const totalAmount = bookings.reduce((s, b) => s + Number(b.totalAmount || 0), 0);
  const receivedAmount = bookings.reduce((s, b) => s + paidAmount(b), 0);
  const remainingAmount = bookings.reduce((s, b) => s + Number(b.remainingDueAmount || 0), 0);
  const revenueCurrency = bookings[0]?.currency || "AED";
  const receivedPct = totalAmount ? `${((receivedAmount / totalAmount) * 100).toFixed(1)}% collected` : "0% collected";
  const remainingPct = totalAmount ? `${((remainingAmount / totalAmount) * 100).toFixed(1)}% pending` : "0% pending";

  const handleStatusClick = (status: string) => {
    setBookingFilter((prev) => (prev === status ? "" : status));
    setPage(1);
  };

  const reset = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setPaymentFilter("");
    setBookingFilter("");
    setPage(1);
  };

  const exportCsv = () => {
    const header = [
      "Order ID", "Booked Date", "Customer", "Email", "Packages", "Event Date", "Event Time", "Guests", "Event Type",
      "Total", "Paid", "Remaining", "Payment", "Booking Status",
    ];
    const lines = filtered.map((b) => {
      const first = (b.items || [])[0];
      return [
        b.orderId,
        formatDate(b.createdAt),
        b.customer?.name,
        b.customer?.email,
        (b.items || []).map((i: any) => i.title).join(" | "),
        (b.items || []).map((i: any) => formatDate(i.eventDate)).join(" | "),
        first ? getEventTime(first) : "",
        getGuests(b),
        getEventType(b),
        b.totalAmount,
        paidAmount(b),
        b.remainingDueAmount ?? 0,
        getPaymentStatus(b),
        getBookingStatus(b),
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",");
    });
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookings.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadInvoice = (b: Record<string, any>) => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) {
      toast.error("Please allow pop-ups to download the invoice");
      return;
    }
    const rowsHtml = (b.items || [])
      .map(
        (i: any, idx: number) => `<tr><td>${idx + 1}</td><td>${escapeHtml(i.title)}</td>
        <td>${escapeHtml(formatDate(i.eventDate))}</td>
        <td style="text-align:right">${escapeHtml(i.quantity)}</td>
        <td style="text-align:right">${escapeHtml(money(b.currency, i.unitAmount))}</td></tr>`,
      )
      .join("");
    w.document.write(`<html><head><title>Invoice ${escapeHtml(b.orderId)}</title>
      <style>body{font-family:Arial,sans-serif;padding:32px;color:#111}
      h1{color:#f97316;margin:0}table{width:100%;border-collapse:collapse;margin-top:20px}
      th,td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left;font-size:13px}
      .meta{display:flex;justify-content:space-between;margin-top:16px;font-size:13px}
      .tot{margin-top:16px;text-align:right;font-size:14px;line-height:1.8}</style></head><body>
      <h1>EventStan</h1><p>Invoice</p>
      <div class="meta"><div><b>Order ID:</b> ${escapeHtml(b.orderId)}<br/>
      <b>Booked on:</b> ${escapeHtml(formatDate(b.createdAt))}</div>
      <div><b>${escapeHtml(b.customer?.name)}</b><br/>${escapeHtml(b.customer?.email)}<br/>${escapeHtml(b.eventAddress)}</div></div>
      <table><thead><tr><th>#</th><th>Package</th><th>Event Date</th><th style="text-align:right">Qty</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${rowsHtml}</tbody></table>
      <div class="tot"><div><b>Total:</b> ${escapeHtml(money(b.currency, b.totalAmount))}</div>
      <div><b>Paid:</b> ${escapeHtml(money(b.currency, paidAmount(b)))}</div>
      <div><b>Remaining:</b> ${escapeHtml(money(b.currency, b.remainingDueAmount))}</div></div>
      <script>window.onload=function(){window.print()}</script></body></html>`);
    w.document.close();
  };

  const openView = (id: string) => router.push(`/admin/booking-management/view/${id}`);

  const headers = [
    "S.No.", "Order ID", "Booked Date", "Event Date & Time", "Customer", "Guests", "Event Type",
    "Total", "Payment", "Remaining", "Booking Status", "Actions",
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Booking Management</h1>
        <p className="text-sm text-gray-500">View and manage all event bookings</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={<CalendarDays size={22} />}
          tone="bg-blue-50 text-blue-500"
          title="Total Bookings"
          value={total}
          sub={bookingFilter === "" ? "Live bookings" : "Click to show all"}
          onClick={() => {
            setBookingFilter("");
            setPage(1);
          }}
          active={bookingFilter === ""}
        />
        <StatCard
          icon={<CheckCircle2 size={22} />}
          tone="bg-green-50 text-green-500"
          title="Confirmed"
          value={confirmedCount}
          sub={pct(confirmedCount)}
          onClick={() => handleStatusClick("Confirmed")}
          active={bookingFilter === "Confirmed"}
        />
        <StatCard
          icon={<CheckCircle2 size={22} />}
          tone="bg-purple-50 text-purple-500"
          title="Completed"
          value={completedCount}
          sub={pct(completedCount)}
          onClick={() => handleStatusClick("Completed")}
          active={bookingFilter === "Completed"}
        />
        <StatCard
          icon={<Clock size={22} />}
          tone="bg-blue-50 text-blue-500"
          title="In Process"
          value={inProcessCount}
          sub={pct(inProcessCount)}
          onClick={() => handleStatusClick("In Process")}
          active={bookingFilter === "In Process"}
        />
        <StatCard
          icon={<XCircle size={22} />}
          tone="bg-red-50 text-red-500"
          title="Rejected"
          value={rejectedCount}
          sub={pct(rejectedCount)}
          onClick={() => handleStatusClick("Rejected")}
          active={bookingFilter === "Rejected"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={<Wallet size={22} />}
          tone="bg-purple-50 text-purple-500"
          title="Total Amount"
          value={money(revenueCurrency, totalAmount)}
          sub="Total booking value"
        />
        <StatCard
          icon={<Wallet size={22} />}
          tone="bg-green-50 text-green-500"
          title="Received Amount"
          value={money(revenueCurrency, receivedAmount)}
          sub={receivedPct}
        />
        <StatCard
          icon={<Wallet size={22} />}
          tone="bg-orange-50 text-orange-500"
          title="Remaining Amount"
          value={money(revenueCurrency, remainingAmount)}
          sub={remainingPct}
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Order ID / Customer"
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400"
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5">
            <CalendarDays size={15} className="text-gray-400" />
            <div className="relative">
              <input
                type="date"
                value={toInputDate(fromDate)}
                onChange={(e) => {
                  setFromDate(fromInputDate(e.target.value));
                  setPage(1);
                }}
                className="peer relative z-10 w-[110px] cursor-pointer bg-transparent text-sm text-transparent outline-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
              />
              <span className="pointer-events-none absolute inset-0 z-20 flex items-center bg-white text-sm text-gray-700">
                {fromDate || <span className="text-gray-400">dd-mm-yyyy</span>}
              </span>
            </div>
            <span className="text-gray-400">→</span>
            <div className="relative">
              <input
                type="date"
                value={toInputDate(toDate)}
                onChange={(e) => {
                  setToDate(fromInputDate(e.target.value));
                  setPage(1);
                }}
                className="peer relative z-10 w-[110px] cursor-pointer bg-transparent text-sm text-transparent outline-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
              />
              <span className="pointer-events-none absolute inset-0 z-20 flex items-center bg-white text-sm text-gray-700">
                {toDate || <span className="text-gray-400">dd-mm-yyyy</span>}
              </span>
            </div>
          </div>

          <Select
            label="Payment Status"
            className="w-44"
            value={paymentFilter}
            onChange={(v) => {
              setPaymentFilter(v);
              setPage(1);
            }}
            options={[
              { value: "", label: "All" },
              { value: "Paid", label: "Paid" },
              { value: "Partial", label: "Partial" },
              { value: "Pending", label: "Pending" },
            ]}
          />
          <Select
            label="Booking Status"
            className="w-44"
            value={bookingFilter}
            onChange={(v) => {
              setBookingFilter(v);
              setPage(1);
            }}
            options={[
              { value: "", label: "All" },
              { value: "In Process", label: "In Process" },
              { value: "Confirmed", label: "Confirmed" },
              { value: "Completed", label: "Completed" },
              { value: "Rejected", label: "Rejected" },
            ]}
          />
          <Button variant="secondary" onClick={reset}>
            <RotateCcw size={15} />
            Reset
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm font-medium text-gray-700">{filtered.length} bookings found</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download size={15} />
              Export
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-16">
            <Loader2 className="animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="border-y border-gray-100 text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  {headers.map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={headers.length} className="px-4 py-10 text-center text-gray-400">
                      No records found
                    </td>
                  </tr>
                ) : (
                  paged.map((row) => {
                    const items: any[] = row.items || [];
                    const first = items[0];
                    const status = getBookingStatus(row);
                    const pay = getPaymentStatus(row);
                    const evType = getEventType(row);
                    const remaining = Number(row.remainingDueAmount || 0);
                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-gray-200 align-top ${
                          row.sr % 2 === 0 ? "bg-gray-100" : "bg-white"
                        }`}
                      >
                        <td className="px-4 py-4 text-gray-700">{row.sr}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-700">{row.orderId || "-"}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                          {formatDate(row.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <p className="text-gray-700">{formatDate(first?.eventDate)}</p>
                          {first && getEventTime(first) && (
                            <p className="text-xs text-gray-400">{getEventTime(first)}</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="whitespace-nowrap font-semibold text-gray-900">{row.customer?.name || "-"}</p>
                          <p className="text-xs text-gray-400">{row.customer?.email}</p>
                        </td>
                        <td className="px-4 py-4 text-gray-700">{getGuests(row)}</td>
                        <td className="px-4 py-4">
                          {evType === "-" ? "-" : <Chip text={evType} cls={eventTone(evType)} />}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-800">
                          {money(row.currency, row.totalAmount)}
                        </td>
                        <td className="px-4 py-4">
                          <Chip text={pay} cls={PAY_CLS[pay]} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-gray-700">
                          {remaining > 0 ? money(row.currency, remaining) : "-"}
                        </td>
                        <td className="px-4 py-4">
                          <Chip text={status} cls={STATUS_CLS[status]} />
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => openView(row.id)}
                            title="View Details"
                            className="rounded-lg border border-gray-200 p-1.5 text-blue-500 hover:bg-blue-50"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={perPage}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}