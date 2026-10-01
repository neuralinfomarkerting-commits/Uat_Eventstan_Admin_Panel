"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  Image as ImageIcon,
  ListOrdered,
  List,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  PartyPopper,
} from "lucide-react";
import Link from "next/link";
import { adminApi } from "@/api/adminApi";
import Button from "@/components/admin/Button";
import Input from "@/components/admin/Input";
import {
  bannerSubtitle,
  emailBodyCss,
  renderTemplateBody,
} from "@/lib/emailTemplateUtils";
import toast from "react-hot-toast";

const emptyForm = {
  name: "",
  subject: "",
  trigger: "",
  body: "",
  status: "Active",
};

const BASIC_PLACEHOLDERS = ["user_name", "start_date", "end_date"];
const BOOKING_PLACEHOLDERS = [
  "name",
  "order_id",
  "status",
  "booking_status",
  "booked_on",
  "event_date",
  "total_packages",
  "total_amount",
  "package_name",
  "start_time",
  "end_time",
  "guests",
  "package_amount",
  "payment_type",
  "payment_percentage",
  "amount_paid",
  "remaining_amount",
  "payment_status",
  "booking_url",
];

const BOOKING_SAMPLE_BODY = `<h2>Booking Confirmation</h2>

<p><strong>Dear {{name}},</strong></p>

<p>
Thank you for booking with EventStan. Your booking has been successfully confirmed.
Your booking details are mentioned below.
</p>

<h3>Booking Details</h3>

<table>
  <tr>
    <td><strong>Order ID</strong></td>
    <td>{{order_id}}</td>
    <td><strong>Booking Status</strong></td>
    <td>{{status}}</td>
  </tr>
  <tr>
    <td><strong>Booked On</strong></td>
    <td>{{booked_on}}</td>
    <td><strong>Event Date</strong></td>
    <td>{{event_date}}</td>
  </tr>
  <tr>
    <td><strong>Total Packages</strong></td>
    <td>{{total_packages}}</td>
    <td><strong>Total Amount</strong></td>
    <td>AED {{total_amount}}</td>
  </tr>
</table>

<h3>Package Details</h3>

<table>
  <thead>
    <tr>
      <th>Package</th>
      <th>Event Date</th>
      <th>Time</th>
      <th>Guests</th>
      <th>Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{{package_name}}</td>
      <td>{{event_date}}</td>
      <td>{{start_time}} – {{end_time}}</td>
      <td>{{guests}}</td>
      <td>AED {{package_amount}}</td>
    </tr>
  </tbody>
</table>

<h3>Payment Details</h3>

<table>
  <tr>
    <td><strong>Payment Type</strong></td>
    <td>{{payment_type}}</td>
    <td><strong>Payment Percentage</strong></td>
    <td>{{payment_percentage}}%</td>
  </tr>
  <tr>
    <td><strong>Total Amount</strong></td>
    <td>AED {{total_amount}}</td>
    <td><strong>Amount Paid</strong></td>
    <td>AED {{amount_paid}}</td>
  </tr>
  <tr>
    <td><strong>Remaining Amount</strong></td>
    <td>AED {{remaining_amount}}</td>
    <td><strong>Payment Status</strong></td>
    <td>{{payment_status}}</td>
  </tr>
</table>

<p>
<strong>View your complete booking details from your EventStan account.</strong>
</p>

<p>
<a href="{{booking_url}}">View Booking Details</a>
</p>

<p>
If you have any questions, contact us at
<strong>support@eventstan.com</strong>.
</p>

<p>
Thank you for choosing EventStan!
</p>

<p>
<strong>Regards,</strong><br>
<strong>The EventStan Team</strong>
</p>`;

const TikTokIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.4a7.4 7.4 0 0 0 4.3 1.38V7.72s-1.88.09-3.24-1.9z" />
  </svg>
);

const SocialIcons = ({ size = 32 }: { size?: number }) => (
  <div className="flex items-center gap-2">
    {[Instagram, Facebook, TikTokIcon, Youtube, Linkedin].map((Icon, i) => (
      <a
        key={i}
        href="#"
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-full bg-slate-700/60 text-white hover:bg-orange-500 transition"
      >
        <Icon size={size / 2} />
      </a>
    ))}
  </div>
);

export default function AddEmailTemplatePage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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

  const insertPlaceholder = (text: string) => {
    setForm({ ...form, body: form.body + text });
  };

  const insertTag = (openTag: string, closeTag: string) => {
    const textarea = document.querySelector("textarea");
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = form.body;
      const selectedText = text.substring(start, end);

      const wrappedText = `${openTag}${selectedText}${closeTag}`;
      const newText =
        text.substring(0, start) + wrappedText + text.substring(end);
      setForm({ ...form, body: newText });

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + openTag.length,
          start + openTag.length + selectedText.length,
        );
      }, 0);
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      const textarea = document.querySelector("textarea");
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = form.body;
        const selectedText = text.substring(start, end) || "link";

        const linkHtml = `<a href="${url}" target="_blank">${selectedText}</a>`;
        const newText =
          text.substring(0, start) + linkHtml + text.substring(end);
        setForm({ ...form, body: newText });
      }
    }
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      const imageHtml = `<img src="${url}" alt="Image" style="max-width: 100%; border-radius: 8px;" />`;
      setForm({ ...form, body: form.body + imageHtml });
    }
  };

  const insertList = (type: "ul" | "ol") => {
    const textarea = document.querySelector("textarea");
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = form.body;
      const selectedText = text.substring(start, end);
      const style = 'style="margin: 10px 0; padding-left: 20px;"';

      const items = selectedText.split("\n").filter((item) => item.trim());
      const lis =
        items.length === 0
          ? "  <li>Item 1</li>\n  <li>Item 2</li>"
          : items.map((item) => `  <li>${item}</li>`).join("\n");

      const listHtml = `<${type} ${style}>\n${lis}\n</${type}>`;
      const newText = text.substring(0, start) + listHtml + text.substring(end);
      setForm({ ...form, body: newText });
    }
  };

  const setSample = () => {
    setForm({
      ...form,
      name: "Welcome Email",
      subject: "Welcome to Eventstan!",
      trigger: "welcome_email",
      body: `<strong>Dear {user_name},</strong>

<strong>Welcome to Eventstan!</strong>

Thank you for registering with us. Your account has been successfully created.

Get started today and explore all the features we have to offer.

Need help? Contact us at <a href="mailto:hello@eventstan.com">hello@eventstan.com</a>

Regards,
The Eventstan Team`,
    });
  };

  const setBookingSample = () => {
    setForm({
      ...form,
      name: "Booking Confirmation",
      subject: "Booking Confirmation",
      trigger: "booking_confirmation",
      body: BOOKING_SAMPLE_BODY,
    });
  };

  const clearForm = () => {
    setForm({ ...emptyForm, body: "" });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/masters/email-templates">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Fill Email Details
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div className="space-y-5">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Template Name
            </label>
            <Input
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="e.g. Welcome Email"
              className="w-full"
            />
          </div>

          {/* Template Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Template Key
            </label>
            <Input
              value={form.trigger}
              onChange={(event) =>
                setForm({ ...form, trigger: event.target.value })
              }
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
              onChange={(event) =>
                setForm({ ...form, subject: event.target.value })
              }
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
                onClick={() => insertTag("<strong>", "</strong>")}
                className="p-1.5 hover:bg-gray-200 rounded transition"
                title="Bold"
              >
                <Bold size={16} className="text-gray-700" />
              </button>
              <button
                type="button"
                onClick={() => insertTag("<em>", "</em>")}
                className="p-1.5 hover:bg-gray-200 rounded transition"
                title="Italic"
              >
                <Italic size={16} className="text-gray-700" />
              </button>
              <button
                type="button"
                onClick={() => insertTag("<u>", "</u>")}
                className="p-1.5 hover:bg-gray-200 rounded transition"
                title="Underline"
              >
                <Underline size={16} className="text-gray-700" />
              </button>
              <div className="w-px h-5 bg-gray-300 mx-1 self-center" />
              <button
                type="button"
                onClick={() => insertList("ul")}
                className="p-1.5 hover:bg-gray-200 rounded transition"
                title="Bullet List"
              >
                <List size={16} className="text-gray-700" />
              </button>
              <button
                type="button"
                onClick={() => insertList("ol")}
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
              onChange={(event) =>
                setForm({ ...form, body: event.target.value })
              }
              rows={14}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              placeholder={`Hello {user_name},

Welcome to Eventstan! We're thrilled to have you on board.

Your account has been successfully created.

Best regards,

Eventstan Team`}
            />
          </div>

          {/* Placeholders */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Placeholders
            </label>
            <div className="flex gap-2 flex-wrap">
              {BASIC_PLACEHOLDERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => insertPlaceholder(`{${p}}`)}
                  className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-orange-500 hover:bg-orange-50 transition"
                >
                  {`{${p}}`}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-3 mb-1.5">
              Booking placeholders
            </p>
            <div className="flex gap-2 flex-wrap">
              {BOOKING_PLACEHOLDERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => insertPlaceholder(`{{${p}}}`)}
                  className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-700 hover:border-orange-500 hover:bg-orange-50 transition"
                >
                  {`{{${p}}}`}
                </button>
              ))}
            </div>
          </div>

          {/* Sample and Clear Buttons */}
          <div className="flex gap-3 pt-2 flex-wrap">
            <button
              type="button"
              onClick={setSample}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Sample
            </button>
            <button
              type="button"
              onClick={setBookingSample}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Booking Sample
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
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Live Email Preview
          </h2>

          {/* Scoped CSS for the email body (tables, headings, links) */}
          <style>{emailBodyCss(".email-body")}</style>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* ===== HEADER ===== */}
            <div className="relative overflow-hidden bg-[#111f33] px-6 py-5 flex items-center justify-between">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-orange-500" />

              <div className="text-2xl tracking-tight text-white">
                Event
                <span className="font-extrabold text-orange-500">Stan</span>
              </div>

              <div className="relative z-10 mr-6">
                <SocialIcons size={28} />
              </div>
            </div>

            {/* ===== SUBJECT BANNER ===== */}
            <div className="mx-4 mt-4 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100/60 px-5 py-4 flex items-center gap-4">
              <PartyPopper size={40} className="text-orange-500 shrink-0" />
              <div className="border-l-2 border-orange-500 pl-4">
                <h3 className="text-lg font-bold text-[#111f33] leading-tight">
                  {form.subject || "Welcome to Eventstan!"}
                </h3>
                <p className="text-sm text-slate-500">
                  {bannerSubtitle(form.trigger)}
                </p>
              </div>
            </div>

            {/* ===== BODY ===== */}
            <div className="px-6 py-5 overflow-x-auto">
              <div
                className="email-body"
                dangerouslySetInnerHTML={{
                  __html: renderTemplateBody(form.body),
                }}
              />
            </div>

            {/* ===== FOOTER ===== */}
            <div className="relative overflow-hidden bg-[#111f33] px-6 py-4 text-center">
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-slate-700/50" />
              <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-orange-500 rotate-45" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-4/5 h-px bg-slate-600 my-2" />

                <p className="text-xs text-slate-300">
                  © {new Date().getFullYear()} Eventstan. All rights reserved.
                </p>

                <div className="w-10 h-0.5 bg-orange-500 my-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}