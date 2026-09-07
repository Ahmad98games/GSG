"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { 
  Check, ShieldAlert, CheckCircle2, Factory,
  Package, Search, Smartphone, Globe, Upload,
  Scissors, Pill, Wrench, Wheat, Store, UtensilsCrossed,
  Sparkles, Lock, ArrowRight, Compass
} from "lucide-react";
import { useBusinessProfileStore } from "@/store/BusinessProfileStore";
import { useThemeStore } from "@/stores/themeStore";
import { cn } from "@/lib/utils";
import { INDUSTRY_CONFIGS, IndustryKey } from '@/lib/industry/configs';
import { CurrencyCode } from "@/lib/currency/currencyEngine";
import { useToast } from "@/hooks/useToast";
import { humanizeError } from "@/lib/utils/errors";
import { seedChartOfAccounts } from "@/lib/accounting/seedAccounts";

// --- Country Infrastructure Setup ---
export type CountrySetup = {
  code: string;
  name: string;
  flag: string;
  currency: CurrencyCode;
  taxSystem: string;
  taxRate: number;
  taxLabel: string;
  phonePrefix: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  fiscalYearStart: string;
  language: string;
  popular?: boolean;
};

export const PRIMARY_COUNTRIES: CountrySetup[] = [
  {
    code: 'PK',
    name: 'Pakistan',
    flag: '🇵🇰',
    currency: 'PKR',
    taxSystem: 'GST',
    taxRate: 17,
    taxLabel: 'NTN',
    phonePrefix: '+92',
    dateFormat: 'DD/MM/YYYY',
    fiscalYearStart: '01-07', // July 1st
    language: 'ur',
    popular: true
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    taxSystem: 'VAT',
    taxRate: 5,
    taxLabel: 'TRN',
    phonePrefix: '+971',
    dateFormat: 'DD/MM/YYYY',
    fiscalYearStart: '01-01',
    language: 'en',
    popular: true
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    currency: 'SAR',
    taxSystem: 'VAT',
    taxRate: 15,
    taxLabel: 'TRN',
    phonePrefix: '+966',
    dateFormat: 'DD/MM/YYYY',
    fiscalYearStart: '01-01',
    language: 'ar',
    popular: true
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    taxSystem: 'VAT',
    taxRate: 20,
    taxLabel: 'VAT Number',
    phonePrefix: '+44',
    dateFormat: 'DD/MM/YYYY',
    fiscalYearStart: '06-04',
    language: 'en',
    popular: true
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    taxSystem: 'Sales Tax',
    taxRate: 0,
    taxLabel: 'EIN',
    phonePrefix: '+1',
    dateFormat: 'MM/DD/YYYY',
    fiscalYearStart: '01-01',
    language: 'en',
    popular: true
  },
  {
    code: 'BD',
    name: 'Bangladesh',
    flag: '🇧🇩',
    currency: 'BDT',
    taxSystem: 'VAT',
    taxRate: 15,
    taxLabel: 'BIN / VAT',
    phonePrefix: '+880',
    dateFormat: 'DD/MM/YYYY',
    fiscalYearStart: '01-07',
    language: 'bn',
    popular: true
  },
];

const ADDITIONAL_COUNTRIES: CountrySetup[] = [
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', taxSystem: 'GST', taxRate: 18, taxLabel: 'GSTIN', phonePrefix: '+91', dateFormat: 'DD/MM/YYYY', fiscalYearStart: '01-04', language: 'en' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', currency: 'TRY', taxSystem: 'KDV', taxRate: 18, taxLabel: 'Vergi No', phonePrefix: '+90', dateFormat: 'DD/MM/YYYY', fiscalYearStart: '01-01', language: 'tr' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', taxSystem: 'GST/HST', taxRate: 13, taxLabel: 'Business No', phonePrefix: '+1', dateFormat: 'DD/MM/YYYY', fiscalYearStart: '01-01', language: 'en' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', taxSystem: 'GST', taxRate: 10, taxLabel: 'ABN', phonePrefix: '+61', dateFormat: 'DD/MM/YYYY', fiscalYearStart: '01-07', language: 'en' },
];

const ALL_COUNTRIES = [...PRIMARY_COUNTRIES, ...ADDITIONAL_COUNTRIES];

const DEFAULT_COUNTRY: CountrySetup = PRIMARY_COUNTRIES[0]; // Pakistan by default

// --- 6 Curated Vertical Blueprints ---
export interface VerticalOption {
  key: IndustryKey;
  title: string;
  subtitle: string;
  icon: any;
  badge: string;
  color: string;
  borderColor: string;
  bgColor: string;
}

const VERTICAL_OPTIONS: VerticalOption[] = [
  {
    key: 'textile',
    title: 'Textile / Garments',
    subtitle: 'Karigar payroll, Thaan tracking, Meter billing',
    icon: Scissors,
    badge: 'Popular',
    color: '#60A5FA',
    borderColor: 'border-blue-500/40',
    bgColor: 'bg-blue-500/10'
  },
  {
    key: 'medical',
    title: 'Medical / Pharma',
    subtitle: 'Expiry alerts, Batch tracking, FIFO',
    icon: Pill,
    badge: 'Healthcare',
    color: '#34D399',
    borderColor: 'border-emerald-500/40',
    bgColor: 'bg-emerald-500/10'
  },
  {
    key: 'auto',
    title: 'Automotive / Parts',
    subtitle: 'OEM numbers, Vehicle tracking',
    icon: Wrench,
    badge: 'Distribution',
    color: '#F59E0B',
    borderColor: 'border-amber-500/40',
    bgColor: 'bg-amber-500/10'
  },
  {
    key: 'rice',
    title: 'Rice / Flour Mill',
    subtitle: 'Weighbridge, Bag tracking, Moisture',
    icon: Wheat,
    badge: 'Processing',
    color: '#EAB308',
    borderColor: 'border-yellow-500/40',
    bgColor: 'bg-yellow-500/10'
  },
  {
    key: 'general',
    title: 'General Trade / Retail',
    subtitle: 'Fast POS, Multi-category, Barcode',
    icon: Store,
    badge: 'Retail',
    color: '#A78BFA',
    borderColor: 'border-purple-500/40',
    bgColor: 'bg-purple-500/10'
  },
  {
    key: 'food',
    title: 'Restaurant / Food',
    subtitle: 'Table billing, Kitchen tickets, Recipes',
    icon: UtensilsCrossed,
    badge: 'Hospitality',
    color: '#F87171',
    borderColor: 'border-red-500/40',
    bgColor: 'bg-red-500/10'
  }
];

// --- Form Schema (4 Steps) ---
const setupSchema = z.object({
  country_code: z.string().min(1),
  currency: z.string().min(3),
  tax_system: z.string().min(1),
  tax_rate: z.coerce.number(),
  date_format: z.string(),
  fiscal_year_start: z.string(),
  industry_key: z.string().min(1, "Please select an industry vertical"),
  worker_term: z.string().default('karigar'),
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  owner_name: z.string().min(2, "Authorized owner name is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  city: z.string().min(2, "City is required"),
  tax_number: z.string().optional(),
  logo_url: z.string().optional(),
  pin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^[0-9]+$/, "Digits only"),
  confirmPin: z.string().length(4, "Please confirm 4-digit PIN"),
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs do not match",
  path: ["confirmPin"],
});

type SetupFormValues = z.infer<typeof setupSchema>;

export default function OnboardingPage() {
  const [step, setStep] = useState(0); // 0: Country, 1: Industry, 2: Profile, 3: Security PIN
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();
  const { setThemeByIndustry } = useThemeStore();

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      country_code: 'PK',
      currency: 'PKR',
      tax_system: 'GST',
      tax_rate: 17,
      date_format: 'DD/MM/YYYY',
      fiscal_year_start: '01-07',
      industry_key: 'textile',
      worker_term: 'karigar',
      business_name: '',
      owner_name: '',
      phone: '',
      city: '',
      tax_number: '',
      pin: '',
      confirmPin: '',
    }
  });

  const selectedCountryCode = watch('country_code');
  const selectedIndustryKey = watch('industry_key');
  const currentCountry = ALL_COUNTRIES.find(c => c.code === selectedCountryCode) || DEFAULT_COUNTRY;
  const phonePrefix = currentCountry.phonePrefix;

  // Auto-configure country tokens
  const handleCountrySelect = (c: CountrySetup) => {
    setValue('country_code', c.code);
    setValue('currency', c.currency);
    setValue('tax_system', c.taxSystem);
    setValue('tax_rate', c.taxRate);
    setValue('date_format', c.dateFormat);
    setValue('fiscal_year_start', c.fiscalYearStart);
  };

  // Auto-configure vertical tokens
  const handleIndustrySelect = (key: IndustryKey) => {
    setValue('industry_key', key);
    const ind = INDUSTRY_CONFIGS[key];
    if (ind) {
      setValue('worker_term', ind.terms.worker.toLowerCase());
      setThemeByIndustry(key);
    }
  };

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login");
    }
    checkAuth();
  }, [supabase, router]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLogoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: SetupFormValues) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      const formattedPhone = values.phone.startsWith('+') ? values.phone : `${phonePrefix}${values.phone.replace(/^0+/, '')}`;

      const { error } = await supabase.from("business_profiles").upsert({
        user_id: user.id,
        business_name: values.business_name,
        owner_name: values.owner_name,
        region: values.country_code === 'PK' || values.country_code === 'IN' || values.country_code === 'BD' ? 'south_asian' : 'international',
        country_code: values.country_code,
        industry_key: values.industry_key,
        industry: values.industry_key,
        industry_type: values.industry_key === 'textile' ? 'textile' : values.industry_key === 'medical' ? 'medical' : values.industry_key === 'auto' ? 'auto' : 'general',
        tax_name: values.tax_system,
        tax_rate: values.tax_rate,
        tax_label: currentCountry.taxLabel,
        phone: formattedPhone,
        city: values.city,
        tax_number: values.tax_number,
        role_pin_hash: values.pin,
        onboarding_done: true,
        persona_locked: true,
        worker_term: values.worker_term,
        stock_unit_primary: 'unit',
        currency: values.currency,
        role: 'manufacturer',
        whatsapp_numbers: [{ name: "Owner", phone: formattedPhone }],
        summary_frequency: 1,
        summary_time: '20:00',
        summary_includes: {
          revenue: true,
          production: true,
          low_stock: true,
          overdue: true,
          attendance: true,
          cashflow: true
        }
      }, { onConflict: 'user_id' });

      if (error) throw error;

      // Seed Chart of Accounts
      try {
        const { data: profileData } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (profileData?.id) {
          await seedChartOfAccounts(profileData.id);
        }
      } catch (seedErr) {
        console.warn('[Setup] Chart of accounts seed notice:', seedErr);
      }

      // Persist onboarding status to local SQLite configuration
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'local_config',
            data: { 
              onboarding_complete: 'true',
              onboarding_done: 'true'
            }
          })
        });
      } catch (localErr) {
        console.warn('Local config sync notice:', localErr);
      }

      // Invalidate store cache
      useBusinessProfileStore.getState().clearCache();

      // Show full-screen celebration modal!
      setShowCelebration(true);
    } catch (err: any) {
      console.error(err);
      toast.error("Setup Failed", humanizeError(err, 'save profile'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsLabel = [
    "Country & Currency",
    "Industry Vertical",
    "Business Profile",
    "Security PIN"
  ];

  return (
    <div className="min-h-screen bg-[#07090B] overflow-y-auto flex items-start justify-center p-4 sm:p-6 font-inter text-slate-300 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-4xl w-full py-6 relative z-10">
        {/* Brand Header & 4-Step Stepper */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-white mb-1.5 tracking-tighter italic">
            NOXIS<span className="text-cyan-400">HUB</span>
          </h1>
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-6">
            System Initialization Wizard
          </p>

          <div className="flex items-center justify-center space-x-2 sm:space-x-4 max-w-lg mx-auto">
            {stepsLabel.map((label, s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center border-2 transition-all duration-300 text-xs font-black",
                    step === s ? "border-cyan-400 bg-cyan-400/15 text-cyan-400 scale-105 shadow-[0_0_15px_rgba(34,211,238,0.25)]" : 
                    step > s ? "border-emerald-500 bg-emerald-500/15 text-emerald-400" : "border-zinc-800 text-zinc-600 bg-zinc-950/60"
                  )}>
                    {step > s ? <Check className="w-4 h-4" /> : <span>{s + 1}</span>}
                  </div>
                </div>
                {s < stepsLabel.length - 1 && (
                  <div className={cn("h-[2px] flex-1 mx-2 transition-all duration-300", step > s ? "bg-emerald-500/60" : "bg-zinc-800")} />
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 text-[10px] font-black tracking-widest text-zinc-500 uppercase">
            Step {step + 1} of 4: <span className="text-zinc-300">{stepsLabel[step]}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            
            {/* ══════════════════════════════════════════════════════
                STEP 1: COUNTRY & CURRENCY
            ══════════════════════════════════════════════════════ */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6 max-w-3xl mx-auto"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                    Select Your Country & Currency
                  </h2>
                  <p className="text-zinc-500 text-xs sm:text-sm max-w-lg mx-auto">
                    Noxis Hub automatically configures your base currency, tax system, phone prefix, and accounting fiscal year.
                  </p>
                </div>

                <div className="bg-[#0D0F12] p-6 sm:p-8 border border-white/10 rounded-sm space-y-6 shadow-2xl">
                  {/* Primary Countries Grid */}
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black text-zinc-400 tracking-wider flex items-center justify-between">
                      <span>Supported Regions</span>
                      <span className="text-[9px] text-cyan-400 font-mono">PRIMARY MARKETS</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {PRIMARY_COUNTRIES.map(c => {
                        const isSelected = selectedCountryCode === c.code;
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => handleCountrySelect(c)}
                            className={cn(
                              "p-4 rounded-sm border text-left transition-all relative overflow-hidden group flex flex-col justify-between h-28",
                              isSelected 
                                ? "bg-cyan-500/10 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400" 
                                : "bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/[0.02]"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-2xl">{c.flag}</span>
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded font-mono",
                                isSelected ? "bg-cyan-400/20 text-cyan-300" : "bg-white/5 text-zinc-500"
                              )}>
                                {c.currency}
                              </span>
                            </div>

                            <div>
                              <p className="text-sm font-bold text-white tracking-tight">{c.name}</p>
                              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                {c.taxSystem} {c.taxRate > 0 ? `${c.taxRate}%` : '0%'} · {c.phonePrefix}
                              </p>
                            </div>

                            {isSelected && (
                              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional Countries expandable or listed */}
                  <div className="pt-2 border-t border-white/5">
                    <label className="text-[10px] uppercase font-black text-zinc-500 tracking-wider mb-2 block">
                      Other Operating Countries
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ADDITIONAL_COUNTRIES.map(c => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleCountrySelect(c)}
                          className={cn(
                            "p-2.5 rounded-sm border text-left text-xs transition-all flex items-center gap-2",
                            selectedCountryCode === c.code 
                              ? "bg-cyan-500/10 border-cyan-400 text-white" 
                              : "bg-black/30 border-white/5 text-zinc-400 hover:border-white/15"
                          )}
                        >
                          <span className="text-lg">{c.flag}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-white truncate">{c.name}</p>
                            <p className="text-[9px] text-zinc-500 font-mono">{c.currency}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Config summary card */}
                  <div className="p-3.5 bg-black/50 border border-cyan-400/20 rounded-sm flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-lg">
                        {currentCountry.flag}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white uppercase tracking-wider">
                          Active Localization: {currentCountry.name}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          Currency: <span className="text-cyan-300 font-mono font-bold">{currentCountry.currency}</span> | Tax: <span className="text-cyan-300 font-mono font-bold">{currentCountry.taxSystem} ({currentCountry.taxRate}%)</span> | Format: <span className="text-cyan-300 font-mono">{currentCountry.dateFormat}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                      Auto-Configured
                    </span>
                  </div>

                  {/* Continue Button */}
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-xs transition-all rounded-sm shadow-[0_4px_20px_rgba(6,182,212,0.25)] flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Industry Vertical</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                STEP 2: INDUSTRY VERTICAL
            ══════════════════════════════════════════════════════ */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 max-w-3xl mx-auto"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                    Select Your Industry Blueprint
                  </h2>
                  <p className="text-zinc-500 text-xs sm:text-sm">
                    Seeds your Chart of Accounts, tailors terminology, and enables specialized workflows.
                  </p>
                </div>

                <div className="bg-[#0D0F12] p-6 sm:p-8 border border-white/10 rounded-sm space-y-6 shadow-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {VERTICAL_OPTIONS.map(v => {
                      const Icon = v.icon;
                      const isSelected = selectedIndustryKey === v.key;

                      return (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => handleIndustrySelect(v.key)}
                          className={cn(
                            "p-5 rounded-sm border text-left transition-all relative flex flex-col justify-between h-40",
                            isSelected 
                              ? cn(v.bgColor, v.borderColor, "shadow-[0_0_20px_rgba(255,255,255,0.05)] ring-1", v.borderColor)
                              : "bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/[0.02]"
                          )}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div 
                                className="w-10 h-10 rounded-sm flex items-center justify-center border"
                                style={{ 
                                  backgroundColor: isSelected ? `${v.color}20` : 'rgba(255,255,255,0.04)',
                                  borderColor: isSelected ? v.color : 'rgba(255,255,255,0.1)'
                                }}
                              >
                                <Icon size={20} style={{ color: v.color }} />
                              </div>
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                                isSelected ? "bg-white/10 text-white" : "bg-white/5 text-zinc-500"
                              )}>
                                {v.badge}
                              </span>
                            </div>

                            <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                              {v.title}
                            </h3>
                          </div>

                          <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                            {v.subtitle}
                          </p>

                          {isSelected && (
                            <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Terminology dynamic banner */}
                  <div className="p-3.5 bg-black/50 border border-white/5 rounded-sm space-y-2">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-cyan-400" />
                      Dynamic Nomenclature for {VERTICAL_OPTIONS.find(v => v.key === selectedIndustryKey)?.title}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-zinc-500 text-[10px] block uppercase font-mono">Workers</span>
                        <span className="text-white font-semibold capitalize">
                          {INDUSTRY_CONFIGS[selectedIndustryKey as IndustryKey]?.terms.worker || 'Karigar'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] block uppercase font-mono">Advances</span>
                        <span className="text-white font-semibold">
                          {INDUSTRY_CONFIGS[selectedIndustryKey as IndustryKey]?.terms.advance || 'Peshgi'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] block uppercase font-mono">Inventory Item</span>
                        <span className="text-white font-semibold">
                          {INDUSTRY_CONFIGS[selectedIndustryKey as IndustryKey]?.terms.item || 'Item'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[10px] block uppercase font-mono">Billing Unit</span>
                        <span className="text-white font-semibold">
                          {INDUSTRY_CONFIGS[selectedIndustryKey as IndustryKey]?.terms.invoice || 'Invoice'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-white/5">
                    <button 
                      type="button" 
                      onClick={() => setStep(0)} 
                      className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-xs transition-all rounded-sm shadow-[0_4px_20px_rgba(6,182,212,0.25)] flex items-center gap-2"
                    >
                      <span>Continue to Business Profile</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                STEP 3: BUSINESS PROFILE
            ══════════════════════════════════════════════════════ */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 max-w-3xl mx-auto"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                    Business Profile & Credentials
                  </h2>
                  <p className="text-zinc-500 text-xs sm:text-sm">
                    Enter your company registration and invoice branding details.
                  </p>
                </div>

                <div className="bg-[#0D0F12] p-6 sm:p-8 border border-white/10 rounded-sm space-y-6 shadow-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">
                        Business Name <span className="text-cyan-400">*</span>
                      </label>
                      <input 
                        {...register("business_name")}
                        className="industrial-input" 
                        placeholder="e.g. Al-Madina Textile Mills" 
                      />
                      {errors.business_name && (
                        <p className="text-[9px] font-bold text-red-400 mt-1 uppercase font-mono">{errors.business_name.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">
                        Owner / Authorized Name <span className="text-cyan-400">*</span>
                      </label>
                      <input 
                        {...register("owner_name")}
                        className="industrial-input" 
                        placeholder="e.g. Muhammad Ahmad" 
                      />
                      {errors.owner_name && (
                        <p className="text-[9px] font-bold text-red-400 mt-1 uppercase font-mono">{errors.owner_name.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">
                        Primary Contact Phone <span className="text-cyan-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-cyan-400 pointer-events-none">
                          {phonePrefix}
                        </span>
                        <input 
                          {...register("phone")}
                          className="industrial-input pl-14 font-mono" 
                          placeholder="3001234567" 
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-[9px] font-bold text-red-400 mt-1 uppercase font-mono">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400">
                        City / Hub Location <span className="text-cyan-400">*</span>
                      </label>
                      <input 
                        {...register("city")}
                        className="industrial-input" 
                        placeholder="e.g. Faisalabad, Karachi, Dubai" 
                      />
                      {errors.city && (
                        <p className="text-[9px] font-bold text-red-400 mt-1 uppercase font-mono">{errors.city.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400 flex items-center justify-between">
                        <span>{currentCountry.taxLabel} (Tax Number)</span>
                        <span className="text-[9px] text-zinc-500 font-mono">OPTIONAL</span>
                      </label>
                      <input 
                        {...register("tax_number")}
                        className="industrial-input font-mono" 
                        placeholder={`e.g. ${currentCountry.taxLabel}-1234567-8`} 
                      />
                    </div>

                    {/* Logo Upload Section */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400 flex items-center justify-between">
                        <span>Company Logo</span>
                        <span className="text-[9px] text-zinc-500 font-mono">OPTIONAL</span>
                      </label>
                      
                      <div className="flex items-center gap-3">
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden" 
                        />
                        {logoPreview ? (
                          <div className="w-12 h-12 rounded border border-cyan-400/40 p-1 bg-black/60 flex items-center justify-center relative group">
                            <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain" />
                            <button 
                              type="button" 
                              onClick={() => { setLogoPreview(null); setLogoFile(null); }}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 py-2.5 px-3 border border-dashed border-zinc-700 hover:border-cyan-400 rounded-sm bg-black/40 text-xs text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            <Upload size={14} className="text-cyan-400" />
                            <span>Upload Logo Image</span>
                          </button>
                        )}
                        <span className="text-[10px] text-zinc-600 font-mono">Appears on invoices</span>
                      </div>
                    </div>

                  </div>

                  <div className="flex justify-between pt-4 border-t border-white/5">
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const bn = watch('business_name');
                        const on = watch('owner_name');
                        const ph = watch('phone');
                        const ci = watch('city');
                        if (bn?.length >= 2 && on?.length >= 2 && ph?.length >= 7 && ci?.length >= 2) {
                          setStep(3);
                        } else {
                          toast.error("Profile Incomplete", "Please fill in Business Name, Owner Name, Phone, and City to proceed.");
                        }
                      }}
                      className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-xs transition-all rounded-sm shadow-[0_4px_20px_rgba(6,182,212,0.25)] flex items-center gap-2"
                    >
                      <span>Proceed to Security PIN</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                STEP 4: SECURITY PIN (CANNOT SKIP)
            ══════════════════════════════════════════════════════ */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-md mx-auto space-y-6"
              >
                <div className="bg-[#0D0F12] p-8 border border-white/10 text-center rounded-sm space-y-6 shadow-2xl relative">
                  <div className="w-14 h-14 bg-cyan-400/10 border border-cyan-400/20 rounded-md flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                    <Lock className="w-7 h-7 text-cyan-400" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Set Security Master PIN</h2>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                      Required 4-digit PIN protecting critical financial actions
                    </p>
                  </div>

                  <div className="space-y-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400 block text-center">
                        4-Digit PIN
                      </label>
                      <input 
                        type="password" 
                        maxLength={4}
                        {...register("pin")}
                        className="text-center text-3xl tracking-[0.6em] font-mono industrial-input bg-black/60 h-14 focus:border-cyan-400" 
                        placeholder="••••"
                      />
                      {errors.pin && (
                        <p className="text-[9px] font-bold text-red-400 text-center font-mono mt-1">{errors.pin.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-zinc-400 block text-center">
                        Confirm 4-Digit PIN
                      </label>
                      <input 
                        type="password" 
                        maxLength={4}
                        {...register("confirmPin")}
                        className="text-center text-3xl tracking-[0.6em] font-mono industrial-input bg-black/60 h-14 focus:border-cyan-400" 
                        placeholder="••••"
                      />
                      {errors.confirmPin && (
                        <p className="text-[9px] font-bold text-red-400 text-center font-mono mt-1">{errors.confirmPin.message}</p>
                      )}
                    </div>
                  </div>

                  {/* PIN Protected Actions Hint */}
                  <div className="p-3.5 bg-black/40 border border-white/5 rounded text-left space-y-1.5">
                    <p className="text-[9px] font-mono font-bold uppercase text-zinc-400 tracking-wider">
                      This PIN secures:
                    </p>
                    <ul className="text-[11px] text-zinc-400 space-y-1">
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-cyan-400" />
                        <span>Void transactions & stock write-offs</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-cyan-400" />
                        <span>Edit closed financial periods</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-cyan-400" />
                        <span>Unlock advanced system settings</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-cyan-400" />
                        <span>View executive financial statements</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2 space-y-3">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-black uppercase tracking-[0.15em] text-xs transition-all flex items-center justify-center rounded-sm shadow-[0_4px_25px_rgba(6,182,212,0.3)] group"
                    >
                      {isSubmitting ? "Initializing Core System..." : "Complete Setup & Launch Trial"}
                      {!isSubmitting && <CheckCircle2 className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />}
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={() => setStep(2)} 
                      className="text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-white transition-colors block mx-auto"
                    >
                      Back to profile
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </form>
      </div>

      {/* ══════════════════════════════════════════════════════
          THE SETUP COMPLETE MOMENT (CELEBRATION OVERLAY)
      ══════════════════════════════════════════════════════ */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 bg-[#07090B] flex items-center justify-center p-6 overflow-hidden">
          {/* Subtle rising gold particle animation effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.15)_0,transparent_70%)]" />
            {[...Array(24)].map((_, i) => (
              <div 
                key={i} 
                className="absolute w-1.5 h-1.5 rounded-full bg-[#C5A059] opacity-70 animate-float-up"
                style={{
                  left: `${(i * 17) % 100}%`,
                  bottom: `-20px`,
                  animationDuration: `${3.5 + (i % 5)}s`,
                  animationDelay: `${(i * 0.25)}s`
                }}
              />
            ))}
          </div>

          <div className="max-w-md w-full text-center space-y-6 relative z-10 animate-in zoom-in-95 duration-500">
            {/* Gold Badge */}
            <div className="w-16 h-16 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(197,160,89,0.25)]">
              <Sparkles className="w-8 h-8 text-[#C5A059]" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Noxis Hub is Ready
              </h1>
              <p className="text-sm font-semibold text-zinc-300">
                Your 14-day Elite trial has started.
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Full access to every feature — POS, Karigar Payroll, CCTV, Mobile Companion, AI Foresight.
              </p>
            </div>

            {/* Trial Countdown Chip in Gold */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#C5A059] font-mono font-bold text-xs shadow-[0_0_15px_rgba(197,160,89,0.2)]">
              <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-ping" />
              <span>14 days remaining</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard?tour=true")}
                className="w-full py-3.5 px-6 bg-[#C5A059] hover:bg-[#D4B06A] text-black font-black uppercase tracking-wider text-xs transition-all rounded-sm shadow-[0_4px_25px_rgba(197,160,89,0.3)] flex items-center justify-center gap-2"
              >
                <Compass size={15} />
                <span>Take a Quick Tour (2 min)</span>
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full py-3 px-6 border border-white/15 hover:border-white/30 text-white font-bold text-xs uppercase tracking-wider transition-all rounded-sm hover:bg-white/5"
              >
                Go to Dashboard
              </button>
            </div>

            {/* Reassurance text */}
            <p className="text-[11px] text-zinc-600 font-medium">
              No credit card required. Your data is never deleted.
            </p>
          </div>
        </div>
      )}

      <style jsx global>{`
        .industrial-input {
          width: 100%;
          background: #090A0D;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: all 200ms ease-in-out;
          border-radius: 2px;
        }
        .industrial-input:focus {
          border-color: #22d3ee;
          box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2);
          background: #090A0D;
        }
        .industrial-input::placeholder {
          color: #52525b;
        }
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          30% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100vh) scale(1.2);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: floatUp 4s infinite linear;
        }
      `}</style>
    </div>
  );
}
