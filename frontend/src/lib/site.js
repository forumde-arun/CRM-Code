

export const SITE = {
  name: "CRM",
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5173',
  title: "CRM | WhatsApp Business CRM for Campaigns & Customer Messaging",
  description:
    "Manage your WhatsApp Business communication with CRM. Connect your WhatsApp number, manage contacts, create approved message templates, run bulk campaigns, and track message delivery.",
  keywords: [
    "WhatsApp CRM",
    "WhatsApp Business CRM",
    "WhatsApp Marketing",
    "WhatsApp Campaign Management",
    "Bulk WhatsApp Messaging",
    "WhatsApp Business API",
    "Customer Relationship Management",
    "WhatsApp Automation",
    "WhatsApp Templates",
    "CRM Software",
  ],
  locale: "en_IN",
  language: "en",
  twitterHandle: "@yourbrand",
  themeColor: "#07130F",
  email: "support@example.com",
};

export const absoluteUrl = (path) =>
  new URL(path, SITE.url).toString();
