'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { REGION_CONFIGS } from '@/lib/industry/regionConfigs'
import { INDUSTRY_CONFIGS } from '@/lib/industry/configs'
import { useIndustryConfig } from '@/hooks/useIndustryConfig'
import { useToast } from '@/hooks/useToast'
import { Globe, Check } from 'lucide-react'

export default function LocalizationPage() {
  const supabase = createClient()
  // Cleaned Destructuring: Removed non-existent refetch variable
  const { profile } = useBusinessProfile()
  const { fmt, fmtDate, taxLabel, taxRate } = useIndustryConfig()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [form, setForm] = useState({
    country_code: profile?.country_code || 'PK',
    currency: profile?.currency || 'PKR',
    tax_label: profile?.tax_label || 'GST',
    tax_rate: profile?.tax_rate || 17,
    industry: profile?.industry_key || profile?.industry_type || 'textile',
  })

  const selectedRegion = REGION_CONFIGS[form.country_code]

  const saveSettings = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('business_profiles')
        .update({
          country_code: form.country_code,
          currency: form.currency,
          tax_label: form.tax_label,
          tax_rate: form.tax_rate,
          industry_key: form.industry,
          industry_type: form.industry,
        })
        .eq('id', profile!.id)
      if (error) throw error
    },
    onSuccess: async () => {
      // Automatic global cache invalidation is enough to refresh the app state
      await queryClient.invalidateQueries({
        queryKey: ['business-profile']
      })
      toast.success('Localization updated', 'Settings re-applied successfully.')
    },
    onError: () => {
      toast.error('Could not save settings')
    },
  })

  const INPUT = 'w-full bg-[#161A1F] border border-white/8 text-white text-xs px-3 py-2.5 outline-none focus:border-[#60A5FA]/40'
  const LABEL = 'text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5'

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-white/5 pb-6">
        <Globe size={20} className="text-[#60A5FA]" />
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight uppercase italic">
            Localization Settings
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure country formatting parameters, base currency, and active industry type.
          </p>
        </div>
      </div>

      {/* Live preview */}
      <div className="p-5 bg-[#0A0C0F] border border-electric-blue/15 rounded-sm shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-electric-blue/5 rounded-full blur-2xl" />
        <p className="text-[9px] font-black uppercase tracking-widest text-electric-blue mb-3.5">
          Live Formatting Preview
        </p>
        <div className="grid grid-cols-2 gap-4 text-xs">
          {[
            ['Invoice amount', `${form.currency} 1,500`],
            ['Tax line', `${form.tax_label} (${form.tax_rate}%): ${form.currency} 255`],
            ['Total', `${form.currency} 1,755`],
            ['Date format', selectedRegion?.dateFormat || 'DD/MM/YYYY'],
            ['Calling code', selectedRegion?.callingCode || '+92'],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-white/5 pb-2">
              <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                {label}
              </p>
              <p className="text-white font-mono font-semibold mt-1">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 bg-[#0F1114] border border-white/5 p-6 rounded-sm">
        {/* Country/Region */}
        <div>
          <label className={LABEL}>
            Country / Region Configuration
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {Object.values(REGION_CONFIGS).map(region => (
              <button
                key={region.countryCode}
                onClick={() => {
                  setForm(p => ({
                    ...p,
                    country_code: region.countryCode,
                    currency: region.currency,
                    tax_label: region.taxLabel,
                    tax_rate: region.taxRate,
                  }))
                }}
                className={`p-3 text-left text-xs border rounded-sm transition-all ${
                  form.country_code === region.countryCode
                    ? 'border-[#60A5FA]/50 bg-[#60A5FA]/8 text-white'
                    : 'border-white/8 text-gray-500 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider">
                    {region.countryCode}
                  </span>
                  {form.country_code === region.countryCode && (
                    <Check size={11} className="text-[#60A5FA]" />
                  )}
                </div>
                <p className="text-[10px] text-gray-600 mt-1">
                  {region.currency} · {region.taxLabel} {region.taxRate}%
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Industry */}
        <div>
          <label className={LABEL}>
            Active Industry Segment
          </label>
          <select
            value={form.industry}
            onChange={e => setForm(p => ({
              ...p, industry: e.target.value
            }))}
            className={INPUT}
          >
            {Object.values(INDUSTRY_CONFIGS).map(ind => (
              <option key={ind.key} value={ind.key}>
                {ind.emoji} {ind.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Custom override values */}
        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
          <div>
            <label className={LABEL}>Custom Tax Label</label>
            <input
              value={form.tax_label}
              onChange={e => setForm(p => ({ ...p, tax_label: e.target.value }))}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Custom Tax Rate (%)</label>
            <input
              type="number"
              value={form.tax_rate}
              onChange={e => setForm(p => ({ ...p, tax_rate: parseFloat(e.target.value) || 0 }))}
              className={INPUT}
            />
          </div>
        </div>

        <button
          onClick={() => saveSettings.mutate()}
          disabled={saveSettings.isPending}
          className="w-full py-3 bg-electric-blue text-onyx text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
        >
          {saveSettings.isPending ? 'Saving Configuration...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}