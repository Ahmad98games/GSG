import React, { useState } from 'react';
import { 
  Receipt, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  PieChart, 
  Search,
  Filter,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

const TRANSACTIONS = [
  { id: 'TX-492', client: 'Master Saleem (Karigar)', type: 'Payment', amount: 45000, date: '2024-04-01', status: 'completed' },
  { id: 'TX-491', client: 'Luxe Fabrics Ltd.', type: 'Purchase', amount: -125000, date: '2024-04-01', status: 'pending' },
  { id: 'TX-490', client: 'Wholesale Buyer (Amritsar)', type: 'Sales', amount: 89000, date: '2024-03-31', status: 'completed' },
  { id: 'TX-489', client: 'Karigar Adv. (Irfan)', type: 'Debit', amount: -5000, date: '2024-03-31', status: 'completed' },
];

export const BillingDashboard: React.FC = () => {
  const [billingMode, setBillingMode] = useState<'wholesale' | 'retail'>('wholesale');

  return (
    <div className="bg-[#09090b] text-zinc-100 min-h-screen p-8 space-y-12 max-w-7xl mx-auto">
      {/* Header with Mode Toggle */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-[10px] font-black uppercase text-[#D4AF37] tracking-[0.4em] mb-2">Finance Engine</h1>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Billing Matrix</h2>
        </div>

        <div className="flex bg-[#18181b] p-1.5 rounded-xl border border-[#27272a] self-start md:self-auto">
          <button
            onClick={() => setBillingMode('wholesale')}
            className={cn(
              "px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              billingMode === 'wholesale' ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/10" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Users className="w-3.5 h-3.5" /> Wholesale
          </button>
          <button
            onClick={() => setBillingMode('retail')}
            className={cn(
              "px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              billingMode === 'retail' ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/10" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Retail Shop
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: '₹14.2M', trend: '+12%', icon: TrendingUp },
          { label: 'Outstanding Owed', value: '₹2.8M', trend: '-5%', icon: ArrowDownLeft, color: 'text-red-500' },
          { label: 'Karigar Advances', value: '₹145K', trend: 'Stable', icon: Users },
          { label: 'Net Profit Margin', value: '38.4%', trend: '+2%', icon: PieChart, color: 'text-green-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#18181b] border border-[#27272a] p-6 rounded-2xl space-y-4 hover:border-[#D4AF37]/30 transition-all group">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-[#09090b] rounded-xl border border-[#27272a] group-hover:border-[#D4AF37]/20 transition-all">
                <stat.icon className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <span className={cn("text-[10px] font-bold uppercase", stat.color || "text-green-500")}>{stat.trend}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black mt-1 font-mono tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Breakdown & Ledger Table */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Advanced Ledger Entry */}
        <div className="lg:col-span-8 bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-3">
              <Receipt className="w-4 h-4 text-[#D4AF37]" /> Transaction Log Matrix
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input 
                  placeholder="Filter Ledger..."
                  className="bg-[#09090b] border border-[#27272a] rounded-lg pl-8 pr-4 py-1.5 text-[10px] text-zinc-400 focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <Filter className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-zinc-300" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#09090b] border-b border-[#27272a]">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest">ID</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Entity</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {TRANSACTIONS.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#212124] transition-all group">
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold font-mono text-zinc-500">{tx.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-zinc-200">{tx.client}</p>
                      <p className="text-[10px] text-zinc-600 font-mono uppercase">{tx.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter",
                        tx.amount > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      )}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black font-mono">
                        {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 hover:bg-[#D4AF37]/10 rounded-lg text-zinc-600 hover:text-[#D4AF37] transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <MoreVertical className="w-4 h-4 text-zinc-700 cursor-pointer" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Pricing Context */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-24 h-24 text-[#D4AF37]" />
            </div>
            
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-6">Price Matrix Insight</h3>
            
            <div className="space-y-6 relative">
              <div className="flex justify-between items-end border-b border-[#27272a] pb-4">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Avg. Production Cost</p>
                  <p className="text-2xl font-black font-mono">₹412.00</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Target Margin</p>
                  <p className="text-lg font-black font-mono text-[#D4AF37]">40%</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[9px] font-bold text-zinc-600 uppercase">Current Market Context</p>
                <div className="flex items-center justify-between p-3 bg-[#09090b] rounded-xl border border-[#27272a]">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#D4AF37] rounded-full" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{billingMode} Price</span>
                  </div>
                  <span className="text-sm font-black font-mono">₹{billingMode === 'wholesale' ? '580.00' : '850.00'}</span>
                </div>
                <p className="text-[9px] text-zinc-600 italic">
                  * Based on current cotton market index and factory overheads.
                </p>
              </div>

              <button className="w-full py-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20 hover:bg-[#D4AF37]/10 rounded-xl text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                Update Pricing Algorithm
              </button>
            </div>
          </div>

          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Quick Batch Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-4 bg-[#09090b] border border-[#27272a] rounded-xl hover:border-[#D4AF37]/50 transition-all gap-2 group">
                <ArrowUpRight className="w-5 h-5 text-green-500 group-hover:scale-110 transition-all" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Mark Sale</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-[#09090b] border border-[#27272a] rounded-xl hover:border-[#D4AF37]/50 transition-all gap-2 group">
                <ArrowDownLeft className="w-5 h-5 text-red-500 group-hover:scale-110 transition-all" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Mark Exp.</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
