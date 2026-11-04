import React from "react";
import PricingClient from "./PricingClient";

export const metadata = {
  title: 'Noxis ERP Pricing — Lite, Pro & Elite Permanent Licenses & Plans',
  description: 'Affordable local-first industrial ERP plans starting at PKR 1,999/month. Monthly, annual, and lifetime permanent licenses (Lite Rs. 45,000, Pro Rs. 95,000, Elite Rs. 149,999). 100% offline local SQLite, zero recurring fees.',
};

export default function PricingPage() {
  return <PricingClient />;
}
