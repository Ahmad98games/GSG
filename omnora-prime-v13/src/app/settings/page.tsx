"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Settings2, 
  Upload, 
  Building2, 
  Network, 
  Bell, 
  Database,
  Lock,
  RefreshCw,
  Save,
  AlertTriangle,
  Download,
  Trash2,
  Zap,
  Shield,
  Activity,
  CheckCircle2,
  Loader2,
  Info,
  Globe,
  Users
} from "lucide-react";

import { useSidebarState } from "@/hooks/useSidebarState";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import ThemePicker from "@/components/shell/ThemePicker";
import { useThemeStore } from "@/stores/themeStore";



interface HubInfo {
  ip: string;
  version: string;
  uptime: string;
}

interface LocalConfig {
  hub_port?: number;
  pairing_key?: string;
  notify_email?: string;
  notify_whatsapp?: string;
  low_stock_threshold?: number;
  payroll_reminder_day?: string;
  [key: string]: string | number | undefined;
}

const TABS = [
  { id: 'profile', label: 'Business Profile', icon: Building2 },
  { id: 'regional', label: 'Regional Settings', icon: Globe },
  { id: 'appearance', label: 'Appearance', icon: Activity },
  { id: 'network', label: 'TCP / Network', icon: Network },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'staff', label: 'Staff & Users', icon: Users, href: '/settings/users' },
  { id: 'hardware', label: 'Hardware Integrations', icon: Zap },
  { id: 'data', label: 'Data Management', icon: Database },
  { id: 'backup', label: 'Backup & Restore', icon: Download, href: '/settings/backup' },
  { id: 'updates', label: 'Software Updates', icon: RefreshCw, href: '/settings/updates' },
  { id: 'about', label: 'About Noxis', icon: Info, href: '/settings/about' },
];

export default function SettingsPage() {
   const { isCollapsed } = useSidebarState();
   const { profile, setProfile } = useBusinessProfile();
   const { mode, setMode } = useThemeStore();
   const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [localConfig, setLocalConfig] = useState<LocalConfig>({});
  const [sessionCount, setSessionCount] = useState(0);
  const [hubInfo, setHubInfo] = useState<HubInfo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pinData, setPinData] = useState({ current: "", next: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [manualLogoPreview, setManualLogoPreview] = useState<string | null>(null);
  const logoPreview = manualLogoPreview || profile?.logo_url || null;

  

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/settings');
      const data = await res.json();
      const configMap = (data.localConfig || []).reduce((acc: LocalConfig, c: { key: string; value: string | number }) => ({ ...acc, [c.key]: c.value }), {});
      setLocalConfig(configMap);
      setSessionCount(data.sessionCount || 0);

      const infoRes = await fetch('/api/hub/info');
      const infoData = await infoRes.json();
      setHubInfo(infoData);
    }
    fetchData();
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      let logoUrl = profile?.logo_url;

      if (logoFile && profile?.id) {
        const ext = logoFile.name.split('.').pop();
        const path = `logos/${profile.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(path, logoFile, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path);
          logoUrl = publicUrl;
        }
      }

      if (!profile) return;
      
      const { error } = await supabase
        .from('business_profiles')
        .update({
          business_name: profile.business_name,
          owner_name: (profile as any).owner_name,
          tax_number: profile.tax_number,
          address: profile.address,
          currency: profile.currency,
          industry_key: profile.industry_key,
          worker_term: profile.worker_term,
          logo_url: logoUrl
        })
        .eq('id', profile.id)

      if (error) {
        alert('Failed to save: ' + error.message)
      } else {
        alert('Profile saved successfully')
        const updatedProfile = { ...profile, logo_url: logoUrl };
        setProfile(updatedProfile as any);
      }
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };



  const handleSaveLocal = async (newData: Partial<LocalConfig>) => {
    setIsSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'local_config', data: newData })
      });
      setLocalConfig({ ...localConfig, ...newData });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePin = async () => {
    if (pinData.next.length !== 4) return alert("PIN must be 4 digits");
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'update_pin', data: { newPin: pinData.next } })
      });
      if (res.ok) {
        alert("Access PIN updated and hashed successfully.");
        setPinData({ current: "", next: "" });
      } else {
        throw new Error("Failed to update PIN");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const regenerateKey = async () => {
    if (!confirm("WARNING: Regenerating the pairing key will disconnect all mobile devices. Continue?")) return;
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'regenerate_pairing_key' })
    });
    const data = await res.json();
    setLocalConfig({ ...localConfig, pairing_key: data.pairingKey });
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 font-inter flex">
      
      <main className={cn( "flex-1 transition-all duration-300 flex flex-col h-screen overflow-hidden")}>
        <div className="flex items-center justify-between mb-6 px-6 pt-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              System Configuration
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Industrial Hub Parameters
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-sm">
                <span className="text-[10px] font-mono text-gray-500 uppercase">Ver {hubInfo?.version || "1.0.0"}</span>
             </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Settings Sidebar */}
          <div className="w-64 border-r border-white/5 bg-[#0A0A0B]/50 p-4 space-y-1">
            {TABS.map(tab => (
              (tab as any).href ? (
                <Link
                  key={tab.id}
                  href={(tab as any).href}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all group"
                >
                  <tab.icon size={18} className="text-slate-600 group-hover:text-slate-400" />
                  {tab.label}
                </Link>
              ) : (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all group",
                    activeTab === tab.id 
                      ? "bg-electric-blue/10 text-electric-blue font-bold shadow-[inset_0_0_20px_rgba(45,185,255,0.05)]" 
                      : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                  )}
                >
                  <tab.icon size={18} className={cn(activeTab === tab.id ? "text-electric-blue" : "text-slate-600 group-hover:text-slate-400")} />
                  {tab.label}
                </button>
              )
            ))}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(45,185,255,0.03),transparent_40%)]">
            <div className="max-w-3xl mx-auto space-y-12">
              
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Business Profile</h2>
                      <p className="text-slate-500 text-sm mt-1">Configure your corporate identity and regional tax requirements.</p>
                    </div>

                    <div className="flex items-center gap-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
                      <div className="relative w-24 h-24 group">
                        <div className="w-full h-full bg-black rounded-xl border border-dashed border-white/10 flex items-center justify-center overflow-hidden">
                          {logoPreview ? (
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                          ) : (
                            <Building2 className="text-slate-700" size={32} />
                          )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl">
                          <Upload size={20} className="text-white" />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setLogoFile(file);
                              setManualLogoPreview(URL.createObjectURL(file));
                            }
                          }} />
                        </label>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-white font-bold">{profile?.business_name || 'Noxis Business'}</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Business Logo</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Business Name</label>
                        <input 
                          value={profile?.business_name || ''}
                          onChange={(e) => profile && setProfile({ ...profile, business_name: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Owner Name</label>
                        <input 
                          value={(profile as any)?.owner_name || ''}
                          onChange={(e) => profile && setProfile({ ...profile, owner_name: e.target.value } as any)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Industry Key</label>
                        <select 
                          value={profile?.industry_key || ''}
                          onChange={(e) => profile && setProfile({ ...profile, industry_key: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50 appearance-none text-white [&>option]:bg-[#1A1D21]"
                        >
                          <option value="textiles">Textiles & Apparel</option>
                          <option value="pharma">Pharmaceuticals</option>
                          <option value="auto">Automotive Parts</option>
                          <option value="food">Food & Beverage</option>
                          <option value="logistics">Logistics & Supply Chain</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Tax Number (NTN/VAT)</label>
                        <input 
                          value={profile?.tax_number || ''}
                          onChange={(e) => profile && setProfile({ ...profile, tax_number: e.target.value })}
                          placeholder="e.g. 1234567-8"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Default Currency</label>
                        <select 
                          value={profile?.currency || 'PKR'}
                          onChange={(e) => profile && setProfile({ ...profile, currency: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50 appearance-none text-white [&>option]:bg-[#1A1D21]"
                        >
                          <option value="PKR">PKR — Pakistani Rupee</option>
                          <option value="USD">USD — US Dollar</option>
                          <option value="AED">AED — Dirham</option>
                          <option value="GBP">GBP — British Pound</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Primary Address</label>
                      <textarea 
                        value={profile?.address || ''}
                        onChange={(e) => profile && setProfile({ ...profile, address: e.target.value })}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50 resize-none"
                      />
                    </div>

                    <div className="pt-4">
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-[#60A5FA] text-white px-6 py-2.5 text-sm font-medium hover:bg-blue-400 transition-colors flex items-center gap-2 rounded disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'network' && (
                  <motion.div
                    key="network"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-12"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">TCP & Networking</h2>
                        <p className="text-slate-500 text-sm mt-1">Manage the high-speed industrial mesh protocols.</p>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Mesh Status</div>
                        <div className="text-emerald font-mono font-bold">OPERATIONAL</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                        <div className="flex items-center gap-3 text-electric-blue">
                          <Network size={20} />
                          <h3 className="font-bold text-sm uppercase tracking-widest">Hub Configuration</h3>
                        </div>
                        <div className="space-y-4 pt-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Local IP Address</span>
                            <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded">{hubInfo?.ip || 'Detecting...'}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">TCP Port</span>
                            <input 
                              type="number"
                              value={localConfig?.hub_port || 9000}
                              onChange={(e) => handleSaveLocal({ hub_port: Number(e.target.value) })}
                              className="w-20 bg-black border border-white/10 text-right px-2 py-1 rounded text-white font-mono"
                            />
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Connected Devices</span>
                            <span className="font-bold text-white">{sessionCount} Nodes</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                        <div className="flex items-center gap-3 text-[#C5A059]">
                          <Shield size={20} />
                          <h3 className="font-bold text-sm uppercase tracking-widest">Mesh Security</h3>
                        </div>
                        <div className="space-y-4 pt-2">
                          <div className="space-y-1">
                            <div className="text-[10px] text-slate-500 font-bold uppercase">Active Pairing Key</div>
                            <div className="font-mono text-[10px] text-slate-400 break-all bg-black/50 p-2 rounded border border-white/5 italic">
                              {localConfig?.pairing_key || 'No Key Set'}
                            </div>
                          </div>
                          <button 
                            onClick={regenerateKey}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#C5A059]/30 text-[#C5A059] text-xs font-bold uppercase tracking-widest hover:bg-[#C5A059]/10 transition-colors"
                          >
                            <RefreshCw size={14} /> Regenerate Key
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-4">
                      <AlertTriangle className="text-amber-500 w-6 h-6 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-amber-500 uppercase tracking-tight">Security Warning</p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Regenerating the pairing key will immediately disconnect all mobile nodes and factory-floor scanners. You will need to re-scan the pairing QR code on each device.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-12"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Alert Protocols</h2>
                      <p className="text-slate-500 text-sm mt-1">Configure automated notifications for stock breaches and financial milestones.</p>
                    </div>

                    <div className="space-y-4">
                      <ToggleItem 
                        label="Email Notifications" 
                        desc="Daily summaries of branch activity and pending tasks."
                        checked={localConfig?.notify_email === 'true'}
                        onChange={(v: boolean) => handleSaveLocal({ notify_email: String(v) })}
                      />
                      <ToggleItem 
                        label="WhatsApp Alerts" 
                        desc="Instant push notifications for sentinel breaches and sales."
                        checked={localConfig?.notify_whatsapp === 'true'}
                        onChange={(v: boolean) => handleSaveLocal({ notify_whatsapp: String(v) })}
                        locked
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Low Stock Threshold</label>
                        <input 
                          type="number"
                          value={localConfig?.low_stock_threshold || 10}
                          onChange={(e) => handleSaveLocal({ low_stock_threshold: Number(e.target.value) })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Payroll Reminder Day</label>
                        <select 
                          value={localConfig?.payroll_reminder_day || '1'}
                          onChange={(e) => handleSaveLocal({ payroll_reminder_day: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50 appearance-none"
                        >
                          {[...Array(28)].map((_, i) => <option key={i+1} value={i+1}>{i+1}st of Month</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="p-8 bg-[#121417] border border-white/5 rounded-2xl space-y-8">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-electric-blue/10 rounded-sm text-electric-blue">
                                <Bell size={20} />
                             </div>
                             <div>
                                <h3 className="text-white font-bold uppercase text-[10px] tracking-widest">WhatsApp Industrial Alerts</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Automated Daily Summaries</p>
                             </div>
                          </div>
                          <button 
                            onClick={async () => {
                              setIsSaving(true);
                              const { error } = await supabase.from('business_profiles').update({
                                whatsapp_numbers: profile?.whatsapp_numbers,
                                summary_frequency: profile?.summary_frequency,
                                summary_time: profile?.summary_time,
                                summary_includes: profile?.summary_includes
                              }).eq('id', profile?.id);
                              if (!error) alert("WhatsApp settings updated");
                              setIsSaving(false);
                            }}
                            className="px-4 py-2 bg-electric-blue text-onyx text-[9px] font-black uppercase tracking-widest rounded-sm"
                          >
                             Save WhatsApp Config
                          </button>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Recipients</label>
                                <div className="space-y-2">
                                   {(profile?.whatsapp_numbers || []).map((num, i) => (
                                     <div key={i} className="flex items-center gap-2">
                                        <input 
                                          value={num.name} 
                                          placeholder="Name" 
                                          className="flex-1 bg-black/40 border border-white/5 p-2 text-[10px] text-white"
                                          onChange={(e) => {
                                            const newNums = [...(profile?.whatsapp_numbers || [])];
                                            newNums[i].name = e.target.value;
                                            setProfile({ ...profile, whatsapp_numbers: newNums } as any);
                                          }}
                                        />
                                        <input 
                                          value={num.phone} 
                                          placeholder="Number" 
                                          className="flex-[2] bg-black/40 border border-white/5 p-2 text-[10px] text-white"
                                          onChange={(e) => {
                                            const newNums = [...(profile?.whatsapp_numbers || [])];
                                            newNums[i].phone = e.target.value;
                                            setProfile({ ...profile, whatsapp_numbers: newNums } as any);
                                          }}
                                        />
                                        <button onClick={() => {
                                          const newNums = (profile?.whatsapp_numbers || []).filter((_, idx) => idx !== i);
                                          setProfile({ ...profile, whatsapp_numbers: newNums } as any);
                                        }}><Trash2 size={12} className="text-gray-700 hover:text-red-500" /></button>
                                     </div>
                                   ))}
                                   <button 
                                     onClick={() => {
                                       const newNums = [...(profile?.whatsapp_numbers || []), { name: '', phone: '' }];
                                       setProfile({ ...profile, whatsapp_numbers: newNums } as any);
                                     }}
                                     className="text-electric-blue text-[9px] font-black uppercase mt-2"
                                   >
                                      + Add recipient
                                   </button>
                                </div>
                             </div>
                          </div>

                          <div className="space-y-6">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                   <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Frequency (Days)</label>
                                   <input 
                                     type="number" 
                                     value={profile?.summary_frequency || 1} 
                                     onChange={(e) => setProfile({ ...profile, summary_frequency: parseInt(e.target.value) } as any)}
                                     className="w-full bg-black/40 border border-white/5 p-2 text-[10px] text-white"
                                   />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Time</label>
                                   <input 
                                     type="time" 
                                     value={profile?.summary_time || '20:00'} 
                                     onChange={(e) => setProfile({ ...profile, summary_time: e.target.value } as any)}
                                     className="w-full bg-black/40 border border-white/5 p-2 text-[10px] text-white"
                                   />
                                </div>
                             </div>

                             <div className="space-y-2 pt-2">
                                <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Content Inclusion</label>
                                <div className="grid grid-cols-2 gap-2">
                                   {['revenue', 'production', 'low_stock', 'overdue', 'attendance', 'cashflow'].map(key => (
                                     <label key={key} className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                          type="checkbox" 
                                          checked={!!profile?.summary_includes?.[key]} 
                                          className="hidden"
                                          onChange={(e) => {
                                            const newIncludes = { ...(profile?.summary_includes || {}), [key]: e.target.checked };
                                            setProfile({ ...profile, summary_includes: newIncludes } as any);
                                          }}
                                        />
                                        <div className={cn("w-3 h-3 border rounded-sm flex items-center justify-center transition-all", profile?.summary_includes?.[key] ? "bg-electric-blue border-electric-blue" : "border-white/20")}>
                                           {profile?.summary_includes?.[key] && <CheckCircle2 size={8} className="text-onyx" />}
                                        </div>
                                        <span className="text-[9px] font-bold uppercase text-gray-600 group-hover:text-gray-400">{key.replace('_', ' ')}</span>
                                     </label>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-12"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Security & Access</h2>
                      <p className="text-slate-500 text-sm mt-1">Manage authentication policies and role-based access control.</p>
                    </div>

                    <div className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-6">
                      <div className="flex items-center gap-3 text-electric-blue">
                        <Lock size={20} />
                        <h3 className="font-bold text-sm uppercase tracking-widest">Change Hub Access PIN</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-6 pt-2">
                        <input 
                          type="password" 
                          placeholder="New 4-Digit PIN" 
                          maxLength={4}
                          value={pinData.next}
                          onChange={e => setPinData({...pinData, next: e.target.value})}
                          className="bg-black border border-white/10 px-4 py-3 rounded-lg text-sm outline-none focus:border-electric-blue/50 transition-all font-mono tracking-[1em]" 
                        />
                        <div className="text-[10px] text-slate-500 italic flex items-center">
                           PIN will be cryptographically hashed (SHA-256) before storage.
                        </div>
                      </div>
                      <button 
                        onClick={updatePin}
                        disabled={isSaving || pinData.next.length !== 4}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-30"
                      >
                        {isSaving ? "Encrypting..." : "Update & Hash Access PIN"}
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-white">Session Timeout</p>
                          <p className="text-xs text-slate-500">Auto-lock Hub terminal after inactivity.</p>
                        </div>
                        <select className="bg-black border border-white/10 px-3 py-1.5 rounded-lg text-sm font-bold uppercase outline-none">
                          <option>15 Minutes</option>
                          <option>30 Minutes</option>
                          <option>60 Minutes</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl opacity-50 cursor-not-allowed grayscale">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-white flex items-center gap-2">
                            Two-Factor Authentication
                          </p>
                          <p className="text-xs text-slate-500">Biometric or TOTP verification for sensitive actions.</p>
                        </div>
                        <div className="w-10 h-5 bg-slate-800 rounded-full" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'data' && (
                  <motion.div
                    key="data"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-12"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Data Integrity</h2>
                      <p className="text-slate-500 text-sm mt-1">Export snapshots, import balances, or purge local cache queues.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button className="p-8 bg-surface border border-white/5 rounded-2xl text-left hover:border-electric-blue/30 transition-all group">
                        <Download className="w-6 h-6 text-electric-blue mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-bold mb-2">Export Master Data</h3>
                        <p className="text-slate-500 text-xs leading-relaxed">Download a complete CSV snapshot of your local database.</p>
                      </button>
                      <button className="p-8 bg-surface border border-white/5 rounded-2xl text-left hover:border-emerald/30 transition-all group">
                        <Upload className="w-6 h-6 text-emerald mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-bold mb-2">Import Opening Balances</h3>
                        <p className="text-slate-500 text-xs leading-relaxed">Upload CSV to initialize SKU quantities and party ledgers.</p>
                      </button>
                    </div>

                    <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-2xl space-y-6">
                      <div className="flex items-center gap-3 text-red-500">
                        <Trash2 size={20} />
                        <h3 className="font-bold text-sm uppercase tracking-widest">Maintenance Actions</h3>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-white">Clear Sync Queue</p>
                          <p className="text-xs text-slate-500">Purge local SQLite records that have already been synced to cloud.</p>
                        </div>
                        <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors">
                          Purge Now
                        </button>
                      </div>
                      <div className="h-px bg-white/5" />
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>Database Size: 1.4 MB</span>
                        <span>Last Full Sync: 4m ago</span>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-white/5">
                      <div className="flex items-center justify-between p-8 bg-electric-blue/5 border border-electric-blue/10 rounded-2xl">
                         <div className="space-y-1">
                            <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
                               <Activity size={16} className="text-electric-blue" />
                               System Infrastructure Audit
                            </h3>
                            <p className="text-xs text-slate-500">Verify cloud handshake, local registry health, and mesh protocol integrity.</p>
                         </div>
                         <Link 
                           href="/settings/diagnostics"
                           className="px-6 py-3 bg-electric-blue text-onyx text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(45,185,255,0.2)]"
                         >
                            Run Diagnostics
                         </Link>
                      </div>
                    </div>
                  </motion.div>
                )}


                {activeTab === 'regional' && (
                  <motion.div
                    key="regional"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Regional Settings</h2>
                      <p className="text-slate-500 text-sm mt-1">Localize your industrial terminology and financial standards.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Worker Terminology</label>
                        <select 
                          value={profile?.worker_term || 'karigar'}
                          onChange={(e) => profile && setProfile({ ...profile, worker_term: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50 appearance-none text-white [&>option]:bg-[#1A1D21]"
                        >
                          <option value="karigar">Karigar (South Asian Traditional)</option>
                          <option value="worker">Worker (International Default)</option>
                          <option value="operator">Operator (Manufacturing/Industrial)</option>
                          <option value="artisan">Artisan (Craft/Luxury)</option>
                          <option value="tailor">Tailor (Garment Specific)</option>
                          <option value="employee">Employee (Office/Formal)</option>
                        </select>
                        <p className="text-[9px] text-gray-500 mt-2 uppercase tracking-tighter">
                          Your workers will be called <span className="text-electric-blue font-bold">{profile?.worker_term || 'Karigar'}s</span> throughout the system.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Default Currency</label>
                        <select 
                          value={profile?.currency || 'PKR'}
                          onChange={(e) => profile && setProfile({ ...profile, currency: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-electric-blue/50 appearance-none text-white [&>option]:bg-[#1A1D21]"
                        >
                          <option value="PKR">PKR — Pakistani Rupee</option>
                          <option value="USD">USD — US Dollar</option>
                          <option value="AED">AED — Dirham</option>
                          <option value="GBP">GBP — British Pound</option>
                          <option value="EUR">EUR — Euro</option>
                          <option value="SAR">SAR — Saudi Riyal</option>
                          <option value="INR">INR — Indian Rupee</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-electric-blue text-onyx px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 shadow-[0_10px_30px_rgba(45,185,255,0.2)] disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        <span>{isSaving ? 'Synchronizing...' : 'Save Regional Settings'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'appearance' && (
                  <motion.div
                    key="appearance"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-12"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Personalization</h2>
                      <p className="text-slate-500 text-sm mt-1">Choose a theme for your workspace to match your industry and workflow.</p>
                    </div>

                    <div className="space-y-6">
                      <label className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em]">Display Mode</label>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: 'dark', label: 'Dark Mode', icon: '🌙' },
                          { id: 'light', label: 'Light Mode', icon: '☀' },
                          { id: 'auto', label: 'Auto (System)', icon: '⚙' }
                        ].map(m => (
                          <button
                            key={m.id}
                            onClick={() => setMode(m.id as any)}
                            className={cn(
                              "flex flex-col items-center justify-center p-6 border rounded-xl transition-all space-y-3 group",
                              mode === m.id 
                                ? "bg-electric-blue/10 border-electric-blue text-electric-blue shadow-[0_0_20px_rgba(45,185,255,0.1)]" 
                                : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10 hover:border-white/20"
                            )}
                          >
                            <span className="text-2xl group-hover:scale-110 transition-transform">{m.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] text-gray-500 italic uppercase">
                        {mode === 'auto' ? "Currently following Windows dark/light system settings." : "Manual display mode active."}
                      </p>
                    </div>

                    <div className="space-y-6">
                      <label className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em]">Color Theme</label>
                      <ThemePicker />
                    </div>

                    <div className="p-6 bg-electric-blue/5 border border-electric-blue/10 rounded-2xl space-y-4">
                       <p className="text-sm text-slate-300 leading-relaxed italic">
                         "Each industrial operation has its own soul. Your software should reflect that."
                       </p>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'hardware' && (
                  <motion.div
                    key="hardware"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-12"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">Hardware Integrations</h2>
                      <p className="text-slate-500 text-sm mt-1">Configure and test external industrial peripherals.</p>
                    </div>

                    <div className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-6">
                      <div className="flex items-center gap-3 text-electric-blue">
                        <Zap size={20} />
                        <h3 className="font-bold text-sm uppercase tracking-widest">USB Barcode Scanner</h3>
                      </div>
                      <div className="space-y-4">
                        <p className="text-sm text-slate-300 leading-relaxed">
                          Plug and play — no setup needed. Any USB HID barcode scanner works automatically. 
                        </p>
                        <div className="space-y-2 pt-4">
                          <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Connection Test</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              placeholder="Scan any barcode here to test..." 
                              className="w-full bg-black border border-white/10 rounded-lg px-4 py-4 text-sm font-mono focus:border-emerald-500 transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                              Link Active
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ToggleItem({ label, desc, checked, onChange, locked }: any) {
  return (
    <div className={cn(
      "flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl transition-all",
      locked && "opacity-50"
    )}>
      <div className="space-y-1">
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <button 
        disabled={locked}
        onClick={() => onChange(!checked)}
        className={cn(
          "w-12 h-6 rounded-full relative transition-all duration-300",
          checked ? "bg-electric-blue shadow-[0_0_15px_rgba(45,185,255,0.4)]" : "bg-slate-800"
        )}
      >
        <div className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
          checked ? "translate-x-7" : "translate-x-1"
        )} />
      </button>
    </div>
  );
}
