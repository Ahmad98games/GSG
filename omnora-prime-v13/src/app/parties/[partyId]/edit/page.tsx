'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Truck,
  FileCheck,
  CreditCard,
  Clock,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { humanizeError } from '@/lib/utils/errors'
import { MAJOR_TEXTILE_HUBS } from '@/components/parties/EditPartyModal'

export default function EditPartyPage() {
  const { partyId } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { profile } = useBusinessProfile()

  const [activeTab, setActiveTab] = useState<'basic' | 'commercial'>('basic')
  const [party, setParty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

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

  useEffect(() => {
    loadParty()
  }, [partyId, profile?.id])

  const loadParty = async () => {
    if (!partyId) return
    setLoading(true)

    const rawBiz = profile?.id || (typeof window !== 'undefined' ? localStorage.getItem('noxis_business_id') : null)

    // 1. Try local cache first for 0ms load
    if (typeof window !== 'undefined') {
      const keys = [
        rawBiz ? `noxis_cached_parties_${rawBiz}` : null,
        `noxis_cached_parties_00000000-0000-0000-0000-000000000000`,
        `noxis_cached_parties`
      ].filter(Boolean) as string[]

      for (const k of keys) {
        try {
          const raw = localStorage.getItem(k)
          if (raw) {
            const list = JSON.parse(raw)
            const found = list.find((p: any) => p.id === partyId)
            if (found) {
              hydrateParty(found)
              setLoading(false)
              break
            }
          }
        } catch {}
      }
    }

    // 2. Fetch from Supabase
    try {
      let query = supabase.from('parties').select('*').eq('id', partyId)
      if (rawBiz) {
        query = query.eq('business_id', rawBiz)
      }
      const { data, error } = await query.maybeSingle()
      if (data) {
        hydrateParty(data)
      }
    } catch (err: any) {
      console.warn('[EditPartyPage] Network fetch note:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const hydrateParty = (data: any) => {
    setParty(data)
    const existingCity = data.city || ''
    const isKnownHub = MAJOR_TEXTILE_HUBS.includes(existingCity as any)
    const selectedHub = isKnownHub
      ? existingCity
      : existingCity
      ? 'Other (Custom)'
      : 'Faisalabad'

    setForm({
      name: data.name || '',
      party_type: data.party_type || 'customer',
      phone: data.phone || '',
      secondaryPhone: data.secondary_phone || data.secondaryPhone || '',
      email: data.email || '',
      city: selectedHub,
      customCity: !isKnownHub && existingCity ? existingCity : '',
      address: data.address || '',
      openingBalance: String(
        data.opening_balance ?? data.openingBalance ?? (data.current_balance ? Math.abs(data.current_balance) : '0')
      ),
      openingBalanceType:
        data.balance_nature ||
        data.openingBalanceType ||
        (Number(data.current_balance || 0) < 0 ? 'payable' : 'receivable'),
      credit_limit: String(data.credit_limit ?? ''),
      credit_days: String(data.credit_days ?? data.credit_terms_days ?? '30'),
      preferredTransport: data.preferred_transport || data.preferredTransport || '',
      cnicOrNtn: data.cnic_or_ntn || data.cnicOrNtn || data.ntn || '',
      notes: data.notes || ''
    })
  }

  const effectiveCity = useMemo(() => {
    if (form.city === 'Other (Custom)') {
      return form.customCity.trim() || 'Pakistan'
    }
    return form.city || 'Faisalabad'
  }, [form.city, form.customCity])

  const validateForm = () => {
    const errs: Record<string, string> = {}

    if (!form.name.trim()) {
      errs.name = 'Party / Business name is required'
    }

    if (form.phone && form.phone.trim().length > 0 && form.phone.replace(/[^0-9]/g, '').length < 10) {
      errs.phone = 'Valid phone number required (e.g. 03001234567)'
    }

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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setGeneralError('')
    setSuccessMsg('')

    if (!validateForm()) {
      if (errors.credit_limit || errors.credit_days) {
        setActiveTab('commercial')
      }
      return
    }

    const rawBiz = profile?.id || (typeof window !== 'undefined' ? localStorage.getItem('noxis_business_id') : null)
    const businessId = rawBiz || party?.business_id || '00000000-0000-0000-0000-000000000000'

    if (!partyId) {
      setGeneralError('Missing Party ID.')
      return
    }

    setSaving(true)

    const creditLimitNum = form.credit_limit ? parseFloat(form.credit_limit) : 0
    const creditDaysNum = parseInt(form.credit_days || '0', 10) || 0
    const opBalNum = parseFloat(form.openingBalance || '0') || 0

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
      const { error: updateErr } = await supabase
        .from('parties')
        .update(updatedPayload)
        .eq('id', partyId)

      if (updateErr) {
        console.warn('[EditPartyPage] Extended columns fallback:', updateErr.message)
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
        await supabase.from('parties').update(corePayload).eq('id', partyId)
      }

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

      // Local storage cache update
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
                  p.id === partyId ? { ...p, ...mergedParty } : p
                )
                localStorage.setItem(k, JSON.stringify(updatedList))
              }
            }
          } catch {}
        })
      }

      // Query cache updates
      queryClient.setQueryData(['parties', businessId], (old: any) => {
        if (!Array.isArray(old)) return [mergedParty]
        return old.map((p: any) => (p.id === partyId ? { ...p, ...mergedParty } : p))
      })
      queryClient.setQueryData(['parties_registry', businessId], (old: any) => {
        if (!Array.isArray(old)) return [mergedParty]
        return old.map((p: any) => (p.id === partyId ? { ...p, ...mergedParty } : p))
      })
      queryClient.setQueryData(['party', partyId], mergedParty)

      queryClient.invalidateQueries({ queryKey: ['parties'] })
      queryClient.invalidateQueries({ queryKey: ['parties_registry'] })
      queryClient.invalidateQueries({ queryKey: ['party', partyId] })
      queryClient.invalidateQueries({ queryKey: ['khata-parties'] })

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('noxis:party-updated', { detail: mergedParty }))
        try {
          if ((window as any).electronAPI?.party?.notifyUpdate) {
            ;(window as any).electronAPI.party.notifyUpdate({ partyId, ...mergedParty })
          }
        } catch (e) {
          console.warn('[IPC] notifyUpdate error:', e);
        }
      }

      setSuccessMsg('Party details updated successfully!')
      setTimeout(() => {
        router.push(`/parties/${partyId}`)
      }, 700)
    } catch (err: any) {
      console.error('[EditPartyPage] Error updating party:', err)
      setGeneralError(humanizeError(err, 'party update'))
    } finally {
      setSaving(false)
    }
  }

  if (loading && !party) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-[#1e293b] rounded-xl animate-pulse" />
        <div className="h-64 bg-[#0f172a] border border-[#1e293b] rounded-2xl animate-pulse" />
      </div>
    )
  }

  const inputClass = (field: string) => `
    w-full bg-[#030712] border ${
      errors[field] ? 'border-red-500/80 focus:border-red-400' : 'border-[#1e293b] focus:border-[#38bdf8]'
    } text-slate-100 text-xs px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-[#38bdf8]/30
  `

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              <span>Edit Wholesale Party</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              {party?.name} &bull; Manage accounts, terms, and dispatch logistics
            </p>
          </div>
        </div>

        <Link
          href={`/parties/${partyId}`}
          className="text-xs font-bold text-[#38bdf8] hover:underline"
        >
          View Profile &rarr;
        </Link>
      </div>

      {/* Main Container */}
      <div
        className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 40px rgba(15, 23, 42, 0.9), 0 0 20px rgba(56, 189, 248, 0.08)'
        }}
      >
        {/* Tab Navigation */}
        <div className="flex border-b border-[#1e293b] bg-[#0b1120] px-6">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-3.5 px-5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
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
            className={`py-3.5 px-5 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
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
        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-5">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
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

              {form.city === 'Other (Custom)' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                    Specify City / Market Name
                  </label>
                  <input
                    type="text"
                    value={form.customCity}
                    onChange={e => setForm(p => ({ ...p, customCity: e.target.value }))}
                    placeholder="Enter city or industrial zone..."
                    className={inputClass('customCity')}
                  />
                </div>
              )}

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
              <div className="p-4.5 rounded-xl bg-[#0b1120] border border-[#1e293b] space-y-3">
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

              {/* Wholesale Credit Limit & Terms */}
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

              {/* Goods Adda & CNIC/NTN */}
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

          {generalError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-bold flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{generalError}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#1e293b] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.back()}
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
    </div>
  )
}
