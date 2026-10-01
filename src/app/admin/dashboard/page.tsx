"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarCheck,
  DollarSign,
  Eye,
  Star,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/api/adminApi";
import StatsCard from "@/components/admin/StatsCard";
import Modal from "@/components/admin/Modal";

interface DashboardData {
  totalUsers: number;
  totalVendors: number;
  totalBookings: number;
  totalRevenue: number;
  pendingApprovals: number;
  completedEvents: number;
  avgRating: number;
  growth: number;
}

interface Booking {
  id: string;
  orderId: string;
  status: string;
  totalAmount: number;
  remainingDueAmount: number;
  advanceDueAmount: number;
  currency: string;
  eventAddress: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  vendorAcceptedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  customer: { name: string; email: string; phone?: string };
  items: Array<{
    id: string;
    title: string;
    vendorId: string;
    type?: string;
    eventDate: string;
    quantity: number;
    unitAmount: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    paymentType: string;
  }>;
  refunds: Array<{ id: string; amount: number; status: string }>;
}

interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  phoneCountryCode?: string;
  primaryMobile?: string;
  primaryMobileCountryCode?: string;
  status: string;
}

const emptyStats: DashboardData = {
  totalUsers: 0,
  totalVendors: 0,
  totalBookings: 0,
  totalRevenue: 0,
  pendingApprovals: 0,
  completedEvents: 0,
  avgRating: 0,
  growth: 0,
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatPhone = (phone?: string, countryCode?: string) => {
  if (!phone) return "-";
  if (phone.startsWith("+")) return phone;
  return `${countryCode || ""} ${phone}`.trim();
};

export default function DashboardPage() {
  const [stats, setStats] = useState(emptyStats);
  const [recent, setRecent] = useState<Booking[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, bookingsRes, vendorsRes] = await Promise.all([
        adminApi.dashboard(),
        adminApi.bookings.list(),
        adminApi.vendors.list(),
      ]);

      setStats(dashRes.data ?? emptyStats);
      setVendors(vendorsRes as Vendor[]);

      const latest = (bookingsRes as Booking[])
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 10);

      setRecent(latest);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Dashboard failed to load",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const vendorMap = useMemo(() => {
    const map: Record<string, Vendor> = {};
    vendors.forEach((v) => {
      map[v.id] = v;
    });
    return map;
  }, [vendors]);

  const paid = (booking: Booking) =>
    booking.payments
      .filter((p) => p.status === "SUCCEEDED")
      .reduce((sum, p) => sum + p.amount, 0);

  const paymentStatus = (booking: Booking) => {
    const paidAmount = paid(booking);
    if (paidAmount === 0) return "Unpaid";
    if (paidAmount >= booking.totalAmount) return "Fully Paid";
    return "Partly Paid";
  };

  const paymentBadge = (booking: Booking) => {
    const label = paymentStatus(booking);
    if (label === "Fully Paid")
      return (
        <span className="inline-block whitespace-nowrap rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-600">
          Fully Paid
        </span>
      );
    if (label === "Unpaid")
      return (
        <span className="inline-block whitespace-nowrap rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600">
          Unpaid
        </span>
      );
    return (
      <span className="inline-block whitespace-nowrap rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
        Partly Paid
      </span>
    );
  };

  const getBookingStatus = (
    booking: Booking,
  ): "Rejected" | "Confirmed" | "In Process" => {
    if (booking.cancelledAt || booking.cancelReason) return "Rejected";
    if (booking.vendorAcceptedAt) return "Confirmed";
    return "In Process";
  };

  const bookingBadge = (booking: Booking) => {
    const label = getBookingStatus(booking);
    if (label === "Confirmed")
      return (
        <span className="inline-block whitespace-nowrap rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-600">
          Confirmed
        </span>
      );
    if (label === "Rejected")
      return (
        <span className="inline-block whitespace-nowrap rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600">
          Rejected
        </span>
      );
    return (
      <span className="inline-block whitespace-nowrap rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-600">
        In Process
      </span>
    );
  };

  const vendorBadge = (accepted: boolean) => {
    if (accepted)
      return (
        <span className="inline-block whitespace-nowrap rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-600">
          Accepted
        </span>
      );
    return (
      <span className="inline-block whitespace-nowrap rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
        Pending
      </span>
    );
  };

  const columns: {
    key: string;
    label: string;
    render: (row: Booking, index: number) => React.ReactNode;
  }[] = [
    {
      key: "sr",
      label: "S.No.",
      render: (_row, index) => index + 1,
    },
    {
      key: "orderId",
      label: "Order ID",
      render: (row) => row.orderId || "-",
    },
    {
      key: "customer",
      label: "Customer",
      render: (row) => (
        <div>
          <p className="font-medium">{row.customer.name}</p>
          <p className="text-xs text-gray-400">{row.customer.email}</p>
        </div>
      ),
    },
    {
      key: "items",
      label: "Package",
      render: (row) => {
        if (!row.items || row.items.length === 0) return "-";
        return (
          <div className="flex min-w-[220px] max-w-[300px] flex-col items-start gap-2">
            {row.items.map((item, idx) => {
              const accepted = Boolean(item.vendorId);
              return (
                <div key={item.id} className="w-full">
                  <span className="inline-flex max-w-full items-start gap-1 whitespace-normal break-words rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs leading-snug text-gray-700">
                    <span className="font-semibold text-gray-500 shrink-0">
                      P{idx + 1}
                    </span>
                    <span>{item.title}</span>
                  </span>
                  <div className="mt-0.5">{vendorBadge(accepted)}</div>
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      key: "eventDate",
      label: "Event Date",
      render: (row) => {
        if (!row.items || row.items.length === 0) return "-";
        return (
          <div className="flex flex-col gap-2">
            {row.items.map((item) => (
              <div
                key={item.id}
                className="whitespace-nowrap text-xs text-gray-700"
              >
                {formatDate(item.eventDate)}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      key: "totalAmount",
      label: "Total",
      render: (row) => `${row.currency} ${row.totalAmount.toLocaleString()}`,
    },
    {
      key: "payments",
      label: "Payment",
      render: (row) => (
        <div className="space-y-1 whitespace-nowrap">
          <p className="font-medium">
            {row.currency} {paid(row).toLocaleString()}
          </p>
          {paymentBadge(row)}
        </div>
      ),
    },
    {
      key: "remainingDueAmount",
      label: "Remaining",
      render: (row) => {
        if (!row.remainingDueAmount || row.remainingDueAmount === 0) {
          return <span className="text-gray-400">-</span>;
        }
        return `${row.currency} ${row.remainingDueAmount.toLocaleString()}`;
      },
    },
    {
      key: "status",
      label: "Booking Status",
      render: (row) => bookingBadge(row),
    },
    {
      key: "createdAt",
      label: "Booked Date",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelected(row);
          }}
          className="text-blue-500"
          title="View"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  if (loading && !stats.totalUsers)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500">EventStan platform overview</p>
        </div>
        <Link
          href="/admin/booking-management"
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          View All Bookings
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users size={18} />}
          color="blue"
        />
        <StatsCard
          title="Total Vendors"
          value={stats.totalVendors}
          icon={<Truck size={18} />}
          color="orange"
        />
        <StatsCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={<BookOpen size={18} />}
          color="green"
        />
        <StatsCard
          title="Total Revenue"
          value={`AED ${stats.totalRevenue.toLocaleString()}`}
          icon={<DollarSign size={18} />}
          color="purple"
        />
        <StatsCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={<TrendingUp size={18} />}
          color="orange"
        />
        <StatsCard
          title="Completed Events"
          value={stats.completedEvents}
          icon={<CalendarCheck size={18} />}
          color="green"
        />
        <StatsCard
          title="Avg Rating"
          value={stats.avgRating}
          icon={<Star size={18} />}
          color="purple"
        />
        <StatsCard
          title="Growth Rate"
          value={`${stats.growth}%`}
          icon={<TrendingUp size={18} />}
          color="blue"
        />
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold">Recent Bookings</h2>
          <Link
            href="/admin/booking-management"
            className="text-xs font-medium text-orange-600 hover:underline"
          >
            View All
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-white text-xs uppercase text-gray-500">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="whitespace-nowrap px-4 py-3 font-medium"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                recent.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelected(row)}
                    className={`cursor-pointer border-b transition-colors hover:bg-gray-100 ${
                      rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 align-top">
                        {col.render(row, rowIndex)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Booking Details"
        size="lg"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <p>
                <strong>Order ID:</strong>
                <br />
                {selected.orderId}
              </p>
              <p>
                <strong>Customer:</strong>
                <br />
                {selected.customer.name}
                <br />
                {selected.customer.email}
              </p>
              <p>
                <strong>Booking Status:</strong>
                <br />
                {bookingBadge(selected)}
              </p>
              <p>
                <strong>Payment Status:</strong>
                <br />
                {paymentBadge(selected)}
              </p>
              <p>
                <strong>Address:</strong>
                <br />
                {selected.eventAddress}
              </p>
              <p>
                <strong>Total:</strong>
                <br />
                {selected.currency} {selected.totalAmount.toLocaleString()}
              </p>
              <p>
                <strong>Paid:</strong>
                <br />
                {selected.currency} {paid(selected).toLocaleString()}
              </p>
              <p>
                <strong>Remaining:</strong>
                <br />
                {selected.remainingDueAmount && selected.remainingDueAmount > 0
                  ? `${selected.currency} ${selected.remainingDueAmount.toLocaleString()}`
                  : "-"}
              </p>
              <p>
                <strong>Booked Date:</strong>
                <br />
                {formatDate(selected.createdAt)}
              </p>
            </div>

            <div>
              <strong>Package</strong>
              {selected.items.map((item, index) => {
                const vendor = vendorMap[item.vendorId];
                const vendorName = vendor
                  ? vendor.companyName || vendor.contactPerson
                  : "Unknown Vendor";
                const accepted = Boolean(item.vendorId);
                const isEven = index % 2 === 0;
                return (
                  <div
                    key={item.id}
                    className={`mt-2 grid grid-cols-2 gap-4 rounded-xl p-3 ${
                      isEven
                        ? "bg-gray-50"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <div>
                      <div className="font-medium">
                        P{index + 1}: {item.title}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Event Date: {formatDate(item.eventDate)} · Qty{" "}
                        {item.quantity}
                      </div>
                    </div>
                    <div className="border-l border-gray-200 pl-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">
                          Vendor
                        </span>
                        {vendorBadge(accepted)}
                      </div>
                      <p className="mt-1 text-xs text-gray-700">
                        {vendorName}
                      </p>
                      {vendor && (
                        <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                          <p>
                            <strong>Email:</strong> {vendor.email || "-"}
                          </p>
                          <p>
                            <strong>Contact:</strong>{" "}
                            {formatPhone(
                              vendor.primaryMobile || vendor.phone,
                              vendor.primaryMobileCountryCode ||
                                vendor.phoneCountryCode,
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}