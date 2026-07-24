"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { useToast } from '@/hooks/useToast';
import { 
  Scale, ArrowDownCircle, ArrowUpCircle, 
  Settings, RefreshCw, Printer, AlertTriangle, 
  Sparkles, CheckCircle, HelpCircle, Weight, Compass
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function WeightEntryDashboard() {
  const supabase = createClient();
  const { profile } = useBusinessProfile();
  const toast = useToast();

  const businessId = profile?.id;

  // Configuration default units: 'kg' or 'maund'
  const [defaultUnit, setDefaultUnit] = useState<'KG' | 'Maund'>('KG');

  // Scale state
  const [isFetchingScale, setIsFetchingScale] = useState(false);
  const [scaleConnected, setScaleConnected] = useState<boolean | null>(null);

  // Left Panel: Paddy IN
  const [paddyKg, setPaddyKg] = useState<string>('');
  const [paddyMaund, setPaddyMaund] = useState<string>('');
  const [paddySupplierId, setPaddySupplierId] = useState<string>('');
  const [paddyMoisture, setPaddyMoisture] = useState<string>('');
  const [paddySubmitting, setPaddySubmitting] = useState(false);

  // Right Panel: Rice OUT
  const [riceKg, setRiceKg] = useState<string>('');
  const [riceMaund, setRiceMaund] = useState<string>('');
  const [riceBuyerId, setRiceBuyerId] = useState<string>('');
  const [riceVehicle, setRiceVehicle] = useState<string>('');
  const [riceDriver, setRiceDriver] = useState<string>('');
  const [riceSubmitting, setRiceSubmitting] = useState(false);

  // General parties & SKUs state
  const [parties, setParties] = useState<any[]>([]);
  const [loadingParties, setLoadingParties] = useState(true);

  // Load parties list
  useEffect(() => {
    if (!businessId) return;
    const fetchParties = async () => {
      try {
        const { data, error } = await supabase
          .from('parties')
          .select('*')
          .eq('business_id', businessId)
          .order('name');
        if (error) throw error;
        setParties(data || []);
      } catch (err) {
        console.error('Failed to load parties:', err);
      } finally {
        setLoadingParties(false);
      }
    };
    fetchParties();
  }, [businessId]);

  // Last 5 Suppliers & Buyers for quick dropdown
  const quickSuppliers = useMemo(() => {
    return parties
      .filter(p => p.party_type === 'supplier' || p.party_type === 'both')
      .slice(0, 5);
  }, [parties]);

  const quickBuyers = useMemo(() => {
    return parties
      .filter(p => p.party_type === 'customer' || p.party_type === 'both')
      .slice(0, 5);
  }, [parties]);

  // Helper conversions: 1 Maund = 40 KG
  const handlePaddyConvert = (val: string, fromUnit: 'KG' | 'Maund') => {
    if (!val || isNaN(Number(val))) {
      if (fromUnit === 'KG') {
        setPaddyKg(val);
        setPaddyMaund('');
      } else {
        setPaddyMaund(val);
        setPaddyKg('');
      }
      return;
    }

    const num = Number(val);
    if (fromUnit === 'KG') {
      setPaddyKg(val);
      setPaddyMaund((num / 40).toFixed(2));
    } else {
      setPaddyMaund(val);
      setPaddyKg((num * 40).toFixed(2));
    }
  };

  const handleRiceConvert = (val: string, fromUnit: 'KG' | 'Maund') => {
    if (!val || isNaN(Number(val))) {
      if (fromUnit === 'KG') {
        setRiceKg(val);
        setRiceMaund('');
      } else {
        setRiceMaund(val);
        setRiceKg('');
      }
      return;
    }

    const num = Number(val);
    if (fromUnit === 'KG') {
      setRiceKg(val);
      setRiceMaund((num / 40).toFixed(2));
    } else {
      setRiceMaund(val);
      setRiceKg((num * 40).toFixed(2));
    }
  };

  // Yield calculation
  const paddyMaundNum = Number(paddyMaund) || 0;
  const expectedYieldMaunds = (paddyMaundNum * 0.65).toFixed(2);

  // Fetch scale weight from Electron IPC
  const triggerScaleRead = async (panel: 'PADDY' | 'RICE') => {
    setIsFetchingScale(true);
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && typeof electronAPI.fetchScaleWeight === 'function') {
        const res = await electronAPI.fetchScaleWeight();
        if (res.success) {
          setScaleConnected(true);
          const weightVal = res.weight;
          if (panel === 'PADDY') {
            handlePaddyConvert(String(weightVal), 'KG');
            toast.success('Paddy Scale Connected', `Successfully fetched ${weightVal} KG from weighbridge.`);
          } else {
            handleRiceConvert(String(weightVal), 'KG');
            toast.success('Rice Scale Connected', `Successfully fetched ${weightVal} KG from weighbridge.`);
          }
        } else {
          setScaleConnected(false);
          toast.error('Weighbridge Error', res.reason || 'Failed to read scale weight. Manual input enabled.');
        }
      } else {
        setScaleConnected(false);
        toast.error('Local Bridge Offline', 'Weighbridge hardware driver is not active. Using manual key-in.');
      }
    } catch (err: any) {
      setScaleConnected(false);
      toast.error('Scale Fetch Error', err.message || 'Scale reader threw an exception.');
    } finally {
      setIsFetchingScale(false);
    }
  };

  // Ensure standard Paddy/Rice SKU exists to support stock updates
  const ensureSkuExists = async (code: 'PADDY' | 'RICE', name: string) => {
    if (!businessId) return null;
    try {
      const { data: existing } = await supabase
        .from('skus')
        .select('*')
        .eq('business_id', businessId)
        .eq('sku_code', code)
        .maybeSingle();

      if (existing) return existing;

      // Create new SKU
      const { data: newSku, error } = await supabase
        .from('skus')
        .insert({
          business_id: businessId,
          sku_code: code,
          name: name,
          unit: 'KG',
          qty_on_hand: 0,
          cost_price: code === 'PADDY' ? 80 : 150,
          sale_price: code === 'PADDY' ? 90 : 180,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return newSku;
    } catch (err) {
      console.error(`Failed to ensure SKU ${code} exists:`, err);
      return null;
    }
  };

  // One-click Receive (Paddy IN)
  const handlePaddyReceive = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!businessId) {
      toast.error('Profile Error', 'Active business profile context missing.');
      return;
    }
    if (!paddySupplierId) {
      toast.error('Validation Warning', 'Please select a supplier party.');
      return;
    }
    if (!paddyKg || Number(paddyKg) <= 0) {
      toast.error('Validation Warning', 'Please check incoming weighbridge weight.');
      return;
    }

    setPaddySubmitting(true);
    try {
      const paddySku = await ensureSkuExists('PADDY', 'Raw Paddy');
      if (!paddySku) throw new Error('Could not resolve raw paddy stock item.');

      const weightKg = Number(paddyKg);
      const costAmount = weightKg * (paddySku.cost_price || 80);

      // 1. Create completed purchase order
      const { data: po, error: poErr } = await supabase
        .from('purchase_orders')
        .insert({
          business_id: businessId,
          supplier_id: paddySupplierId,
          po_number: 'PO-W-' + Math.floor(100000 + Math.random() * 900000),
          status: 'completed',
          total_amount: costAmount,
          net_amount: costAmount,
          notes: `Weighbridge Intake. Moisture: ${paddyMoisture || 'N/A'}%`
        })
        .select()
        .single();

      if (poErr) throw poErr;

      // 2. Add PO line item
      const { error: itemErr } = await supabase
        .from('po_line_items')
        .insert({
          po_id: po.id,
          sku_id: paddySku.id,
          qty_ordered: weightKg,
          unit_cost: paddySku.cost_price || 80,
          line_total: costAmount
        });

      if (itemErr) throw itemErr;

      // 3. Update stock levels
      const { error: stockErr } = await supabase
        .from('skus')
        .update({
          qty_on_hand: Number(paddySku.qty_on_hand || 0) + weightKg
        })
        .eq('id', paddySku.id);

      if (stockErr) throw stockErr;

      toast.success('Paddy Received', `PO ${po.po_number} completed. ${paddyMaund} Maunds recorded.`);
      
      // Auto print receipt trigger
      setTimeout(() => {
        window.print();
      }, 500);

      // Reset Form
      setPaddyKg('');
      setPaddyMaund('');
      setPaddySupplierId('');
      setPaddyMoisture('');
    } catch (err: any) {
      toast.error('Transaction Failed', err.message || 'Error occurred recording paddy intake.');
    } finally {
      setPaddySubmitting(false);
    }
  };

  // One-click Dispatch (Rice OUT)
  const handleRiceDispatch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!businessId) {
      toast.error('Profile Error', 'Active business profile context missing.');
      return;
    }
    if (!riceBuyerId) {
      toast.error('Validation Warning', 'Please select a buyer party.');
      return;
    }
    if (!riceKg || Number(riceKg) <= 0) {
      toast.error('Validation Warning', 'Please check outgoing weighbridge weight.');
      return;
    }

    setRiceSubmitting(true);
    try {
      const riceSku = await ensureSkuExists('RICE', 'Processed Rice');
      if (!riceSku) throw new Error('Could not resolve processed rice stock item.');

      const weightKg = Number(riceKg);

      // 1. Create dispatch order record
      const { error: dispErr } = await supabase
        .from('dispatch_orders')
        .insert({
          business_id: businessId,
          party_id: riceBuyerId,
          status: 'delivered',
          vehicle_num: riceVehicle || 'N/A',
          driver_name: riceDriver || 'N/A',
          notes: `Weighbridge Dispatch: ${weightKg} KG (${riceMaund} Maunds)`
        });

      if (dispErr) throw dispErr;

      // 2. Decrement stock
      const { error: stockErr } = await supabase
        .from('skus')
        .update({
          qty_on_hand: Math.max(0, Number(riceSku.qty_on_hand || 0) - weightKg)
        })
        .eq('id', riceSku.id);

      if (stockErr) throw stockErr;

      toast.success('Rice Dispatched', `Fulfillment recorded. ${riceMaund} Maunds dispatched.`);
      
      // Auto print receipt trigger
      setTimeout(() => {
        window.print();
      }, 500);

      // Reset Form
      setRiceKg('');
      setRiceMaund('');
      setRiceBuyerId('');
      setRiceVehicle('');
      setRiceDriver('');
    } catch (err: any) {
      toast.error('Transaction Failed', err.message || 'Error occurred recording rice dispatch.');
    } finally {
      setRiceSubmitting(false);
    }
  };

  return (
    <div className="bg-[#040608] min-h-screen text-[#94A3B8] font-mono p-6 relative select-none print:bg-white print:text-black">
      
      {/* ═══ PRINT RECEIPT SKELETON (only shown during window.print()) ═══ */}
      <div className="hidden print:block font-mono text-black p-4 text-xs w-[80mm]">
        <div className="text-center border-b border-dashed border-black pb-2 mb-2">
          <h2 className="text-sm font-black uppercase tracking-widest">{profile?.business_name || 'Noxis Mill'}</h2>
          <p className="text-[9px] text-gray-700">{profile?.city || 'Pakistan'}</p>
          <p className="text-[9px] uppercase font-bold mt-1">Weighbridge Receipt</p>
        </div>
        <div className="space-y-1 my-3">
          <div className="flex justify-between"><span>Date:</span><span>{new Date().toLocaleString('en-PK')}</span></div>
          {paddySupplierId && (
            <>
              <div className="flex justify-between"><span>Intake Type:</span><span>PADDY IN</span></div>
              <div className="flex justify-between"><span>Party:</span><span>{parties.find(p => p.id === paddySupplierId)?.name || 'N/A'}</span></div>
              <div className="flex justify-between"><span>Moisture:</span><span>{paddyMoisture || 'N/A'}%</span></div>
              <div className="flex justify-between font-bold border-t border-dashed border-black pt-1 mt-1">
                <span>Net Weight:</span><span>{paddyKg} KG</span>
              </div>
              <div className="flex justify-between">
                <span>Maunds:</span><span>{paddyMaund} Mnds</span>
              </div>
            </>
          )}
          {riceBuyerId && (
            <>
              <div className="flex justify-between"><span>Intake Type:</span><span>RICE OUT</span></div>
              <div className="flex justify-between"><span>Party:</span><span>{parties.find(p => p.id === riceBuyerId)?.name || 'N/A'}</span></div>
              <div className="flex justify-between"><span>Vehicle:</span><span>{riceVehicle || 'N/A'}</span></div>
              <div className="flex justify-between"><span>Driver:</span><span>{riceDriver || 'N/A'}</span></div>
              <div className="flex justify-between font-bold border-t border-dashed border-black pt-1 mt-1">
                <span>Net Weight:</span><span>{riceKg} KG</span>
              </div>
              <div className="flex justify-between">
                <span>Maunds:</span><span>{riceMaund} Mnds</span>
              </div>
            </>
          )}
        </div>
        <div className="text-center border-t border-dashed border-black pt-2 mt-4 text-[8px] text-gray-700">
          Powered by Noxis Hub Enterprise scale driver
        </div>
      </div>

      {/* ═══ CONSOLE GRID TERMINAL ═══ */}
      <div className="max-w-6xl mx-auto space-y-6 print:hidden">
        
        {/* Terminal Header */}
        <header className="flex items-center justify-between border border-emerald-500/20 bg-[#070B0E] p-4 rounded-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30 rounded-sm">
              <Scale className="text-emerald-400 animate-pulse" size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-black uppercase tracking-widest text-white">Weighbridge Control Terminal</h1>
                <span className="text-[8px] px-1.5 py-0.5 bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 rounded font-black tracking-widest uppercase">Live scale</span>
              </div>
              <p className="text-[9px] text-slate-500 uppercase mt-0.5">High-speed Rice & Paddy Logistics Intake</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-[10px] text-slate-500 bg-[#0F161C] border border-white/5 px-3 py-1.5 rounded-sm">
              <Compass size={12} className="text-slate-400" />
              <span>DEFAULT UNIT:</span>
              <button 
                onClick={() => setDefaultUnit(defaultUnit === 'KG' ? 'Maund' : 'KG')}
                className="text-emerald-400 hover:text-emerald-300 font-bold uppercase transition-all"
              >
                {defaultUnit}
              </button>
            </div>

            {scaleConnected !== null && (
              <div className={`flex items-center space-x-1.5 text-[9px] uppercase font-bold tracking-wider px-3 py-1.5 border rounded-sm ${
                scaleConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${scaleConnected ? 'bg-emerald-400' : 'bg-rose-400'} animate-ping`} />
                <span>{scaleConnected ? 'Weighbridge COM Active' : 'Weighbridge Fallback'}</span>
              </div>
            )}
          </div>
        </header>

        {/* Side by side weighing logs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ─── PADDY IN LOG (Purchase / Receive) ─── */}
          <div className="border border-emerald-500/10 bg-[#070B0E] p-6 rounded-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3 mb-6">
                <div className="flex items-center space-x-2">
                  <ArrowDownCircle className="text-emerald-400" size={18} />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Paddy Intake (Purchase)</h2>
                </div>
                <span className="text-[9px] text-[#C5A059] font-black uppercase tracking-widest bg-[#C5A059]/10 border border-[#C5A059]/20 px-2 py-0.5 rounded-[1px]">INWARD LOAD</span>
              </div>

              <form onSubmit={handlePaddyReceive} className="space-y-6">
                {/* Large Scale Display */}
                <div className="bg-black/80 border border-emerald-500/20 rounded-sm p-4 text-center relative group">
                  <span className="absolute top-2 left-3 text-[9px] text-emerald-500/50 uppercase tracking-widest font-black">Weighbridge Indicator</span>
                  
                  <div className="py-2">
                    <p className="text-5xl font-bold font-mono text-emerald-400 tracking-wider">
                      {defaultUnit === 'KG' ? paddyKg || '0.00' : paddyMaund || '0.00'}
                    </p>
                    <p className="text-[10px] text-emerald-500/40 uppercase tracking-widest mt-1">
                      {defaultUnit === 'KG' ? 'KILOGRAMS (KG)' : 'MAUNDS (Mnd)'}
                    </p>
                  </div>

                  <div className="flex border-t border-emerald-500/10 pt-3 mt-3 items-center justify-between text-[10px]">
                    <span className="text-slate-500">Secondary display:</span>
                    <span className="text-emerald-400 font-bold">
                      {defaultUnit === 'KG' ? `${paddyMaund || '0.00'} Maunds` : `${paddyKg || '0.00'} KG`}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => triggerScaleRead('PADDY')}
                    disabled={isFetchingScale}
                    className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase py-3 border border-emerald-500/30 rounded-sm transition-all flex items-center justify-center space-x-2"
                  >
                    <Scale size={14} className={isFetchingScale ? 'animate-spin' : ''} />
                    <span>{isFetchingScale ? 'Reading Scale...' : 'Fetch Scale Weight'}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setPaddyKg('');
                      setPaddyMaund('');
                    }}
                    className="px-4 border border-white/5 hover:bg-white/5 text-slate-400 rounded-sm transition-all"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>

                {/* Manual override input fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase font-black block mb-1">Weight (KG)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={paddyKg}
                      onChange={(e) => handlePaddyConvert(e.target.value, 'KG')}
                      className="w-full bg-[#0F1418] border border-white/5 rounded-sm px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase font-black block mb-1">Weight (Maunds)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={paddyMaund}
                      onChange={(e) => handlePaddyConvert(e.target.value, 'Maund')}
                      className="w-full bg-[#0F1418] border border-white/5 rounded-sm px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                {/* Supplier party list selector */}
                <div>
                  <label className="text-[9px] text-slate-500 uppercase font-black block mb-1">Select Supplier</label>
                  <select
                    value={paddySupplierId}
                    onChange={(e) => setPaddySupplierId(e.target.value)}
                    className="w-full bg-[#0F1418] border border-white/5 rounded-sm px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">-- Choose Party --</option>
                    {parties
                      .filter(p => p.party_type === 'supplier' || p.party_type === 'both')
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name} · {p.city || 'Local'}</option>
                      ))}
                  </select>
                </div>

                {/* Last 5 quick select parties */}
                {quickSuppliers.length > 0 && (
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block mb-1.5">Quick select party</span>
                    <div className="flex flex-wrap gap-1.5">
                      {quickSuppliers.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPaddySupplierId(p.id)}
                          className={`px-2 py-1 text-[9px] font-bold border transition-all rounded-[2px] ${
                            paddySupplierId === p.id 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                              : 'bg-[#0F1418]/60 text-slate-400 border-white/5 hover:bg-white/5'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Paddy variables: moisture content */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase font-black block mb-1">Moisture content (%)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 14.5"
                      value={paddyMoisture}
                      onChange={(e) => setPaddyMoisture(e.target.value)}
                      className="w-full bg-[#0F1418] border border-white/5 rounded-sm px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  {/* Expected yield calc display */}
                  <div className="bg-black/40 border border-white/5 rounded-sm p-3 flex flex-col justify-center">
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block">Est. Yield (65% conversion)</span>
                    <p className="text-emerald-400 font-bold text-sm font-mono mt-0.5">
                      {expectedYieldMaunds} Maunds Rice
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-500/10">
                  <button
                    type="submit"
                    disabled={paddySubmitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase py-4 tracking-widest rounded-sm transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center space-x-2"
                  >
                    <span>Receive Load & Print Slip (Enter)</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ─── RICE OUT LOG (Dispatch / Sale) ─── */}
          <div className="border border-emerald-500/10 bg-[#070B0E] p-6 rounded-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/[0.02] rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3 mb-6">
                <div className="flex items-center space-x-2">
                  <ArrowUpCircle className="text-cyan-400" size={18} />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Rice Dispatch (Sale)</h2>
                </div>
                <span className="text-[9px] text-[#00E5FF] font-black uppercase tracking-widest bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-[1px]">OUTWARD LOAD</span>
              </div>

              <form onSubmit={handleRiceDispatch} className="space-y-6">
                {/* Large Scale Display */}
                <div className="bg-black/80 border border-cyan-500/20 rounded-sm p-4 text-center relative group">
                  <span className="absolute top-2 left-3 text-[9px] text-cyan-500/50 uppercase tracking-widest font-black">Weighbridge Indicator</span>
                  
                  <div className="py-2">
                    <p className="text-5xl font-bold font-mono text-cyan-400 tracking-wider">
                      {defaultUnit === 'KG' ? riceKg || '0.00' : riceMaund || '0.00'}
                    </p>
                    <p className="text-[10px] text-cyan-500/40 uppercase tracking-widest mt-1">
                      {defaultUnit === 'KG' ? 'KILOGRAMS (KG)' : 'MAUNDS (Mnd)'}
                    </p>
                  </div>

                  <div className="flex border-t border-cyan-500/10 pt-3 mt-3 items-center justify-between text-[10px]">
                    <span className="text-slate-500">Secondary display:</span>
                    <span className="text-cyan-400 font-bold">
                      {defaultUnit === 'KG' ? `${riceMaund || '0.00'} Maunds` : `${riceKg || '0.00'} KG`}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => triggerScaleRead('RICE')}
                    disabled={isFetchingScale}
                    className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold uppercase py-3 border border-cyan-500/30 rounded-sm transition-all flex items-center justify-center space-x-2"
                  >
                    <Scale size={14} className={isFetchingScale ? 'animate-spin' : ''} />
                    <span>{isFetchingScale ? 'Reading Scale...' : 'Fetch Scale Weight'}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setRiceKg('');
                      setRiceMaund('');
                    }}
                    className="px-4 border border-white/5 hover:bg-white/5 text-slate-400 rounded-sm transition-all"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>

                {/* Manual override input fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase font-black block mb-1">Weight (KG)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={riceKg}
                      onChange={(e) => handleRiceConvert(e.target.value, 'KG')}
                      className="w-full bg-[#0F1418] border border-white/5 rounded-sm px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase font-black block mb-1">Weight (Maunds)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={riceMaund}
                      onChange={(e) => handleRiceConvert(e.target.value, 'Maund')}
                      className="w-full bg-[#0F1418] border border-white/5 rounded-sm px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                {/* Buyer party list selector */}
                <div>
                  <label className="text-[9px] text-slate-500 uppercase font-black block mb-1">Select Buyer</label>
                  <select
                    value={riceBuyerId}
                    onChange={(e) => setRiceBuyerId(e.target.value)}
                    className="w-full bg-[#0F1418] border border-white/5 rounded-sm px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="">-- Choose Party --</option>
                    {parties
                      .filter(p => p.party_type === 'customer' || p.party_type === 'both')
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name} · {p.city || 'Local'}</option>
                      ))}
                  </select>
                </div>

                {/* Last 5 quick select parties */}
                {quickBuyers.length > 0 && (
                  <div>
                    <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider block mb-1.5">Quick select party</span>
                    <div className="flex flex-wrap gap-1.5">
                      {quickBuyers.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setRiceBuyerId(p.id)}
                          className={`px-2 py-1 text-[9px] font-bold border transition-all rounded-[2px] ${
                            riceBuyerId === p.id 
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                              : 'bg-[#0F1418]/60 text-slate-400 border-white/5 hover:bg-white/5'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vehicle and driver information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase font-black block mb-1">Vehicle No.</label>
                    <input
                      type="text"
                      placeholder="e.g. LEC-1002"
                      value={riceVehicle}
                      onChange={(e) => setRiceVehicle(e.target.value)}
                      className="w-full bg-[#0F1418] border border-white/5 rounded-sm px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase font-black block mb-1">Driver Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Bilal"
                      value={riceDriver}
                      onChange={(e) => setRiceDriver(e.target.value)}
                      className="w-full bg-[#0F1418] border border-white/5 rounded-sm px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-cyan-500/10">
                  <button
                    type="submit"
                    disabled={riceSubmitting}
                    className="w-full bg-[#00E5FF] hover:bg-cyan-400 text-black text-xs font-black uppercase py-4 tracking-widest rounded-sm transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center space-x-2"
                  >
                    <span>Dispatch Load & Print Slip</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
