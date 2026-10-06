"use client";

import type { ReactNode } from "react";

export const Chip = ({ text, cls }: { text: string; cls: string }) => (
  <span
    className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}
  >
    {text}
  </span>
);

export const BookingStatCard = ({
  icon,
  tone,
  title,
  value,
  sub,
  onClick,
  active,
}: {
  icon: ReactNode;
  tone: string;
  title: string;
  value: ReactNode;
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
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-gray-700">{title}</p>
      <p className="text-2xl font-bold leading-tight text-gray-900">{value}</p>
      <p className="truncate text-xs text-gray-400">{sub}</p>
    </div>
  </button>
);

export const FilterSelect = ({
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
