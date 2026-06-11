'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'

export default function EditPartyPage() {
  const { partyId } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const [party, setParty] = useState<any>(null)
  const [form, setForm] = useState({
    name: '',
    party_type: 'customer',
    phone: '',
    email: '',
    address: '',
    credit_limit: '',
    credit_days: '30',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadParty()
  }, [partyId, profile?.id])

  const loadParty = async () => {
    if (!partyId || !profile?.id) return
    const { data, error: err } = await supabase
      .from('parties')
      .select('*')
      .eq('id', partyId)
      .eq('business_id', profile.id)
      .single()
    if (data) {
      setParty(data)
      setForm({
        name: data.name || '',
        party_type: data.party_type || 'customer',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        credit_limit: String(
          data.credit_limit || ''
        ),
        credit_days: String(
          data.credit_days || '30'
        ),
      })
    }
  }

  const handleSave = async () => {
    if (!profile?.id) {
      setError('Business profile not loaded. Refresh and try again.')
      return
    }
    if (!partyId) {
      setError('Party ID missing.')
      return
    }
    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('parties')
      .update({
        name: form.name.trim(),
        party_type: form.party_type,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        credit_limit: form.credit_limit
          ? parseFloat(form.credit_limit) : null,
        credit_days: parseInt(
          form.credit_days
        ) || 0,
      })
      .eq('id', partyId as string)
      .eq('business_id', profile.id)

    if (err) {
      console.error('PARTY UPDATE ERROR:', err)
      setError(`Failed to save: ${err.message || JSON.stringify(err)}`)
    } else {
      router.push(`/parties/${partyId}`)
    }
    setSaving(false)
  }

  if (!party) return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 bg-white/6 rounded" />
        <div className="h-40 bg-white/4 rounded" />
      </div>
    </div>
  )

  const FIELD_CLASS = `w-full bg-[#161A1F] border border-white/8 text-white text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40 transition-colors`

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>
        <h1 className="text-lg font-semibold text-white">
          Edit Party
        </h1>
      </div>

      <div className="space-y-4">
        {[
          { label: 'Party Name *', key: 'name', type: 'text', placeholder: 'Al-Hamid Textiles' },
          { label: 'Phone', key: 'phone', type: 'tel', placeholder: '0300-1234567' },
          { label: 'Email', key: 'email', type: 'email', placeholder: 'optional' },
          { label: 'Address', key: 'address', type: 'text', placeholder: 'City, Pakistan' },
          { label: 'Credit Limit (PKR)', key: 'credit_limit', type: 'number', placeholder: '0' },
          { label: 'Credit Terms (Days)', key: 'credit_days', type: 'number', placeholder: '30' },
        ].map(field => (
          <div key={field.key}>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 block mb-1.5">
              {field.label}
            </label>
            <input
              type={field.type}
              value={form[field.key as keyof typeof form]}
              onChange={e => setForm(p => ({
                ...p, [field.key]: e.target.value
              }))}
              placeholder={field.placeholder}
              className={FIELD_CLASS}
            />
          </div>
        ))}

        <div>
          <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 block mb-1.5">
            Party Type
          </label>
          <select
            value={form.party_type}
            onChange={e => setForm(p => ({
              ...p, party_type: e.target.value
            }))}
            className={FIELD_CLASS}
          >
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-4">
          {error}
        </p>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => router.back()}
          className="flex-1 py-2.5 text-sm border border-white/10 text-gray-400 hover:border-white/20 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 text-sm font-bold bg-[#60A5FA] text-black hover:bg-blue-400 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
