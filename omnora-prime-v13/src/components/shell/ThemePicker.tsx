"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Palette, X, Check, Star, Settings2, 
  Monitor, Layout, Type, Info, Zap,
  Briefcase, Activity, Target
} from "lucide-react";
import { themes, ThemeId, Theme } from "@/lib/themes/themes";
import { useThemeStore } from "@/stores/themeStore";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

export default function ThemePicker({ hideTrigger = false }: { hideTrigger?: boolean }) {
  const { 
    activeThemeId, 
    setTheme, 
    isPanelOpen, 
    setIsPanelOpen,
    customAccentColor,
    customFinancialColor,
    setCustomColors
  } = useThemeStore();
  const { profile, setProfile } = useBusinessProfile();
  const { toast } = useToast();
  const [hoveredThemeId, setHoveredThemeId] = useState<ThemeId | null>(null);

  // Industry recommendation logic
  const recommendedTheme = themes.find(t => 
    t.industry.includes(profile?.industry_key || 'general')
  ) || themes[0];

  // Shortcut Listener: Ctrl+T
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        setIsPanelOpen(!isPanelOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen, setIsPanelOpen]);

  const handleThemeSelect = async (id: ThemeId) => {
    setTheme(id);
    
    // Save to local profile store immediately to prevent AppShell reverting it
    if (profile) {
      setProfile({ ...profile, visual_theme: id } as any);
    }
    
    // Save to Database if profile exists
    if (profile?.id) {
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'business_profile', 
            data: { ...profile, visual_theme: id } 
          })
        });
      } catch (err) {
        console.error("Failed to persist theme to database:", err);
      }
    }

    toast({
      title: "Theme applied",
      message: `Workspace updated to ${themes.find(t => t.id === id)?.name}`,
      type: "success"
    });
  };

  return (
    <>
      {/* Trigger button for Settings page */}
      {!hideTrigger && (
        <button 
          onClick={() => setIsPanelOpen(true)}
          className="group flex items-center space-x-4 p-6 bg-white/5 border border-white/5 rounded-sm hover:bg-white/10 transition-all text-left w-full"
        >
          <div className="p-3 bg-electric-blue/10 rounded-sm text-electric-blue group-hover:scale-110 transition-transform">
            <Palette size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Advanced Theme Selector</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Customize your industrial workspace experience</p>
          </div>
          <div className="px-3 py-1 bg-white/5 rounded-sm text-[8px] font-black uppercase tracking-tighter text-gray-600">
            Ctrl + T
          </div>
        </button>
      )}

      <AnimatePresence>
        {isPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPanelOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />

            {/* Panel */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[480px] glass-panel z-[101] flex flex-col shadow-[-50px_0_100px_rgba(0,0,0,0.5)] border-l border-white/10"
            >
              {/* Header */}
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Personalize Your Workspace</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Theme changes apply instantly</p>
                </div>
                <button 
                  onClick={() => setIsPanelOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-sm transition-colors text-gray-500 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-12">
                {/* Recommendation */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-electric-blue">
                    <Target size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Recommended for {profile?.industry_key || 'Your Industry'}</span>
                  </div>
                  <ThemeCard 
                    theme={recommendedTheme} 
                    isActive={activeThemeId === recommendedTheme.id}
                    isRecommended={true}
                    onSelect={() => handleThemeSelect(recommendedTheme.id)}
                    onHover={() => setHoveredThemeId(recommendedTheme.id)}
                    onLeave={() => setHoveredThemeId(null)}
                  />
                </div>

                {/* Theme List */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-l-2 border-white/10 pl-4">Industrial Presets</h3>
                  <div className="space-y-4">
                    {themes.filter(t => t.id !== recommendedTheme.id).map(theme => (
                      <ThemeCard 
                        key={theme.id}
                        theme={theme}
                        isActive={activeThemeId === theme.id}
                        onSelect={() => handleThemeSelect(theme.id)}
                        onHover={() => setHoveredThemeId(theme.id)}
                        onLeave={() => setHoveredThemeId(null)}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Accent */}
                <div className="pt-8 border-t border-white/5 space-y-6">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Custom Accent</h3>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Override primary and financial brand colors</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3 p-4 bg-white/5 rounded-sm">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block">Primary Accent</label>
                      <div className="flex items-center space-x-4">
                        <input 
                          type="color" 
                          value={customAccentColor || themes.find(t => t.id === activeThemeId)?.colors.primary}
                          onChange={(e) => setCustomColors(e.target.value, customFinancialColor)}
                          className="w-10 h-10 bg-transparent border-none cursor-pointer rounded-sm"
                        />
                        <span className="font-mono text-[10px] text-gray-400 uppercase">{customAccentColor || 'Default'}</span>
                      </div>
                    </div>
                    <div className="space-y-3 p-4 bg-white/5 rounded-sm">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block">Financial Glow</label>
                      <div className="flex items-center space-x-4">
                        <input 
                          type="color" 
                          value={customFinancialColor || themes.find(t => t.id === activeThemeId)?.colors.financial}
                          onChange={(e) => setCustomColors(customAccentColor, e.target.value)}
                          className="w-10 h-10 bg-transparent border-none cursor-pointer rounded-sm"
                        />
                        <span className="font-mono text-[10px] text-gray-400 uppercase">{customFinancialColor || 'Default'}</span>
                      </div>
                    </div>
                  </div>
                  {(customAccentColor || customFinancialColor) && (
                    <button 
                      onClick={() => setCustomColors(null, null)}
                      className="text-[9px] font-black uppercase text-red-500/50 hover:text-red-500 transition-colors"
                    >
                      Reset to defaults
                    </button>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-white/5 bg-white/5">
                 <div className="flex items-center space-x-4 text-gray-600">
                    <Zap size={14} />
                    <p className="text-[8px] font-bold uppercase tracking-widest">Transitions are Hardware Accelerated</p>
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function ThemeCard({ 
  theme, 
  isActive, 
  isRecommended, 
  onSelect, 
  onHover, 
  onLeave 
}: { 
  theme: Theme, 
  isActive: boolean, 
  isRecommended?: boolean,
  onSelect: () => void,
  onHover: () => void,
  onLeave: () => void
}) {
  return (
    <motion.button
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      whileTap={{ scale: 0.98 }}
      animate={isActive ? { scale: 1.02 } : { scale: 1 }}
      className={cn(
        "w-full text-left rounded-sm border transition-all overflow-hidden group",
        isActive 
          ? "border-electric-blue bg-electric-blue/5 shadow-[0_10px_30px_rgba(45,185,255,0.1)]" 
          : "border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10"
      )}
    >
      <div className="h-20 w-full relative bg-[#0F1113] overflow-hidden p-2">
        <ThemePreview theme={theme} />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-white flex items-center space-x-2">
            <span>Apply Preview</span>
            <Activity size={10} className="text-electric-blue" />
          </p>
        </div>
      </div>
      
      <div className="p-4 flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-xs font-black uppercase tracking-tighter text-white">{theme.name}</h4>
            {isRecommended && (
               <span className="px-1.5 py-0.5 bg-electric-blue text-[7px] font-black uppercase text-white rounded-[2px]">Best Match</span>
            )}
          </div>
          <p className="text-[9px] text-gray-500 font-bold uppercase mt-1 leading-tight">{theme.description}</p>
          <div className="flex gap-2 mt-3">
             {theme.industry.map(ind => (
                <span key={ind} className="text-[7px] font-black uppercase tracking-widest text-gray-600 bg-white/5 px-2 py-0.5 rounded-[1px]">
                   {ind}
                </span>
             ))}
          </div>
        </div>
        {isActive && (
          <div className="p-1.5 bg-electric-blue rounded-full text-white">
            <Check size={12} />
          </div>
        )}
      </div>
    </motion.button>
  );
}

function ThemePreview({ theme }: { theme: Theme }) {
  return (
    <svg width="100%" height="80" viewBox="0 0 400 80" className="opacity-80 group-hover:opacity-100 group-hover:brightness-110 transition-all duration-300">
      {/* Background */}
      <rect width="400" height="80" fill={theme.colors.background} />
      
      {/* Sidebar */}
      <rect width="80" height="80" fill={theme.colors.surface} fillOpacity="0.8" />
      <rect width="4" height="80" fill={theme.colors.primary} fillOpacity="0.5" />
      
      {/* Content Area */}
      <rect x="90" y="10" width="300" height="60" fill="transparent" />
      
      {/* Header Bar */}
      <rect x="90" y="5" width="300" height="10" fill={theme.colors.surface} />
      
      {/* Fake Cards */}
      <rect x="100" y="25" width="60" height="40" rx="2" fill={theme.colors.surface} />
      <rect x="170" y="25" width="60" height="40" rx="2" fill={theme.colors.surface} />
      <rect x="240" y="25" width="60" height="40" rx="2" fill={theme.colors.surface} />
      
      {/* Accents */}
      <rect x="105" y="30" width="20" height="4" rx="1" fill={theme.colors.primary} />
      <rect x="175" y="30" width="20" height="4" rx="1" fill={theme.colors.primary} />
      
      {/* Financial Number */}
      <text x="105" y="55" fill={theme.colors.financial} fontSize="12" fontWeight="900" fontFamily="monospace">$8,420</text>
      <text x="175" y="55" fill={theme.colors.financial} fontSize="12" fontWeight="900" fontFamily="monospace">94%</text>
      
      {/* Text Muted placeholders */}
      <rect x="245" y="30" width="40" height="2" fill={theme.colors.textMuted} />
      <rect x="245" y="36" width="30" height="2" fill={theme.colors.textMuted} />
    </svg>
  );
}
