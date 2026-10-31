'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Plus, MessageCircle, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface CargoRecord {
  id: string;
  invoice_number: string;
  party_name: string;
  party_phone?: string;
  destination_city: string;
  adda_name: string;
  bilty_number: string;
  nag_count: number;
  freight_type: 'paid' | 'to_pay';
  freight_amount: number;
  driver_phone?: string;
  status: 'dispatched' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
}

export function CargoBiltyTracker({ businessId }: { businessId?: string }) {
  const toast = useToast();
  const [cargos, setCargos] = useState<CargoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [addaName, setAddaName] = useState('Faisal Movers Goods');
  const [biltyNumber, setBiltyNumber] = useState('');
  const [nagCount, setNagCount] = useState(1);
  const [freightType, setFreightType] = useState<'paid' | 'to_pay'>('to_pay');
  const [freightAmount, setFreightAmount] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCargos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cargo');
      if (res.ok) {
        const data = await res.json();
        setCargos(Array.isArray(data) ? data : []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchCargos();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber || !partyName || !addaName || !biltyNumber) {
      toast.error('Baraye meherbani tamaam zaroori fields darj karein');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/cargo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: businessId || 'local',
          invoiceNumber,
          partyName,
          partyPhone,
          destinationCity: destinationCity || 'Lahore',
          addaName,
          biltyNumber,
          nagCount: Number(nagCount || 1),
          freightType,
          freightAmount: Number(freightAmount || 0),
          driverPhone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Bilty #${biltyNumber} kamyabi se record ho gayi!`);
        setModalOpen(false);
        setInvoiceNumber('');
        setPartyName('');
        setBiltyNumber('');
        fetchCargos();

        if (data.waLink) {
          window.open(data.waLink, '_blank');
        }
      } else {
        toast.error(data.error || 'Bilty save nahi ho saki');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, newStatus: any) => {
    try {
      const res = await fetch('/api/cargo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Cargo status updated: ${newStatus}`);
        fetchCargos();
      }
    } catch {}
  };

  const shareWhatsApp = (item: CargoRecord) => {
    const freightLabel = item.freight_type === 'paid' ? 'PAID (Ada shuda)' : 'TO-PAY (Adaigi Baad az Wasooli)';
    const text = 
`📦 *NOXIS HUB — CARGO / BILTI RAWANAGI*
Mohtaram *${item.party_name}*,
Aapka maal Adda par book kar ke rawana kar diya gaya hai:

📄 *Bill #*: ${item.invoice_number}
🚚 *Goods Adda / Cargo*: ${item.adda_name}
🔖 *Bilty Number*: *${item.bilty_number}*
📦 *Kul Nag (Bori/Thaan)*: *${item.nag_count} Nag*
🏙️ *Manzil (City)*: ${item.destination_city}
💵 *Kiraya (Freight)*: ${freightLabel} ${item.freight_amount > 0 ? `(PKR ${item.freight_amount.toLocaleString('en-PK')})` : ''}
${item.driver_phone ? `📞 *Driver / Adda Phone*: ${item.driver_phone}\n` : ''}
Bilty slip office record mein darj ho chuki hai. Mal wasool hotay hi confirm karein. Shukriya!`;

    const phone = item.party_phone ? item.party_phone.replace(/[^0-9]/g, '') : '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/8 pb-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Truck className="text-[#38bdf8]" size={16} />
            Bilty &amp; Goods Adda Cargo Engine
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Inter-city wholesale shipping, Bilty receipt numbers, Nag counts &amp; WhatsApp dispatches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCargos}
            className="p-2 border border-white/10 text-gray-400 hover:text-white rounded-sm transition-all"
            title="Refresh list"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#60A5FA] text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-blue-400 transition-all rounded-sm"
          >
            <Plus size={14} />
            Book New Bilty
          </button>
        </div>
      </div>

      {/* Cargo List Table */}
      <div className="bg-[#0F1114] border border-white/8 rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500">Loading Bilty records...</div>
        ) : cargos.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Truck size={28} className="mx-auto mb-2 text-gray-700 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">No Bilty Dispatches Yet</p>
            <p className="text-[11px] text-gray-600 mt-1">Book a cargo dispatch to generate customer Bilty updates.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {cargos.map((c) => (
              <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.01] transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#60A5FA] bg-[#60A5FA]/10 px-2 py-0.5 rounded-sm">
                      Bilty #{c.bilty_number}
                    </span>
                    <span className="text-xs font-bold text-white">{c.party_name}</span>
                    <span className="text-[10px] text-gray-400">({c.destination_city})</span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Adda: <span className="text-gray-300 font-medium">{c.adda_name}</span> · Bill #{c.invoice_number} ·{' '}
                    <span className="text-amber-400 font-bold">{c.nag_count} Nag (Bori/Carton)</span> ·{' '}
                    Freight: <span className="text-gray-300">{c.freight_type === 'paid' ? 'PAID' : 'TO-PAY'}</span>{' '}
                    {c.freight_amount > 0 ? `(PKR ${c.freight_amount.toLocaleString('en-PK')})` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={c.status}
                    onChange={(e) => updateStatus(c.id, e.target.value)}
                    className="bg-[#161A1F] border border-white/10 text-[10px] font-bold text-gray-300 px-2.5 py-1.5 rounded-sm outline-none"
                  >
                    <option value="dispatched">Dispatched</option>
                    <option value="in_transit">In-Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <button
                    onClick={() => shareWhatsApp(c)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-sm hover:bg-emerald-500/20 transition-all"
                  >
                    <MessageCircle size={13} />
                    WhatsApp Bilty
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Book New Bilty */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0F1114] border border-white/10 rounded-sm p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Truck size={16} className="text-[#60A5FA]" />
              Book Cargo / Bilty Dispatch
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Invoice / Bill #</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-1004"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Customer / Party Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Haji Cloth House"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Customer Phone (WhatsApp)</label>
                  <input
                    type="text"
                    placeholder="03001234567"
                    value={partyPhone}
                    onChange={(e) => setPartyPhone(e.target.value)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Destination City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Multan / Rawalpindi"
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Goods Adda / Cargo Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Faisal Movers / Daewoo Cargo"
                    value={addaName}
                    onChange={(e) => setAddaName(e.target.value)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Bilty Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BLT-8921"
                    value={biltyNumber}
                    onChange={(e) => setBiltyNumber(e.target.value)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Nag (Bundles/Bori)</label>
                  <input
                    type="number"
                    min="1"
                    value={nagCount}
                    onChange={(e) => setNagCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Freight Type</label>
                  <select
                    value={freightType}
                    onChange={(e) => setFreightType(e.target.value as any)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                  >
                    <option value="to_pay">To-Pay (Bilty Par)</option>
                    <option value="paid">Paid (Office Se)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Freight PKR</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={freightAmount}
                    onChange={(e) => setFreightAmount(e.target.value)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Driver / Booking Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="0312-3456789"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#60A5FA] text-slate-950 text-xs font-black uppercase tracking-widest rounded-sm hover:bg-blue-400 transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save & Share Bilty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
