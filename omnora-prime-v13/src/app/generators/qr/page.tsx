"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  QrCode, Download, Printer, ChevronLeft, 
  User, CreditCard, Package, Wifi, Type,
  Palette, Smartphone, Mail, MapPin, Globe
} from "lucide-react";

import { useSidebarState } from "@/hooks/useSidebarState";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import Link from "next/link";
import QRCode from "qrcode";

type QRType = 'vcard' | 'payment' | 'product' | 'wifi' | 'custom';

export default function QRCodeGenerator() {
  const { isCollapsed } = useSidebarState();
  const { businessId } = usePersona();
  const supabase = createClient();
  

  const [activeTab, setActiveTab] = useState<QRType>('vcard');
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [size, setSize] = useState(256);
  const [colors, setColors] = useState({
    dark: "#000000",
    light: "#FFFFFF"
  });

  // Form States
  const [vcard, setVcard] = useState({ name: "", phone: "", email: "", address: "" });
  const [payment, setPayment] = useState({ phone: "", name: "", amount: "" });
  const [customText, setCustomText] = useState("");
  const [wifi, setWifi] = useState({ ssid: "", password: "", security: "WPA" });
  const [selectedSku, setSelectedSku] = useState<any>(null);
  const [skuSearch, setSkuSearch] = useState("");

  const { data: skus = [] } = useQuery({
    queryKey: ['skus-search', skuSearch],
    queryFn: async () => {
      if (!skuSearch || skuSearch.length < 2) return [];
      const { data } = await supabase
        .from('skus')
        .select('*')
        .eq('business_id', businessId)
        .ilike('name', `%${skuSearch}%`)
        .limit(5);
      return data || [];
    },
    enabled: !!businessId && skuSearch.length >= 2
  });

  const generateData = () => {
    switch (activeTab) {
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${vcard.name}\nTEL:${vcard.phone}\nEMAIL:${vcard.email}\nADR:${vcard.address}\nEND:VCARD`;
      case 'payment':
        return `jazzcash://send?to=${payment.phone}&amount=${payment.amount || 0}`;
      case 'product':
        return selectedSku ? `https://noxis.app/product/${selectedSku.sku_code}` : "";
      case 'wifi':
        return `WIFI:S:${wifi.ssid};T:${wifi.security};P:${wifi.password};;`;
      case 'custom':
        return customText;
      default:
        return "";
    }
  };

  useEffect(() => {
    const data = generateData();
    if (data) {
      QRCode.toDataURL(data, {
        width: size,
        margin: 1,
        color: colors
      }, (err, url) => {
        if (err) console.error(err);
        else setQrDataUrl(url);
      });
    } else {
      Promise.resolve().then(() => {
        setQrDataUrl(prev => prev === "" ? prev : "");
      });
    }
  }, [activeTab, vcard, payment, customText, wifi, selectedSku, size, colors]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `noxis-qr-${activeTab}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const win = window.open();
    if (!win) return;
    win.document.write(`
      <html>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
          <img src="${qrDataUrl}" style="width:500px;height:500px;" />
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200">
      
      
      <main className={cn( "transition-all duration-300 min-h-screen flex flex-col")}>
        <div className="p-8 max-w-[1200px] mx-auto w-full space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/generators" className="p-2 bg-white/5 rounded-sm hover:bg-white/10 transition-colors">
                <ChevronLeft size={20} />
              </Link>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">QR Code Generator</h1>
                <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold mt-1">
                  Create professional codes for business, payments, and products
                </p>
              </div>
            </div>
          </div>

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { id: 'vcard', icon: User, label: 'Business Card' },
              { id: 'payment', icon: CreditCard, label: 'Payment' },
              { id: 'product', icon: Package, label: 'Product' },
              { id: 'wifi', icon: Wifi, label: 'Wi-Fi' },
              { id: 'custom', icon: Type, label: 'Custom' }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveTab(type.id as QRType)}
                className={cn(
                  "p-4 flex flex-col items-center justify-center space-y-2 rounded-sm border transition-all",
                  activeTab === type.id 
                    ? "bg-electric-blue text-white border-electric-blue shadow-[0_0_20px_rgba(96,165,250,0.2)]" 
                    : "bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white"
                )}
              >
                <type.icon size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Form Side */}
            <div className="glass-panel p-8 space-y-8">
              <h3 className="text-xs font-black text-white uppercase tracking-widest border-l-2 border-electric-blue pl-3">Data Input</h3>
              
              <AnimatePresence mode="wait">
                {activeTab === 'vcard' && (
                  <motion.div 
                    key="vcard"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Full Name</label>
                        <input 
                          type="text"
                          value={vcard.name}
                          onChange={(e) => setVcard({...vcard, name: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Phone</label>
                        <input 
                          type="tel"
                          value={vcard.phone}
                          onChange={(e) => setVcard({...vcard, phone: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Email</label>
                      <input 
                        type="email"
                        value={vcard.email}
                        onChange={(e) => setVcard({...vcard, email: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Address</label>
                      <textarea 
                        value={vcard.address}
                        onChange={(e) => setVcard({...vcard, address: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50 h-24 resize-none"
                      />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'payment' && (
                  <motion.div 
                    key="payment"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Account Number / Phone</label>
                      <input 
                        type="text"
                        value={payment.phone}
                        onChange={(e) => setPayment({...payment, phone: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50"
                        placeholder="03XXXXXXXXX"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Account Name</label>
                      <input 
                        type="text"
                        value={payment.name}
                        onChange={(e) => setPayment({...payment, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Fixed Amount (Optional)</label>
                      <input 
                        type="number"
                        value={payment.amount}
                        onChange={(e) => setPayment({...payment, amount: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50"
                      />
                    </div>
                    <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest mt-4">
                      Note: Payment QR links to JazzCash/EasyPaisa mobile app URI.
                    </p>
                  </motion.div>
                )}

                {activeTab === 'product' && (
                  <motion.div 
                    key="product"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1 relative">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Select SKU</label>
                      <div className="relative">
                        <input 
                          type="text"
                          value={skuSearch}
                          onChange={(e) => {
                            setSkuSearch(e.target.value);
                          }}
                          className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50"
                          placeholder="Search product name..."
                        />
                        {skuSearch.length >= 2 && skus.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-[#1A1D21] border border-white/10 z-50 mt-1 shadow-2xl">
                            {skus.map((s: any) => (
                              <button 
                                key={s.id}
                                onClick={() => {
                                  setSelectedSku(s);
                                  setSkuSearch(s.name);
                                }}
                                className="w-full px-4 py-2 text-left text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                              >
                                {s.name} ({s.sku_code})
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedSku && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Selected: {selectedSku.name}</p>
                        <p className="text-[9px] text-gray-500 mt-1">CODE: {selectedSku.sku_code}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'wifi' && (
                  <motion.div 
                    key="wifi"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Network Name (SSID)</label>
                      <input 
                        type="text"
                        value={wifi.ssid}
                        onChange={(e) => setWifi({...wifi, ssid: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Password</label>
                      <input 
                        type="password"
                        value={wifi.password}
                        onChange={(e) => setWifi({...wifi, password: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Security</label>
                      <select 
                        value={wifi.security}
                        onChange={(e) => setWifi({...wifi, security: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50"
                      >
                        <option value="WPA">WPA/WPA2</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">None</option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'custom' && (
                  <motion.div 
                    key="custom"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1 block">Any Text or URL</label>
                      <textarea 
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:border-electric-blue/50 h-32 resize-none"
                        placeholder="https://example.com"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-8 border-t border-white/5 space-y-6">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center space-x-2">
                  <Palette size={14} className="text-electric-blue" />
                  <span>Customization</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Size (PX)</label>
                    <select 
                      value={size}
                      onChange={(e) => setSize(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/5 px-4 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="128">Small (128x128)</option>
                      <option value="256">Medium (256x256)</option>
                      <option value="512">Large (512x512)</option>
                      <option value="1024">HD (1024x1024)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Fore</label>
                      <input 
                        type="color"
                        value={colors.dark}
                        onChange={(e) => setColors({...colors, dark: e.target.value})}
                        className="w-full h-10 bg-white/5 border border-white/5 rounded-sm cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest block">Back</label>
                      <input 
                        type="color"
                        value={colors.light}
                        onChange={(e) => setColors({...colors, light: e.target.value})}
                        className="w-full h-10 bg-white/5 border border-white/5 rounded-sm cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Side */}
            <div className="space-y-8">
              <div className="glass-panel p-12 flex flex-col items-center justify-center space-y-8 bg-white/5 min-h-[400px]">
                {qrDataUrl ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-8 bg-white rounded-xl shadow-2xl relative group"
                  >
                    <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 object-contain" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4 rounded-xl backdrop-blur-sm">
                      <button onClick={handleDownload} className="p-3 bg-electric-blue text-white rounded-full hover:scale-110 transition-transform">
                        <Download size={20} />
                      </button>
                      <button onClick={handlePrint} className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform">
                        <Printer size={20} />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center space-y-4 opacity-20">
                    <QrCode size={120} strokeWidth={1} />
                    <p className="text-xs font-black uppercase tracking-[0.2em]">Awaiting Input Data</p>
                  </div>
                )}

                {qrDataUrl && (
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase text-electric-blue tracking-widest">Preview Generated</p>
                    <p className="text-[9px] text-gray-600 mt-2">Hover over code to download or print</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleDownload}
                  disabled={!qrDataUrl}
                  className="flex items-center justify-center space-x-3 bg-white/5 border border-white/5 p-4 rounded-sm hover:bg-white/10 disabled:opacity-50 transition-all group"
                >
                  <Download size={18} className="text-gray-500 group-hover:text-electric-blue transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Download PNG</span>
                </button>
                <button 
                  onClick={handlePrint}
                  disabled={!qrDataUrl}
                  className="flex items-center justify-center space-x-3 bg-white/5 border border-white/5 p-4 rounded-sm hover:bg-white/10 disabled:opacity-50 transition-all group"
                >
                  <Printer size={18} className="text-gray-500 group-hover:text-white transition-colors" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Direct Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
