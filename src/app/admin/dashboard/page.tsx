"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarCheck,
  DollarSign,
  RefreshCw,
  Star,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/api/adminApi";
import StatsCard from "@/components/admin/StatsCard";

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
interface RecentBooking {
  id: string;
  customer: string;
  vendorId: string | null;
  service: string | null;
  amount: number;
  currency: string;
  status: string;
  date: string;
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

export default function DashboardPage() {
  const [stats, setStats] = useState(emptyStats);
  const [recent, setRecent] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async (notify = false) => {
    setLoading(true);
    try {
      const response = await adminApi.dashboard();
      setStats(response.data ?? emptyStats);
      setRecent(response.recentBookings ?? []);
      if (notify) toast.success("Dashboard updated");
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
  if (loading && !stats.totalUsers)
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500">
            EventStan platform overview
          </p>
        </div>
        <button
          onClick={() => void load(true)}
          className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
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
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {[
                  "Booking",
                  "Customer",
                  "Service",
                  "Amount",
                  "Status",
                  "Date",
                ].map((item) => (
                  <th
                    key={item}
                    className="px-6 py-3 text-left text-xs uppercase text-gray-500"
                  >
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {recent.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-6 py-3 font-medium text-orange-600">
                    {index + 1}
                  </td>
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {item.customer}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {item.service ?? item.vendorId ?? "-"}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {item.currency} {item.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {item.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {!recent.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    No bookings yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
