'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useToast } from '@/hooks/useToast'
import { useFormDraft } from '@/hooks/useFormDraft'
import { DraftRecoveryBanner } from '@/components/DraftRecoveryBanner'
import { ArrowLeft, Save, Users } from 'lucide-react'

const partySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  party_type: z.enum(['customer', 'supplier', 'both']),
  phone: z.string().optional().refine(val => {
    if (!val) return true
    const digits = val.replace(/[^0-9]/g, '')
    return digits.length >= 10
  }, 'Enter a valid phone number'),
  email: z.string().optional().refine(val => {
    if (!val) return true
    return val.includes('@')
  }, 'Enter a valid email address'),
  address: z.string().optional(),
  credit_limit: z.coerce.number().min(0).default(0),
  credit_days: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
})

type PartyFormValues = z.infer<typeof partySchema>

export default function NewPartyPage() {
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { profile } = useBusinessProfile()
  const toast = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema) as any,
    mode: 'onChange',
    defaultValues: {
      name: '',
      party_type: 'customer',
      phone: '',
      email: '',
      address: '',
      credit_limit: 0,
      credit_days: 0,
      notes: '',
    },
  })

  const watchValues = watch()
  const DRAFT_KEY = 'party-new'
  const { getDraft, clearDraft } = useFormDraft(DRAFT_KEY, watchValues)

  const onSubmit = async (values: PartyFormValues) => {
    if (!profile?.id) return
    setIsSubmitting(true)

    try {
      const payload = {
        business_id: profile.id,
        name: values.name,
        party_type: values.party_type,
        phone: values.phone || null,
        email: values.email || null,
        address: values.address || null,
        credit_limit: values.credit_limit,
        credit_days: values.credit_days,
        notes: values.notes || null,
        is_blocked: false,
        current_balance: 0,
      }

      const { error } = await supabase.from('parties').insert(payload)
      if (error) throw error

      await clearDraft()
      toast.success('Party added successfully')
      queryClient.invalidateQueries({ queryKey: ['parties_registry'] })
      router.push('/parties')
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to add party', err.message || 'Unknown error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 p-6 flex flex-col">
      <main className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center">
        <DraftRecoveryBanner
          draftKey={DRAFT_KEY}
          onRecover={(data) => reset(data)}
          onDiscard={() => {}}
        />

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/parties')}
            className="p-2 bg-white/5 border border-white/8 hover:bg-white/10 rounded-sm text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-[#C5A059]" /> Add Party
            </h1>
            <p className="text-xs text-gray-500">Create a new customer or supplier account</p>
          </div>
        </div>

        <div className="bg-[#16191E] border border-white/8 p-6 rounded-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Party Name *</label>
              <input
                type="text"
                {...register('name')}
                placeholder="Party Name"
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
              {errors.name && <p className="text-[10px] text-red-400 mt-1">{errors.name.message as string}</p>}
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Party Type *</label>
              <select
                {...register('party_type')}
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              >
                <option value="customer">Customer</option>
                <option value="supplier">Supplier</option>
                <option value="both">Both (Customer & Supplier)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Phone Number</label>
              <input
                type="text"
                {...register('phone')}
                placeholder="e.g. 03264742678"
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
              {errors.phone && <p className="text-[10px] text-red-400 mt-1">{errors.phone.message as string}</p>}
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Email Address</label>
              <input
                type="email"
                {...register('email')}
                placeholder="email@example.com"
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
              {errors.email && <p className="text-[10px] text-red-400 mt-1">{errors.email.message as string}</p>}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Address</label>
            <input
              type="text"
              {...register('address')}
              placeholder="Business Address"
              className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Credit Limit</label>
              <input
                type="number"
                {...register('credit_limit')}
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Credit Days</label>
              <input
                type="number"
                {...register('credit_days')}
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Notes</label>
            <textarea
              {...register('notes')}
              placeholder="Additional remarks..."
              rows={3}
              className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40 resize-none"
            />
          </div>

          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="w-full py-3 bg-[#C5A059] text-black font-black text-xs uppercase tracking-widest hover:bg-[#D4AF37] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {isSubmitting ? 'Saving...' : (
              <>
                <Save size={14} /> Save Party
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}
