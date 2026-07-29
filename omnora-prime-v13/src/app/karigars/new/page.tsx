'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useToast } from '@/hooks/useToast'
import { useFormDraft } from '@/hooks/useFormDraft'
import { DraftRecoveryBanner } from '@/components/DraftRecoveryBanner'
import { ArrowLeft, Save, User } from 'lucide-react'

const karigarSchema = z.object({
  name: z.string().min(1, 'Worker name is required'),
  father_name: z.string().optional(),
  cnic: z.string().optional(),
  phone: z.string().optional().refine(val => {
    if (!val) return true
    const digits = val.replace(/[^0-9]/g, '')
    return digits.length >= 10 && digits.length <= 13
  }, 'Enter a valid phone number'),
  address: z.string().optional(),
  skill_type: z.string().min(1, 'Skill type is required'),
  grade_id: z.string().min(1, 'Grade is required'),
  wage_type: z.enum(['piece_rate', 'daily_wage', 'monthly_salary']),
  rate: z.coerce.number().min(0, 'Rate cannot be negative'),
  joining_date: z.string().min(1, 'Joining date is required'),
})

type KarigarFormValues = z.infer<typeof karigarSchema>

export default function NewKarigarPage() {
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { profile } = useBusinessProfile()
  const toast = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<KarigarFormValues>({
    resolver: zodResolver(karigarSchema) as any,
    mode: 'onChange',
    defaultValues: {
      name: '',
      father_name: '',
      cnic: '',
      phone: '',
      address: '',
      skill_type: '',
      grade_id: '',
      wage_type: 'piece_rate',
      rate: 0,
      joining_date: new Date().toISOString().split('T')[0],
    },
  })

  const watchValues = watch()
  const DRAFT_KEY = 'karigar-new'
  const { getDraft, clearDraft } = useFormDraft(DRAFT_KEY, watchValues)

  // Fetch grades
  const { data: grades = [] } = useQuery({
    queryKey: ['karigar_grades', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('karigar_grades')
        .select('*')
        .eq('business_id', profile?.id)
      if (error) throw error
      return data || []
    },
    enabled: !!profile?.id,
  })

  const onSubmit = async (values: KarigarFormValues) => {
    if (!profile?.id) return
    setIsSubmitting(true)

    try {
      const payload = {
        business_id: profile.id,
        name: values.name,
        father_name: values.father_name || null,
        cnic: values.cnic || null,
        phone: values.phone || null,
        address: values.address || null,
        skill_type: values.skill_type,
        grade_id: values.grade_id,
        wage_type: values.wage_type,
        joining_date: values.joining_date,
        piece_rate: values.wage_type === 'piece_rate' ? values.rate : null,
        daily_rate: values.wage_type === 'daily_wage' ? values.rate : null,
        monthly_salary: values.wage_type === 'monthly_salary' ? values.rate : null,
        current_advance: 0,
        status: 'active',
      }

      const { error } = await supabase.from('karigars').insert(payload)
      if (error) throw error

      await clearDraft()
      toast.success('Worker registered successfully')
      queryClient.invalidateQueries({ queryKey: ['karigars_registry'] })
      router.push('/karigars')
    } catch (err: any) {
      console.error(err)
      toast.error('Registration failed', err.message || 'Unknown error')
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
            onClick={() => router.push('/karigars')}
            className="p-2 bg-white/5 border border-white/8 hover:bg-white/10 rounded-sm text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <User size={18} className="text-[#C5A059]" /> Register Worker
            </h1>
            <p className="text-xs text-gray-500">Add a new Karigar to the factory registry</p>
          </div>
        </div>

        <div className="bg-[#16191E] border border-white/8 p-6 rounded-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Worker Name *</label>
              <input
                type="text"
                {...register('name')}
                placeholder="Worker Name"
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
              {errors.name && <p className="text-[10px] text-red-400 mt-1">{errors.name.message as string}</p>}
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Father Name</label>
              <input
                type="text"
                {...register('father_name')}
                placeholder="Father Name"
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">CNIC Number</label>
              <input
                type="text"
                {...register('cnic')}
                placeholder="e.g. 35201-1234567-8"
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
            </div>

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
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Address</label>
            <input
              type="text"
              {...register('address')}
              placeholder="Full Address"
              className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Skill Type / Role *</label>
              <input
                type="text"
                {...register('skill_type')}
                placeholder="e.g. Master, Cutter, Helper"
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
              {errors.skill_type && <p className="text-[10px] text-red-400 mt-1">{errors.skill_type.message as string}</p>}
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Grade *</label>
              <select
                {...register('grade_id')}
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              >
                <option value="">Select Grade</option>
                {grades.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.grade_name}</option>
                ))}
              </select>
              {errors.grade_id && <p className="text-[10px] text-red-400 mt-1">{errors.grade_id.message as string}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Wage Type *</label>
              <select
                {...register('wage_type')}
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              >
                <option value="piece_rate">Piece-rate</option>
                <option value="daily_wage">Daily wage</option>
                <option value="monthly_salary">Monthly salary</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Rate Amount *</label>
              <input
                type="number"
                {...register('rate')}
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
              {errors.rate && <p className="text-[10px] text-red-400 mt-1">{errors.rate.message as string}</p>}
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Joining Date *</label>
              <input
                type="date"
                {...register('joining_date')}
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="w-full py-3 bg-[#C5A059] text-black font-black text-xs uppercase tracking-widest hover:bg-[#D4AF37] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {isSubmitting ? 'Registering...' : (
              <>
                <Save size={14} /> Register Worker
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}
