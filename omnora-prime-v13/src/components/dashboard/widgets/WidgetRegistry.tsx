"use client";
import { useEffect, useState } from 'react';
import React from 'react';
import { createClient } from "@/lib/supabase/client";
import { usePersona } from "@/hooks/usePersona";
import { Decimal } from "decimal.js";
import { motion } from "framer-motion";
import { 
  TrendingUp, Package, Users, AlertTriangle, 
  ArrowRightLeft, Factory, DollarSign, 
  ShoppingCart, Calendar, ClipboardCheck, 
  Truck, Activity, Box, Zap, Flame
} from "lucide-react";

// Types
interface WidgetProps {
  businessId: string;
}

// Helper: Skeleton
const WidgetSkeleton = () => (
  <div className="h-40 bg-surface border border-white/5 p-6 animate-pulse rounded-sm">
    <div className="h-4 w-24 bg-white/5 mb-4" />
    <div className="h-8 w-32 bg-white/10" />
  </div>
);

// Helper: Base Widget Container
const WidgetBase = ({ title, value, subtext, icon: Icon, colorClass = "text-electric-blue" }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="h-40 bg-surface border border-white/5 p-6 relative overflow-hidden group hover:border-white/10 transition-colors"
  >
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{title}</h3>
      <Icon className={`w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity ${colorClass}`} />
    </div>
    <div className="text-3xl font-bold text-white mb-2">{value}</div>
    {subtext && <div className="text-xs text-gray-500 font-medium">{subtext}</div>}
    
    <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent to-transparent group-hover:from-transparent group-hover:via-${colorClass.split('-')[1]} group-hover:to-transparent transition-all duration-700`} />
  </motion.div>
);

// 1. Today's Production
const TodayProductionWidget = ({ businessId }: WidgetProps) => {
  const [data, setData] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = usePersona();
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('production_batches')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('started_at', today);
      setData(count || 0);
      setIsLoading(false);
    }
    fetch();
  }, [businessId, supabase]);

  if (isLoading) return <WidgetSkeleton />;
  return (
    <WidgetBase 
      title={t('today_production') || "Today's Production"}
      value={data}
      subtext={`${t('batch') || "Batches"} in progress`}
      icon={Factory}
      colorClass="text-emerald"
    />
  );
};

// 2. Stock Value
const StockValueWidget = ({ businessId }: WidgetProps) => {
  const [data, setData] = useState<Decimal>(new Decimal(0));
  const [isLoading, setIsLoading] = useState(true);
  const { fmt, t } = usePersona();
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data: skus } = await supabase
        .from('skus')
        .select('qty_on_hand, cost_price')
        .eq('business_id', businessId);
      
      if (skus) {
        const total = skus.reduce((acc: Decimal, sku: any) => {
          return acc.plus(new Decimal(sku.qty_on_hand || 0).times(sku.cost_price || 0));
        }, new Decimal(0));
        setData(total);
      }
      setIsLoading(false);
    }
    fetch();
  }, [businessId, supabase]);

  if (isLoading) return <WidgetSkeleton />;
  return (
    <WidgetBase 
      title={t('stock_value') || "Stock Value"}
      value={fmt(data)}
      subtext={`Across all ${t('warehouse') || "Godowns"}`}
      icon={TrendingUp}
      colorClass="text-electric-blue"
    />
  );
};

// 3. Outstanding Khata
const OutstandingKhataWidget = ({ businessId }: WidgetProps) => {
  const [data, setData] = useState<Decimal>(new Decimal(0));
  const [isLoading, setIsLoading] = useState(true);
  const { fmt, t, isSA } = usePersona();
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data: parties } = await supabase
        .from('parties')
        .select('current_balance')
        .eq('business_id', businessId)
        .eq('party_type', 'customer');
      
      if (parties) {
        const total = parties.reduce((acc: Decimal, p: any) => acc.plus(new Decimal(p.current_balance || 0)), new Decimal(0));
        setData(total);
      }
      setIsLoading(false);
    }
    fetch();
  }, [businessId, supabase]);

  if (isLoading) return <WidgetSkeleton />;
  return (
    <WidgetBase 
      title={isSA ? (t('outstanding_khata') || "Baki Khata") : "Outstanding Receivables"}
      value={fmt(data)}
      subtext="Total customer balance"
      icon={DollarSign}
      colorClass="text-sandstone-gold"
    />
  );
};

// 4. Worker Count
const WorkerCountWidget = ({ businessId }: WidgetProps) => {
  const [data, setData] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { t, workerTermPlural } = usePersona();
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      // Assuming 'karigars' table from Phase 5
      const { count } = await supabase
        .from('karigars')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('is_active', true);
      setData(count || 0);
      setIsLoading(false);
    }
    fetch();
  }, [businessId, supabase]);

  if (isLoading) return <WidgetSkeleton />;
  return (
    <WidgetBase 
      title={t('worker_count') || `${workerTermPlural} Active`}
      value={data}
      subtext={`On duty ${t('shift') || "Shift"}`}
      icon={Users}
      colorClass="text-purple-400"
    />
  );
};

// 5. Low Stock Alert
const LowStockWidget = ({ businessId }: WidgetProps) => {
  const [data, setData] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = usePersona();
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { count } = await supabase
        .from('skus')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .lte('qty_on_hand', 0); // Simplified for now, or join with reorder_level
      setData(count || 0);
      setIsLoading(false);
    }
    fetch();
  }, [businessId, supabase]);

  if (isLoading) return <WidgetSkeleton />;
  return (
    <WidgetBase 
      title={t('low_stock') || "Low Stock Alerts"}
      value={data}
      subtext="Requires urgent reorder"
      icon={AlertTriangle}
      colorClass="text-critical-red"
    />
  );
};

// 6. Pending Transfers
const PendingTransfersWidget = ({ businessId }: WidgetProps) => {
  const [data, setData] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = usePersona();
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { count } = await supabase
        .from('transfer_logs')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'pending');
      setData(count || 0);
      setIsLoading(false);
    }
    fetch();
  }, [businessId, supabase]);

  if (isLoading) return <WidgetSkeleton />;
  return (
    <WidgetBase 
      title={t('pending_transfers') || "Pending Transfers"}
      value={data}
      subtext="Awaiting verification"
      icon={ArrowRightLeft}
      colorClass="text-blue-400"
    />
  );
};

// Helper: Generic Fallback Widget
const GenericWidget = ({ title, icon: Icon, colorClass }: any) => (
  <WidgetBase title={title} value="--" subtext="Metric pending" icon={Icon} colorClass={colorClass} />
);

// 7. Expiry Alerts (Pharma)
const ExpiryAlertsWidget = ({ businessId }: WidgetProps) => {
  const [data, setData] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = usePersona();
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const ninetyDays = new Date();
      ninetyDays.setDate(ninetyDays.getDate() + 90);
      const { count } = await supabase
        .from('product_batches_medical')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .lte('expiry_date', ninetyDays.toISOString().split('T')[0])
        .eq('recall_status', 'clear');
      setData(count || 0);
      setIsLoading(false);
    }
    fetch();
  }, [businessId, supabase]);

  if (isLoading) return <WidgetSkeleton />;
  return (
    <WidgetBase 
      title={t('expiry_alerts') || "Expiring Soon"}
      value={data}
      subtext="Within next 90 days"
      icon={Calendar}
      colorClass="text-critical-red"
    />
  );
};

// 8. Batch Recalls (Pharma)
const BatchRecallsWidget = ({ businessId }: WidgetProps) => {
  const [data, setData] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = usePersona();
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { count } = await supabase
        .from('product_batches_medical')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('recall_status', 'recalled');
      setData(count || 0);
      setIsLoading(false);
    }
    fetch();
  }, [businessId, supabase]);

  if (isLoading) return <WidgetSkeleton />;
  return (
    <WidgetBase 
      title={t('batch_recalls') || "Active Recalls"}
      value={data}
      subtext="Locked from inventory"
      icon={AlertTriangle}
      colorClass="text-critical-red"
    />
  );
};

// 9. SLA Compliance (Logistics)
const SLAComplianceWidget = ({ businessId }: WidgetProps) => {
  const [data, setData] = useState<string>("0%");
  const [isLoading, setIsLoading] = useState(true);
  const { t } = usePersona();
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data: shipments } = await supabase
        .from('shipments')
        .select('sla_met')
        .eq('business_id', businessId)
        .not('delivered_at', 'is', null);
      
      if (shipments && shipments.length > 0) {
        const met = shipments.filter((s: any) => s.sla_met).length;
        setData(`${((met / shipments.length) * 100).toFixed(1)}%`);
      }
      setIsLoading(false);
    }
    fetch();
  }, [businessId, supabase]);

  if (isLoading) return <WidgetSkeleton />;
  return (
    <WidgetBase 
      title={t('sla_compliance') || "SLA Compliance"}
      value={data}
      subtext="On-time delivery rate"
      icon={TrendingUp}
      colorClass="text-emerald"
    />
  );
};

// 10. Live Orders (Kitchen)
const LiveOrdersWidget = ({ businessId }: WidgetProps) => {
  const [data, setData] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = usePersona();
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .in('status', ['draft', 'issued']);
      setData(count || 0);
      setIsLoading(false);
    }
    fetch();
  }, [businessId, supabase]);

  if (isLoading) return <WidgetSkeleton />;
  return (
    <WidgetBase 
      title={t('orders_live') || "Live Orders"}
      value={data}
      subtext="Awaiting preparation"
      icon={Flame}
      colorClass="text-critical-red"
    />
  );
};

// 11. Reorder Suggestions
const ReorderSuggestionsWidget = ({ businessId }: WidgetProps) => {
  const [count, setCount] = useState<number>(0);
  const [value, setValue] = useState<Decimal>(new Decimal(0));
  const [isLoading, setIsLoading] = useState(true);
  const { fmt, t } = usePersona();
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('reorder_suggestions')
        .select('*')
        .eq('business_id', businessId);
      
      if (data) {
        setCount(data.length);
        const total = data.reduce((acc: Decimal, s: any) => acc.plus(new Decimal(s.estimated_po_value || 0)), new Decimal(0));
        setValue(total);
      }
      setIsLoading(false);
    }
    fetch();
  }, [businessId, supabase]);

  if (isLoading) return <WidgetSkeleton />;
  return (
    <WidgetBase 
      title={t('reorder_suggestions') || "Reorder Suggestions"}
      value={`${count} Items`}
      subtext={`Estimated ${fmt(value)} total`}
      icon={Zap}
      colorClass="text-sandstone-gold"
    />
  );
};

export const WIDGET_MAP: Record<string, React.FC<WidgetProps>> = {
  today_production: TodayProductionWidget,
  stock_value: StockValueWidget,
  outstanding_khata: OutstandingKhataWidget,
  karigar_count: WorkerCountWidget,
  low_stock: LowStockWidget,
  pending_transfers: PendingTransfersWidget,
  // International / Other
  fulfillment_rate: (props) => <GenericWidget title="Fulfillment Rate" icon={Zap} colorClass="text-emerald" {...props} />,
  inventory_accuracy: (props) => <GenericWidget title="Inventory Accuracy" icon={ClipboardCheck} colorClass="text-blue-400" {...props} />,
  orders_today: (props) => <GenericWidget title="Orders Today" icon={ShoppingCart} colorClass="text-purple-400" {...props} />,
  workforce_count: WorkerCountWidget,
  slippage_rate: (props) => <GenericWidget title="Slippage Rate" icon={Activity} colorClass="text-critical-red" {...props} />,
  throughput: (props) => <GenericWidget title="Throughput" icon={TrendingUp} colorClass="text-emerald" {...props} />,
  bag_inventory: (props) => <GenericWidget title="Bag Inventory" icon={Archive} colorClass="text-gray-400" {...props} />,
  orders_live: LiveOrdersWidget,
  expiry_alerts: ExpiryAlertsWidget,
  batch_recalls: BatchRecallsWidget,
  sla_compliance: SLAComplianceWidget,
  reorder_suggestions: ReorderSuggestionsWidget,
};

// Re-export Lucide icons used in mapping if needed, or just keep them internal
const ShieldCheck = (props: any) => <ClipboardCheck {...props} />;
const Archive = (props: any) => <Box {...props} />;
