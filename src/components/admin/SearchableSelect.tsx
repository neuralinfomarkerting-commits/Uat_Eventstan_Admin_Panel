"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

export interface SearchOption {
  id: string | number;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchOption[];
  value: string | number | "";
  onChange: (id: string | number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Shared searchable dropdown used across the admin panel.
 * Uses a portal so the dropdown is not clipped inside modals/tables.
 *
 * Dropdown always opens below the select field.
 */
export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select",
  searchPlaceholder = "Search...",
  disabled = false,
  className = "",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.id === value);

  const filtered = query
    ? options.filter((option) =>
        `${option.label} ${option.sublabel || ""}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : options;

  /**
   * Calculate dropdown position.
   * Dropdown always opens below the select button.
   */
  const updateCoords = () => {
    const rect = buttonRef.current?.getBoundingClientRect();

    if (!rect) return;

    setCoords({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  };

  const toggleOpen = () => {
    if (disabled) return;

    if (!open) {
      updateCoords();
    }

    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setOpen(false);
        setQuery("");
      }
    };

    const handleReposition = () => {
      updateCoords();
    };

    document.addEventListener("mousedown", handleClickOutside);

    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);

      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open]);

  return (
    <>
      {/* Select Button */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400 text-left transition-colors ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:border-orange-300"
        } ${className}`}
      >
        <span
          className={`truncate ${
            selectedOption ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {selectedOption
            ? selectedOption.sublabel
              ? `${selectedOption.label} (${selectedOption.sublabel})`
              : selectedOption.label
            : placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`text-gray-400 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
            }}
            className="z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
              <Search
                size={14}
                className="text-gray-400 shrink-0"
              />

              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full text-sm outline-none bg-transparent placeholder:text-gray-400"
              />
            </div>

            {/* Options */}
            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <p className="px-3.5 py-2.5 text-sm text-gray-400">
                  No results found
                </p>
              )}

              {filtered.map((option) => {
                const isSelected = option.id === value;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onChange(option.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-sm text-left hover:bg-orange-50 transition-colors ${
                      isSelected
                        ? "text-orange-600 font-medium bg-orange-50/60"
                        : "text-gray-800"
                    }`}
                  >
                    <span className="truncate">
                      {option.label}{" "}
                      {option.sublabel && (
                        <span className="text-gray-400 font-mono text-xs">
                          ({option.sublabel})
                        </span>
                      )}
                    </span>

                    {isSelected && (
                      <Check
                        size={14}
                        className="text-orange-500 shrink-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}