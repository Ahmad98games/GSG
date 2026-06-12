"use client";
import { useEffect, useState } from 'react';
import React from 'react';
// app/cctv/cameras/new/page.tsx
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { 
  Camera, Save, X, ArrowLeft, Cpu, 
  ShieldCheck, AlertCircle, Info, Zap, Signal
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/useToast";

export default function NewCameraPage() {
  const { t } = usePersona();
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  const router = useRouter();
  const toast = useToast();

  const [brands, setBrands] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');

  const [form, setForm] = useState({
    label: "",
    install_location: "",
    brand_id: "",
    model_number: "",
    camera_type_id: "",
    resolution_mp: "2.0",
    has_ir: true,
    ir_range_m: 30,
    has_poe: false,
    ip_address: "",
    port: 554,
    username: "",
    password: "",
    install_date: new Date().toISOString().split('T')[0],
    warranty_expiry: "",
    ai_enabled: false,
    notes: ""
  });

   useEffect(() => {
    async function fetchData() {
      const { data: b } = await supabase.from('cctv_brands').select('*').order('name');
      const { data: t } = await supabase.from('cctv_camera_types').select('*').order('label');
      setBrands(b || []);
      setTypes(t || []);
    }
    fetchData();
  }, [supabase]);

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      const response = await fetch('http://localhost:5001/test-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rtsp_url: `rtsp://${form.username}:${form.password}@${form.ip_address}:${form.port}/stream`
        })
      });
      if (response.ok) {
        setTestStatus('ok');
        toast.success("Stream accessible ✓", "Connection established with camera.");
      } else {
        setTestStatus('fail');
        toast.error("Connection failed", "Cannot reach camera — check IP and credentials.");
      }
    } catch (e) {
      toast.error("Test requires Hub to be running", "Ensure Python sidecar is active.");
      setTestStatus('fail');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { error } = await supabase.from('cctv_nodes').insert({
      ...form,
      business_id: profile?.id,
      status: 'online'
    });

    if (!error) {
      router.push("/cctv/cameras");
    } else {
      alert(`Save failed: ${error.message}`);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tighter uppercase">Initialize Sentinel Node</h1>
          <p className="text-gray-500 text-[10px] font-mono uppercase tracking-widest mt-1">Camera Registry v2.0</p>
        </div>
        <button onClick={() => router.back()} className="text-gray-500 hover:text-white flex items-center space-x-2 text-xs uppercase tracking-widest font-bold transition-colors">
          <ArrowLeft size={16} />
          <span>Cancel</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-2 gap-8">
        {/* Basic Specs */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-electric-blue uppercase tracking-widest border-b border-electric-blue/10 pb-2">Hardware Specs</h3>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Camera Label *</label>
            <input 
              required
              className="w-full bg-surface border border-white/10 p-3 text-sm text-white focus:border-electric-blue focus:outline-none transition-all"
              placeholder="e.g. Main Gate Entry"
              value={form.label}
              onChange={e => setForm({...form, label: e.target.value})}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Install Location *</label>
            <input 
              required
              className="w-full bg-surface border border-white/10 p-3 text-sm text-white focus:border-electric-blue focus:outline-none transition-all"
              placeholder="e.g. Ground Floor - North Wall"
              value={form.install_location}
              onChange={e => setForm({...form, install_location: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Brand *</label>
              <select 
                required
                className="w-full bg-surface border border-white/10 p-3 text-sm text-white focus:border-electric-blue focus:outline-none transition-all"
                value={form.brand_id}
                onChange={e => setForm({...form, brand_id: e.target.value})}
              >
                <option value="">Select Brand</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Model Number</label>
              <input 
                className="w-full bg-surface border border-white/10 p-3 text-sm text-white focus:border-electric-blue focus:outline-none transition-all font-mono"
                placeholder="DS-2CD2143G2-I"
                value={form.model_number}
                onChange={e => setForm({...form, model_number: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Camera Type *</label>
              <select 
                required
                className="w-full bg-surface border border-white/10 p-3 text-sm text-white focus:border-electric-blue focus:outline-none transition-all"
                value={form.camera_type_id}
                onChange={e => setForm({...form, camera_type_id: e.target.value})}
              >
                <option value="">Select Type</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Resolution (MP)</label>
              <select 
                className="w-full bg-surface border border-white/10 p-3 text-sm text-white focus:border-electric-blue focus:outline-none transition-all"
                value={form.resolution_mp}
                onChange={e => setForm({...form, resolution_mp: e.target.value})}
              >
                <option value="1.0">1.0 MP</option>
                <option value="2.0">2.0 MP (1080p)</option>
                <option value="4.0">4.0 MP</option>
                <option value="5.0">5.0 MP</option>
                <option value="8.0">8.0 MP (4K)</option>
                <option value="12.0">12.0 MP</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Infrared (IR)</span>
                <input type="checkbox" checked={form.has_ir} onChange={e => setForm({...form, has_ir: e.target.checked})} className="toggle-switch" />
             </div>
             {form.has_ir && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">IR Range (m)</label>
                  <input type="number" className="w-full bg-surface border border-white/10 p-2 text-sm text-white" value={form.ir_range_m} onChange={e => setForm({...form, ir_range_m: parseInt(e.target.value)})} />
                </div>
             )}
          </div>
        </div>

        {/* Network & AI */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-amber-500/10 pb-2">Network Configuration</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">IP Address</label>
              <input 
                className="w-full bg-surface border border-white/10 p-3 text-sm text-white font-mono"
                placeholder="192.168.1.64"
                value={form.ip_address}
                onChange={e => setForm({...form, ip_address: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">RTSP Port</label>
              <input 
                type="number"
                className="w-full bg-surface border border-white/10 p-3 text-sm text-white font-mono"
                value={form.port}
                onChange={e => setForm({...form, port: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">RTSP Username</label>
              <input 
                className="w-full bg-surface border border-white/10 p-3 text-sm text-white"
                value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">RTSP Password</label>
              <input 
                type="password"
                className="w-full bg-surface border border-white/10 p-3 text-sm text-white"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="button"
            onClick={handleTestConnection}
            className={`w-full py-3 flex items-center justify-center space-x-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${
              testStatus === 'idle' ? 'border-white/10 hover:bg-white/5' :
              testStatus === 'testing' ? 'border-amber-500 text-amber-500 animate-pulse' :
              testStatus === 'ok' ? 'border-emerald text-emerald bg-emerald/5' :
              'border-critical-red text-critical-red bg-critical-red/5'
            }`}
          >
            {testStatus === 'testing' ? <Zap size={14} className="animate-bounce" /> : <Signal size={14} />}
            <span>{
              testStatus === 'idle' ? "Test Connection" :
              testStatus === 'testing' ? "Pinging Node..." :
              testStatus === 'ok' ? "Stream Link Verified ✓" :
              "Connection Failed"
            }</span>
          </button>

          <div className="bg-surface/50 border border-white/5 p-4 rounded-sm space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                   <Cpu size={14} className="text-electric-blue" />
                   <span className="text-[10px] font-bold text-white uppercase tracking-widest">AI Sentinel Detection</span>
                </div>
                <input type="checkbox" checked={form.ai_enabled} onChange={e => setForm({...form, ai_enabled: e.target.checked})} className="toggle-switch" />
             </div>
             <p className="text-[9px] text-gray-500 leading-relaxed italic">
               Enable real-time object detection (Person, Vehicle, Fire) on this node. Requires Pro/Elite tier processing power.
             </p>
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-electric-blue py-6 text-onyx font-bold uppercase tracking-[0.2em] flex items-center justify-center space-x-3 hover:brightness-110 active:scale-95 transition-all disabled:opacity-20"
            >
              {isSubmitting ? <div className="w-5 h-5 border-2 border-onyx border-t-transparent animate-spin rounded-full" /> : (
                <>
                  <Save size={20} />
                  <span>Register Sentinel Node</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

