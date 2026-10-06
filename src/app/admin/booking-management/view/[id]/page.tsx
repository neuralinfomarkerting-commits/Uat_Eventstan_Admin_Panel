"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Building2,
  CalendarDays,
  Copy,
  FileText,
  History,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  Tag,
  User,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/api/adminApi";
import Button from "@/components/admin/Button";
import { getBookingStatus } from "@/lib/bookingUtils";

type Item = {
  [key: string]: any;
  id: string;
  title: string;
  vendorId: string;
  eventDate: string;
  quantity: number;
  unitAmount: number;
  itemId?: string;
};

type Booking = {
  [key: string]: any;
  id: string;
  orderId: string;
  status: string;
  totalAmount: number;
  remainingDueAmount: number;
  currency: string;
  eventAddress: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  vendorAcceptedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  customerId?: string;
  customer: {
    [key: string]: any;
    id?: string;
    name: string;
    email: string;
    phone?: string;
    profileImage?: string;
  };
  items: Item[];
  payments: Array<{
    [key: string]: any;
    id: string;
    amount: number;
    status: string;
    paymentType: string;
  }>;
  refunds: Array<{ id: string; amount: number; status: string }>;
};

type Vendor = {
  [key: string]: any;
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  phoneCountryCode?: string;
  primaryMobile?: string;
  primaryMobileCountryCode?: string;
  vendorProfileImage?: string | null;
  imageUrl?: string | null;
};

const CUSTOMER_API_BASE =
  process.env.NEXT_PUBLIC_CUSTOMER_API_URL ||
  "https://uatcustomer.eventstan.com/api/proxy";

const CARD_SHADOW =
  "shadow-[0_1px_3px_rgba(16,24,40,0.08),0_4px_12px_-2px_rgba(16,24,40,0.06)]";

const FAILED_STATUSES = ["REQUIRES_PAYMENT_METHOD", "FAILED"];

const pad = (n: number) => String(n).padStart(2, "0");

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
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
  return `${pad(h)}:${pad(m)}`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const t = formatTimeValue(value);
  return `${formatDate(value)}${t ? ` ${t}` : ""}`;
};

const getEventTime = (item: Record<string, any>): string => {
  const start = item.startTime ?? item.eventStartTime ?? item.slot?.startTime;
  const end = item.endTime ?? item.eventEndTime ?? item.slot?.endTime;
  if (start && end)
    return `${formatTimeValue(start)} – ${formatTimeValue(end)}`;
  if (start) return formatTimeValue(start);
  const label = item.timeSlot ?? item.slotName ?? item.slot?.name;
  return label ? String(label) : "";
};

const getEventType = (b: Booking): string => {
  const first = b.items?.[0] || {};
  const raw =
    b.eventType ??
    b.eventTypeName ??
    b.event?.name ??
    first.eventType ??
    first.eventTypeName ??
    first.event?.name;
  if (raw && typeof raw === "object") return raw.name || raw.title || "-";
  return raw ? String(raw) : "-";
};

const getGuests = (b: Booking): string => {
  const first = b.items?.[0] || {};
  const v =
    b.guestCount ??
    b.guests ??
    b.numberOfGuests ??
    first.guestCount ??
    first.guests ??
    first.numberOfGuests;
  return v === undefined || v === null || v === "" ? "-" : String(v);
};

const formatPhone = (phone?: string, code?: string) => {
  if (!phone) return "-";
  return phone.startsWith("+") ? phone : `${code || ""} ${phone}`.trim();
};

const escapeHtml = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const ADDRESS_LABELS = [
  "Address Line 1",
  "Address Line 2",
  "City",
  "State",
  "PO Box",
  "Landmark",
];

const parseNotes = (notes?: string) => {
  const fields: Record<string, string> = {};
  let message = "";
  if (!notes) return { fields, message };
  notes.split(" - ").forEach((part) => {
    const idx = part.indexOf(":");
    const key = idx > -1 ? part.slice(0, idx).trim() : "";
    if (ADDRESS_LABELS.includes(key)) {
      fields[key] = part.slice(idx + 1).trim();
    } else {
      message = message ? `${message} - ${part}` : part;
    }
  });
  return { fields, message: message.trim() };
};

const initials = (name?: string) =>
  (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

const isItemAccepted = (booking: Booking, item: Item): boolean => {
  const own = item.vendorStatus ?? item.status;
  if (typeof own === "string")
    return ["ACCEPTED", "VENDOR_ACCEPTED", "CONFIRMED"].includes(
      own.toUpperCase(),
    );
  if (typeof item.vendorAcceptedAt !== "undefined")
    return Boolean(item.vendorAcceptedAt);
  return (
    Boolean(booking.vendorAcceptedAt) || booking.status === "VENDOR_ACCEPTED"
  );
};

const getCategoryName = (
  item: Record<string, any>,
  pkg?: Record<string, any> | null,
): string => {
  const raw =
    item.category?.name ??
    item.categoryName ??
    item.category_name ??
    pkg?.category?.name ??
    pkg?.category_name ??
    pkg?.items?.[0]?.service?.category?.name;
  if (raw && typeof raw === "object") return raw.name || raw.title || "-";
  return raw ? String(raw) : "-";
};

const getPackageImage = (
  item: Record<string, any>,
  pkg?: Record<string, any> | null,
): string | null => {
  const pkgImage =
    item.image ||
    item.imageUrl ||
    item.image_url ||
    item.thumbnail ||
    pkg?.imageUrl ||
    pkg?.image_url ||
    pkg?.image ||
    null;
  if (pkgImage) return pkgImage;

  const catImage =
    item.category?.image ||
    item.categoryImage ||
    pkg?.category?.image ||
    pkg?.category_image ||
    null;
  if (catImage) return catImage;

  const serviceImage =
    pkg?.items?.[0]?.service?.imageUrl ||
    pkg?.items?.[0]?.service?.image_url ||
    item.service?.imageUrl ||
    null;
  return serviceImage || null;
};

const getVendorImage = (v?: Vendor | null): string | null => {
  if (!v) return null;
  return (
    v.vendorProfileImage ||
    v.imageUrl ||
    v.profileImage ||
    v.image ||
    v.avatar ||
    null
  );
};

const getCustomerImage = (c?: Record<string, any> | null): string | null => {
  if (!c) return null;
  return (
    c.profileImage ||
    c.profileImageUrl ||
    c.imageUrl ||
    c.image_url ||
    c.avatar ||
    c.image ||
    null
  );
};

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("accessToken") ||
    null
  );
};

const fetchCustomerById = async (customerId: string) => {
  const headers: Record<string, string> = {
    accept: "application/json",
  };
  const token = getAuthToken();
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(`${CUSTOMER_API_BASE}/customers/${customerId}`, {
    headers,
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to load customer (${res.status})`);
  return res.json();
};

const Pill = ({ text, cls }: { text: string; cls: string }) => (
  <span
    className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${cls}`}
  >
    {text}
  </span>
);

const Card = ({
  title,
  icon,
  action,
  children,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={`rounded-2xl border border-gray-100 bg-white p-4 ${CARD_SHADOW} ${className}`}
  >
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <span className="text-orange-500">{icon}</span>
        {title}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-4 py-0.5 text-sm">
    <span className="shrink-0 text-gray-500">{label}</span>
    <span className="text-right font-medium text-gray-900">{children}</span>
  </div>
);

const Stat = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="px-5 py-4">
    <p className="mb-2 text-xs text-gray-500">{label}</p>
    {children}
  </div>
);

const Avatar = ({
  src,
  name,
  size = 40,
  className = "",
}: {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
}) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  const showImg = src && !failed;
  return showImg ? (
    <img
      src={src as string}
      alt={name || "avatar"}
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  ) : (
    <div
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gray-900 font-semibold text-white ${className}`}
    >
      <span style={{ fontSize: Math.max(10, size * 0.32) }}>
        {initials(name)}
      </span>
    </div>
  );
};

export default function BookingViewPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorDetails, setVendorDetails] = useState<Record<string, Vendor>>({});
  const [customerDetail, setCustomerDetail] = useState<Record<
    string,
    any
  > | null>(null);
  const [packageMap, setPackageMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [b, v] = await Promise.all([
        adminApi.bookings.get(id),
        adminApi.vendors.list().catch(() => []),
      ]);
      setBooking(b);
      setVendors(v);

      const api: any = adminApi as any;

      const vendorIds: string[] = Array.from(
        new Set(
          (b.items || [])
            .map((it: any) => it.vendorId)
            .filter((x: any): x is string => Boolean(x)),
        ),
      );

      const vendorDetailResults = await Promise.all(
        vendorIds.map(async (vid) => {
          try {
            if (api?.vendors?.get) return await api.vendors.get(vid);
            return null;
          } catch {
            return null;
          }
        }),
      );

      const vMap: Record<string, Vendor> = {};
      vendorDetailResults.forEach((d) => {
        if (d && d.id) vMap[d.id] = d;
      });
      setVendorDetails(vMap);

      const packageIds: string[] = Array.from(
        new Set(
          (b.items || [])
            .map((it: any) => it.itemId)
            .filter((x: any): x is string => Boolean(x)),
        ),
      );

      const pkgResults = await Promise.all(
        packageIds.map(async (pid) => {
          try {
            if (api?.packages?.get) return await api.packages.get(pid);
            if (api?.packages?.getById) return await api.packages.getById(pid);
            return null;
          } catch {
            return null;
          }
        }),
      );

      const pMap: Record<string, any> = {};
      pkgResults.forEach((p) => {
        if (p && p.id) pMap[p.id] = p;
      });
      setPackageMap(pMap);

      const custId = b.customerId || b.customer?.id;
      if (custId) {
        try {
          let cd: any = null;
          if (api?.customers?.get) {
            cd = await api.customers.get(custId);
          } else {
            cd = await fetchCustomerById(custId);
          }
          setCustomerDetail(cd || null);
        } catch {
          try {
            const cd = await fetchCustomerById(custId);
            setCustomerDetail(cd || null);
          } catch {
            setCustomerDetail(null);
          }
        }
      } else {
        setCustomerDetail(null);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load booking",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push("/admin/booking-management")}
          className="flex items-center gap-2 text-sm text-gray-600"
        >
          <ArrowLeft size={16} /> Back to bookings
        </button>
        <p className="text-gray-500">Booking not found.</p>
      </div>
    );
  }

  const vendorMap: Record<string, Vendor> = {};
  vendors.forEach((v) => (vendorMap[v.id] = v));
  Object.keys(vendorDetails).forEach((vid) => {
    vendorMap[vid] = { ...(vendorMap[vid] || {}), ...vendorDetails[vid] };
  });

  const items = booking.items || [];
  const payments = booking.payments || [];
  const succeeded = payments.filter((p) => p.status === "SUCCEEDED");
  const paid = succeeded.reduce((s, p) => s + p.amount, 0);
  const lastPayment =
    succeeded[succeeded.length - 1] || payments[payments.length - 1];
  const total = Number(booking.totalAmount || 0);
  const remaining = Number(booking.remainingDueAmount || 0);
  const cancelled = Boolean(booking.cancelledAt || booking.cancelReason);

  const customer = {
    ...(booking.customer || {}),
    ...(customerDetail || {}),
  } as Booking["customer"];

  const statusLabel = getBookingStatus(booking as any);
  const statusCls =
    statusLabel === "Completed"
      ? "bg-purple-100 text-purple-600"
      : statusLabel === "Confirmed"
        ? "bg-green-100 text-green-700"
        : statusLabel === "Rejected"
          ? "bg-red-100 text-red-600"
          : "bg-blue-100 text-blue-600";

  const lastFailed =
    payments.length > 0 &&
    FAILED_STATUSES.includes(
      String(payments[payments.length - 1].status).toUpperCase(),
    );

  const payLabel =
    paid <= 0
      ? lastFailed
        ? "Failed"
        : "Pending"
      : total > 0 && paid >= total
        ? "Fully Paid"
        : "Partial";
  const payCls =
    payLabel === "Fully Paid"
      ? "bg-green-100 text-green-700"
      : payLabel === "Partial"
        ? "bg-orange-100 text-orange-600"
        : payLabel === "Failed"
          ? "bg-red-100 text-red-600"
          : "bg-yellow-100 text-yellow-700";

  const money = (n: number) =>
    `${booking.currency} ${Number(n || 0).toLocaleString()}`;

  const firstItem = items[0] || ({} as Item);
  const eventTime = getEventTime(firstItem);
  const txnId =
    lastPayment?.providerRef ??
    lastPayment?.transactionId ??
    lastPayment?.paymentIntentId ??
    lastPayment?.stripePaymentIntentId ??
    lastPayment?.id;
  const paidAt =
    lastPayment?.succeededAt ?? lastPayment?.paidAt ?? lastPayment?.createdAt;
  const addr = parseNotes(booking.notes);

  const timeline = [
    {
      label: "Booking Created",
      desc: "Booking has been created by customer.",
      at: booking.createdAt,
      color: "bg-blue-500",
      text: "text-blue-600",
    },
    booking.vendorAcceptedAt && {
      label: "Vendor Accepted",
      desc: "Vendor has accepted the booking.",
      at: booking.vendorAcceptedAt,
      color: "bg-green-500",
      text: "text-green-600",
    },
    paid > 0 && {
      label: "Payment Completed",
      desc: "Payment received successfully.",
      at: paidAt,
      color: "bg-green-500",
      text: "text-green-600",
    },
    booking.status === "CONFIRMED" && {
      label: "Booking Confirmed",
      desc: "Booking status changed to Confirmed.",
      at: booking.confirmedAt ?? booking.updatedAt,
      color: "bg-emerald-600",
      text: "text-emerald-600",
    },
    cancelled && {
      label: "Booking Cancelled",
      desc: booking.cancelReason || "Booking was cancelled.",
      at: booking.cancelledAt,
      color: "bg-red-500",
      text: "text-red-600",
    },
  ].filter(Boolean) as Array<{
    label: string;
    desc: string;
    at?: string | null;
    color: string;
    text: string;
  }>;

  const complete = async () => {
    try {
      await adminApi.bookings.complete(booking.id);
      toast.success("Booking completed");
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to complete booking",
      );
    }
  };

  const copy = (text: string) => {
    void navigator.clipboard
      ?.writeText(text)
      .then(() => toast.success("Copied"));
  };

  const downloadInvoice = () => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) {
      toast.error("Please allow pop-ups to download the invoice");
      return;
    }
    const b = booking;
    const rowsHtml = items
      .map(
        (i, idx) => `<tr><td>${idx + 1}</td><td>${escapeHtml(i.title)}</td>
        <td>${escapeHtml(formatDate(i.eventDate))}</td>
        <td style="text-align:right">${escapeHtml(i.quantity)}</td>
        <td style="text-align:right">${escapeHtml(b.currency)} ${Number(i.unitAmount || 0).toLocaleString()}</td></tr>`,
      )
      .join("");
    w.document
      .write(`<html><head><title>Invoice ${escapeHtml(b.orderId)}</title>
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
      <div class="tot"><div><b>Total:</b> ${escapeHtml(money(total))}</div>
      <div><b>Paid:</b> ${escapeHtml(money(paid))}</div>
      <div><b>Remaining:</b> ${escapeHtml(money(remaining))}</div></div>
      <script>window.onload=function(){window.print()}</script></body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/admin/booking-management")}
            className="mt-1 text-gray-600 hover:text-gray-900"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Booking Details
            </h1>
            <p className="text-sm text-gray-500">
              View complete details of the booking and manage the status,
              payment and vendor.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {["CONFIRMED", "IN_PROGRESS"].includes(booking.status) &&
            statusLabel !== "Completed" && (
            <Button onClick={() => void complete()}>Mark Completed</Button>
          )}
          <Button variant="secondary" onClick={downloadInvoice}>
            <FileText size={15} /> Download Invoice
          </Button>
        </div>
      </div>

      {cancelled && booking.cancelReason && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Cancelled:</strong> {booking.cancelReason}
        </div>
      )}

      <div
        className={`grid grid-cols-2 divide-gray-100 rounded-2xl border border-gray-100 bg-white md:grid-cols-5 md:divide-x ${CARD_SHADOW}`}
      >
        <Stat label="Booking ID">
          <p className="flex items-center gap-2 text-xl font-bold text-gray-900">
            {booking.orderId}
            <button
              onClick={() => copy(booking.orderId)}
              className="text-gray-400 hover:text-gray-600"
              title="Copy"
            >
              <Copy size={14} />
            </button>
          </p>
          <p className="mt-2 text-xs text-gray-500">Order ID</p>
          <p className="text-sm font-medium text-gray-900">{booking.orderId}</p>
        </Stat>
        <Stat label="Booking Status">
          <Pill text={statusLabel} cls={statusCls} />
        </Stat>
        <Stat label="Payment Status">
          <Pill text={payLabel} cls={payCls} />
        </Stat>
        <Stat label="Booking Date">
          <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <CalendarDays size={15} className="text-gray-500" />
            {formatDate(booking.createdAt)}
          </p>
          <p className="ml-6 mt-1 text-xs text-gray-500">
            {formatTimeValue(booking.createdAt)}
          </p>
        </Stat>
        <Stat label="Total Amount">
          <p className="text-xl font-bold text-gray-900">{money(total)}</p>
        </Stat>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card
            title="Package Details"
            icon={<Package size={16} />}
            action={
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                Total: {items.length}
              </span>
            }
          >
            <div className="flex flex-col gap-3">
              {items.map((item, index) => {
                const accepted = isItemAccepted(booking, item);
                const v = vendorMap[item.vendorId];
                const pkg = item.itemId ? packageMap[item.itemId] : null;
                const categoryName = getCategoryName(item, pkg);
                const imageSrc = getPackageImage(item, pkg);
                const vendorImg = getVendorImage(v);
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 bg-gray-50/40 p-3"
                  >
                    <div className="grid gap-0 md:grid-cols-2">
                      <div className="md:pr-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                            {index + 1}
                          </span>
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={item.title}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-orange-400">
                              <Package size={16} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {item.title}
                            </p>
                            {item.capacity && (
                              <p className="text-[11px] leading-4 text-gray-500">
                                (up to {item.capacity})
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-1.5 text-xs">
                          <Row label="Category">{categoryName}</Row>
                          <Row label="Quantity">{item.quantity}</Row>
                          <Row label="Price">{money(item.unitAmount)}</Row>
                        </div>
                      </div>

                      <div className="mt-2 border-t border-gray-200 pt-2 md:mt-0 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                        <div className="mb-1.5 flex items-center justify-between">
                          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                            <Building2 size={12} /> Vendor
                          </p>
                          {accepted ? (
                            <Pill
                              text="Accepted"
                              cls="bg-green-100 text-green-700"
                            />
                          ) : (
                            <Pill
                              text="Pending"
                              cls="bg-yellow-100 text-yellow-700"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={vendorImg}
                            name={v?.companyName || v?.contactPerson}
                            size={32}
                          />
                          <div className="min-w-0 text-[11px] leading-4 text-gray-500">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {v?.companyName || "Unknown Vendor"}
                            </p>
                            <p className="truncate">
                              {v?.contactPerson || "-"}
                            </p>
                            <p className="truncate">{v?.email || "-"}</p>
                            <p>
                              {formatPhone(
                                v?.primaryMobile || v?.phone,
                                v?.primaryMobileCountryCode ||
                                  v?.phoneCountryCode,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card title="Payment Summary" icon={<Banknote size={16} />}>
            <Row label="Total Amount">
              <span className="font-bold">{money(total)}</span>
            </Row>
            <Row label="Paid Amount">
              <span className="font-bold text-green-600">{money(paid)}</span>
            </Row>
            {remaining > 0 && (
              <Row label="Remaining Amount">
                <span className="font-bold text-orange-500">
                  {money(remaining)}
                </span>
              </Row>
            )}
            <Row label="Payment Status">
              <Pill text={payLabel} cls={payCls} />
            </Row>
            <div className="my-2 border-t border-gray-100" />
            <Row label="Payment Method">
              <span className="capitalize">
                {String(booking.paymentMethod || "-").toLowerCase()}
              </span>
            </Row>
            <Row label="Transaction ID">
              <span className="inline-flex items-center gap-1.5">
                {txnId ? String(txnId) : "-"}
                {txnId && (
                  <button
                    onClick={() => copy(String(txnId))}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Copy size={12} />
                  </button>
                )}
              </span>
            </Row>
            <Row label="Payment Date">{formatDateTime(paidAt)}</Row>
          </Card>
          <Card
            title="Payment Transaction Details"
            icon={<FileText size={16} />}
          >
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {payments.map((p, idx) => {
                  const statusKey = String(p.status).toUpperCase();
                  const isSuccess = statusKey === "SUCCEEDED";
                  const isFailed = FAILED_STATUSES.includes(statusKey);
                  const statusText = isFailed
                    ? "Failed"
                    : statusKey.charAt(0) + statusKey.slice(1).toLowerCase();
                  const matchedItem = items.find((it) => it.id === p.itemId);
                  const matchedPkg = matchedItem?.itemId
                    ? packageMap[matchedItem.itemId]
                    : null;
                  const thumb =
                    matchedItem?.image ||
                    matchedItem?.imageUrl ||
                    (matchedItem &&
                      getPackageImage(matchedItem, matchedPkg)) ||
                    items[0]?.image ||
                    items[0]?.imageUrl ||
                    (items[0] &&
                      getPackageImage(
                        items[0],
                        packageMap[items[0]?.itemId || ""],
                      )) ||
                    null;
                  const stripeId =
                    p.providerRef ??
                    p.transactionId ??
                    p.paymentIntentId ??
                    p.stripePaymentIntentId;
                  const paymentTypeLabel =
                    p.paymentType === "ADVANCE"
                      ? "Advance Payment"
                      : p.paymentType === "FULL"
                        ? "Full Payment"
                        : p.paymentType === "REMAINING"
                          ? "Remaining Payment"
                          : p.paymentType || "Payment";

                  return (
                    <div
                      key={p.id}
                      className={`rounded-xl border border-gray-100 bg-white p-3 ${CARD_SHADOW}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt=""
                              className="h-14 w-14 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-orange-50 text-orange-400">
                              <Package size={22} />
                            </div>
                          )}

                          <div className="space-y-1 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-gray-900">
                                Payment #{idx + 1}
                              </p>
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                {paymentTypeLabel}
                              </span>
                            </div>

                            <p className="text-xs text-gray-500">
                              {formatDateTime(
                                p.succeededAt ?? p.paidAt ?? p.createdAt,
                              )}
                            </p>

                            {stripeId && (
                              <p className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span className="font-medium uppercase tracking-wide text-gray-400">
                                  Stripe Transaction ID
                                </span>
                                <span className="text-gray-700">
                                  {String(stripeId)}
                                </span>
                                <button
                                  onClick={() => copy(String(stripeId))}
                                  className="text-gray-400 hover:text-gray-600"
                                  title="Copy"
                                >
                                  <Copy size={12} />
                                </button>
                              </p>
                            )}

                            <p className="flex items-center gap-1.5 text-xs text-gray-500">
                              <span className="font-medium uppercase tracking-wide text-gray-400">
                                Payment ID
                              </span>
                              <span className="text-gray-700">
                                {String(p.id)}
                              </span>
                              <button
                                onClick={() => copy(String(p.id))}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copy"
                              >
                                <Copy size={12} />
                              </button>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <p className="text-lg font-bold text-gray-900">
                            {money(p.amount)}
                          </p>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isSuccess
                                ? "bg-green-100 text-green-700"
                                : isFailed
                                  ? "bg-red-100 text-red-600"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {statusText.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {(booking.refunds || []).length > 0 && (
              <div className="mt-4 space-y-1 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-700">Refunds</p>
                {booking.refunds.map((r) => (
                  <Row key={r.id} label={r.status}>
                    {money(r.amount)}
                  </Row>
                ))}
              </div>
            )}
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Customer Details" icon={<User size={16} />}>
            <div className="mb-3 flex items-center gap-3">
              <Avatar
                src={getCustomerImage(customer)}
                name={customer.name}
                size={48}
              />
              <div className="text-sm">
                <p className="font-semibold text-gray-900">
                  {customer.name || "-"}
                </p>
                <p className="text-gray-500">{customer.email || "-"}</p>
                <p className="text-gray-700">{customer.phone || "-"}</p>
              </div>
            </div>
            <Row label="Country">{customer.country || "UAE"}</Row>
            <Row label="State">{addr.fields["State"] || "-"}</Row>
            <Row label="City">{addr.fields["City"] || "-"}</Row>
            <Row label="Address Line 1">
              {addr.fields["Address Line 1"] || booking.eventAddress || "-"}
            </Row>
            <Row label="Address Line 2">
              {addr.fields["Address Line 2"] || "-"}
            </Row>
            <Row label="Landmark">{addr.fields["Landmark"] || "-"}</Row>
            <Row label="PO Box">{addr.fields["PO Box"] || "-"}</Row>
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span className="text-orange-500">
                  <MessageSquare size={16} />
                </span>
                Customer Message / Special Request
              </p>
              {addr.message ? (
                <>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
                    {addr.message}
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-gray-500">
                    <span>— {customer.name}</span>
                    <span>{formatDateTime(booking.createdAt)}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  The customer did not leave any message.
                </p>
              )}
            </div>
          </Card>
          <Card title="Event Details" icon={<CalendarDays size={16} />}>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="flex items-center gap-2 text-gray-500">
                    <CalendarDays size={14} /> Event Date & Time
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {formatDate(firstItem.eventDate)}
                  </p>
                  {eventTime && (
                    <p className="text-xs text-gray-500">{eventTime}</p>
                  )}
                </div>
                <div>
                  <p className="flex items-center gap-2 text-gray-500">
                    <Users size={14} /> Guest Count
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {getGuests(booking)}
                  </p>
                </div>
              </div>
              <div className="space-y-4 sm:border-l sm:border-gray-100 sm:pl-4">
                <div>
                  <p className="flex items-center gap-2 text-gray-500">
                    <MapPin size={14} /> Event Address
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {booking.eventAddress || "-"}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-2 text-gray-500">
                    <Tag size={14} /> Event Type
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {getEventType(booking)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
          <Card title="Booking Timeline" icon={<History size={16} />}>
            <ol className="relative space-y-5 border-l border-gray-200 pl-5">
              {timeline.map((t) => (
                <li key={t.label} className="relative text-sm">
                  <span
                    className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${t.color}`}
                  />
                  <div className="flex flex-wrap items-baseline gap-x-4">
                    <p className={`font-medium ${t.text}`}>{t.label}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(t.at)}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">{t.desc}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}