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
import { ArrowLeft, Save, Package } from 'lucide-react'

const skuSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200, 'Name must be under 200 characters'),
  sku_code: z.string().min(1, 'SKU code is required'),
  category: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  cost_price: z.coerce.number().min(0, 'Cost price cannot be negative'),
  sale_price: z.coerce.number().min(0, 'Sale price cannot be negative'),
  barcode: z.string().optional(),
  requires_batch_tracking: z.boolean().default(false),
  batch_number: z.string().optional(),
  expiry_date: z.string().optional(),
  manufacture_date: z.string().optional(),
})

type SKUFormValues = z.infer<typeof skuSchema>

export default function NewSKUPage() {
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { profile } = useBusinessProfile()
  const toast = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<SKUFormValues>({
    resolver: zodResolver(skuSchema) as any,
    mode: 'onChange',
    defaultValues: {
      name: '',
      sku_code: '',
      category: '',
      unit: 'pcs',
      cost_price: 0,
      sale_price: 0,
      barcode: '',
      requires_batch_tracking: false,
      batch_number: '',
      expiry_date: '',
      manufacture_date: '',
    },
  })

  const watchValues = watch()
  const DRAFT_KEY = 'sku-new'
  const { getDraft, clearDraft } = useFormDraft(DRAFT_KEY, watchValues)

  const onSubmit = async (values: SKUFormValues) => {
    if (!profile?.id) return
    setIsSubmitting(true)

    try {
      const payload = {
        business_id: profile.id,
        name: values.name,
        sku_code: values.sku_code,
        category: values.category || null,
        unit: values.unit,
        cost_price: values.cost_price,
        sale_price: values.sale_price,
        barcode: values.barcode || null,
        requires_batch_tracking: values.requires_batch_tracking,
        batch_number: values.requires_batch_tracking ? (values.batch_number || null) : null,
        expiry_date: values.requires_batch_tracking ? (values.expiry_date || null) : null,
        manufacture_date: values.requires_batch_tracking ? (values.manufacture_date || null) : null,
        qty_on_hand: 0,
        qty_reserved: 0,
        reorder_level: 0,
        is_active: true,
      }

      const { error } = await supabase.from('skus').insert(payload)
      if (error) throw error

      await clearDraft()
      toast.success('Product registered successfully')
      queryClient.invalidateQueries({ queryKey: ['skus_catalog'] })
      router.push('/inventory')
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to register SKU', err.message || 'Unknown error')
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
            onClick={() => router.push('/inventory')}
            className="p-2 bg-white/5 border border-white/8 hover:bg-white/10 rounded-sm text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Package size={18} className="text-[#C5A059]" /> Register Product (SKU)
            </h1>
            <p className="text-xs text-gray-500">Add a new item to the inventory catalog</p>
          </div>
        </div>

        <div className="bg-[#16191E] border border-white/8 p-6 rounded-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Product Name *</label>
              <input
                type="text"
                {...register('name')}
                placeholder="Product Name"
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
              {errors.name && <p className="text-[10px] text-red-400 mt-1">{errors.name.message as string}</p>}
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">SKU Code *</label>
              <input
                type="text"
                {...register('sku_code')}
                placeholder="SKU Code"
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
              {errors.sku_code && <p className="text-[10px] text-red-400 mt-1">{errors.sku_code.message as string}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Category</label>
              <input
                type="text"
                {...register('category')}
                placeholder="Category"
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Unit *</label>
              <input
                type="text"
                {...register('unit')}
                placeholder="e.g. pcs, kg, meter"
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
              {errors.unit && <p className="text-[10px] text-red-400 mt-1">{errors.unit.message as string}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Cost Price *</label>
              <input
                type="number"
                {...register('cost_price')}
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
              {errors.cost_price && <p className="text-[10px] text-red-400 mt-1">{errors.cost_price.message as string}</p>}
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Sale Price *</label>
              <input
                type="number"
                {...register('sale_price')}
                className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
              />
              {errors.sale_price && <p className="text-[10px] text-red-400 mt-1">{errors.sale_price.message as string}</p>}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">Barcode</label>
            <input
              type="text"
              {...register('barcode')}
              placeholder="Scan or enter barcode"
              className="w-full bg-[#0F1114] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#C5A059]/40"
            />
          </div>

          <div className="p-3 bg-[#0F1114] border border-white/8 rounded-sm">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requires_batch_tracking"
                {...register('requires_batch_tracking')}
                className="rounded bg-[#0F1114] border border-white/10 text-[#C5A059] focus:ring-0 focus:ring-offset-0"
              />
              <label htmlFor="requires_batch_tracking" className="text-xs text-gray-400 font-bold select-none cursor-pointer">
                Requires Batch & Expiry Tracking (Medical/Pharmacy)
              </label>
            </div>

            {watchValues.requires_batch_tracking && (
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Batch #</label>
                  <input
                    type="text"
                    {...register('batch_number')}
                    className="w-full bg-[#16191E] border border-white/8 text-white text-[10px] px-2 py-1 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Expiry</label>
                  <input
                    type="date"
                    {...register('expiry_date')}
                    className="w-full bg-[#16191E] border border-white/8 text-white text-[10px] px-2 py-1 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Manufacture</label>
                  <input
                    type="date"
                    {...register('manufacture_date')}
                    className="w-full bg-[#16191E] border border-white/8 text-white text-[10px] px-2 py-1 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="w-full py-3 bg-[#C5A059] text-black font-black text-xs uppercase tracking-widest hover:bg-[#D4AF37] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {isSubmitting ? 'Registering...' : (
              <>
                <Save size={14} /> Register Product
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}
