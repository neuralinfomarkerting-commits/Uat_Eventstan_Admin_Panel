"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Bold, Italic, Underline, Link as LinkIcon, Image as ImageIcon, ListOrdered, List } from "lucide-react";
import Link from "next/link";
import { adminApi } from "@/api/adminApi";
import Button from "@/components/admin/Button";
import Input from "@/components/admin/Input";
import toast from "react-hot-toast";

const emptyForm = {
  name: "",
  subject: "",
  trigger: "",
  body: "",
  status: "Active",
};

export default function AddEmailTemplatePage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState({
    user_name: "John Doe",
    start_date: "01-Nov-2025",
    end_date: "05-Nov-2025",
  });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.trigger || !form.subject || !form.body) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      await adminApi.emailTemplates.create({ ...form });
      toast.success("Email template created");
      router.push("/admin/masters/email-templates");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create template");
    } finally {
      setSaving(false);
    }
  };

  const getPreviewHtml = () => {
    let html = form.body;
    // Replace placeholders
    html = html.replace(/{user_name}/g, previewData.user_name);
    html = html.replace(/{start_date}/g, previewData.start_date);
    html = html.replace(/{end_date}/g, previewData.end_date);
    html = html.replace(/\(user_name\)/g, previewData.user_name);
    html = html.replace(/\(start_date\)/g, previewData.start_date);
    html = html.replace(/\(end_date\)/g, previewData.end_date);
    
    // Convert line breaks to <br/> for HTML display
    html = html.replace(/\n/g, '<br/>');
    
    return html;
  };

  const insertPlaceholder = (placeholder: string) => {
    setForm({ ...form, body: form.body + `{${placeholder}}` });
  };

  const insertTag = (openTag: string, closeTag: string) => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = form.body;
      const selectedText = text.substring(start, end);
      
      const wrappedText = `${openTag}${selectedText}${closeTag}`;
      const newText = text.substring(0, start) + wrappedText + text.substring(end);
      setForm({ ...form, body: newText });
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + openTag.length, start + openTag.length + selectedText.length);
      }, 0);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = form.body;
        const selectedText = text.substring(start, end) || 'link';
        
        const linkHtml = `<a href="${url}" target="_blank">${selectedText}</a>`;
        const newText = text.substring(0, start) + linkHtml + text.substring(end);
        setForm({ ...form, body: newText });
      }
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      const imageHtml = `<img src="${url}" alt="Image" style="max-width: 100%; border-radius: 8px;" />`;
      setForm({ ...form, body: form.body + imageHtml });
    }
  };

  const insertList = (type: 'ul' | 'ol') => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = form.body;
      const selectedText = text.substring(start, end);
      
      const items = selectedText.split('\n').filter(item => item.trim());
      if (items.length === 0) {
        const listHtml = type === 'ul' ? '<ul style="margin: 10px 0; padding-left: 20px;">\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>' : '<ol style="margin: 10px 0; padding-left: 20px;">\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>';
        const newText = text.substring(0, start) + listHtml + text.substring(end);
        setForm({ ...form, body: newText });
      } else {
        const listHtml = type === 'ul' 
          ? '<ul style="margin: 10px 0; padding-left: 20px;">\n' + items.map(item => `  <li>${item}</li>`).join('\n') + '\n</ul>'
          : '<ol style="margin: 10px 0; padding-left: 20px;">\n' + items.map(item => `  <li>${item}</li>`).join('\n') + '\n</ol>';
        const newText = text.substring(0, start) + listHtml + text.substring(end);
        setForm({ ...form, body: newText });
      }
    }
  };

  const setSample = () => {
    setForm({
      ...form,
      subject: "Welcome to Eventstan! 🎉",
      trigger: "welcome_email",
      body: `Dear {user_name},

Welcome to Eventstan! 🎉

Thank you for registering with us. Your account has been successfully created.

Get started today and explore all the features we have to offer.

Need help? Contact us at support@eventstan.com

Regards,
The Eventstan Team`
    });
  };

  const clearForm = () => {
    setForm({
      ...emptyForm,
      body: ""
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with Eventstan on right */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/masters/email-templates">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Fill Email Details</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div className="space-y-5">
          {/* Template Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Template Key
            </label>
            <Input 
              value={form.trigger} 
              onChange={event => setForm({ ...form, trigger: event.target.value })} 
              placeholder="e.g. welcome_email"
              className="w-full"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Subject
            </label>
            <Input 
              value={form.subject} 
              onChange={event => setForm({ ...form, subject: event.target.value })} 
              placeholder="Welcome to Eventstan!"
              className="w-full"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Body
            </label>
            
            {/* Toolbar */}
            <div className="flex gap-1 mb-2 p-1.5 bg-gray-50 rounded-lg border border-gray-200 w-fit">
              <button
                type="button"
                onClick={() => insertTag('<strong>', '</strong>')}
                className="p-1.5 hover:bg-gray-200 rounded transition"
                title="Bold"
              >
                <Bold size={16} className="text-gray-700" />
              </button>
              <button
                type="button"
                onClick={() => insertTag('<em>', '</em>')}
                className="p-1.5 hover:bg-gray-200 rounded transition"
                title="Italic"
              >
                <Italic size={16} className="text-gray-700" />
              </button>
              <button
                type="button"
                onClick={() => insertTag('<u>', '</u>')}
                className="p-1.5 hover:bg-gray-200 rounded transition"
                title="Underline"
              >
                <Underline size={16} className="text-gray-700" />
              </button>
              <div className="w-px h-5 bg-gray-300 mx-1 self-center" />
              <button
                type="button"
                onClick={() => insertList('ul')}
                className="p-1.5 hover:bg-gray-200 rounded transition"
                title="Bullet List"
              >
                <List size={16} className="text-gray-700" />
              </button>
              <button
                type="button"
                onClick={() => insertList('ol')}
                className="p-1.5 hover:bg-gray-200 rounded transition"
                title="Numbered List"
              >
                <ListOrdered size={16} className="text-gray-700" />
              </button>
              <div className="w-px h-5 bg-gray-300 mx-1 self-center" />
              <button
                type="button"
                onClick={insertLink}
                className="p-1.5 hover:bg-gray-200 rounded transition"
                title="Insert Link"
              >
                <LinkIcon size={16} className="text-gray-700" />
              </button>
              <button
                type="button"
                onClick={insertImage}
                className="p-1.5 hover:bg-gray-200 rounded transition"
                title="Insert Image"
              >
                <ImageIcon size={16} className="text-gray-700" />
              </button>
            </div>

            {/* Body Textarea */}
            <textarea 
              value={form.body} 
              onChange={event => setForm({ ...form, body: event.target.value })} 
              rows={10} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              placeholder="Hello {user_name},

Welcome to Eventstan! We're thrilled to have you on board.

Your account has been successfully created.

Best regards,

Eventstan Team"
            />
          </div>

          {/* Placeholders */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Placeholders
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => insertPlaceholder('user_name')}
                className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-orange-500 hover:bg-orange-50 transition"
              >
                {'{user_name}'}
              </button>
              <button
                type="button"
                onClick={() => insertPlaceholder('start_date')}
                className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-orange-500 hover:bg-orange-50 transition"
              >
                {'{start_date}'}
              </button>
              <button
                type="button"
                onClick={() => insertPlaceholder('end_date')}
                className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-orange-500 hover:bg-orange-50 transition"
              >
                {'{end_date}'}
              </button>
            </div>
          </div>

          {/* Sample and Clear Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={setSample}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Sample
            </button>
            <button
              type="button"
              onClick={clearForm}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Clear
            </button>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t">
            <Button 
              type="submit" 
              onClick={save}
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 px-6"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </div>

        {/* Right Column - Live Preview */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Live Email Preview</h2>
          
          {/* Email Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Card Header with Subject on Left and Eventstan on Right */}
            <div className="px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-between">
              <h3 className="font-semibold text-white">
                {form.subject || "Welcome to Eventstan! 🎉"}
              </h3>
              <span className="text-white font-medium text-sm opacity-90">Eventstan</span>
            </div>
            
            {/* Card Body - HTML rendering enabled */}
            <div className="p-5">
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
              />
            </div>

            {/* Card Footer */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
              <div className="text-center text-xs text-gray-500">
                <p>© {new Date().getFullYear()} Eventstan. All rights reserved.</p>
                <p className="mt-1">
                  <a href="#" className="text-orange-500 hover:underline">Unsubscribe</a> | 
                  <a href="#" className="text-orange-500 hover:underline ml-2">Privacy Policy</a>
                </p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="mt-4 text-center text-xs text-gray-400">
            Headquarter Address: 144-A IInd Floor, Vikas Nagar, Kanpur, Uttar Pradesh – 208024
          </div>
        </div>
      </div>
    </div>
  );
}