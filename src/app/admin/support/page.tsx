"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Filter, LifeBuoy, Loader2, Search, ShieldCheck, MessageSquare } from "lucide-react";
import { adminApi } from "@/api/adminApi";
import SearchableSelect from "@/components/admin/SearchableSelect";

type SupportStatus = "OPEN" | "IN_PROGRESS" | "WAITING_FOR_ADMIN" | "WAITING_FOR_VENDOR" | "RESOLVED" | "CLOSED";

interface SupportMessage {
  id: string;
  body: string;
  attachments: string[];
  createdAt: string;
  author: { id: string; name: string; email: string; role: string };
}

interface SupportTicket {
  id: string;
  subject: string;
  description?: string | null;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  vendor: { id: string; companyName: string; contactPerson: string; email: string; phone: string };
  createdBy: { id: string; name: string; email: string; role: string };
  messages: SupportMessage[];
}

const statusClass: Record<SupportStatus, string> = {
  OPEN: "bg-blue-50 text-blue-700",
  IN_PROGRESS: "bg-orange-50 text-orange-700",
  WAITING_FOR_ADMIN: "bg-amber-50 text-amber-700",
  WAITING_FOR_VENDOR: "bg-indigo-50 text-indigo-700",
  RESOLVED: "bg-green-50 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

const statusOptions: Array<SupportStatus | "ALL"> = ["ALL", "OPEN", "IN_PROGRESS", "WAITING_FOR_ADMIN", "WAITING_FOR_VENDOR", "RESOLVED", "CLOSED"];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SupportStatus | "ALL">("ALL");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminApi.support.list<SupportTicket[]>();
      setTickets(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTickets();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesQuery =
        !q ||
        ticket.subject.toLowerCase().includes(q) ||
        ticket.vendor.companyName.toLowerCase().includes(q) ||
        ticket.vendor.contactPerson.toLowerCase().includes(q) ||
        ticket.createdBy.email.toLowerCase().includes(q);
      const matchesStatus = status === "ALL" || ticket.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [tickets, query, status]);

  const stats = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<SupportStatus, number>,
    );
  }, [tickets]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 size={30} className="animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 text-orange-700 px-3 py-1 text-xs font-semibold">
            <LifeBuoy size={13} />
            Help & Support
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">Vendor help desk</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor vendor support tickets, initiate conversations, and resolve issues from one place.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
          <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-lg font-bold text-gray-900">{tickets.length}</p>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-400">Open</p>
            <p className="text-lg font-bold text-gray-900">{stats.OPEN ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-400">Waiting</p>
            <p className="text-lg font-bold text-gray-900">{(stats.WAITING_FOR_ADMIN ?? 0) + (stats.WAITING_FOR_VENDOR ?? 0)}</p>
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm p-4 lg:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by subject or vendor"
              className="w-full rounded-2xl border border-gray-200 pl-10 pr-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="relative min-w-56">
            <SearchableSelect
              options={statusOptions.map((item) => ({ id: item, label: item === "ALL" ? "All statuses" : item.replaceAll("_", " ") }))}
              value={status}
              onChange={(id) => setStatus(id as SupportStatus | "ALL")}
              searchPlaceholder="Search..."
            />
          </div>

          <button onClick={() => void fetchTickets()} className="rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition">
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            No support tickets match the current filters.
          </div>
        ) : filtered.map((ticket) => {
          const lastMessage = ticket.messages[ticket.messages.length - 1];
          return (
            <Link
              key={ticket.id}
              href={`/admin/support/${ticket.id}`}
              className="rounded-3xl bg-white border border-gray-100 shadow-sm p-5 hover:border-orange-200 hover:bg-orange-50/30 transition block"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass[ticket.status]}`}>
                      {ticket.status.replaceAll("_", " ")}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(ticket.lastMessageAt).toLocaleString()}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{ticket.subject}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {ticket.vendor.companyName} · {ticket.vendor.contactPerson} · {ticket.vendor.email}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 max-h-12 overflow-hidden">
                    {lastMessage?.body || ticket.description || "No description"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 text-right">
                    <p className="text-xs text-gray-400">Created by</p>
                    <p className="text-sm font-semibold text-gray-900">{ticket.createdBy.name}</p>
                    <p className="text-xs text-gray-500">{ticket.createdBy.email}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3 text-gray-400">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <MessageSquare size={12} />
                  {ticket.messages.length} message{ticket.messages.length === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck size={12} />
                  Open conversation
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
