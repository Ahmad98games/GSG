import React from "react";
import PricingClient from "./PricingClient";

export const metadata = {
  title: 'Noxis Pricing — PKR 2,500/month | Factory ERP Plans',
  description: 'Noxis factory ERP pricing. Lite PKR 2,500/month, Pro PKR 6,500/month, Elite PKR 14,000/month. Free 3-day trial. No credit card required. For Pakistani and international factories.',
};

export default function PricingPage() {
  return <PricingClient />;
}
