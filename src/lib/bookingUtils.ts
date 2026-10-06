export const pad = (n: number) => String(n).padStart(2, "0");

export const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
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

export const getEventTime = (item: Record<string, any>): string => {
  const start = item.startTime ?? item.eventStartTime ?? item.slot?.startTime;
  const end = item.endTime ?? item.eventEndTime ?? item.slot?.endTime;
  if (start && end) return `${formatTimeValue(start)} – ${formatTimeValue(end)}`;
  if (start) return formatTimeValue(start);
  const label = item.timeSlot ?? item.slotName ?? item.slot?.name;
  return label ? String(label) : "";
};

export const getEventType = (b: Record<string, any>): string => {
  const first = b.items?.[0] || {};
  const raw =
    b.eventType ?? b.eventTypeName ?? b.event?.name ??
    first.eventType ?? first.eventTypeName ?? first.event?.name;
  if (raw && typeof raw === "object") return raw.name || raw.title || "-";
  return raw ? String(raw) : "-";
};

export const getGuests = (b: Record<string, any>): string => {
  const first = b.items?.[0] || {};
  const v =
    b.guestCount ?? b.guests ?? b.numberOfGuests ??
    first.guestCount ?? first.guests ?? first.numberOfGuests;
  return v === undefined || v === null || v === "" ? "-" : String(v);
};

export const isEventPast = (b: Record<string, any>): boolean => {
  const items: any[] = b.items || [];
  const times = items
    .map((i) => new Date(i.eventDate).getTime())
    .filter((t) => !isNaN(t));
  if (times.length === 0) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastEvent = new Date(Math.max(...times));
  lastEvent.setHours(0, 0, 0, 0);
  return lastEvent.getTime() < today.getTime();
};

export type BookingStatus = "Rejected" | "Confirmed" | "In Process" | "Completed";

export const getBookingStatus = (b: Record<string, any>): BookingStatus => {
  if (b.cancelledAt || b.cancelReason) return "Rejected";
  if (String(b.status).toUpperCase() === "COMPLETED") return "Completed";
  if (b.vendorAcceptedAt) return isEventPast(b) ? "Completed" : "Confirmed";
  return "In Process";
};

export const paidAmount = (b: Record<string, any>) =>
  (b.payments || [])
    .filter((p: any) => p.status === "SUCCEEDED")
    .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

export const getPaymentStatus = (
  b: Record<string, any>,
): "Paid" | "Partial" | "Pending" => {
  const paid = paidAmount(b);
  if (paid <= 0) return "Pending";
  return paid >= Number(b.totalAmount || 0) ? "Paid" : "Partial";
};

export const money = (currency: string | undefined, v: number) =>
  `${currency || "AED"} ${Number(v || 0).toLocaleString()}`;

const EVENT_TONES = [
  "bg-red-50 text-red-500",
  "bg-blue-50 text-blue-500",
  "bg-pink-50 text-pink-500",
  "bg-purple-50 text-purple-500",
  "bg-teal-50 text-teal-600",
  "bg-orange-50 text-orange-500",
];
export const eventTone = (name: string) => {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 997;
  return EVENT_TONES[h % EVENT_TONES.length];
};

export const STATUS_CLS: Record<string, string> = {
  Confirmed: "bg-green-100 text-green-600",
  "In Process": "bg-blue-100 text-blue-600",
  Rejected: "bg-red-100 text-red-600",
  Completed: "bg-purple-100 text-purple-600",
};
export const PAY_CLS: Record<string, string> = {
  Paid: "bg-green-100 text-green-600",
  Partial: "bg-orange-100 text-orange-600",
  Pending: "bg-yellow-100 text-yellow-700",
};
