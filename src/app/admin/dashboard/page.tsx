"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Chip, FilterSelect } from "@/components/admin/BookingUi";
import {
  PAY_CLS,
  STATUS_CLS,
  eventTone,
  formatDate,
  getBookingStatus,
  getEventTime,
  getEventType,
  getGuests,
  getPaymentStatus,
  money,
} from "@/lib/bookingUtils";

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

type Booking = Record<string, any>;

const headers = [
  "S.No.", "Order ID", "Booked Date", "Event Date & Time", "Customer", "Guests", "Event Type",
  "Total", "Payment", "Remaining", "Booking Status", "Actions",
];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(emptyStats);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingFilter, setBookingFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, bookingsRes] = await Promise.all([
        adminApi.dashboard(),
        adminApi.bookings.list(),
      ]);
      setStats(dashRes.data ?? emptyStats);
      setBookings(Array.isArray(bookingsRes) ? bookingsRes : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dashboard failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const recent = useMemo(
    () =>
      bookings
        .filter((b) => !bookingFilter || getBookingStatus(b) === bookingFilter)
        .filter((b) => !paymentFilter || getPaymentStatus(b) === paymentFilter)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
    [bookings, bookingFilter, paymentFilter],
  );

  const openView = (id: string) => router.push(`/admin/booking-management/view/${id}`);
  if (loading && !stats.totalUsers && bookings.length === 0)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
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
        <StatsCard title="Total Users" value={stats.totalUsers} icon={<Users size={18} />} color="blue" />
        <StatsCard title="Total Vendors" value={stats.totalVendors} icon={<Truck size={18} />} color="orange" />
        <StatsCard title="Total Bookings" value={stats.totalBookings} icon={<BookOpen size={18} />} color="green" />
        <StatsCard title="Total Revenue" value={`AED ${stats.totalRevenue.toLocaleString()}`} icon={<DollarSign size={18} />} color="purple" />
        <StatsCard title="Pending Approvals" value={stats.pendingApprovals} icon={<TrendingUp size={18} />} color="orange" />
        <StatsCard title="Completed Events" value={stats.completedEvents} icon={<CalendarCheck size={18} />} color="green" />
        <StatsCard title="Avg Rating" value={stats.avgRating} icon={<Star size={18} />} color="purple" />
        <StatsCard title="Growth Rate" value={`${stats.growth}%`} icon={<TrendingUp size={18} />} color="blue" />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 py-3">
          <p className="text-sm font-medium text-gray-700">Recent Bookings</p>
          <div className="flex flex-wrap items-end gap-3">
            <FilterSelect
              label="Booking Status"
              className="w-44"
              value={bookingFilter}
              onChange={setBookingFilter}
              options={[
                { value: "", label: "All" },
                { value: "In Process", label: "In Process" },
                { value: "Confirmed", label: "Confirmed" },
                { value: "Completed", label: "Completed" },
                { value: "Rejected", label: "Rejected" },
              ]}
            />
            <FilterSelect
              label="Payment Status"
              className="w-44"
              value={paymentFilter}
              onChange={setPaymentFilter}
              options={[
                { value: "", label: "All" },
                { value: "Paid", label: "Paid" },
                { value: "Partial", label: "Partial" },
                { value: "Pending", label: "Pending" },
              ]}
            />
            <Link
              href="/admin/booking-management"
              className="pb-2.5 text-xs font-medium text-orange-600 hover:underline"
            >
              View All
            </Link>
          </div>
        </div>

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
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="px-4 py-10 text-center text-gray-400">
                    No records found
                  </td>
                </tr>
              ) : (
                recent.map((row, i) => {
                  const first = (row.items || [])[0];
                  const status = getBookingStatus(row);
                  const pay = getPaymentStatus(row);
                  const evType = getEventType(row);
                  const remaining = Number(row.remainingDueAmount || 0);
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-200 align-top ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-100"
                      }`}
                    >
                      <td className="px-4 py-4 text-gray-700">{i + 1}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-gray-700">{row.orderId || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-gray-700">{formatDate(row.createdAt)}</td>
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
      </div>
    </div>
  );
}
