'use client'
import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Users, Phone, MapPin, Truck, FileCheck, Coins } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useToast } from '@/hooks/useToast'
import { useLicense } from '@/hooks/useLicense'
import { useQueryClient } from '@tanstack/react-query'
import { SoftLimitModal } from '@/components/license/SoftLimitModal'
import { MAJOR_TEXTILE_HUBS } from '@/components/parties/EditPartyModal'

type PartyType = 'customer' | 'supplier' | 'karigar'
type BalanceNature = 'receivable' | 'payable'

interface AddPartyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (party: any) => void
  defaultType?: PartyType
}

export function AddPartyModal({
  isOpen, onClose, onSuccess, defaultType,
}: AddPartyModalProps) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { profile } = useBusinessProfile()
  const { atLimit } = useLicense()
  const toast = useToast()

  const [partyType, setPartyType] = useState<PartyType>(defaultType || 'customer')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [secondaryPhone, setSecondaryPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('Faisalabad')
  const [customCity, setCustomCity] = useState('')
  const [address, setAddress] = useState('')
  const [openingBalance, setOpeningBalance] = useState('')
  const [balanceNature, setBalanceNature] = useState<BalanceNature>('receivable')
  const [creditLimit, setCreditLimit] = useState('')
  const [creditTerms, setCreditTerms] = useState('30')
  const [preferredTransport, setPreferredTransport] = useState('')
  const [cnicOrNtn, setCnicOrNtn] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPartyLimit, setShowPartyLimit] = useState(false)

  const showBalanceNature = parseFloat(openingBalance) > 0

  const resetForm = useCallback(() => {
    setName('')
    setPhone('')
    setSecondaryPhone('')
    setEmail('')
    setCity('Faisalabad')
    setCustomCity('')
    setAddress('')
    setOpeningBalance('')
    setBalanceNature('receivable')
    setCreditLimit('')
    setCreditTerms('30')
    setPreferredTransport('')
    setCnicOrNtn('')
    setPartyType(defaultType || 'customer')
  }, [defaultType])

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()
    const effectiveCity = city === 'Other (Custom)' ? (customCity.trim() || 'Pakistan') : city

    if (!trimmedName) {
      toast.error('Please enter full name')
      return
    }

    const rawBiz = profile?.id || (typeof window !== 'undefined' ? localStorage.getItem('noxis_business_id') : null);
    const businessId = rawBiz || '00000000-0000-0000-0000-000000000000';

    // Check free tier party soft limit
    if (atLimit('max_parties')) {
      setShowPartyLimit(true)
      return
    }

    setSaving(true)
    try {
      const balanceAmount = parseFloat(openingBalance) || 0
      const currentBalance = balanceNature === 'receivable'
        ? balanceAmount
        : -balanceAmount

      const dbPartyType = partyType === 'supplier' ? 'supplier' : 'customer';

      const partyId = 'party-' + Date.now().toString(36);
      const payload: any = {
        id: partyId,
        business_id: businessId,
        name: trimmedName,
        party_type: dbPartyType,
        phone: trimmedPhone || null,
        secondary_phone: secondaryPhone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        city: effectiveCity,
        opening_balance: balanceAmount,
        balance_nature: balanceNature,
        current_balance: currentBalance,
        credit_limit: parseFloat(creditLimit) || 0,
        credit_days: parseInt(creditTerms) || 30,
        preferred_transport: preferredTransport.trim() || null,
        cnic_or_ntn: cnicOrNtn.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      let createdParty = payload;
      try {
        const { data, error } = await supabase
          .from('parties')
          .insert(payload)
          .select()
          .single()

        if (error) {
          // If error is missing columns or schema mismatch, fallback to core columns
          console.warn('[AddPartyModal] Initial insert fallback:', error.message)
          const corePayload = {
            name: trimmedName,
            party_type: dbPartyType,
            phone: trimmedPhone || null,
            email: email.trim() || null,
            address: address.trim() || null,
            city: effectiveCity,
            credit_limit: parseFloat(creditLimit) || 0,
            credit_days: parseInt(creditTerms) || 30,
            business_id: businessId,
            created_at: new Date().toISOString()
          }
          const { data: d2, error: e2 } = await supabase.from('parties').insert(corePayload).select().single();
          if (e2) {
            console.warn('[AddPartyModal] Fallback insert note:', e2.message);
          }
          if (d2) createdParty = { ...payload, ...d2 };
        } else if (data) {
          createdParty = { ...payload, ...data };
        }
      } catch (err: any) {
        console.warn('[AddPartyModal] Offline / local save fallback:', err);
      }

      // 1. Update local storage party cache for instant dashboard, offline & khata rendering
      if (typeof window !== 'undefined') {
        const cacheKeys = [
          `noxis_cached_parties_${businessId}`,
          `noxis_cached_parties_00000000-0000-0000-0000-000000000000`,
          `noxis_cached_parties`
        ]
        if (rawBiz && rawBiz !== businessId) {
          cacheKeys.push(`noxis_cached_parties_${rawBiz}`)
        }
        cacheKeys.forEach(k => {
          try {
            const existing = JSON.parse(localStorage.getItem(k) || '[]');
            localStorage.setItem(k, JSON.stringify([createdParty, ...existing.filter((p: any) => p.id !== createdParty.id && p.name !== createdParty.name)]));
          } catch {}
        })
      }

      // 2. Post opening balance ledger entry if needed
      if (balanceAmount > 0 && createdParty?.id) {
        try {
          await supabase.from('ledger_entries').insert({
            business_id: businessId,
            party_id: createdParty.id,
            entry_type: 'opening_balance',
            entry_date: new Date().toISOString().split('T')[0],
            description: 'Opening Balance',
            debit: balanceNature === 'receivable' ? balanceAmount : 0,
            credit: balanceNature === 'payable' ? balanceAmount : 0,
            reference: 'OB',
          })
        } catch (obErr) {
          console.warn('Opening balance entry posting failed:', obErr)
        }
      }

      // 3. Increment party count in license store if IPC available
      if (typeof window !== 'undefined') {
        (window as any).electronAPI?.license?.incrementParty?.()
      }

      // 4. Update React Query Cache immediately
      queryClient.setQueryData(['parties', businessId], (prev: any) => {
        const arr = Array.isArray(prev) ? prev : []
        return [createdParty, ...arr.filter((p: any) => p.id !== createdParty.id)]
      })
      queryClient.setQueryData(['parties_registry', businessId], (prev: any) => {
        const arr = Array.isArray(prev) ? prev : []
        return [createdParty, ...arr.filter((p: any) => p.id !== createdParty.id)]
      })

      // Invalidate relevant React Query caches
      queryClient.invalidateQueries({ queryKey: ['parties_registry'] })
      queryClient.invalidateQueries({ queryKey: ['parties'] })
      queryClient.invalidateQueries({ queryKey: ['khata-parties'] })
      queryClient.invalidateQueries({ queryKey: ['khata-entries'] })
      queryClient.invalidateQueries({ queryKey: ['ledger_entries'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })

      // 5. Broadcast event across app
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('noxis:party-added', { detail: createdParty }))
        if ((window as any).electronAPI?.party?.notifyUpdate) {
          (window as any).electronAPI.party.notifyUpdate({ partyId: createdParty.id, ...createdParty })
        }
      }

      toast.success(`${trimmedName} added successfully`)
      onSuccess(createdParty)
      onClose()
      resetForm()
    } catch (err: any) {
      console.error('Failed to create party:', err)
      toast.error(err.message || 'Failed to create party')
    } finally {
      setSaving(false)
    }
  }, [
    name, phone, secondaryPhone, email, address, city, customCity, partyType, openingBalance, balanceNature,
    creditLimit, creditTerms, preferredTransport, cnicOrNtn, profile, atLimit, onSuccess, onClose, resetForm, toast, queryClient, supabase
  ])

  if (!isOpen) return null
  if (typeof document === 'undefined') return null

  const PARTY_TYPES = [
    {
      value: 'customer' as PartyType,
      label: 'BUYER',
      sublabel: 'Customer',
    },
    {
      value: 'supplier' as PartyType,
      label: 'SUPPLIER',
      sublabel: 'Vendor',
    },
    {
      value: 'karigar' as PartyType,
      label: 'KARIGAR',
      sublabel: 'Worker',
    },
  ]

  return createPortal(
    // Overlay
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Modal */}
      <div className="w-full max-w-lg bg-[#0F1114] border border-[#60A5FA]/25 rounded-xl shadow-2xl shadow-[#60A5FA]/5 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 bg-[#0A0C0F]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#60A5FA]/10 border border-[#60A5FA]/20 flex items-center justify-center">
              <Users size={15} className="text-[#60A5FA]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Add New Party</p>
              <p className="text-[10px] text-gray-400">Wholesale buyer, mill supplier, or vendor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-4">
          {/* Party Type Pills */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">
              Party Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PARTY_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setPartyType(type.value)}
                  className={`
                    py-2.5 px-2 rounded-sm border text-center transition-all duration-150 cursor-pointer
                    ${partyType === type.value
                      ? 'bg-[#60A5FA]/10 border-[#60A5FA]/40 text-[#60A5FA]'
                      : 'bg-[#0F1114] border-white/8 text-gray-400 hover:border-white/15 hover:text-gray-200'}
                  `}
                >
                  <p className="text-[10px] font-black uppercase tracking-wider">
                    {type.label}
                  </p>
                  <p className="text-[9px] opacity-70 mt-0.5">
                    {type.sublabel}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
              Full Name <span className="text-red-400 ml-1">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Al-Hameed Textile Mills"
              className="noxis-input"
              autoFocus
            />
          </div>

          {/* Phone & Munshi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5 flex items-center gap-1">
                <Phone size={11} className="text-[#60A5FA]" />
                Primary Phone
              </label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="03XX-XXXXXXX"
                type="tel"
                className="noxis-input"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5 flex items-center gap-1">
                <Phone size={11} className="text-[#60A5FA]" />
                Munshi / Contact
              </label>
              <input
                value={secondaryPhone}
                onChange={e => setSecondaryPhone(e.target.value)}
                placeholder="Munshi name / phone"
                type="tel"
                className="noxis-input"
              />
            </div>
          </div>

          {/* City & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5 flex items-center gap-1">
                <MapPin size={11} className="text-[#60A5FA]" />
                City / Textile Hub
              </label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="noxis-input"
              >
                {MAJOR_TEXTILE_HUBS.map(hub => (
                  <option key={hub} value={hub}>{hub}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
                Email Address
              </label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="contact@business.com"
                type="email"
                className="noxis-input"
              />
            </div>
          </div>

          {city === 'Other (Custom)' && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
                Specify City Name
              </label>
              <input
                value={customCity}
                onChange={e => setCustomCity(e.target.value)}
                placeholder="Enter city..."
                className="noxis-input"
              />
            </div>
          )}

          {/* Address */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
              Shop / Factory Address
            </label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Plot #, Street, Mill Area, Market"
              className="noxis-input"
            />
          </div>

          {/* Opening Balance & Nature */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5 flex items-center gap-1">
                <Coins size={11} className="text-[#60A5FA]" />
                Opening Balance
              </label>
              <input
                value={openingBalance}
                onChange={e => setOpeningBalance(e.target.value)}
                placeholder="0"
                type="number"
                min="0"
                className="noxis-input"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
                Balance Type
              </label>
              <select
                value={balanceNature}
                onChange={e => setBalanceNature(e.target.value as BalanceNature)}
                className="noxis-input"
              >
                <option value="receivable">Receivable (Lena Hai)</option>
                <option value="payable">Payable (Dena Hai)</option>
              </select>
            </div>
          </div>

          {/* Credit Limit & Goods Adda */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
                Credit Limit (PKR)
              </label>
              <input
                value={creditLimit}
                onChange={e => setCreditLimit(e.target.value)}
                placeholder="0 = no limit"
                type="number"
                min="0"
                className="noxis-input"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5 flex items-center gap-1">
                <Truck size={11} className="text-[#60A5FA]" />
                Preferred Goods Adda
              </label>
              <input
                value={preferredTransport}
                onChange={e => setPreferredTransport(e.target.value)}
                placeholder="e.g. Faisal Movers"
                className="noxis-input"
              />
            </div>
          </div>

          {/* CNIC / NTN */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5 flex items-center gap-1">
              <FileCheck size={11} className="text-[#60A5FA]" />
              CNIC / NTN (Tax Verification)
            </label>
            <input
              value={cnicOrNtn}
              onChange={e => setCnicOrNtn(e.target.value)}
              placeholder="33100-XXXXXXX-X or NTN"
              className="noxis-input"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-white/6 bg-[#0A0C0F] flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim() || saving}
            className="
              flex-1 py-3 bg-[#60A5FA] text-black font-black uppercase tracking-wider text-xs rounded-lg
              hover:brightness-110 disabled:opacity-40 transition-all cursor-pointer
            "
          >
            {saving ? 'Creating Party...' : 'Create Party'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="
              px-6 py-3 border border-white/8 text-gray-400 text-xs font-semibold rounded-lg
              hover:border-white/15 hover:text-white transition-all cursor-pointer
            "
          >
            Cancel
          </button>
        </div>
      </div>

      <SoftLimitModal
        isOpen={showPartyLimit}
        type="party"
        onClose={() => setShowPartyLimit(false)}
      />
    </div>,
    document.body
  )
}
