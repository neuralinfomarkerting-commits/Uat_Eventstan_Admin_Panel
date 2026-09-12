"use client";

import { useEffect, useState } from "react";
import { Edit, Eye, Mail, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { adminApi } from "@/api/adminApi";
import Button from "@/components/admin/Button";
import ConfirmModal from "@/components/admin/ConfirmModal";
import Pagination from "@/components/admin/Pagination";
import Table from "@/components/admin/Table";
import { Column } from "@/lib/types";
import toast from "react-hot-toast";

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  trigger: string;
  body: string;
  status: string;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [pendingStatus, setPendingStatus] = useState("");

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      setTemplates(await adminApi.emailTemplates.list());
    } catch (error) {
      console.error(error);
      toast.error("Failed to load email templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openStatus = (template: EmailTemplate) => {
    setSelected(template);
    setPendingStatus(template.status === "Active" ? "Inactive" : "Active");
    setStatusOpen(true);
  };

  const confirmStatus = async () => {
    if (!selected) return;
    await adminApi.emailTemplates.update(selected.id, { status: pendingStatus });
    toast.success("Template status updated");
    setStatusOpen(false);
    setSelected(null);
    await load();
  };

  const confirmDelete = async () => {
    if (!selected) return;
    await adminApi.emailTemplates.delete(selected.id);
    toast.success("Template deleted");
    setDeleteOpen(false);
    setSelected(null);
    await load();
  };

  const columns: Column[] = [
    { key: "id", label: "ID" },
    { key: "name", label: "Template", render: (value: string) => <div className="flex items-center gap-2"><Mail size={14} className="text-orange-400" /><span className="font-medium">{value}</span></div> },
    { key: "subject", label: "Subject", render: (value: string) => <span className="text-gray-600 text-xs">{value.length > 45 ? `${value.slice(0, 45)}...` : value}</span> },
    { key: "trigger", label: "Trigger", render: (value: string) => <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{value}</span> },
    {
      key: "status",
      label: "Status",
      render: (value: string, row: EmailTemplate) => (
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${value === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{value}</span>
          <button onClick={() => openStatus(row)} className="text-gray-500 hover:text-orange-600 transition-colors" title={value === "Active" ? "Deactivate" : "Activate"}>
            {value === "Active" ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, row: EmailTemplate) => (
        <div className="flex items-center gap-1">
          <Link href={`/admin/masters/email-templates/preview/${row.id}`}><button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50" title="Preview"><Eye size={14} /></button></Link>
          <Link href={`/admin/masters/email-templates/edit/${row.id}`}><button className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50" title="Edit"><Edit size={14} /></button></Link>
          <button onClick={() => { setSelected(row); setDeleteOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50" title="Delete"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil(templates.length / ITEMS_PER_PAGE);
  const paginatedData = templates.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-gray-500">Loading email templates...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">{templates.length} templates - {templates.filter(template => template.status === "Active").length} active</p>
        </div>
        <Link href="/admin/masters/email-templates/add"><Button><Plus size={15} />New Template</Button></Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <Table columns={columns} data={paginatedData} />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={templates.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      <ConfirmModal isOpen={statusOpen} onClose={() => setStatusOpen(false)} onConfirm={confirmStatus} title={`${pendingStatus} Template`} message={`Are you sure you want to set "${selected?.name}" as ${pendingStatus}?`} />
      <ConfirmModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={confirmDelete} title="Delete Template" message={`Delete "${selected?.name}"?`} />
    </div>
  );
}