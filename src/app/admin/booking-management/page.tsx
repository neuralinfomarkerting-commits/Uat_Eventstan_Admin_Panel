"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Loader2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/api/adminApi";
import Button from "@/components/admin/Button";
import Modal from "@/components/admin/Modal";
import Pagination from "@/components/admin/Pagination";
import SearchableSelect from "@/components/admin/SearchableSelect";
import { Column } from "@/lib/types";

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
    type: string;
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

type BookingRow = Booking & { sr: number };

const STATUS_OPTIONS = [
  { id: "", label: "All statuses" },
  { id: "In Process", label: "In Process" },
  { id: "Confirmed", label: "Confirmed" },
  { id: "Rejected", label: "Rejected" },
];

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

export default function BookingManagementPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const load = async () => {
    setLoading(true);
    try {
      const [bookingData, vendorData] = await Promise.all([
        adminApi.bookings.list(),
        adminApi.vendors.list(),
      ]);
      setBookings(bookingData);
      setVendors(vendorData);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load data",
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

  const reset = async () => {
    setStatusFilter("");
    setPage(1);
    await load();
  };

  const complete = async (booking: Booking) => {
    try {
      await adminApi.bookings.complete(booking.id);
      toast.success("Booking completed");
      setSelected(null);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to complete booking",
      );
    }
  };

  const paid = (booking: Booking) =>
    booking.payments
      .filter((item) => item.status === "SUCCEEDED")
      .reduce((sum, item) => sum + item.amount, 0);

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

  const columns: Column[] = [
    {
      key: "sr",
      label: "S.No.",
      render: (value: number) => value,
    },
    {
      key: "orderId",
      label: "Order ID",
      render: (value: string) => value || "-",
    },
    {
      key: "customer",
      label: "Customer",
      render: (value: Booking["customer"]) => (
        <div>
          <p className="font-medium">{value.name}</p>
          <p className="text-xs text-gray-400">{value.email}</p>
        </div>
      ),
    },
    {
      key: "items",
      label: "Package",
      render: (value: Booking["items"]) => {
        if (!value || value.length === 0) return "-";
        return (
          <div className="flex min-w-[260px] max-w-[340px] flex-col items-start gap-2">
            {value.map((item, index) => {
              const accepted = Boolean(item.vendorId);
              return (
                <div key={item.id} className="w-full">
                  <span className="inline-flex max-w-full items-start gap-1 whitespace-normal break-words rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs leading-snug text-gray-700">
                    <span className="font-semibold text-gray-500 shrink-0">
                      P{index + 1}
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
      key: "eventDates",
      label: "Event Date",
      render: (_: unknown, row: Booking) => {
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
      render: (value: number, row: Booking) =>
        `${row.currency} ${value.toLocaleString()}`,
    },
    {
      key: "payments",
      label: "Payment",
      render: (_: unknown, row: Booking) => (
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
      render: (value: number, row: Booking) => {
        if (!value || value === 0) {
          return <span className="text-gray-400">-</span>;
        }
        return `${row.currency} ${value.toLocaleString()}`;
      },
    },
    {
      key: "status",
      label: "Booking Status",
      render: (_: unknown, row: Booking) => bookingBadge(row),
    },
    {
      key: "createdAt",
      label: "Booked Date",
      render: (value: string) => formatDate(value),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: Booking) => (
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

  const filtered = useMemo(
    () =>
      statusFilter
        ? bookings.filter((b) => getBookingStatus(b) === statusFilter)
        : bookings,
    [bookings, statusFilter],
  );

  const paged: BookingRow[] = useMemo(
    () =>
      filtered
        .slice((page - 1) * perPage, page * perPage)
        .map((b, i) => ({ ...b, sr: (page - 1) * perPage + i + 1 })),
    [filtered, page],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Booking Management</h1>
          <p className="text-sm text-gray-500">
            {filtered.length} live bookings
          </p>
        </div>
        <div className="flex gap-2">
          <div className="w-56">
            <SearchableSelect
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(id) => {
                setStatusFilter(String(id));
                setPage(1);
              }}
              placeholder="All statuses"
              searchPlaceholder="Search..."
            />
          </div>
          <Button variant="secondary" onClick={() => void reset()}>
            <RotateCcw size={15} />
            Reset
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
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
                {paged.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      No records found
                    </td>
                  </tr>
                ) : (
                  paged.map((row, rowIndex) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row)}
                      className={`cursor-pointer border-b transition-colors hover:bg-gray-100 ${
                        rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 align-top">
                          {col.render
                            ? col.render(
                                row[col.key as keyof BookingRow],
                                row,
                              )
                            : (row[
                                col.key as keyof BookingRow
                              ] as React.ReactNode)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={page}
          totalPages={Math.max(1, Math.ceil(filtered.length / perPage))}
          totalItems={filtered.length}
          itemsPerPage={perPage}
          onPageChange={setPage}
        />
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

            {["CONFIRMED", "IN_PROGRESS"].includes(selected.status) && (
              <div className="flex justify-end">
                <Button onClick={() => void complete(selected)}>
                  Mark Completed
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}