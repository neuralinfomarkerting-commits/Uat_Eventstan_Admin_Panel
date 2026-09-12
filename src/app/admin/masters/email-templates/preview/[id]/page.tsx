"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { adminApi } from "@/api/adminApi";
import Button from "@/components/admin/Button";
import toast from "react-hot-toast";

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  trigger: string;
  body: string;
  status: string;
}

export default function PreviewEmailTemplatePage() {
  const params = useParams();
  const id = Number(params?.id);
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState({
    user_name: "John Doe",
    start_date: "01-Nov-2025",
    end_date: "05-Nov-2025",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminApi.emailTemplates.get(id);
        setTemplate(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load template");
      } finally {
        setLoading(false);
      }
    };
    if (id) void load();
  }, [id]);

  const getPreviewHtml = () => {
    if (!template) return "";
    
    let html = template.body;
    // Replace placeholders
    html = html.replace(/{user_name}/g, previewData.user_name);
    html = html.replace(/{start_date}/g, previewData.start_date);
    html = html.replace(/{end_date}/g, previewData.end_date);
    html = html.replace(/\(user_name\)/g, previewData.user_name);
    html = html.replace(/\(start_date\)/g, previewData.start_date);
    html = html.replace(/\(end_date\)/g, previewData.end_date);
    
    // Convert line breaks to <br/> for HTML display
    html = html.replace(/\n/g, '<br/>');
    
    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { margin: 0; padding: 24px; background: #f3f4f6; font-family: Arial, sans-serif; color: #374151; }
            .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
            .header { background: linear-gradient(to right, #f97316, #ea580c); color: #ffffff; padding: 28px 24px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 32px; line-height: 1.6; }
            .footer { padding: 20px 24px; background: #f9fafb; color: #6b7280; font-size: 12px; text-align: center; border-top: 1px solid #e5e7eb; }
            .address { margin-top: 8px; font-size: 10px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Eventstan</h1>
            </div>
            <div class="content">
              ${html}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Eventstan. All rights reserved.</p>
              <p class="address">Headquarter Address: 144-A IInd Floor, Vikas Nagar, Kanpur, Uttar Pradesh – 208024</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-gray-500">Loading preview...</div>;
  if (!template) return <div className="text-sm text-gray-500">Template not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/masters/email-templates">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Preview: {template.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{template.subject}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/admin/masters/email-templates/edit/${id}`}>
            <Button className="bg-orange-500 hover:bg-orange-600">Edit Template</Button>
          </Link>
          <Link href="/admin/masters/email-templates">
            <Button variant="secondary">Back</Button>
          </Link>
        </div>
      </div>

      {/* Template Info */}
      <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm">
        <div>
          <span className="font-semibold text-gray-700">Template Key:</span> {template.trigger}
        </div>
        <div>
          <span className="font-semibold text-gray-700">Status:</span> 
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            template.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {template.status}
          </span>
        </div>
      </div>

      {/* Preview Data Controls */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Preview Data (for placeholders)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">User Name</label>
            <input
              type="text"
              value={previewData.user_name}
              onChange={(e) => setPreviewData({ ...previewData, user_name: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
            <input
              type="text"
              value={previewData.start_date}
              onChange={(e) => setPreviewData({ ...previewData, start_date: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End Date</label>
            <input
              type="text"
              value={previewData.end_date}
              onChange={(e) => setPreviewData({ ...previewData, end_date: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Email Preview Frame */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50" style={{ height: "70vh" }}>
        <iframe 
          srcDoc={getPreviewHtml()} 
          className="w-full h-full border-0" 
          title="Email Preview"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    </div>
  );
}