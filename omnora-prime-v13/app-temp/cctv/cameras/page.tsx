"use client";

import { useEffect, useState } from "react";
import { usePersona } from "@/hooks/usePersona";
import { 
  Plus, 
  Camera, 
  Settings2, 
  Trash2, 
  Activity, 
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Video
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CamerasManagementPage() {
  const { t, fmt } = usePersona();
  const [cameras, setCameras] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    node_label: "",
    brand_id: "",
    model_number: "",
    rtsp_url: "",
    location_desc: "",
    ai_enabled: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    const [cRes, bRes] = await Promise.all([
      supabase.from("cctv_nodes").select("*").order("created_at", { ascending: false }),
      supabase.from("cctv_brands").select("*")
    ]);
    setCameras(cRes.data || []);
    setBrands(bRes.data || []);
    setIsLoading(false);
  }

  async function handleAddCamera(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("cctv_nodes").insert([formData]);
    if (!error) {
      setIsFormOpen(false);
      setFormData({ node_label: "", brand_id: "", model_number: "", rtsp_url: "", location_desc: "", ai_enabled: true });
      fetchData();
    }
  }

  async function testConnection(rtspUrl: string, nodeId?: string) {
    setIsTesting(nodeId || "new");
    try {
      // Simulation: Contact python sidecar to verify RTSP stream
      const res = await fetch("http://localhost:5000/test_stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rtsp_url: rtspUrl })
      });
      const data = await res.json();
      alert(data.status === 'ok' ? "Stream Verified!" : "Stream Failed: " + data.error);
    } catch (err) {
      alert("Error: Vision Sidecar not reachable at localhost:5000");
    } finally {
      setIsTesting(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-mono">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tighter uppercase text-white flex items-center gap-3">
              <Camera className="w-8 h-8 text-yellow-400" />
              Sentinel Node Registry
            </h1>
            <p className="text-slate-500 text-sm uppercase tracking-widest">Vision Mesh Configuration & Control</p>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-yellow-400 text-black px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-yellow-300 transition-colors shadow-[0_0_20px_rgba(250,204,21,0.2)]"
          >
            <Plus className="w-5 h-5" /> Initialize Node
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Nodes" value={cameras.length} icon={<Video className="w-4 h-4" />} />
          <StatCard label="Live Streams" value={cameras.filter(c => c.status === 'online').length} icon={<Activity className="w-4 h-4 text-emerald-500" />} />
          <StatCard label="AI Shield Active" value={cameras.filter(c => c.ai_enabled).length} icon={<ShieldCheck className="w-4 h-4 text-blue-400" />} />
          <StatCard label="Faults Detected" value={cameras.filter(c => c.status === 'offline').length} icon={<AlertCircle className="w-4 h-4 text-red-500" />} />
        </div>

        {/* Table Section */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search by label, IP, or location..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-yellow-400/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><Filter className="w-4 h-4" /></button>
              <button onClick={fetchData} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"><RefreshCw className="w-4 h-4" /></button>
            </div>
          </div>

          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Node Label</th>
                <th className="px-6 py-4">Hardware</th>
                <th className="px-6 py-4">Network Info</th>
                <th className="px-6 py-4">AI Engine</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-600 uppercase tracking-widest">
                    Initializing Registry...
                  </td>
                </tr>
              ) : cameras.map((camera) => (
                <tr key={camera.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        camera.status === 'online' ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500"
                      )} />
                      <span className="text-[10px] font-bold uppercase">{camera.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-100">{camera.node_label}</span>
                      <span className="text-[10px] text-slate-500">{camera.location_desc || 'No Zone'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-300">{camera.brand_id ? brands.find(b => b.id === camera.brand_id)?.name : 'Generic'}</span>
                      <span className="text-[10px] text-slate-500">{camera.model_number || 'Sentinel-V1'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-yellow-400/80 truncate w-48">{camera.rtsp_url}</span>
                      <span className="text-[9px] text-slate-600">Last Seen: {camera.last_seen_at ? new Date(camera.last_seen_at).toLocaleString() : 'Never'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                      camera.ai_enabled ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-slate-800 border-slate-700 text-slate-500"
                    )}>
                      {camera.ai_enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => testConnection(camera.rtsp_url, camera.id)}
                      disabled={isTesting === camera.id}
                      className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
                    >
                      {isTesting === camera.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                    </button>
                    <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"><Settings2 className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-over Form */}
      <AnimatePresence>
        {isFormOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-800 p-8 z-[110] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold uppercase tracking-tighter">Initialize Sentinel</h2>
                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleAddCamera} className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Node Label</label>
                  <input 
                    required
                    value={formData.node_label}
                    onChange={(e) => setFormData({...formData, node_label: e.target.value})}
                    placeholder="e.g. Loading Dock Main"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Brand</label>
                    <select 
                      value={formData.brand_id}
                      onChange={(e) => setFormData({...formData, brand_id: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 appearance-none"
                    >
                      <option value="">Generic</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Model</label>
                    <input 
                      value={formData.model_number}
                      onChange={(e) => setFormData({...formData, model_number: e.target.value})}
                      placeholder="IPC-X200"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">RTSP Stream URL</label>
                  <div className="relative">
                    <input 
                      required
                      value={formData.rtsp_url}
                      onChange={(e) => setFormData({...formData, rtsp_url: e.target.value})}
                      placeholder="rtsp://admin:pass@192.168.1.50:554/live"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-yellow-400"
                    />
                    <button 
                      type="button"
                      onClick={() => testConnection(formData.rtsp_url)}
                      disabled={!formData.rtsp_url || isTesting === 'new'}
                      className="absolute right-2 top-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[9px] font-bold uppercase transition-colors disabled:opacity-50"
                    >
                      {isTesting === 'new' ? 'Testing...' : 'Test'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Operational Zone</label>
                  <input 
                    value={formData.location_desc}
                    onChange={(e) => setFormData({...formData, location_desc: e.target.value})}
                    placeholder="e.g. Warehouse B - Section 4"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-tighter">AI Analysis Engine</div>
                    <p className="text-[9px] text-slate-500">Enable SSD-MobileNet object detection mesh</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, ai_enabled: !formData.ai_enabled})}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors",
                      formData.ai_enabled ? "bg-emerald-500" : "bg-slate-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                      formData.ai_enabled ? "translate-x-7" : "translate-x-1"
                    )} />
                  </button>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-yellow-400 text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-yellow-300 transition-all shadow-[0_10px_30px_rgba(250,204,21,0.2)]"
                  >
                    Commit Configuration
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: any; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-2 backdrop-blur-sm relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white tracking-tighter">{value}</div>
      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-yellow-400/5 rounded-full blur-2xl group-hover:bg-yellow-400/10 transition-colors" />
    </div>
  );
}
