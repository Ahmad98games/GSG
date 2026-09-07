'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Truck,
  FileCheck,
  CreditCard,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Coins,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useToast } from '@/hooks/useToast'
import { useQueryClient } from '@tanstack/react-query'

export const MAJOR_TEXTILE_HUBS = [
  'Faisalabad',
  'Lahore',
  'Karachi',
  'Gujranwala',
  'Multan',
  'Sialkot',
  'Rawalpindi',
  'Peshawar',
  'Kasur',
  'Hafizabad',
  'Other (Custom)'
] as const

export interface EditPartyModalProps {
  isOpen: boolean
  onClose: () => void
  party: any
  onSuccess?: (updatedParty: any) => void
}

export function EditPartyModal({
  isOpen,
  onClose,
  party,
  onSuccess
}: EditPartyModalProps) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { profile } = useBusinessProfile()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'basic' | 'commercial'>('basic')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form State
  const [form, setForm] = useState({
    name: '',
    party_type: 'customer',
    phone: '',
    secondaryPhone: '',
    email: '',
    city: 'Faisalabad',
    customCity: '',
    address: '',
    openingBalance: '0',
    openingBalanceType: 'receivable' as 'receivable' | 'payable',
    credit_limit: '',
    credit_days: '30',
    preferredTransport: '',
    cnicOrNtn: '',
    notes: ''
  })

  // Hydrate form when party changes
  useEffect(() => {
    if (party && isOpen) {
      const existingCity = party.city || ''
      const isKnownHub = MAJOR_TEXTILE_HUBS.includes(existingCity as any)
      const selectedHub = isKnownHub
        ? existingCity
        : existingCity
        ? 'Other (Custom)'
        : 'Faisalabad'

      setForm({
        name: party.name || '',
        party_type: party.party_type || 'customer',
        phone: party.phone || '',
        secondaryPhone: party.secondary_phone || party.secondaryPhone || '',
        email: party.email || '',
        city: selectedHub,
        customCity: !isKnownHub && existingCity ? existingCity : '',
        address: party.address || '',
        openingBalance: String(
          party.opening_balance ?? party.openingBalance ?? (party.current_balance ? Math.abs(party.current_balance) : '0')
        ),
        openingBalanceType:
          party.balance_nature ||
          party.openingBalanceType ||
          (Number(party.current_balance || 0) < 0 ? 'payable' : 'receivable'),
        credit_limit: String(party.credit_limit ?? ''),
        credit_days: String(party.credit_days ?? party.credit_terms_days ?? '30'),
        preferredTransport: party.preferred_transport || party.preferredTransport || '',
        cnicOrNtn: party.cnic_or_ntn || party.cnicOrNtn || party.ntn || '',
        notes: party.notes || ''
      })
      setErrors({})
      setActiveTab('basic')
    }
  }, [party, isOpen])

  // Field validation
  const validateForm = () => {
    const errs: Record<string, string> = {}

    if (!form.name.trim()) {
      errs.name = 'Party / Business name is required'
    }

    if (form.phone && form.phone.trim().length > 0 && form.phone.replace(/[^0-9]/g, '').length < 10) {
      errs.phone = 'Valid phone number required (e.g. 03001234567)'
    }

    // Wholesale Credit Limit Validation:
    // Minimum threshold for non-zero wholesale credit is PKR 10,000 to prevent accidental under-limits.
    const creditVal = parseFloat(form.credit_limit || '0')
    if (form.credit_limit && form.credit_limit.trim() !== '') {
      if (isNaN(creditVal) || creditVal < 0) {
        errs.credit_limit = 'Credit limit must be a positive number or 0'
      } else if (creditVal > 0 && creditVal < 10000) {
        errs.credit_limit = 'Wholesale credit limit should be at least PKR 10,000 (or leave empty for cash-only)'
      }
    }

    const creditDaysVal = parseInt(form.credit_days || '0', 10)
    if (isNaN(creditDaysVal) || creditDaysVal < 0) {
      errs.credit_days = 'Credit terms days must be 0 or greater'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const effectiveCity = useMemo(() => {
    if (form.city === 'Other (Custom)') {
      return form.customCity.trim() || 'Pakistan'
    }
    return form.city || 'Faisalabad'
  }, [form.city, form.customCity])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!validateForm()) {
      // If error is in commercial tab and we are on basic tab, switch tabs or notify
      if (errors.credit_limit || errors.credit_days) {
        setActiveTab('commercial')
      }
      return
    }

    const rawBiz = profile?.id || (typeof window !== 'undefined' ? localStorage.getItem('noxis_business_id') : null)
    const businessId = rawBiz || party?.business_id || '00000000-0000-0000-0000-000000000000'

    if (!party?.id) {
      toast.error('Missing party identifier')
      return
    }

    setSaving(true)

    const creditLimitNum = form.credit_limit ? parseFloat(form.credit_limit) : 0
    const creditDaysNum = parseInt(form.credit_days || '0', 10) || 0
    const opBalNum = parseFloat(form.openingBalance || '0') || 0

    // Full wholesale payload
    const updatedPayload: Record<string, any> = {
      name: form.name.trim(),
      party_type: form.party_type,
      phone: form.phone.trim() || null,
      secondary_phone: form.secondaryPhone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      city: effectiveCity,
      credit_limit: creditLimitNum,
      credit_days: creditDaysNum,
      opening_balance: opBalNum,
      balance_nature: form.openingBalanceType,
      preferred_transport: form.preferredTransport.trim() || null,
      cnic_or_ntn: form.cnicOrNtn.trim() || null,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString()
    }

    try {
      // 1. Attempt update on Supabase
      const { data, error: updateErr } = await supabase
        .from('parties')
        .update(updatedPayload)
        .eq('id', party.id)
        .select()
        .single()

      if (updateErr) {
        // Fallback: If DB schema doesn't have newer columns yet, strip new columns and save core fields
        console.warn('[EditPartyModal] Extended column update fallback:', updateErr.message)
        const corePayload = {
          name: form.name.trim(),
          party_type: form.party_type,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          city: effectiveCity,
          credit_limit: creditLimitNum,
          credit_days: creditDaysNum,
          notes: form.notes.trim() || null,
          updated_at: new Date().toISOString()
        }
        const { error: coreErr } = await supabase
          .from('parties')
          .update(corePayload)
          .eq('id', party.id)

        if (coreErr) {
          console.warn('[EditPartyModal] Core update fallback:', coreErr.message)
        }
      }

      // 2. Updated Party Object combining old and new properties
      const mergedParty = {
        ...party,
        ...updatedPayload,
        city: effectiveCity,
        secondaryPhone: form.secondaryPhone.trim(),
        preferredTransport: form.preferredTransport.trim(),
        cnicOrNtn: form.cnicOrNtn.trim(),
        openingBalance: opBalNum,
        openingBalanceType: form.openingBalanceType
      }

      // 3. Update localStorage cache immediately for 0ms offline rendering
      if (typeof window !== 'undefined') {
        const cacheKeys = [
          `noxis_cached_parties_${businessId}`,
          `noxis_cached_parties_00000000-0000-0000-0000-000000000000`,
          `noxis_cached_parties`
        ]
        cacheKeys.forEach(k => {
          try {
            const raw = localStorage.getItem(k)
            if (raw) {
              const list = JSON.parse(raw)
              if (Array.isArray(list)) {
                const updatedList = list.map((p: any) =>
                  p.id === party.id ? { ...p, ...mergedParty } : p
                )
                localStorage.setItem(k, JSON.stringify(updatedList))
              }
            }
          } catch {}
        })
      }

      // 4. Update React Query Cache immediately
      queryClient.setQueryData(['parties', businessId], (old: any) => {
        if (!Array.isArray(old)) return [mergedParty]
        return old.map((p: any) => (p.id === party.id ? { ...p, ...mergedParty } : p))
      })
      queryClient.setQueryData(['parties_registry', businessId], (old: any) => {
        if (!Array.isArray(old)) return [mergedParty]
        return old.map((p: any) => (p.id === party.id ? { ...p, ...mergedParty } : p))
      })
      queryClient.setQueryData(['party', party.id], mergedParty)

      queryClient.invalidateQueries({ queryKey: ['parties'] })
      queryClient.invalidateQueries({ queryKey: ['parties_registry'] })
      queryClient.invalidateQueries({ queryKey: ['party', party.id] })
      queryClient.invalidateQueries({ queryKey: ['khata-parties'] })

      // 5. Broadcast update event across window & Electron
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('noxis:party-updated', { detail: mergedParty }))
        if ((window as any).electronAPI?.party?.notifyUpdate) {
          ;(window as any).electronAPI.party.notifyUpdate({ partyId: party.id, ...mergedParty })
        }
      }

      toast.success('Party Updated', `${mergedParty.name} details saved successfully`)
      if (onSuccess) onSuccess(mergedParty)
      onClose()
    } catch (err: any) {
      console.error('[EditPartyModal] Error saving party:', err)
      toast.error('Save Notice', err.message || 'Updated locally')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !party) return null
  if (typeof document === 'undefined') return null

  const inputClass = (field: string) => `
    w-full bg-[#030712] border ${
      errors[field] ? 'border-red-500/80 focus:border-red-400' : 'border-[#1e293b] focus:border-[#38bdf8]'
    } text-slate-100 text-xs px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-[#38bdf8]/30
  `

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      {/* Modal Container */}
      <div
        className="w-full max-w-2xl bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all"
        style={{
          boxShadow: '0 0 40px rgba(15, 23, 42, 0.9), 0 0 20px rgba(56, 189, 248, 0.08)'
        }}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#1e293b] flex items-center justify-between bg-[#0f172a]/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20">
              <Building2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-wide uppercase">
                Edit Party Details
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {party?.name || 'Wholesale Client'} &bull; ID: {party?.id?.slice(0, 8)}...
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1e293b] bg-[#0b1120] px-6">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'basic'
                ? 'text-[#38bdf8] border-[#38bdf8] bg-[#38bdf8]/5'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Building2 size={14} />
            <span>Basic Info</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('commercial')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'commercial'
                ? 'text-[#38bdf8] border-[#38bdf8] bg-[#38bdf8]/5'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <CreditCard size={14} />
            <span>Commercial &amp; Logistics</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {/* Party Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                    Party Name <span className="text-[#38bdf8]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Al-Hamid Textiles &amp; Fabrics"
                    className={inputClass('name')}
                  />
                  {errors.name && (
                    <p className="text-[10px] text-red-400 font-bold">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                    Party Role
                  </label>
                  <select
                    value={form.party_type}
                    onChange={e => setForm(p => ({ ...p, party_type: e.target.value }))}
                    className={inputClass('party_type')}
                  >
                    <option value="customer">Buyer / Customer</option>
                    <option value="supplier">Supplier / Mill</option>
                    <option value="both">Both (Buyer &amp; Supplier)</option>
                    <option value="karigar">Karigar / Vendor</option>
                  </select>
                </div>
              </div>

              {/* Primary Phone & Munshi Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                    <Phone size={11} className="text-[#38bdf8]" />
                    Primary Phone (Owner / Office)
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="0300-1234567"
                    className={inputClass('phone')}
                  />
                  {errors.phone && (
                    <p className="text-[10px] text-red-400 font-bold">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                    <Phone size={11} className="text-[#38bdf8]" />
                    Munshi / Alternate Contact
                  </label>
                  <input
                    type="tel"
                    value={form.secondaryPhone}
                    onChange={e => setForm(p => ({ ...p, secondaryPhone: e.target.value }))}
                    placeholder="Munshi name &amp; phone (0321-7654321)"
                    className={inputClass('secondaryPhone')}
                  />
                  <p className="text-[9px] text-slate-500">
                    Accounts manager or factory floor munshi contact.
                  </p>
                </div>
              </div>

              {/* Email & City Hub */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                    <Mail size={11} className="text-[#38bdf8]" />
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="accounts@alhamidtextile.com"
                    className={inputClass('email')}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                    <MapPin size={11} className="text-[#38bdf8]" />
                    Textile Hub / City
                  </label>
                  <select
                    value={form.city}
                    onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                    className={inputClass('city')}
                  >
                    {MAJOR_TEXTILE_HUBS.map(hub => (
                      <option key={hub} value={hub}>
                        {hub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom City text input if "Other (Custom)" chosen */}
              {form.city === 'Other (Custom)' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                    Specify City / Market Name
                  </label>
                  <input
                    type="text"
                    value={form.customCity}
                    onChange={e => setForm(p => ({ ...p, customCity: e.target.value }))}
                    placeholder="Enter city or textile industrial zone..."
                    className={inputClass('customCity')}
                  />
                </div>
              )}

              {/* Physical Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                  <MapPin size={11} className="text-[#38bdf8]" />
                  Factory / Shop Physical Address
                </label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Plot #, Street, Mill Area, Bazar Name..."
                  className={inputClass('address')}
                />
              </div>
            </div>
          )}

          {/* TAB 2: COMMERCIAL & LOGISTICS */}
          {activeTab === 'commercial' && (
            <div className="space-y-4">
              {/* Opening Balance Card & Toggle */}
              <div className="p-4 rounded-xl bg-[#0b1120] border border-[#1e293b] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1">
                      <Coins size={12} className="text-[#38bdf8]" />
                      Opening Balance (PKR)
                    </label>
                    <p className="text-[10px] text-slate-500">
                      Pre-existing balance carried forward at onboarding.
                    </p>
                  </div>

                  {/* Nature Toggle */}
                  <div className="inline-flex p-1 bg-[#030712] rounded-xl border border-[#1e293b]">
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, openingBalanceType: 'receivable' }))}
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        form.openingBalanceType === 'receivable'
                          ? 'bg-emerald-500 text-black shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ArrowUpRight size={12} />
                      <span>Receivable (Lena Hai)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, openingBalanceType: 'payable' }))}
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        form.openingBalanceType === 'payable'
                          ? 'bg-amber-500 text-black shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ArrowDownLeft size={12} />
                      <span>Payable (Dena Hai)</span>
                    </button>
                  </div>
                </div>

                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.openingBalance}
                  onChange={e => setForm(p => ({ ...p, openingBalance: e.target.value }))}
                  placeholder="0"
                  className={inputClass('openingBalance')}
                />
              </div>

              {/* Wholesale Credit Limit & Credit Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                      <CreditCard size={11} className="text-[#38bdf8]" />
                      Credit Limit (PKR)
                    </label>
                    <span className="text-[9px] text-slate-500">Min threshold: 10k</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.credit_limit}
                    onChange={e => setForm(p => ({ ...p, credit_limit: e.target.value }))}
                    placeholder="e.g. 500000 (0 for Cash-only)"
                    className={inputClass('credit_limit')}
                  />
                  {errors.credit_limit && (
                    <p className="text-[10px] text-red-400 font-bold">{errors.credit_limit}</p>
                  )}
                  <p className="text-[9px] text-slate-500">
                    System warns when unpaid billing exceeds this limit.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                    <Clock size={11} className="text-[#38bdf8]" />
                    Credit Terms (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.credit_days}
                    onChange={e => setForm(p => ({ ...p, credit_days: e.target.value }))}
                    placeholder="30"
                    className={inputClass('credit_days')}
                  />
                  {errors.credit_days && (
                    <p className="text-[10px] text-red-400 font-bold">{errors.credit_days}</p>
                  )}
                  <p className="text-[9px] text-slate-500">
                    Standard payment cycle: e.g. 15, 30, or 60 days.
                  </p>
                </div>
              </div>

              {/* Preferred Transport (Goods Adda) & CNIC/NTN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                    <Truck size={11} className="text-[#38bdf8]" />
                    Preferred Transport (Goods Adda)
                  </label>
                  <input
                    type="text"
                    value={form.preferredTransport}
                    onChange={e => setForm(p => ({ ...p, preferredTransport: e.target.value }))}
                    placeholder="e.g. Faisal Movers / Daewoo / Royal Cargo"
                    className={inputClass('preferredTransport')}
                  />
                  <p className="text-[9px] text-slate-500">
                    Designated Adda / Bilty counter for dispatches.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                    <FileCheck size={11} className="text-[#38bdf8]" />
                    CNIC / NTN Verification
                  </label>
                  <input
                    type="text"
                    value={form.cnicOrNtn}
                    onChange={e => setForm(p => ({ ...p, cnicOrNtn: e.target.value }))}
                    placeholder="33100-XXXXXXX-X or 7-digit NTN"
                    className={inputClass('cnicOrNtn')}
                  />
                  <p className="text-[9px] text-slate-500">
                    FBR active taxpayer verification &amp; identity string.
                  </p>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1">
                  Internal Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Payment reputation, special discount agreements, guarantor details..."
                  className={inputClass('notes')}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#1e293b] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {activeTab === 'basic' ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('commercial')}
                  className="px-5 py-2.5 text-xs font-bold text-[#38bdf8] bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 rounded-xl transition-all cursor-pointer"
                >
                  Next: Commercial &amp; Logistics &rarr;
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 border border-white/10 rounded-xl transition-all cursor-pointer"
                >
                  &larr; Back to Basic Info
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#38bdf8] hover:bg-sky-400 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#38bdf8]/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
