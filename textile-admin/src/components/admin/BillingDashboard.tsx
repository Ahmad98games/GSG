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
  ChevronRight,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '../../lib/utils';

const PROFIT_DATA = [
  { name: 'Jan', profit: 45000, revenue: 120000 },
  { name: 'Feb', profit: 52000, revenue: 145000 },
  { name: 'Mar', profit: 48000, revenue: 130000 },
  { name: 'Apr', profit: 61000, revenue: 155000 },
  { name: 'May', profit: 55000, revenue: 140000 },
  { name: 'Jun', profit: 67000, revenue: 165000 },
];

const TRANSACTIONS = [
  { id: 'TX-492', client: 'Master Saleem (Karigar)', type: 'Payment', amount: 45000, date: '2024-04-01', status: 'completed' },
  { id: 'TX-491', client: 'Luxe Fabrics Ltd.', type: 'Purchase', amount: -125000, date: '2024-04-01', status: 'pending' },
  { id: 'TX-490', client: 'Wholesale Buyer (Amritsar)', type: 'Sales', amount: 89000, date: '2024-03-31', status: 'completed' },
  { id: 'TX-489', client: 'Karigar Adv. (Irfan)', type: 'Debit', amount: -5000, date: '2024-03-31', status: 'completed' },
];

export const BillingDashboard: React.FC = () => {
  const [billingMode, setBillingMode] = useState<'wholesale' | 'retail'>('wholesale');
  const [inputSets, setInputSets] = useState(0);
  const [inputBasePrice, setInputBasePrice] = useState(0);

  const calculateWholesaleDiscount = (sets: number) => {
    if (sets >= 100) return 10;
    if (sets >= 50) return 5;
    return 0;
  };

  const discountPercent = billingMode === 'wholesale' ? calculateWholesaleDiscount(inputSets) : 0;
  const subtotal = inputSets * inputBasePrice;
  const discountAmount = subtotal * (discountPercent / 100);
  const grandTotal = subtotal - discountAmount;

  return (
    <div className="bg-[#070809] text-zinc-100 min-h-screen p-4 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
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
          { label: 'Total Revenue', value: 'Rs. 14.2M', trend: '+12%', icon: TrendingUp },
          { label: 'Outstanding Owed', value: 'Rs. 2.8M', trend: '-5%', icon: ArrowDownLeft, color: 'text-red-500' },
          { label: 'Karigar Liability', value: 'Rs. 145K', trend: 'Pending', icon: Users, color: 'text-electric-blue' },
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

      {/* Financial Heatmap (Sovereign Analytics) */}
      <div className="bg-[#0F1113] border border-white/5 rounded-xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-electric-blue mb-1">Fiscal Performance</h3>
            <h4 className="text-xl font-black uppercase tracking-tighter">Net Sovereign Profit</h4>
          </div>
          <div className="p-3 bg-[#070809] rounded-lg border border-white/5">
            <Activity className="w-4 h-4 text-electric-blue" />
          </div>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={PROFIT_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#3f3f46', fontSize: 9, fontWeight: 900 }} 
                dy={10}
              />
              <YAxis 
                hide 
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0F1113', border: '1px solid #60A5FA33', borderRadius: '4px' }}
                itemStyle={{ color: '#60A5FA', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                labelStyle={{ color: '#71717a', fontSize: '9px', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="profit" 
                stroke="#60A5FA" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#profitGradient)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
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
                        {tx.amount > 0 ? '+' : ''}Rs. {Math.abs(tx.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 hover:bg-electric-blue/10 rounded-lg text-zinc-600 hover:text-electric-blue transition-all">
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
                  <p className="text-2xl font-black font-mono text-zinc-100">Rs. 412.00</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Target Margin</p>
                  <p className="text-lg font-black font-mono text-electric-blue">40%</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-zinc-600 uppercase mb-2 block">Input Sets</label>
                    <input 
                      type="number"
                      value={inputSets}
                      onChange={(e) => setInputSets(Number(e.target.value))}
                      className="w-full bg-[#09090b] border border-white/5 p-3 rounded-[2px] text-xs font-mono text-white outline-none focus:border-electric-blue/30"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-zinc-600 uppercase mb-2 block">Set Price (PKR)</label>
                    <input 
                      type="number"
                      value={inputBasePrice}
                      onChange={(e) => setInputBasePrice(Number(e.target.value))}
                      className="w-full bg-[#09090b] border border-white/5 p-3 rounded-[2px] text-xs font-mono text-electric-blue outline-none focus:border-electric-blue/30"
                    />
                  </div>
                </div>

                {billingMode === 'wholesale' && inputSets >= 50 && (
                  <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-[2px] flex items-center justify-between">
                    <span className="text-[10px] font-black text-green-500 uppercase italic">Wholesale Discount Applied</span>
                    <span className="text-xs font-black font-mono text-green-500">-{discountPercent}%</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-[#09090b] rounded-[2px] border border-white/5 border-l-2 border-l-gold shadow-2xl">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Grand Total</span>
                    <span className="text-lg font-black font-mono text-white">Rs. {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black uppercase text-zinc-700 italic">PKR Standard</span>
                  </div>
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
