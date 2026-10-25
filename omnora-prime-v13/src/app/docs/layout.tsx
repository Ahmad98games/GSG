import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Noxis Hub Documentation · Official Engineering & Industrial Manual",
  description: "Comprehensive technical documentation for Noxis Hub v14.0.17. Complete guide to 23 industrial themes, 100% offline SQLite WAL engine, multi-user LAN auto-sync, Developer REST API v1, HMAC webhooks, RS232 weighbridge scales, and Karigar piece-rate payroll.",
  keywords: [
    "Noxis Hub documentation",
    "offline ERP documentation",
    "23 industrial themes",
    "multi-user LAN sync",
    "developer REST API",
    "HMAC webhooks engine",
    "RS232 weighbridge scale",
    "ESC/POS thermal printing",
    "Karigar payroll",
    "textile ERP manual",
    "SQLite WAL power cut protection"
  ],
  openGraph: {
    title: "Noxis Hub Documentation · Official Engineering & Industrial Manual",
    description: "Complete guide to Noxis Hub v14.0.17 architecture: 23 visual themes, offline SQLite WAL database, multi-user LAN peer sync, public REST API, and industrial hardware integration.",
    url: "https://noxishub.app/docs",
    siteName: "Noxis Hub",
    type: "article",
  },
  alternates: {
    canonical: "https://noxishub.app/docs",
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
