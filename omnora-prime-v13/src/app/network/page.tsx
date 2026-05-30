'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Shield, Users, Inbox, ArrowUpRight, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { GLOBAL_INDUSTRIES, getIndustryLabel } from '@/lib/network/industries';

const COUNTRY_NAMES: Record<string, string> = {
  PK: 'Pakistan',
  AE: 'UAE',
  BD: 'Bangladesh',
  TR: 'Turkey',
  ID: 'Indonesia',
  VN: 'Vietnam',
  MA: 'Morocco',
  GB: 'UK',
  ET: 'Ethiopia',
  CA: 'Canada',
};

const getPrivacyNotice = (countryCode: string) => {
  if (['GB', 'DE', 'FR', 'IT', 'ES',
       'NL', 'BE', 'SE', 'NO'].includes(
    countryCode
  )) {
    return `Under GDPR, you have the right to access, correct, and delete your data. Only your industry and city are shown publicly. Contact support@omnoralabs.com to exercise your rights.`
  }
  if (countryCode === 'US') {
    return `Your data is processed according to our Privacy Policy. Only your industry and city are shown publicly.`
  }
  // Default (Pakistan, UAE, etc.)
  return `Only your industry and city are shown publicly. No financial data. No customer lists. You can leave the network anytime.`
}

export default function NetworkPage() {
  const { profile } = useBusinessProfile();
  const supabase = createClient();
  
  const [networkProfile, setNetworkProfile] = useState<Record<string, any> | null>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [stats, setStats] = useState({
    inYourCountry: 0,
    inYourCity: 0,
    inYourIndustry: 0,
  });
  
  const lang = profile?.preferred_locale || 'en';
  
  useEffect(() => {
    loadNetworkStats();
    loadOwnProfile();
  }, [profile?.id, profile?.country_code, profile?.city, profile?.industry_key]);
  
  const loadNetworkStats = async () => {
    const userCountry = profile?.country_code || 'PK';
    const userCity = profile?.city || '';
    const userIndustry = profile?.industry_key || '';
    
    const [countryCount, cityCount, industryCount] = await Promise.all([
      supabase
        .from('network_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_visible', true)
        .eq('country_code', userCountry),
      
      supabase
        .from('network_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_visible', true)
        .ilike('city', `%${userCity}%`),
      
      supabase
        .from('network_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_visible', true)
        .eq('industry', userIndustry),
    ]);
    
    setStats({
      inYourCountry: countryCount.count || 0,
      inYourCity: cityCount.count || 0,
      inYourIndustry: industryCount.count || 0,
    });
  };
  
  const loadOwnProfile = async () => {
    if (!profile?.id) return;
    
    const { data } = await supabase
      .from('network_profiles')
      .select('*')
      .eq('business_id', profile.id)
      .maybeSingle();
    
    setNetworkProfile(data);
    setJoined(data?.is_visible || false);
  };
  
  const handleJoinNetwork = async () => {
    if (!profile?.id) return;
    setJoining(true);
    
    const profileData = {
      business_id: profile.id,
      display_name: profile.business_name || 'Anonymous Factory',
      industry: profile.industry_key || 'general',
      city: profile.city || '',
      country_code: profile.country_code || 'PK',
      is_visible: true,
      joined_network_at: new Date().toISOString(),
    };
    
    await supabase
      .from('network_profiles')
      .upsert(profileData, {
        onConflict: 'business_id'
      });
    
    setJoined(true);
    setJoining(false);
    loadNetworkStats();
  };
  
  return (
    <div className="min-h-screen bg-[#0F1113] text-gray-200 select-none flex flex-col font-sans">
      <div className="max-w-4xl mx-auto p-8 w-full flex-1 space-y-10 relative">
        {/* Sleek top glowing orb */}
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-electric-blue/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 text-center md:text-left space-y-6"
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#60A5FA]/8 border border-[#60A5FA]/20 px-3.5 py-1.5 rounded-full mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#60A5FA] animate-pulse" />
              <span className="text-[10px] font-black text-[#60A5FA] uppercase tracking-widest">
                Early Access
              </span>
            </div>
            
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic flex items-center justify-center md:justify-start gap-3">
              <Globe className="text-electric-blue animate-spin-slow" size={28} />
              <span>Noxis Factory Network</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
              Connect with verified factories across Pakistan, UAE, Bangladesh, Turkey and beyond. Find suppliers. Sell surplus. Trade directly.
            </p>
          </div>

          {/* Scrolling country chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
            {[
              { code: 'PK', flag: '🇵🇰', name: 'Pakistan' },
              { code: 'AE', flag: '🇦🇪', name: 'UAE' },
              { code: 'BD', flag: '🇧🇩', name: 'Bangladesh' },
              { code: 'TR', flag: '🇹🇷', name: 'Turkey' },
              { code: 'ID', flag: '🇮🇩', name: 'Indonesia' },
              { code: 'VN', flag: '🇻🇳', name: 'Vietnam' },
              { code: 'MA', flag: '🇲🇦', name: 'Morocco' },
              { code: 'GB', flag: '🇬🇧', name: 'UK' },
              { code: 'ET', flag: '🇪🇹', name: 'Ethiopia' },
              { code: 'CA', flag: '🇨🇦', name: 'Canada' },
            ].map(c => (
              <div key={c.code}
                className="flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0 bg-[#0F1114] border border-white/6 rounded-full text-xs text-gray-400"
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </div>
            ))}
          </div>

          {/* International industries grid */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">
              Active industries
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(GLOBAL_INDUSTRIES).map(([key, names]) => (
                <div key={key}
                  className="px-3 py-1.5 bg-[#0F1114] border border-white/6 rounded-full text-xs text-gray-400"
                >
                  {names.en}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            {
              value: stats.inYourCountry,
              label: `${COUNTRY_NAMES[profile?.country_code || 'PK'] || profile?.country_code || 'PK'} factories`,
              icon: Globe,
            },
            {
              value: stats.inYourCity,
              label: `in ${profile?.city || 'Your City'}`,
              icon: Users,
            },
            {
              value: stats.inYourIndustry,
              label: `in ${getIndustryLabel(profile?.industry_key || '', lang)} globally`,
              icon: Inbox,
            },
          ].map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx}
                className="relative group p-6 bg-[#16191C]/80 border border-white/5 hover:border-white/10 transition-all rounded-sm text-center flex flex-col items-center justify-center overflow-hidden shadow-2xl"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.02)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <Icon size={16} className="text-gray-500 mb-2 group-hover:text-electric-blue transition-colors" />
                <p className="text-2xl font-black font-mono text-white tracking-tight">
                  {s.value}
                </p>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                  {s.label}
                </p>
              </div>
            );
          })}
        </motion.div>
        
        {/* What it is */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {[
            {
              icon: '🏭',
              title: 'Find suppliers near you',
              desc: 'See which factories in your city make what you need. Contact them directly.',
            },
            {
              icon: '📦',
              title: 'Sell surplus stock',
              desc: 'List excess inventory and let nearby factories find you.',
            },
            {
              icon: '🤝',
              title: 'Verified businesses only',
              desc: 'Every factory on the network is a verified Noxis user with real transaction history.',
            },
            {
              icon: '🔒',
              title: 'Your data stays private',
              desc: 'Only your city and industry are shown publicly. No financial data. No customer lists.',
            },
          ].map((item, idx) => (
            <div key={idx}
              className="flex items-start gap-4 p-5 bg-[#16191C]/80 border border-white/5 hover:border-white/10 transition-all rounded-sm shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <span className="text-5xl">{item.icon}</span>
              </div>
              <span className="text-2xl flex-shrink-0 relative z-10 bg-white/5 p-2 rounded-sm">
                {item.icon}
              </span>
              <div className="relative z-10">
                <p className="text-sm font-bold text-white mb-1 uppercase tracking-tight">
                  {item.title}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
        
        {/* Join / Status */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative z-10"
        >
          {joined ? (
            <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-sm text-center space-y-4 shadow-2xl">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 rounded-full animate-pulse">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400">
                  ✓ You are on the Noxis Network
                </h3>
              </div>
              <p className="text-xs text-gray-400 max-w-md mx-auto font-medium">
                Your factory node is visible. Other verified factories can discover your location and industry to request collaborations.
              </p>
              <button
                onClick={() => {}}
                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors bg-white/5 border border-white/10 px-4 py-2 hover:bg-white/10"
              >
                Manage your listing →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleJoinNetwork}
                disabled={joining}
                className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] bg-electric-blue text-black hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_25px_rgba(0,112,243,0.25)]"
              >
                {joining ? 'Connecting Node...' : 'Join the Network — Free'}
              </button>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center max-w-lg mx-auto leading-relaxed">
                🔒 {getPrivacyNotice(profile?.country_code || 'PK')}
              </p>
            </div>
          )}
        </motion.div>
        
        {/* Coming soon */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="p-6 bg-[#16191C]/50 border border-white/5 rounded-sm shadow-inner"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">
            Roadmap / Incoming Infrastructure
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Direct B2B orders between Noxis factories',
              'Verified supplier ratings & ledgers',
              'Real-time local industry price benchmarks',
              'Working capital trade financing deals',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-black/20 p-3 border border-white/[0.02]">
                <div className="w-1.5 h-1.5 rounded-full bg-electric-blue/50 shrink-0" />
                <span className="text-xs text-gray-400 font-medium">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
