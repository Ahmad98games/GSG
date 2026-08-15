'use client'
import {
  useState, useCallback, useEffect,
  useRef, memo, Suspense,
} from 'react'
import { useRouter } from 'next/navigation'
import { useToastStore } from '@/hooks/useToast'
import {
  Package, ChevronLeft, Save,
  Barcode, Calendar, AlertTriangle,
} from 'lucide-react'

const toast = Object.assign(
  (msg: string, _opts?: any) => {
    useToastStore.getState().addToast({ type: 'warning', title: msg })
  },
  {
    success: (msg: string) => useToastStore.getState().addToast({ type: 'success', title: msg }),
    error: (msg: string) => useToastStore.getState().addToast({ type: 'error', title: msg }),
  }
)

import { createClient }
  from '@/lib/supabase/client'
import { useBusinessProfile }
  from '@/hooks/useBusinessProfile'
import { useLicense } from '@/hooks/useLicense'
import { useFormDraft }
  from '@/hooks/useFormDraft'
import { useActionGuard } from '@/hooks/useActionGuard'
import { GlobalErrorBoundary } from '@/components/ui/GlobalErrorBoundary'

// CRITICAL: Define all static data
// OUTSIDE the component so they never
// cause re-renders
const UNITS = [
  'Meter', 'Kilogram', 'Gram',
  'Liter', 'Piece', 'Box', 'Dozen',
  'Maund', 'Quintal', 'Ton',
  'Yard', 'Foot', 'Inch', 'Bag',
  'Bundle', 'Roll', 'Sheet',
] as const

const CATEGORIES = [
  'Raw Material', 'Finished Goods',
  'Semi-Finished', 'Packaging',
  'Spare Parts', 'Stationery',
  'Electronics', 'Chemicals',
  'Textiles', 'Food & Beverage',
  'Medicine', 'Other',
] as const

const TAX_RATES = [
  { label: 'No Tax', value: 0 },
  { label: 'GST 5%', value: 5 },
  { label: 'GST 8%', value: 8 },
  { label: 'GST 12%', value: 12 },
  { label: 'GST 17%', value: 17 },
  { label: 'VAT 5% (UAE)', value: 5 },
] as const

// INITIAL STATE defined outside component
// Prevents re-creation on every render
const INITIAL_STATE = {
  name: '',
  skuCode: '',
  barcode: '',
  category: '',
  unit: 'Piece',
  costPrice: '',
  salePrice: '',
  openingStock: '',
  reorderLevel: '',
  expiryDate: '',
  batchNumber: '',
  taxRate: 0,
  description: '',
  isActive: true,
}

export default function NewInventoryPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const { atLimit } = useLicense()

  // Single state object — batch updates
  const [form, setForm] =
    useState(INITIAL_STATE)
  const [saving, setSaving] = useState(false)

  // Ref for the name input — focus on mount
  const nameRef = useRef<HTMLInputElement>(null)

  // Form draft — async, non-blocking
  const { saveDraft, clearDraft } =
    useFormDraft('inventory-new')

  // Focus name field after mount
  // useLayoutEffect causes paint delay
  // setTimeout(0) defers until after render
  useEffect(() => {
    const t = setTimeout(() => {
      nameRef.current?.focus()
    }, 0)
    return () => clearTimeout(t)
  }, [])

  // Restore draft — async, deferred
  // Does NOT block the initial render
  useEffect(() => {
    let cancelled = false
    const restore = async () => {
      try {
        const draft = await (window as any)
          .electronAPI?.store
          ?.getDraft?.('inventory-new') || await (window as any)
          .electronAPI?.store
          ?.getFormDraft?.('inventory-new')
        if (draft && !cancelled) {
          setForm(prev => ({
            ...prev, ...draft
          }))
        }
      } catch {
        // No draft — fine
      }
    }
    // Defer 100ms so the UI renders first
    const t = setTimeout(restore, 100)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [])

  // Auto-save draft every 5 seconds
  // Non-blocking interval
  useEffect(() => {
    if (!form.name) return
    const t = setInterval(() => {
      saveDraft(form)
    }, 5000)
    return () => clearInterval(t)
  }, [form, saveDraft])

  // useCallback prevents child re-renders
  // when parent updates
  const updateField = useCallback(
    (field: keyof typeof INITIAL_STATE) =>
      (e: React.ChangeEvent<
        HTMLInputElement |
        HTMLSelectElement |
        HTMLTextAreaElement
      >) => {
        const value = e.target.type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value
        // Functional update — never stale
        setForm(prev => ({
          ...prev, [field]: value
        }))
      },
    []
  )

  // Validate before save
  const validate = useCallback((): string | null => {
    if (!form.name.trim())
      return 'Item name is required'
    if (!form.unit)
      return 'Unit is required'
    if (form.costPrice &&
      isNaN(parseFloat(form.costPrice)))
      return 'Cost price must be a number'
    if (form.salePrice &&
      isNaN(parseFloat(form.salePrice)))
      return 'Sale price must be a number'
    if (form.salePrice && form.costPrice &&
      parseFloat(form.salePrice) <
      parseFloat(form.costPrice)) {
      // Warning only — not blocking
      toast('Sale price is below cost price',
        { icon: '⚠️' })
    }
    return null
  }, [form])

  const { guard } = useActionGuard()

  const handleSave = useCallback(() => {
    guard(async () => {
      const error = validate()
      if (error) {
        toast.error(error)
        return
      }
      if (!profile?.id) {
        toast.error('Business profile not loaded')
        return
      }

      // Free tier limit check
      if (atLimit('max_skus' as any)) {
        toast.error(
          'Free plan limit: 200 items. ' +
          'Upgrade to add more.'
        )
        return
      }

      setSaving(true)
      try {
        const payload = {
          business_id: profile.id,
          name: form.name.trim(),
          sku_code: form.skuCode.trim() || null,
          barcode: form.barcode.trim() || null,
          category: form.category || null,
          unit: form.unit,
          cost_price:
            parseFloat(form.costPrice) || 0,
          sale_price:
            parseFloat(form.salePrice) || 0,
          qty_on_hand:
            parseFloat(form.openingStock) || 0,
          reorder_level:
            parseFloat(form.reorderLevel) || 0,
          expiry_date:
            form.expiryDate || null,
          batch_number:
            form.batchNumber.trim() || null,
          tax_rate: form.taxRate,
          description:
            form.description.trim() || null,
          is_active: true,
        }

        const { data, error } = await supabase
          .from('skus')
          .insert(payload)
          .select()
          .single()

        if (error) throw error

        // Increment license SKU count
        ;(window as any).electronAPI?.license
          ?.incrementSku?.()

        // Clear draft on success
        clearDraft()

        toast.success(
          `${form.name.trim()} added to inventory`
        )

        // Brief delay so user sees success toast
        setTimeout(() => {
          router.push('/inventory')
        }, 500)

      } catch (err: any) {
        toast.error(
          err.message || 'Failed to save item'
        )
      } finally {
        setSaving(false)
      }
    })
  }, [form, profile, atLimit, validate, clearDraft, router, supabase, guard])

  const handleCancel = useCallback(() => {
    router.push('/inventory')
  }, [router])

  return (
    <GlobalErrorBoundary>
    <div className="flex flex-col h-full">

      {/* HEADER — no heavy logic */}
      <div className="flex items-center
        gap-4 px-6 py-4 border-b
        border-white/6 bg-[#0A0C0F]
        flex-shrink-0">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2
            text-gray-500 hover:text-white
            transition-colors text-sm"
        >
          <ChevronLeft size={16} />
          Inventory
        </button>
        <div className="flex items-center
          gap-3 flex-1">
          <div className="w-8 h-8 rounded-lg
            bg-[#F59E0B]/10 border
            border-[#F59E0B]/20
            flex items-center justify-center">
            <Package size={15}
              className="text-[#F59E0B]" />
          </div>
          <div>
            <h1 className="text-sm font-bold
              text-white">
              New Inventory Item
            </h1>
            <p className="text-[10px]
              text-gray-600">
              Fields marked * are required
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border
              border-white/8 text-gray-400
              text-sm hover:border-white/15
              hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving ||
              !form.name.trim()}
            className="flex items-center
              gap-2 px-5 py-2 bg-[#60A5FA]
              text-white font-bold text-sm
              hover:brightness-110
              disabled:opacity-40
              transition-all"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </div>

      {/* FORM — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto
          p-6 space-y-6">

          {/* SECTION 1 — Basic Info */}
          <FormSection title="Basic Information">

            {/* Item Name */}
            <FormField
              label="Item Name"
              required>
              <input
                ref={nameRef}
                value={form.name}
                onChange={updateField('name')}
                placeholder="Cotton Fabric 40s"
                className="noxis-input"
                maxLength={200}
              />
            </FormField>

            {/* SKU Code + Barcode */}
            <div className="grid grid-cols-2
              gap-4">
              <FormField label="SKU Code">
                <input
                  value={form.skuCode}
                  onChange={updateField('skuCode')}
                  placeholder="FAB-001"
                  className="noxis-input"
                />
              </FormField>
              <FormField label="Barcode">
                <div className="relative">
                  <input
                    value={form.barcode}
                    onChange={
                      updateField('barcode')}
                    placeholder="8901234567890"
                    className="noxis-input pr-10"
                  />
                  <Barcode size={14}
                    className="absolute right-3
                      top-1/2 -translate-y-1/2
                      text-gray-700" />
                </div>
              </FormField>
            </div>

            {/* Category + Unit */}
            <div className="grid grid-cols-2
              gap-4">
              <FormField label="Category">
                <select
                  value={form.category}
                  onChange={updateField('category')}
                  className="noxis-input"
                >
                  <option value="">
                    Select category
                  </option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Unit" required>
                <select
                  value={form.unit}
                  onChange={updateField('unit')}
                  className="noxis-input"
                >
                  {UNITS.map(u => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

          </FormSection>

          {/* SECTION 2 — Pricing */}
          <FormSection title="Pricing">

            <div className="grid grid-cols-2
              gap-4">
              <FormField label="Cost Price (PKR)">
                <input
                  value={form.costPrice}
                  onChange={updateField('costPrice')}
                  placeholder="0"
                  type="number"
                  min="0"
                  step="0.01"
                  className="noxis-input"
                />
              </FormField>
              <FormField label="Sale Price (PKR)">
                <input
                  value={form.salePrice}
                  onChange={updateField('salePrice')}
                  placeholder="0"
                  type="number"
                  min="0"
                  step="0.01"
                  className="noxis-input"
                />
              </FormField>
            </div>

            <FormField label="Tax Rate">
              <select
                value={form.taxRate}
                onChange={updateField('taxRate')}
                className="noxis-input"
              >
                {TAX_RATES.map(t => (
                  <option
                    key={t.value + t.label}
                    value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </FormField>

          </FormSection>

          {/* SECTION 3 — Stock */}
          <FormSection title="Stock">

            <div className="grid grid-cols-2
              gap-4">
              <FormField label="Opening Stock">
                <input
                  value={form.openingStock}
                  onChange={
                    updateField('openingStock')}
                  placeholder="0"
                  type="number"
                  min="0"
                  className="noxis-input"
                />
              </FormField>
              <FormField label="Reorder Level">
                <input
                  value={form.reorderLevel}
                  onChange={
                    updateField('reorderLevel')}
                  placeholder="0"
                  type="number"
                  min="0"
                  className="noxis-input"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2
              gap-4">
              <FormField label="Expiry Date">
                <div className="relative">
                  <input
                    value={form.expiryDate}
                    onChange={
                      updateField('expiryDate')}
                    type="date"
                    className="noxis-input"
                  />
                </div>
              </FormField>
              <FormField label="Batch Number">
                <input
                  value={form.batchNumber}
                  onChange={
                    updateField('batchNumber')}
                  placeholder="BATCH-2026-001"
                  className="noxis-input"
                />
              </FormField>
            </div>

          </FormSection>

          {/* SECTION 4 — Description */}
          <FormSection title="Notes">
            <FormField label="Description">
              <textarea
                value={form.description}
                onChange={
                  updateField('description')}
                placeholder="Optional notes about this item..."
                rows={3}
                className="noxis-input resize-none"
                maxLength={500}
              />
            </FormField>
          </FormSection>

          {/* Bottom save button for
              long forms — convenience */}
          <div className="flex gap-3
            pb-8">
            <button
              onClick={handleSave}
              disabled={saving ||
                !form.name.trim()}
              className="flex-1 py-3
                bg-[#60A5FA] text-white
                font-bold text-sm
                hover:brightness-110
                disabled:opacity-40
                transition-all flex
                items-center justify-center
                gap-2"
            >
              <Save size={15} />
              {saving
                ? 'Saving...'
                : 'Save Item to Inventory'}
            </button>
          </div>

        </div>
      </div>
    </div>
    </GlobalErrorBoundary>
  )
}

// MEMOIZED sub-components
// These never re-render unless
// their own props change
const FormSection = memo(function FormSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center
        gap-3">
        <p className="text-[10px] font-bold
          uppercase tracking-widest
          text-gray-500 whitespace-nowrap">
          {title}
        </p>
        <div className="flex-1 h-px
          bg-white/6" />
      </div>
      {children}
    </div>
  )
})

const FormField = memo(function FormField({
  label,
  required,
  children,
  hint,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px]
        font-bold uppercase tracking-widest
        text-gray-500 block">
        {label}
        {required && (
          <span className="text-red-400 ml-1">
            *
          </span>
        )}
      </label>
      {children}
      {hint && (
        <p className="text-[10px] text-gray-700">
          {hint}
        </p>
      )}
    </div>
  )
})
