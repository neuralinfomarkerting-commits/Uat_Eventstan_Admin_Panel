'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Column } from '@/lib/types';

interface TableProps {
  columns: Column[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
}

/**
 * Self-contained data table.
 *
 * Any page can hand this component as many columns as it needs — the
 * horizontal scroll (when the columns don't fit the viewport) is always
 * contained *inside* this component's own scroll region. Pages should NOT
 * wrap <Table /> in their own `overflow-x-auto` div anymore; doing so used
 * to create a second, stray scrollbar underneath the table. If a page still
 * has that wrapper, it's safe to remove — this component handles it alone.
 */
export default function Table({ columns, data, onEdit, onDelete }: TableProps) {
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap bg-white"
              >
                {col.label}
              </th>
            ))}
            {hasActions && (
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap bg-white">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-gray-700">
                  {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                </td>
              ))}
              {hasActions && (
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-8 text-center text-gray-400 text-sm">
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
