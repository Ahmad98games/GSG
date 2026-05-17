"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { 
  Check, ShieldAlert, Landmark, 
  CheckCircle2, Factory, Package, Search,
  Smartphone
} from "lucide-react";
import { useBusinessProfileStore } from "@/store/BusinessProfileStore";
import { useThemeStore } from "@/stores/themeStore";
import ThemePicker from "@/components/shell/ThemePicker";
import { cn } from "@/lib/utils";
import { INDUSTRIES } from "@/lib/persona/industries";
import { CurrencyCode } from "@/lib/currency/currencyEngine";

// --- Country Infrastructure ---

type CountrySetup = {
  code: string     // ISO 3166-1 alpha-2
  name: string
  currency: CurrencyCode
  taxName: string
  defaultTaxRate: number
  phonePrefix: string
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  language: string  // suggested UI language
}

const COUNTRY_SETUPS: CountrySetup[] = [
  {
    code: 'PK', name: 'Pakistan',
    currency: 'PKR', taxName: 'GST',
    defaultTaxRate: 17, phonePrefix: '+92',
    dateFormat: 'DD/MM/YYYY', language: 'ur'
  },
  {
    code: 'AE', name: 'United Arab Emirates',
    currency: 'AED', taxName: 'VAT',
    defaultTaxRate: 5, phonePrefix: '+971',
    dateFormat: 'DD/MM/YYYY', language: 'en'
  },
  {
    code: 'SA', name: 'Saudi Arabia',
    currency: 'SAR', taxName: 'VAT',
    defaultTaxRate: 15, phonePrefix: '+966',
    dateFormat: 'DD/MM/YYYY', language: 'ar'
  },
  {
    code: 'GB', name: 'United Kingdom',
    currency: 'GBP', taxName: 'VAT',
    defaultTaxRate: 20, phonePrefix: '+44',
    dateFormat: 'DD/MM/YYYY', language: 'en'
  },
  {
    code: 'US', name: 'United States',
    currency: 'USD', taxName: 'Sales Tax',
    defaultTaxRate: 0, phonePrefix: '+1',
    dateFormat: 'MM/DD/YYYY', language: 'en'
  },
  {
    code: 'BD', name: 'Bangladesh',
    currency: 'BDT', taxName: 'VAT',
    defaultTaxRate: 15, phonePrefix: '+880',
    dateFormat: 'DD/MM/YYYY', language: 'bn'
  },
  {
    code: 'IN', name: 'India',
    currency: 'INR', taxName: 'GST',
    defaultTaxRate: 18, phonePrefix: '+91',
    dateFormat: 'DD/MM/YYYY', language: 'en'
  },
  {
    code: 'TR', name: 'Turkey',
    currency: 'TRY', taxName: 'KDV',
    defaultTaxRate: 18, phonePrefix: '+90',
    dateFormat: 'DD/MM/YYYY', language: 'tr'
  },
  {
    code: 'ID', name: 'Indonesia',
    currency: 'IDR', taxName: 'PPN',
    defaultTaxRate: 11, phonePrefix: '+62',
    dateFormat: 'DD/MM/YYYY', language: 'id'
  },
  {
    code: 'VN', name: 'Vietnam',
    currency: 'VND', taxName: 'VAT',
    defaultTaxRate: 10, phonePrefix: '+84',
    dateFormat: 'DD/MM/YYYY', language: 'vi'
  },
  {
    code: 'MA', name: 'Morocco',
    currency: 'MAD', taxName: 'TVA',
    defaultTaxRate: 20, phonePrefix: '+212',
    dateFormat: 'DD/MM/YYYY', language: 'fr'
  },
  {
    code: 'ET', name: 'Ethiopia',
    currency: 'ETB', taxName: 'VAT',
    defaultTaxRate: 15, phonePrefix: '+251',
    dateFormat: 'DD/MM/YYYY', language: 'en'
  },
  {
    code: 'MX', name: 'Mexico',
    currency: 'MXN', taxName: 'IVA',
    defaultTaxRate: 16, phonePrefix: '+52',
    dateFormat: 'DD/MM/YYYY', language: 'es'
  },
  {
    code: 'CA', name: 'Canada',
    currency: 'CAD', taxName: 'GST/HST',
    defaultTaxRate: 13, phonePrefix: '+1',
    dateFormat: 'DD/MM/YYYY', language: 'en'
  },
  {
    code: 'AU', name: 'Australia',
    currency: 'AUD', taxName: 'GST',
    defaultTaxRate: 10, phonePrefix: '+61',
    dateFormat: 'DD/MM/YYYY', language: 'en'
  },
  {
    code: 'SG', name: 'Singapore',
    currency: 'SGD', taxName: 'GST',
    defaultTaxRate: 9, phonePrefix: '+65',
    dateFormat: 'DD/MM/YYYY', language: 'en'
  },
  {
    code: 'MY', name: 'Malaysia',
    currency: 'MYR', taxName: 'SST',
    defaultTaxRate: 6, phonePrefix: '+60',
    dateFormat: 'DD/MM/YYYY', language: 'ms'
  },
];

const DEFAULT_COUNTRY: CountrySetup = {
  code: 'GLOBAL', name: 'Other',
  currency: 'USD', taxName: 'Tax',
  defaultTaxRate: 0, phonePrefix: '+',
  dateFormat: 'DD/MM/YYYY', language: 'en'
}

export function getCountrySetup(code: string): CountrySetup {
  return COUNTRY_SETUPS.find(c => c.code === code) || DEFAULT_COUNTRY;
}

// --- Form Schema ---

const setupSchema = z.object({
  region: z.enum(["south_asian", "international"]),
  country_code: z.string().min(1),
  industry_key: z.string().min(1, "Please select an industry"),
  currency: z.string().min(3),
  worker_term: z.string().min(1),
  business_name: z.string().min(2, "Business name is too short"),
  owner_name: z.string().min(2, "Owner name is required"),
  phone: z.string().min(8, "Invalid phone number"),
  city: z.string().min(2, "City is required"),
  tax_name: z.string().min(1),
  tax_rate: z.coerce.number(),
  tax_number: z.string().optional(),
  pin: z.string().length(4, "PIN must be 4 digits").regex(/^[0-9]+$/, "Digits only"),
  confirmPin: z.string().length(4),
  whatsapp_numbers: z.array(z.object({ name: z.string(), phone: z.string() })).optional(),
  summary_frequency: z.number().default(1),
  summary_time: z.string().default('20:00'),
  summary_includes: z.record(z.boolean()).default({
    revenue: true,
    production: true,
    low_stock: true,
    overdue: true,
    attendance: true,
    cashflow: true
  }),
}).refine((data) => data.pin === data.confirmPin, {
  message: "PINs do not match",
  path: ["confirmPin"],
});

type SetupFormValues = z.infer<typeof setupSchema>;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [languageSuggestion, setLanguageSuggestion] = useState<string | null>(null);
  const [countrySearch, setCountrySearch] = useState("");
  const router = useRouter();
  const supabase = createClient();
  const { activeTheme, setThemeByIndustry } = useThemeStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      region: 'south_asian',
      country_code: 'PK',
      currency: 'PKR',
      worker_term: 'karigar',
      tax_name: 'GST',
      tax_rate: 17
    }
  });

  const selectedRegion = watch('region');
  const selectedIndustryKey = watch('industry_key');
  const selectedCountryCode = watch('country_code');

  // Handle Country Selection Logic
  useEffect(() => {
    const setup = getCountrySetup(selectedCountryCode);
    setValue('currency', setup.currency);
    setValue('tax_name', setup.taxName);
    setValue('tax_rate', setup.defaultTaxRate);
    
    if (setup.language !== 'en') {
      setLanguageSuggestion(setup.language);
    } else {
      setLanguageSuggestion(null);
    }
  }, [selectedCountryCode, setValue]);

  useEffect(() => {
    if (selectedIndustryKey) {
      const ind = INDUSTRIES.find(i => i.id === selectedIndustryKey);
      if (ind) {
        setValue('worker_term', ind.terms.worker.toLowerCase());
      }
    }
  }, [selectedIndustryKey, setValue]);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login");
    }
    checkAuth();
  }, [supabase, router]);

  const filteredIndustries = INDUSTRIES.filter(i => i.region === selectedRegion);
  const categories = Array.from(new Set(filteredIndustries.map(i => i.category)));
  const industriesInSelectedCategory = selectedCategory 
    ? filteredIndustries.filter(i => i.category === selectedCategory)
    : filteredIndustries;

  const onSubmit = async (values: SetupFormValues) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const selectedIndustry = INDUSTRIES.find(i => i.id === values.industry_key);
      if (!selectedIndustry) throw new Error("Industry not found");

      const { error } = await supabase.from("business_profiles").upsert({
        user_id: user.id,
        business_name: values.business_name,
        owner_name: values.owner_name,
        region: values.region,
        country_code: values.country_code,
        industry_key: values.industry_key,
        industry_type: selectedIndustry.id, 
        tax_name: values.tax_name,
        tax_rate: values.tax_rate,
        tax_label: values.tax_name, // Sync for legacy components
        phone: values.phone,
        city: values.city,
        tax_number: values.tax_number,
        role_pin_hash: values.pin,
        onboarding_done: true,
        persona_locked: true,
        worker_term: values.worker_term,
        stock_unit_primary: 'unit',
        currency: values.currency,
        role: 'manufacturer',
        theme_id: activeTheme.id,
        whatsapp_numbers: values.whatsapp_numbers || [],
        summary_frequency: values.summary_frequency,
        summary_time: values.summary_time,
        summary_includes: values.summary_includes,
      }, { onConflict: 'user_id' });

      if (error) throw error;

      useBusinessProfileStore.getState().clearCache();
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      alert(`Failed to save profile: ${err.message || "Unknown error"}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleCountries = COUNTRY_SETUPS.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0A0C0E] flex items-center justify-center p-6 font-inter text-slate-300">
      <div className="max-w-5xl w-full">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter italic">NOXIS<span className="text-electric-blue">HUB</span></h1>
          <div className="flex items-center justify-center space-x-4 mt-6">
            {[0, 1, 2, 3, 4, 5].map((s: number) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-sm flex items-center justify-center border-2 transition-all duration-300 ${
                  step === s ? "border-electric-blue bg-electric-blue/10 text-electric-blue scale-110" : 
                  step > s ? "border-emerald bg-emerald/10 text-emerald" : "border-white/5 text-gray-600"
                }`}>
                  {step > s ? <Check className="w-4 h-4" /> : <span className="text-[10px] font-black">{s + 1}</span>}
                </div>
                {s < 5 && <div className={`w-12 h-0.5 ${step > s ? "bg-emerald" : "bg-white/5"}`} />}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                <div className="text-center">
                  <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tight">International Infrastructure</h2>
                  <p className="text-gray-500 max-w-2xl mx-auto text-sm">
                    Select your country to auto-configure regional tax laws, currency formatting, and industrial terminology.
                  </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text"
                      placeholder="Search for your country..."
                      className="w-full bg-[#121417] border border-white/10 h-16 pl-12 pr-6 text-white text-lg outline-none focus:border-electric-blue transition-all"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {visibleCountries.map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setValue('country_code', c.code)}
                        className={cn(
                          "p-4 text-left border transition-all hover:bg-white/5",
                          selectedCountryCode === c.code ? "bg-electric-blue/10 border-electric-blue text-white" : "bg-[#121417] border-white/5 text-gray-400"
                        )}
                      >
                        <p className="text-xs font-black uppercase tracking-widest">{c.name}</p>
                        <p className="text-[10px] text-gray-500 mt-1">{c.currency} • {c.taxName}</p>
                      </button>
                    ))}
                    {visibleCountries.length === 0 && (
                      <button
                        type="button"
                        onClick={() => setValue('country_code', 'GLOBAL')}
                        className="col-span-full p-8 text-center bg-[#121417] border border-dashed border-white/10 text-gray-500"
                      >
                        Country not listed? Select Global Default
                      </button>
                    )}
                  </div>
                </div>

                {languageSuggestion && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md mx-auto p-4 bg-electric-blue/10 border border-electric-blue/20 rounded text-center"
                  >
                    <p className="text-xs text-electric-blue font-bold">
                      Tip: Noxis is available in {languageSuggestion.toUpperCase()}. 
                      Switch in Settings → Language after setup.
                    </p>
                  </motion.div>
                )}

                <div className="flex justify-center mt-12">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-12 py-4 bg-electric-blue hover:bg-blue-600 text-white font-black uppercase tracking-widest text-sm transition-all shadow-[0_20px_40px_rgba(0,112,243,0.2)]"
                  >
                    Establish Infrastructure
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-black text-white mb-2 uppercase">Industry Persona</h2>
                  <p className="text-gray-500 text-sm">
                    Select your sector to load industry-specific terminology and workflows.
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 min-h-[400px]">
                  <div className="w-full md:w-64 space-y-1">
                    <p className="text-[10px] uppercase font-black text-gray-700 tracking-widest px-4 mb-4">Verticals</p>
                    <button 
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className={cn(
                        "w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                        !selectedCategory ? "bg-electric-blue text-onyx" : "text-gray-500 hover:text-white hover:bg-white/5"
                      )}
                    >
                      All Sectors
                    </button>
                    {categories.map(cat => (
                      <button 
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                          selectedCategory === cat ? "bg-electric-blue text-onyx" : "text-gray-500 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {industriesInSelectedCategory.map((ind) => (
                      <IndustryCard
                        key={ind.id}
                        selected={selectedIndustryKey === ind.id}
                        onClick={() => {
                          setValue('industry_key', ind.id);
                          setThemeByIndustry(ind.suggestedTheme);
                        }}
                        title={ind.name}
                        unit={ind.category}
                        type={ind.id}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between mt-12 pt-8 border-t border-white/5">
                  <button type="button" onClick={() => setStep(0)} className="text-[10px] font-black uppercase text-gray-500 hover:text-white transition-colors">Back</button>
                  <button
                    type="button"
                    disabled={!selectedIndustryKey}
                    onClick={() => setStep(2)}
                    className="px-8 py-3 bg-electric-blue hover:bg-blue-600 disabled:opacity-50 text-onyx font-black uppercase tracking-widest text-[10px] transition-all"
                  >
                    Configure Alerts
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto bg-[#121417] p-10 border border-white/5 space-y-10"
              >
                <div className="text-center">
                   <div className="w-16 h-16 bg-electric-blue/10 rounded-sm flex items-center justify-center mx-auto mb-4">
                      <Smartphone className="text-electric-blue" size={32} />
                   </div>
                   <h2 className="text-2xl font-black text-white uppercase tracking-tighter">WhatsApp Alerts Setup</h2>
                   <p className="text-gray-500 mt-2 text-sm">Noxis will send you a summary every day</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div className="space-y-4">
                         <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Primary WhatsApp Number</label>
                         <input 
                           type="text" 
                           placeholder="+92 300 1234567" 
                           className="industrial-input h-14"
                           onChange={(e) => {
                             const nums = (watch('whatsapp_numbers' as any) || []);
                             nums[0] = { name: 'Owner', phone: e.target.value };
                             setValue('whatsapp_numbers' as any, nums);
                           }}
                         />
                         <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest">Format: Country prefix + number</p>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-white/5">
                         <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Additional Recipients</label>
                            <button type="button" className="text-electric-blue text-[9px] font-black uppercase hover:underline">+ Add Member</button>
                         </div>
                         <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                               <input placeholder="Name" className="industrial-input h-10 text-[10px]" />
                               <input placeholder="Number" className="industrial-input h-10 text-[10px]" />
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-8 bg-black/20 p-6 border border-white/5 rounded-sm">
                      <div className="space-y-4">
                         <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Summary Frequency</label>
                         <div className="grid grid-cols-2 gap-2">
                            {['Daily', '3 Days', 'Weekly'].map(f => (
                              <button 
                                key={f} 
                                type="button" 
                                onClick={() => setValue('summary_frequency' as any, f === 'Daily' ? 1 : f === '3 Days' ? 3 : 7)}
                                className={cn(
                                  "py-3 text-[9px] font-black uppercase tracking-widest border transition-all",
                                  (watch('summary_frequency' as any) || 1) === (f === 'Daily' ? 1 : f === '3 Days' ? 3 : 7)
                                    ? "bg-electric-blue border-electric-blue text-onyx" 
                                    : "bg-[#0F1113] border-white/10 text-gray-500 hover:border-white/20"
                                )}
                              >
                                {f}
                              </button>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-4">
                         <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Send at what time?</label>
                         <select className="industrial-input h-12" {...register('summary_time' as any)}>
                            <option value="08:00">08:00 AM</option>
                            <option value="09:00">09:00 AM</option>
                            <option value="20:00">08:00 PM (Recommended)</option>
                            <option value="21:00">09:00 PM</option>
                         </select>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-white/5">
                         <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">What to include?</label>
                         <div className="grid grid-cols-2 gap-y-3">
                            {['Revenue', 'Production', 'Low Stock', 'Overdue', 'Attendance', 'Cashflow'].map(item => (
                              <label key={item} className="flex items-center gap-3 cursor-pointer group">
                                <input type="checkbox" defaultChecked className="hidden peer" />
                                <div className="w-4 h-4 border border-white/20 rounded-sm flex items-center justify-center peer-checked:bg-electric-blue peer-checked:border-electric-blue transition-all">
                                   <Check size={10} className="text-onyx" />
                                </div>
                                <span className="text-[9px] font-black uppercase text-gray-600 group-hover:text-gray-400 transition-colors">{item}</span>
                              </label>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/5">
                   <button type="button" onClick={() => setStep(1)} className="text-[10px] font-black uppercase text-gray-500 hover:text-white">Back</button>
                   <div className="flex gap-6 items-center">
                      <button type="button" onClick={() => setStep(3)} className="text-[10px] font-black uppercase text-gray-600 hover:text-gray-400">Skip for now</button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="px-10 py-3 bg-electric-blue hover:bg-blue-600 text-onyx font-black uppercase tracking-widest text-[10px] transition-all"
                      >
                        Save & Continue
                      </button>
                   </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-black text-white mb-2 uppercase">Logistics & Fiscal</h2>
                  <p className="text-gray-500 text-sm">
                    Verify currency and workforce terminology for your region.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                   <div className="p-8 bg-[#121417] border border-white/5 space-y-4">
                      <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest flex items-center gap-2">
                         <Landmark size={14} className="text-electric-blue" />
                         Operating Currency
                      </label>
                      <input 
                        readOnly
                        value={watch('currency')}
                        className="industrial-input h-14 bg-black/40 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-[9px] text-gray-700 uppercase font-black">Base currency for your financial ledger.</p>
                   </div>

                   <div className="p-8 bg-[#121417] border border-white/5 space-y-4">
                      <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest flex items-center gap-2">
                         <Factory size={14} className="text-electric-blue" />
                         Worker Title
                      </label>
                      <select 
                        {...register("worker_term")}
                        className="industrial-input h-14"
                      >
                         <option value="karigar">Karigar (Traditional)</option>
                         <option value="worker">Worker (Standard)</option>
                         <option value="operator">Operator (Industrial)</option>
                         <option value="artisan">Artisan (Craft)</option>
                         <option value="tailor">Tailor (Garment)</option>
                         <option value="employee">Employee (Formal)</option>
                      </select>
                      <p className="text-[9px] text-gray-700 uppercase font-black">Staff will be referred to as {watch('worker_term')}s.</p>
                   </div>
                </div>

                <div className="flex justify-between mt-12">
                  <button type="button" onClick={() => setStep(2)} className="text-[10px] font-black uppercase text-gray-500 hover:text-white transition-colors">Back</button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-8 py-3 bg-electric-blue hover:bg-blue-600 text-onyx font-black uppercase tracking-widest text-[10px] transition-all"
                  >
                    Confirm Blueprint
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto bg-[#121417] p-10 border border-white/5"
              >
                <div className="mb-10">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Business Identity</h2>
                  <p className="text-gray-500 mt-2 text-sm">Configure your primary industrial entity.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Business Name" error={errors.business_name?.message}>
                    <input {...register("business_name")} className="industrial-input" placeholder="e.g. Noxis Industrial" />
                  </InputGroup>
                  
                  <InputGroup label="Authorized Person" error={errors.owner_name?.message}>
                    <input {...register("owner_name")} className="industrial-input" placeholder="Your Full Name" />
                  </InputGroup>

                  <InputGroup label="Contact Phone" error={errors.phone?.message}>
                    <input {...register("phone")} className="industrial-input" placeholder="+1..." />
                  </InputGroup>

                  <InputGroup label="City / Location" error={errors.city?.message}>
                    <input {...register("city")} className="industrial-input" placeholder="e.g. London" />
                  </InputGroup>

                  <InputGroup label={`${watch('tax_name')} Registration Number`} error={errors.tax_number?.message}>
                    <input {...register("tax_number")} className="industrial-input" placeholder="Optional" />
                  </InputGroup>
                </div>

                <div className="flex justify-between mt-12">
                  <button type="button" onClick={() => setStep(3)} className="text-[10px] font-black uppercase text-gray-500 hover:text-white transition-colors">Back</button>
                  <button type="button" onClick={() => setStep(5)} className="px-8 py-3 bg-electric-blue hover:bg-blue-600 text-onyx font-black uppercase tracking-widest text-[10px] transition-all">Finalize Security</button>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-md mx-auto bg-[#121417] p-10 border border-white/5 text-center"
              >
                <div className="w-16 h-16 bg-electric-blue/10 rounded-sm flex items-center justify-center mx-auto mb-6">
                  <ShieldAlert className="w-8 h-8 text-electric-blue" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 uppercase">Secure Access</h2>
                <p className="text-gray-500 text-xs mb-8 uppercase font-bold">
                  Set a 4-digit PIN for high-stakes financial operations.
                </p>

                <div className="space-y-6 text-left">
                  <InputGroup label="Access PIN" error={errors.pin?.message}>
                    <input 
                      type="password" 
                      maxLength={4}
                      {...register("pin")}
                      className="text-center text-3xl tracking-[1em] font-mono industrial-input py-4 bg-black/40" 
                      placeholder="****"
                    />
                  </InputGroup>

                  <InputGroup label="Confirm PIN" error={errors.confirmPin?.message}>
                    <input 
                      type="password" 
                      maxLength={4}
                      {...register("confirmPin")}
                      className="text-center text-3xl tracking-[1em] font-mono industrial-input py-4 bg-black/40" 
                      placeholder="****"
                    />
                  </InputGroup>
                </div>

                <div className="mt-12 space-y-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-5 bg-emerald hover:bg-emerald-600 text-onyx font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center"
                  >
                    {isSubmitting ? "Deploying Ecosystem..." : "Initialize Noxis Hub"}
                    {!isSubmitting && <CheckCircle2 className="w-5 h-5 ml-2" />}
                  </button>
                  <button type="button" onClick={() => setStep(4)} className="text-[10px] font-black uppercase text-gray-600 hover:text-white transition-colors">Adjust Profile</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      <style jsx global>{`
        .industrial-input {
          width: 100%;
          background: #0F1113;
          border: 1px solid #1A1D21;
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
          border-radius: 0px;
        }
        .industrial-input:focus {
          border-color: #0070F3;
          background: #121417;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1A1D21;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}

function IndustryCard({ title, unit, type, selected, onClick }: any) {
  const Icon = type.includes('textile') ? Factory : type.includes('warehouse') ? Package : Landmark;
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-6 bg-[#121417] border cursor-pointer transition-all group relative overflow-hidden",
        selected ? "border-electric-blue ring-1 ring-electric-blue/50" : "border-white/5 hover:border-white/10"
      )}
    >
      <div className={cn("mb-4", selected ? "text-electric-blue" : "text-gray-700")}>
        <Icon size={28} />
      </div>
      <h4 className="text-white font-black uppercase text-[11px] tracking-widest">{title}</h4>
      <p className="text-[9px] text-gray-600 uppercase mt-2 font-bold">{unit}</p>
      
      {selected && (
        <div className="absolute top-2 right-2">
           <div className="w-4 h-4 bg-electric-blue flex items-center justify-center">
              <Check size={10} className="text-onyx" />
           </div>
        </div>
      )}
    </div>
  );
}

function InputGroup({ label, children, error }: any) {
  return (
    <div className="space-y-2">
      <label className="block text-[9px] uppercase font-black tracking-[0.2em] text-gray-600">
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-[9px] font-bold uppercase mt-1">{error}</p>}
    </div>
  );
}