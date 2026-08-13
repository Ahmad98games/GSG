'use client'
import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useToast } from '@/hooks/useToast'
import { useLicense } from '@/hooks/useLicense'
import { useQueryClient } from '@tanstack/react-query'

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
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [openingBalance, setOpeningBalance] = useState('')
  const [balanceNature, setBalanceNature] = useState<BalanceNature>('receivable')
  const [creditLimit, setCreditLimit] = useState('')
  const [creditTerms, setCreditTerms] = useState('0')
  const [saving, setSaving] = useState(false)

  const showBalanceNature = parseFloat(openingBalance) > 0

  const resetForm = useCallback(() => {
    setName('')
    setPhone('')
    setEmail('')
    setAddress('')
    setOpeningBalance('')
    setBalanceNature('receivable')
    setCreditLimit('')
    setCreditTerms('0')
    setPartyType(defaultType || 'customer')
  }, [defaultType])

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedName) {
      toast.error('Please enter full name')
      return
    }

    const rawBiz = profile?.id || (typeof window !== 'undefined' ? localStorage.getItem('noxis_business_id') : null);
    const businessId = (rawBiz && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawBiz)) ? rawBiz : '00000000-0000-0000-0000-000000000000';

    // Check free tier party limit
    if (atLimit('max_parties')) {
      toast.error('Party limit reached on Free plan. Upgrade to add more.')
      return
    }

    setSaving(true)
    try {
      const balanceAmount = parseFloat(openingBalance) || 0
      const currentBalance = balanceNature === 'receivable'
        ? balanceAmount
        : -balanceAmount

      const payload: any = {
        business_id: businessId,
        name: trimmedName,
        party_type: partyType,
        phone: trimmedPhone || null,
        email: email.trim() || null,
        address: address.trim() || null,
        opening_balance: balanceAmount,
        current_balance: currentBalance,
        credit_limit: parseFloat(creditLimit) || 0,
        credit_terms_days: parseInt(creditTerms) || 0,
      }

      const { data, error } = await supabase
        .from('parties')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      // Post opening balance ledger entry if needed
      if (balanceAmount > 0 && data?.id) {
        try {
          await supabase.from('ledger_entries').insert({
            business_id: businessId,
            party_id: data.id,
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

      // Increment party count in license store if IPC available
      if (typeof window !== 'undefined') {
        (window as any).electronAPI?.license?.incrementParty?.()
      }

      // Invalidate relevant React Query caches
      queryClient.invalidateQueries({ queryKey: ['parties_registry'] })
      queryClient.invalidateQueries({ queryKey: ['parties'] })
      queryClient.invalidateQueries({ queryKey: ['khata-parties'] })
      queryClient.invalidateQueries({ queryKey: ['khata-entries'] })

      toast.success(`${trimmedName} added successfully`)
      onSuccess(data)
      onClose()
      resetForm()
    } catch (err: any) {
      console.error('Failed to create party:', err)
      toast.error(err.message || 'Failed to create party')
    } finally {
      setSaving(false)
    }
  }, [
    name, phone, email, address, partyType, openingBalance, balanceNature,
    creditLimit, creditTerms, profile, atLimit, onSuccess, onClose, resetForm, toast, queryClient, supabase
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
      <div className="w-full max-w-md bg-[#0F1114] border border-[#60A5FA]/25 rounded-lg shadow-2xl shadow-[#60A5FA]/5 animate-in zoom-in-95 fade-in-0 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 bg-[#0A0C0F]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#60A5FA]/10 border border-[#60A5FA]/20 flex items-center justify-center">
              <Users size={15} className="text-[#60A5FA]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Add New Party</p>
              <p className="text-[10px] text-gray-400">Customer, supplier, or worker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[70vh] space-y-4">
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
                    py-2.5 px-2 rounded-sm border text-center transition-all duration-150
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

          {/* Phone */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
              WhatsApp / Phone <span className="text-gray-500 ml-1 text-[9px] normal-case tracking-normal font-normal">optional</span>
            </label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="03XX-XXXXXXX"
              type="tel"
              className="noxis-input"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
              Email Address <span className="text-gray-500 ml-1 text-[9px] normal-case tracking-normal font-normal">optional</span>
            </label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="contact@business.com"
              type="email"
              className="noxis-input"
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
              Address / City <span className="text-gray-500 ml-1 text-[9px] normal-case tracking-normal font-normal">optional</span>
            </label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Street address, city, country"
              rows={2}
              className="noxis-input resize-none"
            />
          </div>

          {/* Opening Balance & Nature */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
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

            {showBalanceNature ? (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
                  Balance Type
                </label>
                <select
                  value={balanceNature}
                  onChange={e => setBalanceNature(e.target.value as BalanceNature)}
                  className="noxis-input"
                >
                  <option value="receivable">Receivable (Jama) — They owe</option>
                  <option value="payable">Payable (Naam) — We owe</option>
                </select>
              </div>
            ) : (
              <div />
            )}
          </div>

          {/* Credit Limit + Terms */}
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
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">
                Credit Terms (Days)
              </label>
              <input
                value={creditTerms}
                onChange={e => setCreditTerms(e.target.value)}
                placeholder="0"
                type="number"
                min="0"
                className="noxis-input"
              />
            </div>
          </div>

          {/* System Protocol Banner */}
          <div className="p-3 rounded-sm border border-[#60A5FA]/15 bg-[#60A5FA]/5 flex items-start gap-2.5">
            <div className="w-4 h-4 rounded bg-[#60A5FA]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[8px] text-[#60A5FA] font-black">i</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              <span className="text-[#60A5FA] font-bold">SYSTEM PROTOCOL:</span> Onboarding a party automatically creates a sub-ledger context. Credit limit or credit term breaches will trigger automatic transactional warnings.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-white/6 bg-[#0A0C0F] flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim() || saving}
            className="
              flex-1 py-3 bg-[#60A5FA] text-white font-bold text-sm rounded-sm
              hover:brightness-110 disabled:opacity-40 transition-all cursor-pointer
            "
          >
            {saving ? 'Creating Party...' : 'Create Party'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="
              px-6 py-3 border border-white/8 text-gray-400 text-sm font-semibold rounded-sm
              hover:border-white/15 hover:text-white transition-all cursor-pointer
            "
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
