"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Globe, MapPin, 
  ShieldCheck, Upload, Save, 
  CheckCircle2, Loader2,
  Settings, Calculator
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";

import { useSidebarState } from "@/hooks/useSidebarState";
import { cn } from "@/lib/utils";
import Image from "next/image";

// --- Validation ---
const profileSchema = z.object({
  business_name: z.string().min(2, "Business name is required"),
  industry_key: z.string().min(1, "Industry type is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country_code: z.string().length(2, "Use 2-letter ISO code (e.g. PK)"),
  currency: z.string().min(1, "Currency is required"),
  region: z.enum(['south_asian', 'international']),
  tax_label: z.string().optional(),
  tax_rate: z.coerce.number().min(0).max(100),
  date_format: z.string(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function BusinessProfilePage() {
  const { profile, setProfile } = useBusinessProfile();
  const { isCollapsed } = useSidebarState();
  const supabase = createClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [manualLogoPreview, setManualLogoPreview] = useState<string | null>(null);
  const logoPreview = manualLogoPreview || profile?.logo_url || null;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const currentAvatar = avatarPreview || profile?.avatar_url || null;

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        business_name: profile.business_name || "",
        industry_key: profile.industry_key || "textile_garments",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        country_code: profile.country_code || "PK",
        currency: profile.currency || "PKR",
        region: profile.region || "south_asian",
        tax_label: profile.tax_label || "GST",
        tax_rate: profile.tax_rate || 0,
        date_format: profile.date_format || "DD/MM/YYYY",
      });
    }
  }, [profile, reset]);

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) return alert("Logo must be under 1MB");
      setSelectedFile(file);
      setManualLogoPreview(URL.createObjectURL(file));
    }
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    
    if (file.size > 1024 * 1024) return alert("Avatar must be under 1MB");
    
    // Optimistic UI
    setAvatarPreview(URL.createObjectURL(file));
    
    try {
      const ext = file.name.split('.').pop();
      const path = `${profile.id}/avatar.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      
      // Update DB
      const { data: updatedProfile, error: dbError } = await supabase
        .from('business_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)
        .select()
        .single();
        
      if (dbError) throw dbError;
      
      setProfile(updatedProfile);
    } catch (err: any) {
      alert("Avatar upload failed: " + err.message);
    }
  };

  const syncLogoToLocal = async (url: string) => {
    // If running in Electron environment, we notify the main process to cache the logo
    if (typeof window !== 'undefined' && (window as any).electron) {
      try {
        await (window as any).electron.invoke('cache-logo', url);
        console.log("Logo cached locally for offline use.");
      } catch (err) {
        console.error("Failed to cache logo locally:", err);
      }
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!profile?.id) return;
    setIsSubmitting(true);
    setSuccessMsg(null);

    try {
      let logoUrl = profile.logo_url;

      // 1. Upload Logo if changed
      if (selectedFile) {
        const ext = selectedFile.name.split('.').pop();
        const path = `logos/${profile.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('business-assets')
          .upload(path, selectedFile, { upsert: true });

        if (uploadError) {
           console.error("Logo upload error:", uploadError);
           // Fallback or alert
        } else {
           const { data: { publicUrl } } = supabase.storage.from('business-assets').getPublicUrl(path);
           logoUrl = publicUrl;
           if (logoUrl) await syncLogoToLocal(logoUrl);
        }
      }

      // 2. Update Profile
      const { data, error } = await supabase
        .from('business_profiles')
        .update({
          ...values,
          logo_url: logoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      setSuccessMsg("Industrial profile synchronized successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  

  return (
    <div className="min-h-screen bg-onyx text-slate-200 font-inter flex">
      
      
      <main className={cn( "flex-1 transition-all duration-300 min-h-screen flex flex-col")}>
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-surface/80 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center space-x-3">
              <div className="p-2 bg-sandstone-gold/10 text-sandstone-gold rounded-sm">
                 <Building2 size={18} />
              </div>
              <div>
                 <h1 className="text-sm font-black uppercase tracking-widest text-white">Business Identity</h1>
                 <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Global configuration & persona management</p>
              </div>
           </div>
           
           <div className="ml-auto flex items-center space-x-4">
              <AnimatePresence>
                 {successMsg && (
                   <motion.div 
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: 20 }}
                     className="flex items-center space-x-2 text-emerald text-[10px] font-bold uppercase tracking-widest"
                   >
                      <CheckCircle2 size={14} />
                      <span>{successMsg}</span>
                   </motion.div>
                 )}
              </AnimatePresence>
              <button 
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-6 py-2 bg-sandstone-gold text-onyx text-[10px] uppercase tracking-widest font-black hover:brightness-110 transition-all shadow-lg disabled:opacity-50"
              >
                 {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                 <span>Commit Changes</span>
              </button>
           </div>
        </header>

        <div className="flex-1 p-8 max-w-[1200px] mx-auto w-full">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Visual Identity */}
              <div className="lg:col-span-1 space-y-6">
                 <div className="bg-surface border border-white/5 p-8 text-center space-y-6 rounded-sm">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center space-y-4 pb-6 mb-6 border-b border-white/5">
                       <div className="relative group w-20 h-20">
                          <div className="w-full h-full rounded-full bg-electric-blue flex items-center justify-center text-white text-2xl font-mono overflow-hidden border-2 border-white/10 shadow-2xl relative">
                             {currentAvatar ? (
                               <Image src={currentAvatar} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
                             ) : (
                               (profile?.business_name?.[0] || 'N').toUpperCase()
                             )}
                          </div>
                          <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                             <Upload size={16} className="text-white" />
                             <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={onAvatarChange} />
                          </label>
                       </div>
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Personal Avatar</p>
                    </div>

                    <div className="relative w-32 h-32 mx-auto group">
                       <div className="w-full h-full bg-onyx border border-dashed border-white/10 rounded-sm flex items-center justify-center overflow-hidden">
                          {logoPreview ? (
                            <Image src={logoPreview} alt="Logo" fill className="object-contain p-2" unoptimized />
                          ) : (
                            <Building2 size={40} className="text-gray-800" />
                          )}
                       </div>
                       <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Upload size={20} className="text-white" />
                          <input type="file" className="hidden" accept="image/*" onChange={onLogoChange} />
                       </label>
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-white font-bold uppercase tracking-tight">{profile?.business_name || "New Business"}</h3>
                       <p className="text-[10px] text-gray-500 font-mono uppercase">{profile?.industry_key || "unspecified_industry"}</p>
                    </div>
                    <div className="pt-4 border-t border-white/5">
                       <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-600">
                          <span>Status</span>
                          <span className="text-emerald">Active Node</span>
                       </div>
                    </div>
                 </div>

                 <div className="bg-surface border border-white/5 p-6 rounded-sm space-y-4">
                    <div className="flex items-center space-x-3 text-sandstone-gold">
                       <ShieldCheck size={16} />
                       <h4 className="text-[10px] font-black uppercase tracking-widest">Security Credentials</h4>
                    </div>
                    <p className="text-[9px] text-gray-500 leading-relaxed font-bold">Your industrial ID is cryptographically linked to your user session. Only authorized controllers can modify these parameters.</p>
                 </div>
              </div>

              {/* Right Column: Configuration Form */}
              <div className="lg:col-span-2 space-y-8">
                 <form className="space-y-8 pb-20">
                    <div className="space-y-6">
                       <SectionHeader icon={Settings} title="Primary Identity" />
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2 col-span-2">
                             <Label>Official Business Name</Label>
                             <Input {...register("business_name")} />
                             {errors.business_name && <ErrorMsg>{errors.business_name.message}</ErrorMsg>}
                          </div>
                          <div className="space-y-2">
                             <Label>Industry Persona</Label>
                             <select {...register("industry_key")} className="industrial-select">
                                <option value="textile_garments">Textile & Garments</option>
                                <option value="pharmaceutical">Pharmaceutical</option>
                                <option value="logistics">Logistics & Warehousing</option>
                                <option value="food_processing">Food & Beverage</option>
                                <option value="general_trade">General Trade</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <Label>Contact Phone</Label>
                             <Input {...register("phone")} />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <SectionHeader icon={Globe} title="Regional & Fiscal" />
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <Label>Region Mode</Label>
                             <select {...register("region")} className="industrial-select">
                                <option value="south_asian">South Asian (Lakh-based)</option>
                                <option value="international">International (Western)</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <Label>Currency Code</Label>
                             <Input {...register("currency")} placeholder="e.g. PKR, USD" />
                          </div>
                          <div className="space-y-2">
                             <Label>Country Code (ISO)</Label>
                             <Input {...register("country_code")} maxLength={2} />
                          </div>
                          <div className="space-y-2">
                             <Label>Date Format</Label>
                             <select {...register("date_format")} className="industrial-select">
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                             </select>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <SectionHeader icon={Calculator} title="Taxation & Compliance" />
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-onyx/50 border border-white/5 rounded-sm">
                          <div className="space-y-2">
                             <Label>Tax Label</Label>
                             <Input {...register("tax_label")} placeholder="GST / VAT" />
                          </div>
                          <div className="space-y-2">
                             <Label>Default Rate (%)</Label>
                             <Input type="number" step="0.01" {...register("tax_rate")} />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <SectionHeader icon={MapPin} title="Operational Headquarters" />
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2 col-span-2">
                             <Label>Street Address</Label>
                             <textarea 
                               {...register("address")} 
                               className="w-full bg-onyx border border-white/10 p-4 text-xs text-white focus:border-sandstone-gold outline-none transition-all h-24 resize-none rounded-sm"
                             />
                          </div>
                          <div className="space-y-2">
                             <Label>City</Label>
                             <Input {...register("city")} />
                          </div>
                       </div>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      </main>

      <style jsx global>{`
        .industrial-select {
          width: 100%;
          background: #1A1D21;
          border: 1px solid rgba(255,255,255,0.05);
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.75rem;
          outline: none;
          transition: all 0.2s;
          border-radius: 2px;
          cursor: pointer;
        }
        .industrial-select:focus {
          border-color: #C5A059;
        }
      `}</style>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: any, title: string }) {
  return (
    <div className="flex items-center space-x-3 pb-2 border-b border-white/5">
       <Icon size={16} className="text-gray-500" />
       <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{title}</h2>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block ml-1">{children}</label>;
}

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <input 
    ref={ref}
    {...props} 
    className="w-full bg-[#1A1D21] border border-white/5 px-4 py-3 text-xs text-white focus:border-sandstone-gold/50 outline-none transition-all rounded-sm" 
  />
));
Input.displayName = "Input";

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-critical-red font-bold uppercase mt-1 ml-1">{children}</p>;
}
