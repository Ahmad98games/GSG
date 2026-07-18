'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { FeatureGate } from '@/components/ui/FeatureGate';
import { 
  Key, Cpu, Code, Copy, Plus, Trash2, Globe, RefreshCw, 
  AlertCircle, ExternalLink, ShieldCheck, CheckCircle2, Lock, ArrowUpRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ApiSettingsPage() {
  return (
    <FeatureGate feature="apiAccess">
      <ApiPlatformContent />
    </FeatureGate>
  );
}

function ApiPlatformContent() {
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(['read']);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (!profile?.id) return;
    loadApiData();
  }, [profile?.id]);
  
  const loadApiData = async () => {
    if (!profile?.id) return;
    
    try {
      const [keys, hooks] = await Promise.all([
        supabase.from('api_keys')
          .select('id, name, key_prefix, scopes, last_used_at, total_requests, is_active, created_at')
          .eq('business_id', profile.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase.from('webhook_endpoints')
          .select('*')
          .eq('business_id', profile.id)
      ]);
      
      setApiKeys(keys.data || []);
      setWebhooks(hooks.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  const createApiKey = async () => {
    if (!profile?.id || !newKeyName.trim()) return;
    
    try {
      // Generate a secure key
      const uuidString = crypto.randomUUID().replace(/-/g, '');
      const rawKey = `noxis_${uuidString}`;
      const prefix = rawKey.slice(0, 12);
      
      // Hash the key before storing (SHA-256)
      const keyHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(rawKey)
      ).then((buf: ArrayBuffer) => 
        Array.from(new Uint8Array(buf))
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('')
      );
      
      const { error } = await supabase
        .from('api_keys')
        .insert({
          business_id: profile.id,
          name: newKeyName.trim(),
          key_hash: keyHash,
          key_prefix: prefix,
          scopes: newKeyScopes,
          is_active: true,
          total_requests: 0,
        });
      
      if (!error) {
        setCreatedKey(rawKey);
        setNewKeyName('');
        setCreating(false);
        await loadApiData();
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  const revokeKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', id);
        
      if (!error) {
        setApiKeys(prev => prev.filter((k: any) => k.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  const handleCopy = () => {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setCreatedKey(null);
    }, 2000);
  };
  
  const AVAILABLE_SCOPES = [
    { id: 'read', label: 'Read Data', desc: 'Allows read-only access to Invoices, Inventory, and Karigars telemetry.' },
    { id: 'write', label: 'Write Data', desc: 'Allows writing and updating Invoices, Orders, and Stock counts.' },
    { id: 'webhooks', label: 'Webhooks Control', desc: 'Allows creation and triggers configuration for third-party webhooks.' },
  ];
  
  return (
    <div className="min-h-screen bg-[#07090B] text-gray-200 p-6 md:p-8 font-sans select-none relative">
      <div className="absolute top-0 right-0 w-[500px] h-[250px] bg-electric-blue/5 rounded-full blur-[140px] pointer-events-none" />
      
      <main className="max-w-4xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="border-b border-white/5 pb-6">
          <div className="inline-flex items-center gap-2 bg-electric-blue/5 border border-electric-blue/20 px-3 py-1 rounded-full mb-3">
            <Cpu className="text-electric-blue" size={14} />
            <span className="text-[10px] font-black text-electric-blue uppercase tracking-widest">Noxis Open API Platform</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white italic">
            API Platform Management
          </h1>
          <p className="text-gray-500 text-xs mt-1 uppercase font-bold tracking-wider">
            Provision secure credentials to link third-party ERP, web-mandi, or logistics tools directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Columns (Keys & Forms) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* API Key Created Banner */}
            <AnimatePresence>
              {createdKey && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-5 bg-emerald-500/[0.02] border border-emerald-500/20 rounded-sm space-y-3 overflow-hidden"
                >
                  <div className="flex items-center gap-2 text-emerald-400">
                    <ShieldCheck size={16} className="animate-pulse" />
                    <h3 className="text-xs font-black uppercase tracking-widest">API Secret Key Generated</h3>
                  </div>
                  <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                    ⚠️ Copy this key now! For security reasons, it will not be shown again.
                  </p>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <code className="flex-1 text-xs font-mono bg-black/40 border border-white/5 px-3 py-2.5 text-gray-300 rounded-sm select-all break-all">
                      {createdKey}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2.5 text-xs font-black uppercase tracking-widest bg-emerald-400 text-black hover:bg-emerald-300 transition-all rounded-sm flex-shrink-0"
                    >
                      {copied ? 'Copied!' : 'Copy & Close'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* API Keys List */}
            <div className="bg-[#0C0F12] border border-white/5 p-6 rounded-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key size={14} className="text-electric-blue" />
                  <h3 className="text-xxs font-black uppercase tracking-widest text-gray-400">API Credentials</h3>
                </div>
                {!creating && (
                  <button
                    onClick={() => setCreating(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-electric-blue hover:text-cyan-300 transition-colors flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Generate Key</span>
                  </button>
                )}
              </div>

              {/* Create Form */}
              <AnimatePresence>
                {creating && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-5 bg-black/40 border border-white/5 rounded-sm space-y-4"
                  >
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2">Key Label / Name</label>
                      <input
                        type="text"
                        value={newKeyName}
                        onChange={e => setNewKeyName(e.target.value)}
                        placeholder="e.g. Mandi Logistics Sync"
                        className="w-full bg-[#161A1F] border border-white/5 text-white text-xs px-3 py-2.5 outline-none focus:border-electric-blue/40 font-medium transition-colors rounded-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block">Granular Permissions Scopes</label>
                      <div className="space-y-2.5">
                        {AVAILABLE_SCOPES.map(s => (
                          <label key={s.id} className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={newKeyScopes.includes(s.id)}
                              onChange={e => {
                                setNewKeyScopes(prev =>
                                  e.target.checked
                                    ? [...prev, s.id]
                                    : prev.filter(x => x !== s.id)
                                );
                              }}
                              className="mt-0.5 rounded-sm border-white/10 bg-black/20 text-electric-blue focus:ring-0"
                            />
                            <div>
                              <p className="text-xs text-white font-medium group-hover:text-electric-blue transition-colors">{s.label}</p>
                              <p className="text-[10px] text-gray-500 leading-relaxed font-medium">{s.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setCreating(false)}
                        className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest border border-white/10 text-gray-400 hover:border-white/20 transition-all rounded-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={createApiKey}
                        disabled={!newKeyName.trim()}
                        className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest bg-electric-blue text-black hover:bg-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-sm"
                      >
                        Generate Secret
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* List */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 text-electric-blue animate-spin" />
                </div>
              ) : apiKeys.length === 0 && !creating ? (
                <div className="py-12 border border-dashed border-white/5 rounded-sm text-center flex flex-col items-center justify-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-gray-700" />
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">No active API credentials found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key: any) => (
                    <div key={key.id} className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-sm hover:border-white/10 transition-colors">
                      <div>
                        <p className="text-xs font-black uppercase text-white tracking-tight">{key.name}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500 font-mono">
                          <code className="bg-white/5 px-1.5 py-0.5 rounded-sm text-electric-blue font-bold">{key.key_prefix}...</code>
                          <span>·</span>
                          <span className="uppercase text-[9px] font-black tracking-wider text-gray-400">Scopes: {key.scopes.join(', ')}</span>
                          <span>·</span>
                          <span>{key.total_requests} requests</span>
                        </div>
                      </div>
                      <button
                        onClick={() => revokeKey(key.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        <span>Revoke</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Sandbox Documentation */}
            <div className="bg-[#0C0F12] border border-white/5 p-6 rounded-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code size={14} className="text-electric-blue" />
                  <h3 className="text-xxs font-black uppercase tracking-widest text-gray-400">Core REST Endpoints</h3>
                </div>
                <span className="text-[8px] font-black px-2 py-0.5 bg-electric-blue/5 border border-electric-blue/10 text-electric-blue rounded-full">HTTPS ONLY</span>
              </div>

              <div className="space-y-3">
                {[
                  { method: 'GET', path: '/v1/invoices', desc: 'Query and filter standard ledger sales & invoices' },
                  { method: 'POST', path: '/v1/invoices', desc: 'Create new invoices directly from supply logs' },
                  { method: 'GET', path: '/v1/inventory', desc: 'Fetch live SKU stocks, locations, and reorder alerts' },
                  { method: 'GET', path: '/v1/parties', desc: 'List active buyers, suppliers, and transaction histories' },
                  { method: 'GET', path: '/v1/karigars', desc: 'Fetch active labor registries and profile indexes' },
                ].map(ep => (
                  <div key={ep.path} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-black/20 border border-white/5 rounded-sm">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded-sm ${
                        ep.method === 'GET' ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10' : 'text-cyan-400 bg-cyan-500/5 border border-cyan-500/10'
                      }`}>
                        {ep.method}
                      </span>
                      <code className="text-xs font-mono text-gray-300 font-bold">{ep.path}</code>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column (Instructions & Webhooks) */}
          <div className="space-y-8">
            
            {/* Quick Sandbox Start */}
            <div className="bg-[#0C0F12] border border-white/5 p-6 rounded-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1/2 h-[1px] bg-electric-blue" />
              <h3 className="text-xxs font-black uppercase tracking-widest text-gray-400 mb-3">Quick Sandbox CURL</h3>
              <div className="p-3 bg-black/50 border border-white/5 rounded-sm font-mono text-[10px] text-gray-400 leading-relaxed break-all select-all">
                curl -X GET "https://api.noxishub.app/v1/inventory" \<br />
                &nbsp;&nbsp;-H "Authorization: Bearer noxis_key"
              </div>
              <p className="text-[9px] text-gray-600 mt-2 font-semibold uppercase tracking-wider">
                Replace <code className="text-electric-blue select-none font-bold font-mono">noxis_key</code> with your generated API credential.
              </p>
            </div>

            {/* Webhook Endpoint Summary */}
            <div className="bg-[#0C0F12] border border-white/5 p-6 rounded-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-electric-blue" />
                  <h3 className="text-xxs font-black uppercase tracking-widest text-gray-400">Webhooks</h3>
                </div>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{webhooks.length} endpoints</span>
              </div>
              
              <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                Configure HTTP callbacks to receive real-time notifications when invoices are paid, karigars production is logged, or stock reorder alerts trigger.
              </p>
              
              <div className="p-3 bg-black/20 border border-white/5 rounded-sm text-center">
                <span className="text-[9px] font-black uppercase text-electric-blue tracking-widest block">Webhooks Management</span>
                <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest block mt-1">Configurable via CLI/Core settings</span>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
