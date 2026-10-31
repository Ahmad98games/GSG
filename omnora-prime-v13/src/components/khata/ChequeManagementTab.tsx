'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, AlertTriangle, Plus, RefreshCw, MessageSquare, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface ChequeRecord {
  id: string;
  party_id?: string;
  party_name: string;
  party_phone?: string;
  invoice_id?: string;
  cheque_number: string;
  bank_name: string;
  amount: number;
  cheque_date: string;
  clearance_due_date?: string;
  status: 'pending' | 'cleared' | 'bounced' | 'cancelled';
  bounced_reason?: string;
  bounce_penalty_fee?: number;
  bounced_at?: string;
  created_at: string;
}

export function ChequeManagementTab({ businessId }: { businessId?: string }) {
  const toast = useToast();
  const [cheques, setCheques] = useState<ChequeRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'cleared' | 'bounced'>('pending');
  const [loading, setLoading] = useState(true);

  // Bounce Modal State
  const [bounceModalOpen, setBounceModalOpen] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState<ChequeRecord | null>(null);
  const [bounceReason, setBounceReason] = useState('Insufficient Funds (Khaate me raqam na thi)');
  const [penaltyFee, setPenaltyFee] = useState('500');
  const [processing, setProcessing] = useState(false);

  // New Cheque Modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [bankName, setBankName] = useState('Habib Bank Limited (HBL)');
  const [amount, setAmount] = useState('');
  const [chequeDate, setChequeDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');

  const fetchCheques = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cheques?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setCheques(Array.isArray(data) ? data : []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchCheques();
  }, [statusFilter]);

  const handleClear = async (id: string) => {
    try {
      const res = await fetch('/api/cheques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear', chequeId: id, businessId: businessId || 'local' }),
      });
      if (res.ok) {
        toast.success('Cheque kamyabi se Clear mark ho gaya!');
        fetchCheques();
      }
    } catch {
      toast.error('Network error clearing cheque');
    }
  };

  const handleBounceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCheque) return;

    setProcessing(true);
    try {
      const res = await fetch('/api/cheques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bounce',
          chequeId: selectedCheque.id,
          businessId: businessId || 'local',
          reason: bounceReason,
          penaltyFee: Number(penaltyFee || 0),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.error(`Cheque Bounced! PKR ${data.reversalAmount?.toLocaleString('en-PK')} Khata me wapas reverse ho gaya.`);
        setBounceModalOpen(false);
        fetchCheques();

        // Open WhatsApp alert if available
        if (selectedCheque.party_phone) {
          const phone = selectedCheque.party_phone.replace(/[^0-9]/g, '');
          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(data.whatsappMessage)}`, '_blank');
        }
      } else {
        toast.error(data.error || 'Bounce process failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error bouncing cheque');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateCheque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName || !chequeNumber || !amount) {
      toast.error('Zaroori fields darj karein');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/cheques', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record',
          businessId: businessId || 'local',
          partyName,
          partyPhone,
          chequeNumber,
          bankName,
          amount: Number(amount),
          chequeDate,
          clearanceDueDate: dueDate || undefined,
        }),
      });

      if (res.ok) {
        toast.success('Cheque record save ho gaya!');
        setNewModalOpen(false);
        setPartyName('');
        setChequeNumber('');
        setAmount('');
        fetchCheques();
      }
    } catch {
      toast.error('Error saving cheque');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="text-[#60A5FA]" size={16} />
            Cheque Clearance &amp; Bounce Management Engine
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Track pending bank cheques, 1-click clearance, automated Khata reversals on bounce &amp; WhatsApp alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Pills */}
          <div className="flex items-center bg-[#161A1F] border border-white/8 p-0.5 rounded-sm">
            {(['all', 'pending', 'cleared', 'bounced'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${
                  statusFilter === s ? 'bg-[#60A5FA] text-slate-950 font-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => setNewModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#60A5FA] text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-blue-400 rounded-sm transition-all"
          >
            <Plus size={14} />
            Record Cheque
          </button>
        </div>
      </div>

      {/* Cheques Table */}
      <div className="bg-[#0F1114] border border-white/8 rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500">Loading cheques...</div>
        ) : cheques.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CreditCard size={28} className="mx-auto mb-2 text-gray-700" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">No {statusFilter} cheques</p>
            <p className="text-[11px] text-gray-600 mt-1">Cheques logged from Khata or manual records will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {cheques.map((c) => (
              <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.01]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white bg-white/5 px-2 py-0.5 rounded-sm">
                      #{c.cheque_number}
                    </span>
                    <span className="text-xs font-bold text-white">{c.party_name}</span>
                    <span className="text-xs font-bold text-[#60A5FA] font-mono">
                      PKR {Number(c.amount).toLocaleString('en-PK')}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                      c.status === 'cleared'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : c.status === 'bounced'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Bank: <span className="text-gray-300 font-medium">{c.bank_name}</span> · Cheque Date: {c.cheque_date}
                    {c.clearance_due_date ? ` · Due Date: ${c.clearance_due_date}` : ''}
                    {c.bounced_reason ? ` · Reason: ${c.bounced_reason} (Penalty PKR ${c.bounce_penalty_fee || 0})` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {c.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleClear(c.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-sm hover:bg-emerald-500/20"
                      >
                        <CheckCircle2 size={13} />
                        Mark Cleared
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCheque(c);
                          setBounceModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-sm hover:bg-red-500/20"
                      >
                        <AlertTriangle size={13} />
                        Mark Bounced
                      </button>
                    </>
                  )}
                  {c.status === 'bounced' && c.party_phone && (
                    <button
                      onClick={() => {
                        const phone = c.party_phone!.replace(/[^0-9]/g, '');
                        const msg = `⚠️ *CHEQUE BOUNCE NOTIFICATION*\nMohtaram *${c.party_name}*,\nAapka cheque #${c.cheque_number} bank se bounce ho gaya hai. Wajah: ${c.bounced_reason || 'Insufficient funds'}. Baraye meherbani foran cash ada karein.`;
                        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 text-gray-300 text-xs font-bold rounded-sm hover:bg-white/10"
                    >
                      <MessageSquare size={13} />
                      WhatsApp Notice
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bounce Action Modal */}
      {bounceModalOpen && selectedCheque && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F1114] border border-red-500/30 rounded-sm p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={16} />
              Mark Cheque #{selectedCheque.cheque_number} Bounced
            </h3>
            <p className="text-xs text-gray-400">
              Yeh action <b>PKR {Number(selectedCheque.amount).toLocaleString('en-PK')}</b> foran customer ke Khata mein wapas reverse (debit) kar dega aur penalty add karega.
            </p>

            <form onSubmit={handleBounceSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Bounce Reason *</label>
                <select
                  value={bounceReason}
                  onChange={(e) => setBounceReason(e.target.value)}
                  className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                >
                  <option value="Insufficient Funds (Khaate me raqam na thi)">Insufficient Funds (Khaate me raqam na thi)</option>
                  <option value="Signature Mismatch (Dastakhat ghalat hain)">Signature Mismatch (Dastakhat ghalat hain)</option>
                  <option value="Account Frozen / Blocked">Account Frozen / Blocked</option>
                  <option value="Post-dated / Stale Cheque">Post-dated / Stale Cheque</option>
                  <option value="Other Bank Discrepancy">Other Bank Discrepancy</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Bank Bounce Penalty Fee (PKR)</label>
                <input
                  type="number"
                  value={penaltyFee}
                  onChange={(e) => setPenaltyFee(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none font-bold"
                />
                <span className="text-[9px] text-gray-500 mt-0.5 block">Yeh penalty customer ke baaqi udhar mein add ho jayegi.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => setBounceModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-sm hover:bg-red-500 transition-all disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Confirm Bounce & Reverse Khata'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Cheque Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F1114] border border-white/10 rounded-sm p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard size={16} className="text-[#60A5FA]" />
              Record Incoming Cheque
            </h3>

            <form onSubmit={handleCreateCheque} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Customer / Party Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Madina Fabrics"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Cheque Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10928312"
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Amount (PKR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="HBL / Meezan / UBL"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Customer Phone</label>
                  <input
                    type="text"
                    placeholder="03001234567"
                    value={partyPhone}
                    onChange={(e) => setPartyPhone(e.target.value)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Cheque Date</label>
                  <input
                    type="date"
                    value={chequeDate}
                    onChange={(e) => setChequeDate(e.target.value)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Clearance Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 bg-[#60A5FA] text-slate-950 text-xs font-black uppercase tracking-widest rounded-sm hover:bg-blue-400 transition-all disabled:opacity-50"
                >
                  {processing ? 'Saving...' : 'Save Cheque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
