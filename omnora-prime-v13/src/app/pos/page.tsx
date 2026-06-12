// app/pos/page.tsx
"use client";

import React, { useState } from "react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { 
  Search, Barcode, ShoppingCart, Trash2, Plus, Minus, 
  Banknote, Smartphone, Receipt, Save, User as UserIcon, CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Decimal } from "decimal.js";
import { useZxing } from "react-zxing";
import { useBarcodeScan } from "@/hooks/useBarcodeScan";

// Types
interface CartItem {
  id: string; // SKU ID
  name: string;
  qty: number;
  price: number;
  barcode?: string;
}

interface SaleRecord {
  sale_ref: string;
}



export default function POSPage() {
  const { t, fmt, isSA, persona } = usePersona();
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [tendered, setTendered] = useState("0");
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'jazzcash' | 'easypaisa' | 'bank_transfer' | 'credit'>('cash');
  const [completing, setCompleting] = useState(false);
  const [lastSale, setLastSale] = useState<SaleRecord | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  React.useEffect(() => {
    if (!profile?.id) return;
    
    async function initSession() {
      setLoadingSession(true);
      // 1. Check for open session
      const { data: openSession } = await supabase
        .from('pos_sessions')
        .select('id')
        .eq('business_id', profile?.id)
        .eq('is_closed', false)
        .order('opened_at', { ascending: false })
        .limit(1)
        .single();

      if (openSession) {
        setSessionId(openSession.id);
      } else {
        // 2. Create new session
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: newSession, error } = await supabase
          .from('pos_sessions')
          .insert({
            business_id: profile?.id,
            opened_by: user.id,
            opening_cash: 0,
            is_closed: false
          })
          .select()
          .single();

        if (newSession) setSessionId(newSession.id);
        if (error) console.error("Session creation error:", error);
      }
      setLoadingSession(false);
    }

    initSession();
  }, [profile?.id]);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, item];
    });
  };

  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio beep failed", e);
    }
  };

  const handleBarcodeScan = async (code: string) => {
    const { data: sku } = await supabase
      .from('skus')
      .select('id, name, barcode, price_retail')
      .eq('business_id', profile?.id)
      .eq('barcode', code)
      .single();

    if (sku) {
      addToCart({
        id: sku.id,
        name: sku.name,
        qty: 1,
        price: sku.price_retail || 0,
        barcode: sku.barcode
      });
      playBeep();
    } else {
      console.warn("SKU not found:", code);
    }
  };

  // Barcode Scanner
  const { ref: scannerRef } = useZxing({
    onResult(result) {
      handleBarcodeScan(result.getText());
    },
    paused: !scanning
  });

  useBarcodeScan((code) => {
    handleBarcodeScan(code);
  });

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0.1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(i => i.qty > 0));
  };

  const subtotal = cart.reduce((acc, item) => acc.plus(new Decimal(item.qty).times(item.price)), new Decimal(0));
  const taxRate = new Decimal(persona?.tax_rate || 0).div(100);
  const taxAmount = subtotal.times(taxRate);
  const total = subtotal.plus(taxAmount);
  
  const changeDue = new Decimal(tendered || 0).minus(total);

  const handleComplete = async () => {
    if (new Decimal(tendered || 0).lt(total) && paymentMode !== 'credit') return;
    setCompleting(true);
    
    // 1. Create Sale Record
    const { data: sale } = await supabase.from('pos_sales').insert({
      business_id: profile?.id,
      session_id: sessionId, 
      subtotal: subtotal.toNumber(),
      tax_amount: taxAmount.toNumber(),
      total: total.toNumber(),
      amount_tendered: Number(tendered),
      status: 'completed',
      completed_at: new Date().toISOString()
    }).select().single();

    if (sale) {
      // 2. Insert Items
      await supabase.from('pos_sale_items').insert(
        cart.map(item => ({
          sale_id: sale.id,
          sku_id: item.id,
          qty: item.qty,
          unit_price: item.price
        }))
      );

      // 3. Insert Payment
      await supabase.from('pos_payments').insert({
        sale_id: sale.id,
        mode: paymentMode,
        amount: total.toNumber()
      });

      setLastSale(sale);
      setTimeout(() => {
        setCart([]);
        setTendered("0");
        setLastSale(null);
      }, 3000);
    }
    setCompleting(false);
  };

  const appendToTendered = (val: string) => {
    if (val === '.') {
      if (!tendered.includes('.')) setTendered(prev => prev + '.');
    } else if (val === 'back') {
      setTendered(prev => prev.slice(0, -1) || "0");
    } else {
      setTendered(prev => prev === "0" ? val : prev + val);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-onyx overflow-hidden">
      {/* Left: Cart Area (60%) */}
      <div className="w-[60%] flex flex-col border-r border-white/5 bg-surface/30">
        {/* Search & Scan Header */}
        <div className="p-4 border-b border-white/5 flex space-x-3 items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-electric-blue transition-colors" />
            <input 
              type="text"
              placeholder={t('search_sku') || "Search SKU or Barcode..."}
              className="w-full bg-onyx border border-white/10 rounded-sm py-3 pl-10 pr-4 text-sm focus:border-electric-blue focus:outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setScanning(!scanning)}
            className={`p-3 rounded-sm border transition-all ${scanning ? 'bg-electric-blue border-electric-blue text-onyx' : 'border-white/10 text-gray-400 hover:text-white'}`}
          >
            <Barcode className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Viewport */}
        <AnimatePresence>
          {scanning && (
            <motion.div 
              initial={{ height: 0 }} animate={{ height: 200 }} exit={{ height: 0 }}
              className="overflow-hidden bg-black relative"
            >
              <video ref={scannerRef} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-32 border-2 border-electric-blue/50 border-dashed animate-pulse" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
              <ShoppingCart size={48} strokeWidth={1} className="mb-4" />
              <p className="text-xs uppercase tracking-widest">{t('cart_empty') || "Empty Cart"}</p>
            </div>
          ) : (
            cart.map((item) => (
              <motion.div 
                key={item.id}
                layout
                className="bg-onyx/50 border border-white/5 p-3 flex items-center group"
              >
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">{item.name}</h4>
                  <p className="text-[10px] text-gray-500 font-mono uppercase">{item.barcode || "NO_BARCODE"}</p>
                </div>
                
                <div className="flex items-center space-x-3 px-4">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:text-electric-blue transition-colors">
                    <Minus size={14} />
                  </button>
                  <span className="font-mono text-sm w-12 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:text-electric-blue transition-colors">
                    <Plus size={14} />
                  </button>
                </div>

                <div className="text-right w-24">
                  <div className="text-sm font-bold text-white font-mono">{fmt(new Decimal(item.qty).times(item.price))}</div>
                  <div className="text-[10px] text-gray-500 font-mono">@{fmt(item.price)}</div>
                </div>

                <button 
                  onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}
                  className="ml-4 p-2 text-gray-600 hover:text-critical-red opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))
          )}
        </div>

        {/* Cart Totals */}
        <div className="p-6 bg-surface border-t border-white/10 space-y-2">
          <div className="flex justify-between text-xs text-gray-500 uppercase tracking-widest font-bold">
            <span>{t('subtotal') || "Subtotal"}</span>
            <span className="font-mono text-gray-300">{fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 uppercase tracking-widest font-bold">
            <span>{persona?.tax_label || "Tax"} ({persona?.tax_rate || 0}%)</span>
            <span className="font-mono text-gray-300">{fmt(taxAmount)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/5 mt-2">
            <span className="uppercase tracking-tighter">{t('total') || "Grand Total"}</span>
            <span className="text-electric-blue font-mono">{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Right: Payment Area (40%) */}
      <div className="w-[40%] flex flex-col p-6 space-y-6">
        {/* Payment Modes */}
        <div className="grid grid-cols-2 gap-3">
          <PaymentButton 
            active={paymentMode === 'cash'} icon={Banknote} label="Cash" 
            onClick={() => setPaymentMode('cash')} 
          />
          <PaymentButton 
            active={paymentMode === 'card'} icon={CreditCard} label="Card" 
            onClick={() => setPaymentMode('card')} 
          />
          {isSA ? (
            <>
              <PaymentButton 
                active={paymentMode === 'jazzcash'} icon={Smartphone} label="JazzCash" 
                onClick={() => setPaymentMode('jazzcash')} 
              />
              <PaymentButton 
                active={paymentMode === 'easypaisa'} icon={Smartphone} label="EasyPaisa" 
                onClick={() => setPaymentMode('easypaisa')} 
              />
            </>
          ) : (
            <PaymentButton 
              active={paymentMode === 'bank_transfer'} icon={Smartphone} label="Transfer" 
              onClick={() => setPaymentMode('bank_transfer')} 
            />
          )}
          <PaymentButton 
            active={paymentMode === 'credit'} icon={UserIcon} label="Khata / Credit" 
            onClick={() => setPaymentMode('credit')} 
          />
        </div>

        {/* Amount Input Display */}
        <div className="bg-onyx border border-white/10 p-6 flex flex-col items-end rounded-sm">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t('amount_tendered') || "Amount Tendered"}</span>
          <div className="text-5xl font-bold text-white font-mono">{tendered}</div>
          {paymentMode === 'cash' && (
            <div className="mt-4 flex flex-col items-end">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Change Due</span>
              <div className={`text-2xl font-bold font-mono ${changeDue.gte(0) ? 'text-emerald' : 'text-critical-red'}`}>
                {fmt(changeDue)}
              </div>
            </div>
          )}
        </div>

        {/* Numpad Grid */}
        <div className="grid grid-cols-3 gap-3 flex-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'back'].map(val => (
            <button 
              key={val}
              onClick={() => appendToTendered(val.toString())}
              className="bg-surface border border-white/5 flex items-center justify-center font-mono text-2xl font-bold hover:bg-white/5 active:scale-95 transition-all text-white"
            >
              {val === 'back' ? <Trash2 size={24} /> : val}
            </button>
          ))}
        </div>

        {/* Complete Action */}
        <button 
          onClick={handleComplete}
          disabled={completing || loadingSession || !sessionId || cart.length === 0 || (new Decimal(tendered || 0).lt(total) && paymentMode !== 'credit')}
          className="w-full bg-electric-blue py-6 text-onyx font-bold uppercase tracking-[0.2em] flex items-center justify-center space-x-3 hover:brightness-110 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale"
        >
          {completing ? (
            <div className="w-5 h-5 border-2 border-onyx border-t-transparent animate-spin rounded-full" />
          ) : (
            <>
              <Save size={20} />
              <span>{t('complete_sale') || "Complete Sale"}</span>
            </>
          )}
        </button>

        {/* Receipt Feedback Overlay */}
        <AnimatePresence>
          {!!lastSale && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-onyx/90 backdrop-blur-md flex items-center justify-center flex-col"
            >
              <div className="bg-emerald/20 p-4 rounded-full mb-6">
                <Receipt className="text-emerald w-16 h-16" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Sale Completed!</h2>
              <p className="text-gray-400 font-mono uppercase tracking-widest">{lastSale.sale_ref}</p>
              <div className="mt-10 flex space-x-4">
                <button className="px-6 py-2 border border-white/20 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">Print Receipt</button>
                <button className="px-6 py-2 border border-white/20 text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">WhatsApp</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PaymentButton({ active, icon: Icon, label, onClick }: {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-4 border transition-all rounded-sm",
        active ? "bg-electric-blue border-electric-blue text-onyx" : "bg-onyx border-white/10 text-gray-500 hover:text-white"
      )}
    >
      <Icon size={20} className="mb-2" />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";


