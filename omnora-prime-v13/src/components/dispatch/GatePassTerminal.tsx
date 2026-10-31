'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Printer, Search, Plus, AlertTriangle, CheckCircle2, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { generateGatePassReceiptPDF } from '@/lib/pdf/generateGatePassReceipt';

interface GatePassRecord {
  id: string;
  gate_pass_no: string;
  invoice_number: string;
  party_name: string;
  party_phone?: string;
  nag_count: number;
  vehicle_number?: string;
  driver_name?: string;
  items_summary?: string;
  security_status: 'issued' | 'verified' | 'exited' | 'flagged';
  verified_at?: string;
  verified_by?: string;
  created_at: string;
}

export function GatePassTerminal({ businessName, businessId }: { businessName?: string; businessId?: string }) {
  const toast = useToast();
  const [passes, setPasses] = useState<GatePassRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Guard Scanning Input
  const [scanInput, setScanInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  // Modal: Issue Gate Pass
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [nagCount, setNagCount] = useState(1);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gate-pass');
      if (res.ok) {
        const data = await res.json();
        setPasses(Array.isArray(data) ? data : []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  const handleVerifyScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    setVerifying(true);
    setScanResult(null);

    try {
      const res = await fetch('/api/gate-pass', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gate_pass_no: scanInput.trim(),
          verified_by: 'Main Gate Guard',
        }),
      });

      const data = await res.json();
      setScanResult(data);
      if (data.verified) {
        toast.success('Parcha Tasteeq Shuda! Exit Allowed.');
        fetchPasses();
      } else {
        toast.error(data.message || 'Security Verification Failed');
      }
    } catch (err: any) {
      toast.error('Network error during gate scan');
    } finally {
      setVerifying(false);
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber || !partyName) {
      toast.error('Invoice Number and Party Name are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/gate-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: businessId || 'local',
          invoiceId: invoiceId || `inv_${Date.now()}`,
          invoiceNumber,
          partyName,
          partyPhone,
          nagCount: Number(nagCount || 1),
          vehicleNumber,
          driverName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Gate Pass ${data.gatePassNo} issued successfully!`);
        setIssueModalOpen(false);
        setInvoiceNumber('');
        setPartyName('');
        fetchPasses();

        // Auto print 3-inch receipt
        generateGatePassReceiptPDF({
          businessName: businessName || 'NOXIS TEXTILE HUB',
          gatePassNo: data.gatePassNo,
          invoiceNumber: data.invoiceNumber,
          date: new Date().toLocaleString('en-PK'),
          partyName: data.partyName,
          nagCount: data.nagCount,
          vehicleNumber: data.vehicleNumber,
          driverName: data.driverName,
          items: data.items || [{ description: 'Wholesale Package', quantity: data.nagCount, unit: 'Nag' }],
        });
      } else {
        toast.error(data.error || 'Could not issue gate pass');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error issuing pass');
    } finally {
      setSaving(false);
    }
  };

  const printPass = (p: GatePassRecord) => {
    generateGatePassReceiptPDF({
      businessName: businessName || 'NOXIS TEXTILE HUB',
      gatePassNo: p.gate_pass_no,
      invoiceNumber: p.invoice_number,
      date: new Date(p.created_at).toLocaleString('en-PK'),
      partyName: p.party_name,
      nagCount: p.nag_count,
      vehicleNumber: p.vehicle_number,
      driverName: p.driver_name,
      items: [{ description: p.items_summary || 'Wholesale Goods', quantity: p.nag_count, unit: 'Nag' }],
    });
  };

  return (
    <div className="space-y-6">
      {/* Guard Verification Box */}
      <div className="bg-[#12151B] border-2 border-white/10 p-5 rounded-sm shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" size={18} />
            <span className="text-xs font-bold text-white uppercase tracking-widest">
              Guard Gate Exit Verification Terminal (Anti-Theft Scan)
            </span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">Scan barcode on 3-inch Parcha</span>
        </div>

        <form onSubmit={handleVerifyScan} className="flex gap-2">
          <div className="relative flex-1">
            <QrCode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              autoFocus
              placeholder="Scan Barcode or Type Gate Pass # (e.g. GP-20261027-1042)..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="w-full bg-[#0A0C10] border border-white/15 pl-10 pr-4 py-2.5 text-xs text-white font-mono rounded-sm outline-none focus:border-emerald-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={verifying}
            className="px-6 py-2.5 bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-sm hover:bg-emerald-400 transition-all disabled:opacity-50"
          >
            {verifying ? 'Verifying...' : 'Verify Pass'}
          </button>
        </form>

        {/* Scan Result Alert */}
        {scanResult && (
          <div
            className={`p-4 rounded-sm border ${
              scanResult.verified
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {scanResult.verified ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{scanResult.message}</span>
            </div>
            {scanResult.record && (
              <p className="text-xs mt-1 opacity-80">
                Customer: <b>{scanResult.record.party_name}</b> · Bill #{scanResult.record.invoice_number} ·{' '}
                Total: <b>{scanResult.record.nag_count} Nag (Physical Bundles)</b> · Loader: {scanResult.record.vehicle_number || 'N/A'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Header & Controls */}
      <div className="flex items-center justify-between border-b border-white/8 pb-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" size={16} />
            Issued Gate Passes (Parcha List)
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Physical quantity checks at shop exit. Wholesale prices remain strictly hidden from guards and loaders.
          </p>
        </div>

        <button
          onClick={() => setIssueModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#60A5FA] text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-blue-400 transition-all rounded-sm"
        >
          <Plus size={14} />
          Issue Gate Pass (Parcha)
        </button>
      </div>

      {/* Table of Issued Gate Passes */}
      <div className="bg-[#0F1114] border border-white/8 rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500">Loading Gate Passes...</div>
        ) : passes.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ShieldCheck size={28} className="mx-auto mb-2 text-gray-700" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">No Gate Passes Issued Today</p>
            <p className="text-[11px] text-gray-600 mt-1">Issue a Gate Pass when loading physical goods for a customer.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {passes.map((p) => (
              <div key={p.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.01]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white bg-white/5 px-2 py-0.5 rounded-sm">
                      {p.gate_pass_no}
                    </span>
                    <span className="text-xs font-bold text-white">{p.party_name}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                      p.security_status === 'exited' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {p.security_status === 'exited' ? '✓ Exited Gate' : '● Awaiting Exit'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Bill #{p.invoice_number} · <span className="text-white font-bold">{p.nag_count} Nag Bundles</span> ·{' '}
                    Loader: {p.vehicle_number || 'Rickshaw/Hand'} · Issued: {new Date(p.created_at).toLocaleTimeString('en-PK')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printPass(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:text-white rounded-sm hover:bg-white/10 transition-all"
                  >
                    <Printer size={13} />
                    Print 3-inch Parcha
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Issue Gate Pass */}
      {issueModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F1114] border border-white/10 rounded-sm p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              Issue Gate Pass Parcha
            </h3>

            <form onSubmit={handleIssue} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Invoice / Bill # *</label>
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
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chaudhry Fabrics"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Total Nag (Bori/Thaan)</label>
                  <input
                    type="number"
                    min="1"
                    value={nagCount}
                    onChange={(e) => setNagCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Loader / Van #</label>
                  <input
                    type="text"
                    placeholder="e.g. LE-24-912"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Driver / Loader Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tariq Loader"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-[#161A1F] border border-white/10 px-3 py-2 text-xs text-white rounded-sm outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => setIssueModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-widest rounded-sm hover:bg-emerald-400 transition-all disabled:opacity-50"
                >
                  {saving ? 'Issuing...' : 'Issue & Print Parcha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
