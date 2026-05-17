const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'app');

const routes = [
  { dir: 'inventory', title: 'Inventory Management', desc: 'Full warehouse inventory tracking with location-based stock management, batch tracking, and automated reorder alerts.', icon: 'Package' },
  { dir: 'ledger', title: 'General Ledger', desc: 'Complete double-entry accounting ledger with chart of accounts, journal entries, and trial balance generation.', icon: 'BookOpen' },
  { dir: 'workforce', title: 'Workforce Management', desc: 'Employee lifecycle management including attendance, shift scheduling, performance tracking, and compliance documentation.', icon: 'Users' },
  { dir: 'dispatch', title: 'Dispatch Center', desc: 'Order fulfillment and dispatch tracking with route optimization, vehicle assignment, and delivery confirmation.', icon: 'Truck' },
  { dir: 'fulfillment', title: 'Fulfillment Hub', desc: 'End-to-end order fulfillment pipeline from picking and packing to shipping label generation and carrier integration.', icon: 'Zap' },
  { dir: 'sales', title: 'Sales Operations', desc: 'Sales pipeline management with quotation generation, order processing, and customer relationship tracking.', icon: 'ShoppingCart' },
  { dir: 'analytics', title: 'Analytics Dashboard', desc: 'Advanced business intelligence with customizable KPI dashboards, trend analysis, and predictive forecasting.', icon: 'BarChart3' },
  { dir: 'export', title: 'Data Export Center', desc: 'Bulk data export facility supporting CSV, Excel, and PDF formats with scheduled report generation.', icon: 'Send' },
  { dir: 'mandi', title: 'Mandi Trading', desc: 'Wholesale market operations with live rate tracking, auction management, and commission-based settlement.', icon: 'Briefcase' },
  { dir: 'dealers', title: 'Dealer Network', desc: 'Dealer and distributor management with territory mapping, credit limit tracking, and performance benchmarking.', icon: 'Users' },
  { dir: 'expiry', title: 'Expiry Management', desc: 'Product expiration tracking with FIFO enforcement, near-expiry alerts, and automated write-off processing.', icon: 'RefreshCw' },
  { dir: 'batches', title: 'Batch Tracking', desc: 'Lot and batch traceability from raw material intake to finished goods with full recall capability.', icon: 'Layers' },
  { dir: 'cold-chain', title: 'Cold Chain Monitor', desc: 'Temperature-controlled logistics with IoT sensor integration, threshold alerts, and compliance reporting.', icon: 'Thermometer' },
  { dir: 'shipments', title: 'Shipment Tracking', desc: 'Inbound and outbound shipment management with carrier integration, tracking updates, and proof of delivery.', icon: 'Truck' },
  { dir: 'fleet', title: 'Fleet Management', desc: 'Vehicle fleet tracking with maintenance scheduling, fuel management, and driver assignment.', icon: 'Truck' },
  { dir: 'artisans', title: 'Artisan Workshop', desc: 'Craftsman and artisan management with piece-rate tracking, quality grading, and skill-based assignment.', icon: 'Users' },
  { dir: 'samples', title: 'Sample Management', desc: 'Product sample tracking for quality control with lab results, approval workflows, and batch correlation.', icon: 'Archive' },
  { dir: 'menu', title: 'Menu Management', desc: 'Restaurant and kitchen menu configuration with recipe costing, ingredient linking, and seasonal pricing.', icon: 'ClipboardList' },
  { dir: 'orders', title: 'Order Management', desc: 'Centralized order processing hub with multi-channel intake, status tracking, and fulfillment routing.', icon: 'ShoppingCart' },
  { dir: 'profile', title: 'Business Profile', desc: 'Your business identity, operator settings, branch configuration, and system preferences.', icon: 'User' },
];

const iconImportMap = {
  Package: 'Package',
  BookOpen: 'BookOpen',
  Users: 'Users',
  Truck: 'Truck',
  Zap: 'Zap',
  ShoppingCart: 'ShoppingCart',
  BarChart3: 'BarChart3',
  Send: 'Send',
  Briefcase: 'Briefcase',
  RefreshCw: 'RefreshCw',
  Layers: 'Layers',
  Thermometer: 'Thermometer',
  Archive: 'Archive',
  ClipboardList: 'ClipboardList',
  User: 'User',
};

for (const route of routes) {
  const dirPath = path.join(appDir, route.dir);
  const filePath = path.join(dirPath, 'page.tsx');
  
  if (fs.existsSync(filePath)) {
    console.log(`SKIP: ${route.dir}/page.tsx already exists`);
    continue;
  }

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const content = `"use client";
import ComingSoonPage from "@/components/ui/ComingSoonPage";
import IndustrialSidebar from "@/components/shell/IndustrialSidebar";
import { useSidebarState } from "@/hooks/useSidebarState";
import { ${route.icon} } from "lucide-react";

export default function Page() {
  const { isCollapsed } = useSidebarState();
  return (
    <div className="min-h-screen bg-onyx">
      <IndustrialSidebar />
      <main className={\`\${isCollapsed ? "pl-[60px]" : "pl-[240px]"} transition-all duration-300\`}>
        <ComingSoonPage title="${route.title}" description="${route.desc}" icon={${route.icon}} />
      </main>
    </div>
  );
}
`;

  fs.writeFileSync(filePath, content);
  console.log(`CREATED: ${route.dir}/page.tsx`);
}

console.log('\nDone! All missing routes have been created.');
