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
  Smartphone, Plus, Trash2, Globe
} from "lucide-react";
import { useBusinessProfileStore } from "@/store/BusinessProfileStore";
import { useThemeStore } from "@/stores/themeStore";
import { cn } from "@/lib/utils";
import { INDUSTRIES } from "@/lib/persona/industries";
import { INDUSTRY_CONFIGS, IndustryKey } from '@/lib/industry/configs';
import { REGION_CONFIGS } from '@/lib/industry/regionConfigs';
import { CurrencyCode } from "@/lib/currency/currencyEngine";
import { useToast } from "@/hooks/useToast";
import { humanizeError } from "@/lib/utils/errors";
import { seedChartOfAccounts } from "@/lib/accounting/seedAccounts";

// --- Country Infrastructure ---
type CountrySetup = {
  code: string;     // ISO 3166-1 alpha-2
  name: string;
  currency: CurrencyCode;
  taxName: string;
  defaultTaxRate: number;
  phonePrefix: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  language: string;  // suggested UI language
};

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
};

function getCountrySetup(code: string): CountrySetup {
  return COUNTRY_SETUPS.find(c => c.code === code) || DEFAULT_COUNTRY;
}

const mapIndustryToType = (industryId: string): 'textile' | 'medical' | 'auto' | 'general' => {
  if (['textile', 'garment', 'apparel_intl', 'leather', 'sports_goods', 'cotton_gin'].includes(industryId)) {
    return 'textile';
  }
  if (['pharma', 'pharmaceutical', 'medical_devices', 'chemical'].includes(industryId)) {
    return 'medical';
  }
  if (['auto_parts', 'automotive', 'electronics', 'shipbuilding', 'aerospace'].includes(industryId)) {
    return 'auto';
  }
  return 'general';
};

// --- Form Schema ---
const setupSchema = z.object({
  region: z.enum(["south_asian", "international"]),
  country_code: z.string().min(1),
  industry_key: z.string().min(1, "Please select an industry vertical"),
  currency: z.string().min(3),
  worker_term: z.string().min(1),
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  owner_name: z.string().min(2, "Authorized name is required"),
  phone: z.string().min(8, "Invalid phone number"),
  owner_phone: z.string().optional(),
  city: z.string().min(2, "City is required"),
  tax_name: z.string().min(1),
  tax_rate: z.coerce.number(),
  tax_number: z.string().optional(),
  pin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^[0-9]+$/, "Digits only"),
  confirmPin: z.string().length(4),
  whatsapp_numbers: z.array(z.object({ name: z.string(), phone: z.string() })).default([]),
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
  const [step, setStep] = useState(0); // 0 to 4 (5 Steps total)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [languageSuggestion, setLanguageSuggestion] = useState<string | null>(null);
  const [countrySearch, setCountrySearch] = useState("");
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();
  const { activeTheme, setThemeByIndustry } = useThemeStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Additional WhatsApp contacts
  const [whatsappContacts, setWhatsappContacts] = useState<{ name: string; phone: string }[]>([]);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      region: 'south_asian',
      country_code: 'PK',
      currency: 'PKR',
      worker_term: 'karigar',
      tax_name: 'GST',
      tax_rate: 17,
      summary_frequency: 1,
      summary_time: '20:00',
      summary_includes: {
        revenue: true,
        production: true,
        low_stock: true,
        overdue: true,
        attendance: true,
        cashflow: true
      },
      whatsapp_numbers: []
    }
  });

  const selectedRegion = watch('region');
  const selectedIndustryKey = watch('industry_key');
  const selectedCountryCode = watch('country_code');
  const primaryPhone = watch('phone');

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
      const ind = INDUSTRY_CONFIGS[selectedIndustryKey as IndustryKey];
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

  const handleAddContact = () => {
    setWhatsappContacts([...whatsappContacts, { name: "", phone: "" }]);
  };

  const handleRemoveContact = (index: number) => {
    const next = [...whatsappContacts];
    next.splice(index, 1);
    setWhatsappContacts(next);
  };

  const handleContactChange = (index: number, field: 'name' | 'phone', value: string) => {
    const next = [...whatsappContacts];
    next[index] = { ...next[index], [field]: value };
    setWhatsappContacts(next);
  };

  const onSubmit = async (values: SetupFormValues) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      const selectedIndustry = INDUSTRY_CONFIGS[values.industry_key as IndustryKey];
      if (!selectedIndustry) throw new Error("Industry not found");

      // Format final whatsapp list
      const finalWhatsapp = [
        { name: "Owner", phone: values.phone },
        ...whatsappContacts.filter(c => c.name.trim() && c.phone.trim())
      ];

      const { error } = await supabase.from("business_profiles").upsert({
        user_id: user.id,
        business_name: values.business_name,
        owner_name: values.owner_name,
        region: values.region,
        country_code: values.country_code,
        industry_key: values.industry_key,
        industry: values.industry_key,
        industry_type: mapIndustryToType(values.industry_key),
        tax_name: values.tax_name,
        tax_rate: values.tax_rate,
        tax_label: REGION_CONFIGS[values.country_code as keyof typeof REGION_CONFIGS]?.taxLabel || values.tax_name || 'GST',
        phone: values.phone,
        city: values.city,
        tax_number: values.tax_number,
        role_pin_hash: values.pin, // plain text storage as per schema pin constraint
        onboarding_done: true,
        persona_locked: true,
        worker_term: values.worker_term,
        stock_unit_primary: 'unit',
        currency: REGION_CONFIGS[values.country_code as keyof typeof REGION_CONFIGS]?.currency || values.currency || 'PKR',
        role: 'manufacturer',
        theme_id: activeTheme.id,
        whatsapp_numbers: finalWhatsapp,
        summary_frequency: values.summary_frequency,
        summary_time: values.summary_time,
        summary_includes: values.summary_includes,
      }, { onConflict: 'user_id' });

      if (error) throw error;

      // Seed default chart of accounts for new business
      try {
        const { data: profileData } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (profileData?.id) {
          const { seeded } = await seedChartOfAccounts(profileData.id);
          if (seeded > 0) {
            console.log(`[Setup] Seeded ${seeded} default accounts for business ${profileData.id}`);
          }
        }
      } catch (seedErr) {
        console.warn('[Setup] Chart of accounts seeding failed (non-fatal):', seedErr);
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
        console.warn('Failed to persist onboarding status to local database config:', localErr);
      }

      // Update Client cache
      useBusinessProfileStore.getState().clearCache();
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save profile", humanizeError(err, 'save profile'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleCountries = COUNTRY_SETUPS.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const stepsLabel = [
    "Regional Infrastructure",
    "Industry Vertical",
    "Business Profile",
    "WhatsApp Alerts",
    "Security PIN"
  ];

  return (
    <div className="min-h-screen bg-[#07090B] overflow-y-auto flex items-start justify-center p-6 font-inter text-slate-300">
      <div className="max-w-5xl w-full py-6">
        {/* Hub Logo & Stepper */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter italic">
            NOXIS<span className="text-cyan-400">HUB</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">Setup Wizard</p>
          <div className="flex items-center justify-center space-x-3 max-w-xl mx-auto">
            {stepsLabel.map((label, s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-9 h-9 rounded-md flex items-center justify-center border-2 transition-all duration-300 text-xs font-black",
                    step === s ? "border-cyan-400 bg-cyan-400/10 text-cyan-400 scale-105 shadow-[0_0_15px_rgba(34,211,238,0.25)]" : 
                    step > s ? "border-emerald bg-emerald/10 text-emerald" : "border-zinc-800 text-zinc-600 bg-black/40"
                  )}>
                    {step > s ? <Check className="w-4 h-4" /> : <span>{s + 1}</span>}
                  </div>
                </div>
                {s < stepsLabel.length - 1 && (
                  <div className={cn("h-[2px] flex-1 mx-2 transition-all duration-300", step > s ? "bg-emerald" : "bg-zinc-800")} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
            Step {step + 1}: {stepsLabel[step]}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8 max-w-3xl mx-auto"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Regional Infrastructure</h2>
                  <p className="text-zinc-500 max-w-xl mx-auto text-sm">
                    Select your operating region and country to load localization tokens, currency matrices, and tax compliance regulations.
                  </p>
                </div>

                <div className="bg-zinc-950/60 p-8 border border-zinc-800 rounded-sm space-y-6">
                  {/* Region Selection */}
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">Vertical Region</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setValue('region', 'south_asian')}
                        className={cn(
                          "py-4 rounded-sm border font-black uppercase text-xs tracking-widest transition-all",
                          selectedRegion === 'south_asian' 
                            ? "bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]" 
                            : "bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        )}
                      >
                        South Asian
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue('region', 'international')}
                        className={cn(
                          "py-4 rounded-sm border font-black uppercase text-xs tracking-widest transition-all",
                          selectedRegion === 'international' 
                            ? "bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]" 
                            : "bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        )}
                      >
                        International
                      </button>
                    </div>
                  </div>

                  {/* Country Search & Select */}
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">Country Profile</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                      <input 
                        type="text"
                        placeholder="Search country..."
                        className="w-full bg-[#09090b] border border-zinc-800 h-12 pl-12 pr-6 text-white text-sm outline-none focus:border-cyan-400 transition-all rounded-sm"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {visibleCountries.map(c => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => setValue('country_code', c.code)}
                          className={cn(
                            "p-3 text-left border rounded-sm transition-all hover:bg-white/5",
                            selectedCountryCode === c.code 
                              ? "bg-cyan-500/10 border-cyan-400 text-white" 
                              : "bg-black/30 border-zinc-900 text-zinc-400"
                          )}
                        >
                          <p className="text-xs font-black uppercase tracking-wider">{c.name}</p>
                          <p className="text-[10px] text-zinc-500 mt-1">{c.currency} • {c.taxName} ({c.defaultTaxRate}%)</p>
                        </button>
                      ))}
                      {visibleCountries.length === 0 && (
                        <button
                          type="button"
                          onClick={() => setValue('country_code', 'GLOBAL')}
                          className="col-span-full p-6 text-center bg-black/40 border border-dashed border-zinc-800 text-zinc-500 text-xs rounded-sm"
                        >
                          Country not listed? Initialize Global Profile
                        </button>
                      )}
                    </div>
                  </div>

                  {languageSuggestion && (
                    <div className="p-3 bg-cyan-400/10 border border-cyan-400/20 rounded-sm text-center">
                      <p className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                        <Globe size={14} /> suggested system interface: {languageSuggestion === 'ur' ? 'URDU (Nasta\'liq)' : languageSuggestion.toUpperCase()}
                      </p>
                    </div>
                  )}

                  {/* Next button INSIDE the card — always visible */}
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-sm transition-all rounded-sm shadow-[0_4px_20px_rgba(6,182,212,0.3)] mt-2"
                  >
                    Continue → Load Industry Vertical
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
                className="space-y-6 max-w-3xl mx-auto"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Industry & Region</h2>
                  <p className="text-zinc-500 text-sm">
                    Select your operating country and industry vertical to customize localization tokens, currency, and tax settings.
                  </p>
                </div>

                <div className="bg-zinc-950/60 p-8 border border-zinc-800 rounded-sm space-y-6">
                  {/* Country Selector */}
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">
                      Country / Region
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.values(REGION_CONFIGS).map(region => (
                        <button
                          type="button"
                          key={region.countryCode}
                          onClick={() => {
                            setValue('country_code', region.countryCode);
                          }}
                          className={cn(
                            "p-3 rounded-sm border text-left text-xs transition-all",
                            selectedCountryCode === region.countryCode
                              ? 'border-cyan-400 bg-cyan-400/10 text-white'
                              : 'border-white/8 text-gray-500 hover:border-white/18'
                          )}
                        >
                          <div className="font-semibold text-white">
                            {region.countryCode}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                            {region.currency} · {region.taxLabel} {region.taxRate}%
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Industry vertical selection grid */}
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">
                      Industry Blueprint
                    </label>
                    <p className="text-xs text-gray-500">
                      Your choice changes the entire software — labels, features, and workflows adapt to your business.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.values(INDUSTRY_CONFIGS).map(config => (
                        <button
                          type="button"
                          key={config.key}
                          onClick={() => {
                            setValue('industry_key', config.key);
                            setThemeByIndustry(config.key);
                          }}
                          className={cn(
                            "p-4 rounded-sm border text-left transition-all text-white",
                            selectedIndustryKey === config.key
                              ? ''
                              : 'border-white/8 bg-[#0F1114] hover:border-white/18'
                          )}
                          style={{
                            borderColor: selectedIndustryKey === config.key ? config.accentColor : undefined,
                            backgroundColor: selectedIndustryKey === config.key ? config.accentColorDim : undefined,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">
                              {config.emoji}
                            </span>
                            <span className="text-sm font-semibold text-white">
                              {config.displayName}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-relaxed">
                            {config.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live preview of what changes */}
                  {selectedIndustryKey && (
                    <div className="p-4 bg-[#070809] border border-white/6 rounded-sm space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        How the software will look
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          ['Workers called', INDUSTRY_CONFIGS[selectedIndustryKey as IndustryKey]?.terms.workers],
                          ['Advances called', INDUSTRY_CONFIGS[selectedIndustryKey as IndustryKey]?.terms.advance],
                          ['Items called', INDUSTRY_CONFIGS[selectedIndustryKey as IndustryKey]?.terms.items],
                          ['Production called', INDUSTRY_CONFIGS[selectedIndustryKey as IndustryKey]?.terms.production],
                          ['Invoice called', INDUSTRY_CONFIGS[selectedIndustryKey as IndustryKey]?.terms.invoice],
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-gray-500">
                              {label}
                            </span>
                            <span className="text-white font-medium">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-white/6">
                        <p className="text-[10px] text-zinc-500 mb-1.5 font-bold uppercase tracking-widest">
                          Features included
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(
                            INDUSTRY_CONFIGS[selectedIndustryKey as IndustryKey]?.features || {}
                          )
                            .filter(([_, v]) => v)
                            .map(([key]) => (
                            <span key={key} className="text-[9px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-6 border-t border-zinc-800">
                  <button type="button" onClick={() => setStep(0)} className="text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-white transition-colors">Back</button>
                  <button
                    type="button"
                    disabled={!selectedIndustryKey}
                    onClick={() => setStep(2)}
                    className="px-10 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black uppercase tracking-widest text-xs transition-all rounded-sm shadow-[0_4px_20px_rgba(6,182,212,0.25)]"
                  >
                    Continue with {
                      selectedIndustryKey
                        ? INDUSTRY_CONFIGS[selectedIndustryKey as IndustryKey]?.displayName
                        : '...'
                    }
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
                className="max-w-4xl mx-auto space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Business Profile & Terms</h2>
                  <p className="text-zinc-500 text-sm">Configure your primary business identity parameters and nomenclature.</p>
                </div>

                <div className="bg-zinc-950/60 p-8 border border-zinc-800 rounded-sm space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputGroup label="Business / Factory Name" error={errors.business_name?.message}>
                      <input {...register("business_name")} className="industrial-input" placeholder="e.g. Faisalabad Textile Mills" />
                    </InputGroup>
                    
                    <InputGroup label="Authorized Owner Name" error={errors.owner_name?.message}>
                      <input {...register("owner_name")} className="industrial-input" placeholder="Your Full Legal Name" />
                    </InputGroup>

                    <InputGroup label="Primary Contact Number" error={errors.phone?.message}>
                      <input {...register("phone")} className="industrial-input" placeholder="e.g. +923001234567" />
                    </InputGroup>

                    <InputGroup label="City / Hub Location" error={errors.city?.message}>
                      <input {...register("city")} className="industrial-input" placeholder="e.g. Faisalabad" />
                    </InputGroup>

                    <InputGroup label={`${watch('tax_name')} Registration Number`} error={errors.tax_number?.message}>
                      <input {...register("tax_number")} className="industrial-input" placeholder="Optional" />
                    </InputGroup>

                    <InputGroup label="Worker Term Customization" error={errors.worker_term?.message}>
                      <select {...register("worker_term")} className="industrial-input">
                        <option value="karigar">Karigar (Traditional South Asian)</option>
                        <option value="worker">Worker (Standard)</option>
                        <option value="operator">Operator (Industrial Manufacturing)</option>
                        <option value="artisan">Artisan (Craftsman)</option>
                        <option value="tailor">Tailor (Apparel/Garments)</option>
                        <option value="employee">Employee (Corporate / General)</option>
                      </select>
                    </InputGroup>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-zinc-800">
                  <button type="button" onClick={() => setStep(1)} className="text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-white">Back</button>
                  <button
                    type="button"
                    onClick={() => {
                      // Basic validation check
                      const bn = watch('business_name');
                      const on = watch('owner_name');
                      const ph = watch('phone');
                      const ci = watch('city');
                      if (bn && bn.length >= 2 && on && on.length >= 2 && ph && ph.length >= 8 && ci && ci.length >= 2) {
                        setStep(3);
                      } else {
                        toast.error("Validation Failed", "Please fill in the required profile fields correctly.");
                      }
                    }}
                    className="px-10 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-black uppercase tracking-widest text-xs transition-all rounded-sm shadow-[0_4px_20px_rgba(6,182,212,0.25)]"
                  >
                    Setup Alerts
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-cyan-400/10 border border-cyan-400/20 rounded-md flex items-center justify-center mx-auto">
                    <Smartphone className="text-cyan-400" size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">WhatsApp Summary Alerts</h2>
                  <p className="text-zinc-500 text-sm">Configure automated daily operations reports directly to your phone.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left panel: Contacts list */}
                  <div className="bg-zinc-950/60 p-6 border border-zinc-800 rounded-sm space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">Primary Recipient Phone</label>
                      <input 
                        type="text" 
                        value={primaryPhone || ""} 
                        readOnly 
                        className="industrial-input bg-black/60 text-zinc-500 cursor-not-allowed" 
                      />
                      <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-wider">Synced from Business Profile</p>
                    </div>

                    <div className="border-t border-zinc-900 pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">Additional Alert Recipients</label>
                        <button 
                          type="button" 
                          onClick={handleAddContact}
                          className="text-cyan-400 text-[10px] font-black uppercase hover:underline flex items-center gap-1"
                        >
                          <Plus size={12} /> Add recipient
                        </button>
                      </div>

                      <div className="space-y-3 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                        {whatsappContacts.map((c, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input 
                              type="text"
                              placeholder="Name" 
                              value={c.name}
                              onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                              className="industrial-input text-xs" 
                            />
                            <input 
                              type="text"
                              placeholder="Phone (+92...)" 
                              value={c.phone}
                              onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                              className="industrial-input text-xs" 
                            />
                            <button 
                              type="button" 
                              onClick={() => handleRemoveContact(idx)} 
                              className="p-2 text-red-500 hover:text-red-400 bg-red-950/20 border border-red-900/35 hover:bg-red-950/40 transition-all rounded-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {whatsappContacts.length === 0 && (
                          <p className="text-[10px] text-zinc-600 italic">No additional recipients added. Alerts will only be dispatched to the primary number.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right panel: Scheduling & Settings */}
                  <div className="bg-zinc-950/60 p-6 border border-zinc-800 rounded-sm space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">Alert frequency</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Daily', '3 Days', 'Weekly'].map(f => {
                          const val = f === 'Daily' ? 1 : f === '3 Days' ? 3 : 7;
                          const currentFreq = watch('summary_frequency') || 1;
                          return (
                            <button 
                              key={f} 
                              type="button" 
                              onClick={() => setValue('summary_frequency', val)}
                              className={cn(
                                "py-2.5 rounded-sm text-[10px] font-black uppercase tracking-wider border transition-all",
                                currentFreq === val
                                  ? "bg-cyan-500/15 border-cyan-400 text-cyan-400" 
                                  : "bg-black/40 border-zinc-900 text-zinc-500 hover:border-zinc-800"
                              )}
                            >
                              {f}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">Scheduled Dispatch Time</label>
                      <select className="industrial-input h-10 text-xs" {...register('summary_time')}>
                        <option value="08:00">08:00 AM (Shift Start)</option>
                        <option value="12:00">12:00 PM (Midday)</option>
                        <option value="20:00">08:00 PM (Recommended - Shift End)</option>
                        <option value="21:00">09:00 PM (Post-Shift reconcile)</option>
                      </select>
                    </div>

                    <div className="space-y-3 border-t border-zinc-900 pt-4">
                      <label className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">Metrics to Include</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['revenue', 'production', 'low_stock', 'overdue', 'attendance', 'cashflow'].map((item) => (
                          <label key={item} className="flex items-center gap-3 cursor-pointer group">
                            <input 
                              type="checkbox" 
                              className="hidden peer"
                              defaultChecked
                              onChange={(e) => {
                                const prev = watch('summary_includes') || {};
                                setValue('summary_includes', { ...prev, [item]: e.target.checked });
                              }}
                            />
                            <div className="w-4 h-4 border border-zinc-800 rounded-sm flex items-center justify-center peer-checked:bg-cyan-400 peer-checked:border-cyan-400 transition-all bg-black/40">
                              <Check size={10} className="text-black hidden peer-checked:block" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-zinc-500 group-hover:text-zinc-300 transition-colors">
                              {item.replace('_', ' ')}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-zinc-800">
                  <button type="button" onClick={() => setStep(2)} className="text-[10px] font-black uppercase text-zinc-500 hover:text-white">Back</button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-10 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-black uppercase tracking-widest text-xs transition-all rounded-sm shadow-[0_4px_20px_rgba(6,182,212,0.25)]"
                  >
                    Ecosystem Security
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-md mx-auto bg-zinc-950/60 p-8 border border-zinc-850 text-center rounded-sm space-y-6"
              >
                <div className="w-14 h-14 bg-cyan-400/10 border border-cyan-400/20 rounded-md flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-7 h-7 text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Access Control PIN</h2>
                  <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                    Set a 4-digit PIN for high-stakes ledger entries and role switches.
                  </p>
                </div>

                <div className="space-y-4 text-left">
                  <InputGroup label="Set Access PIN" error={errors.pin?.message}>
                    <input 
                      type="password" 
                      maxLength={4}
                      {...register("pin")}
                      className="text-center text-2xl tracking-[0.8em] font-mono industrial-input bg-black/60 h-14" 
                      placeholder="****"
                    />
                  </InputGroup>

                  <InputGroup label="Confirm Access PIN" error={errors.confirmPin?.message}>
                    <input 
                      type="password" 
                      maxLength={4}
                      {...register("confirmPin")}
                      className="text-center text-2xl tracking-[0.8em] font-mono industrial-input bg-black/60 h-14" 
                      placeholder="****"
                    />
                  </InputGroup>
                </div>

                <div className="pt-6 space-y-3">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-4 bg-emerald hover:bg-emerald-600 disabled:opacity-50 text-black font-black uppercase tracking-[0.15em] text-xs transition-all flex items-center justify-center rounded-sm shadow-[0_4px_25px_rgba(16,185,129,0.2)]"
                  >
                    {isSubmitting ? "Deploying Core Ecosystem..." : "Initialize Noxis Hub"}
                    {!isSubmitting && <CheckCircle2 className="w-4 h-4 ml-2" />}
                  </button>
                  <button type="button" onClick={() => setStep(3)} className="text-[10px] font-black uppercase tracking-wider text-zinc-650 hover:text-white transition-colors block mx-auto">Adjust alerts</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      <style jsx global>{`
        .industrial-input {
          width: 100%;
          background: #09090b;
          border: 1px solid #27272a;
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: all 200ms ease-in-out;
          border-radius: 2px;
        }
        .industrial-input:focus {
          border-color: #22d3ee;
          box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.25);
          background: #09090b;
        }
        .industrial-input::placeholder {
          color: #52525b;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}

function InputGroup({ label, children, error }: any) {
  return (
    <div className="space-y-2">
      <label className="block text-[9px] uppercase font-black tracking-[0.15em] text-zinc-500">
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-[9px] font-bold uppercase mt-1">{error}</p>}
    </div>
  );
}
