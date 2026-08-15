import React from 'react';
import { redirect } from 'next/navigation';
import { getPortalSession } from '@/lib/auth/portal';
import { createAdminClient } from '@/lib/supabase/admin';
import { PersonaEngine } from '@/lib/persona/PersonaEngine';
import { CreditCard, ArrowRight, Download } from 'lucide-react';
import Link from 'next/link';

interface DashboardInvoice {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  outstanding: number;
  status: 'paid' | 'partial' | 'overdue' | 'unpaid';
}

export default async function PortalDashboardPage() {
  const portal = await getPortalSession();
  if (!portal) redirect('/portal/auth');

  const admin = createAdminClient();

  // 1. Fetch Summary via SQL RPC
  const { data: summaryArr } = await admin.rpc('get_client_summary', {
    p_portal_id: portal.id
  });
  const summary = (summaryArr?.[0] as {
    total_invoiced: number;
    total_paid: number;
    total_outstanding: number;
    overdue_count: number;
    oldest_overdue_days: number | null;
  }) || {
    total_invoiced: 0,
    total_paid: 0,
    total_outstanding: 0,
    overdue_count: 0,
    oldest_overdue_days: null
  };

  // 2. Fetch Recent Invoices (limit 5)
  const { data: invoices } = await admin.rpc('get_client_statement', {
    p_portal_id: portal.id
  });
  const recentInvoices = (invoices as DashboardInvoice[] | null)?.slice(0, 5) || [];

  const t = (key: string) => PersonaEngine.t(key);
  const fmt = (val: number) => PersonaEngine.formatCurrency(val);

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">{t('portal.dashboard.title')}</h1>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">
            Welcome back, {portal.displayName}
          </p>
        </div>
        <Link 
          href="/portal/invoices"
          className="flex items-center space-x-3 px-6 py-3 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white hover:text-onyx transition-all group"
        >
          <span>{t('portal.invoices.view_all')}</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div className="bg-[#1A1D21] p-6 border border-white/5 flex flex-col justify-between h-32">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('portal.dashboard.total_outstanding')}</span>
          <div className="text-2xl font-mono text-sandstone-gold font-bold">
            {fmt(summary.total_outstanding)}
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="bg-[#1A1D21] p-6 border border-white/5 flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('portal.dashboard.overdue')}</span>
            {summary.overdue_count > 0 && (
              <div className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest border border-amber-500/20">
                Warning
              </div>
            )}
          </div>
          <div className={`text-2xl font-mono font-bold ${summary.overdue_count > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
            {summary.overdue_count > 0 ? `${summary.overdue_count} Items` : 'All Clear'}
          </div>
        </div>

        {/* Last Activity (Simplified as Total Paid) */}
        <div className="bg-[#1A1D21] p-6 border border-white/5 flex flex-col justify-between h-32">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('portal.dashboard.last_payment')}</span>
          <div className="text-2xl font-mono text-white/90 font-bold">
            {fmt(summary.total_paid)}
          </div>
        </div>

        {/* Next Due Date */}
        <div className="bg-[#1A1D21] p-6 border border-white/5 flex flex-col justify-between h-32">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('portal.dashboard.next_due')}</span>
          <div className="text-lg font-mono text-white/90 font-bold uppercase">
            {summary.oldest_overdue_days ? `${summary.oldest_overdue_days}d Overdue` : 'None Pending'}
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="space-y-6">
        <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">{t('portal.dashboard.recent_invoices')}</h2>
        
        <div className="border border-white/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('portal.invoices.invoice_no')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('portal.invoices.date')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">{t('portal.invoices.amount')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">{t('portal.invoices.outstanding')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('portal.invoices.status')}</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-gray-500 font-medium uppercase tracking-widest">
                    {t('portal.invoices.empty')}
                  </td>
                </tr>
              ) : (
                recentInvoices.map((inv: DashboardInvoice) => (
                  <tr key={inv.invoice_id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-xs font-mono text-sandstone-gold font-bold">{inv.invoice_number}</td>
                    <td className="px-6 py-4 text-xs text-gray-400 font-medium">{PersonaEngine.formatDate(inv.invoice_date)}</td>
                    <td className="px-6 py-4 text-xs font-mono text-white text-right">{fmt(inv.total_amount)}</td>
                    <td className="px-6 py-4 text-xs font-mono text-white/90 text-right font-bold">{fmt(inv.outstanding)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border ${
                        inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        inv.status === 'partial' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        inv.status === 'overdue' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {t(`portal.status.${inv.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        {inv.outstanding > 0 && (
                          <button className="p-2 bg-electric-blue/10 text-electric-blue hover:bg-electric-blue hover:text-onyx transition-all border border-electric-blue/20">
                            <CreditCard size={14} />
                          </button>
                        )}
                        <Link 
                          href={`/portal/invoices/${inv.invoice_id}/pdf`}
                          className="p-2 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                        >
                          <Download size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

