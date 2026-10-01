// Shared helpers for email template preview (add / edit / preview pages)

export const SAMPLE_DATA: Record<string, string> = {
  // general
  user_name: "John Doe",
  start_date: "01-Nov-2025",
  end_date: "05-Nov-2025",
  // booking
  name: "John Doe",
  order_id: "ORD-10245",
  status: "Confirmed",
  booking_status: "Confirmed",
  booked_on: "20-Oct-2025",
  event_date: "01-Nov-2025",
  total_packages: "1",
  total_amount: "2,500",
  package_name: "Premium Birthday Package",
  start_time: "06:00 PM",
  end_time: "10:00 PM",
  guests: "25",
  package_amount: "2,500",
  payment_type: "Partial",
  payment_percentage: "50",
  amount_paid: "1,250",
  remaining_amount: "1,250",
  payment_status: "Partially Paid",
  booking_url: "#",
};


// Banner subtitle per trigger. Keep in sync with BANNER_SUBTITLE in api/src/modules/mail/mail.service.ts,
// so the admin preview and the email that customers receive look identical.
const BANNER_SUBTITLES: Record<string, string> = {
  welcome_email: "We're excited to have you on board",
  reset_password: "Let's get you back into your account",
  change_password: "Your account security matters to us",
  booking_request_received: "We've received your booking request",
  booking_accepted: "The vendor accepted your request",
  booking_confirmed: "Your event is all set",
  booking_declined: "We're sorry about this",
  payment_successful: "Thank you for your payment",
  payment_failed: "Your payment didn't go through",
  remaining_payment_due: "A quick reminder about your balance",
  // aliases the backend also accepts for the same email
  booking_rejected: "We're sorry about this",
  booking_confirmation: "Your event is all set",
  booking_received: "We've received your booking request",
  remaining_payment: "A quick reminder about your balance",
};

export const bannerSubtitle = (trigger?: string | null) =>
  BANNER_SUBTITLES[(trigger || "").trim().toLowerCase()] ?? "";

/**
 * Replaces {{key}}, {key} and (key) placeholders with sample data.
 * If the body already contains block-level HTML (table, p, h1-h6, div, ul, ol),
 * new lines are NOT converted to <br/>, otherwise tables/lists break.
 */
export const renderTemplateBody = (
  body: string,
  overrides: Record<string, string> = {},
) => {
  const data = { ...SAMPLE_DATA, ...overrides };

  let html = body.replace(
    /\{\{\s*(\w+)\s*\}\}|\{(\w+)\}|\((user_name|start_date|end_date)\)/g,
    (match, a, b, c) => {
      const key = a || b || c;
      return key in data ? data[key] : match;
    },
  );

  const hasBlockHtml = /<(table|p|h[1-6]|div|ul|ol)\b/i.test(html);
  if (!hasBlockHtml) {
    html = html.replace(/\n/g, "<br/>");
  }

  return html;
};

/** CSS for the email body. Pass a selector like ".email-body". */
export const emailBodyCss = (s: string) => `
${s} { line-height: 1.7; font-size: 15px; color: #334155; }
${s} h2 { font-size: 22px; font-weight: 700; color: #111f33; margin: 0 0 16px; }
${s} h3 { font-size: 17px; font-weight: 700; color: #111f33; margin: 24px 0 10px; }
${s} p { margin: 0 0 14px; }
${s} a { color: #f97316; font-weight: 600; text-decoration: none; }
${s} ul, ${s} ol { margin: 10px 0; padding-left: 20px; }
${s} ul { list-style: disc; }
${s} ol { list-style: decimal; }
${s} table { width: 100%; border-collapse: collapse; margin: 0 0 20px; font-size: 14px; }
${s} td, ${s} th { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; vertical-align: top; }
${s} th { background: #fff7ed; color: #111f33; font-weight: 700; }
${s} img { max-width: 100%; }
`;