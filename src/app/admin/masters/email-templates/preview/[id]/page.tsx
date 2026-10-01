"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { adminApi } from "@/api/adminApi";
import {
  bannerSubtitle,
  emailBodyCss,
  renderTemplateBody,
} from "@/lib/emailTemplateUtils";
import toast from "react-hot-toast";

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  trigger: string;
  body: string;
  status: string;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Inline SVG icons (iframe cannot use Tailwind / lucide components)
const svg = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

const socialIcons = [
  svg(
    '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
  ),
  svg(
    '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  ),
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#ffffff"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.4a7.4 7.4 0 0 0 4.3 1.38V7.72s-1.88.09-3.24-1.9z"/></svg>`,
  svg(
    '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
  ),
  svg(
    '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
  ),
];

const socialHtml = (size: number) =>
  `<div class="social">${socialIcons
    .map(
      (icon) =>
        `<a href="#" style="width:${size}px;height:${size}px">${icon}</a>`,
    )
    .join("")}</div>`;

const partyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/></svg>`;

export default function PreviewEmailTemplatePage() {
  const params = useParams();
  const id = Number(params?.id);
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);

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

    const html = renderTemplateBody(template.body);

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 24px; background: #f3f4f6; font-family: Arial, sans-serif; color: #334155; }
            .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; }
            .social { display: flex; align-items: center; gap: 8px; }
            .social a { display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(51,65,85,0.7); text-decoration: none; }

            .header { position: relative; overflow: hidden; background: #111f33; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; }
            .header .corner { position: absolute; top: -40px; right: -40px; width: 96px; height: 96px; border-radius: 50%; background: #f97316; }
            .logo { font-size: 26px; color: #ffffff; letter-spacing: -0.5px; position: relative; z-index: 1; }
            .logo span { font-weight: 800; color: #f97316; }
            .header .social { position: relative; z-index: 1; margin-right: 24px; }

            .banner { margin: 16px 16px 0; border-radius: 12px; background: linear-gradient(to right, #fff7ed, #ffedd5); padding: 16px 20px; display: flex; align-items: center; gap: 16px; }
            .banner .text { border-left: 2px solid #f97316; padding-left: 16px; }
            .banner h3 { margin: 0; font-size: 18px; color: #111f33; line-height: 1.25; }
            .banner p { margin: 4px 0 0; font-size: 13px; color: #64748b; }

            .content { padding: 20px 24px; overflow-x: auto; }

            .footer { position: relative; overflow: hidden; background: #111f33; padding: 16px 24px; text-align: center; }
            .footer .shape-left { position: absolute; bottom: -40px; left: -40px; width: 128px; height: 128px; border-radius: 50%; background: rgba(51,65,85,0.5); }
            .footer .shape-right { position: absolute; bottom: -32px; right: -32px; width: 96px; height: 96px; background: #f97316; transform: rotate(45deg); }
            .footer .inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; }
            .footer .line { width: 80%; height: 1px; background: #475569; margin: 8px 0; }
            .footer p { margin: 0; font-size: 12px; color: #cbd5e1; }
            .footer .accent { width: 40px; height: 2px; background: #f97316; margin: 12px 0; }

            ${emailBodyCss(".content")}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="corner"></div>
              <div class="logo">Event<span>Stan</span></div>
              ${socialHtml(28)}
            </div>

            <div class="banner">
              ${partyIcon}
              <div class="text">
                <h3>${escapeHtml(template.subject || "")}</h3>
                ${bannerSubtitle(template.trigger) ? `<p>${escapeHtml(bannerSubtitle(template.trigger))}</p>` : ""}
              </div>
            </div>

            <div class="content">
              ${html}
            </div>

            <div class="footer">
              <div class="shape-left"></div>
              <div class="shape-right"></div>
              <div class="inner">
                <div class="line"></div>
                <p>© ${new Date().getFullYear()} Eventstan. All rights reserved.</p>
                <div class="accent"></div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  if (loading)
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        Loading preview...
      </div>
    );
  if (!template)
    return <div className="text-sm text-gray-500">Template not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Only Back button */}
      <Link href="/admin/masters/email-templates">
        <button className="p-2 rounded-lg hover:bg-gray-100 transition">
          <ArrowLeft size={20} />
        </button>
      </Link>

      {/* Email only */}
      <div
        className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50"
        style={{ height: "calc(100vh - 120px)" }}
      >
        <iframe
          srcDoc={getPreviewHtml()}
          className="w-full h-full border-0"
          title="Email Preview"
          sandbox="allow-same-origin allow-popups"
        />
      </div>
    </div>
  );
}