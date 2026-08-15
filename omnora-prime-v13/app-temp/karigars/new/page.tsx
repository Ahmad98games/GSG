'use client'
import {
  useState, useCallback, useEffect,
  useRef, memo,
} from 'react'
import { useRouter } from 'next/navigation'
import { useToastStore } from '@/hooks/useToast'
import {
  Users2, ChevronLeft, Save,
  User, Phone, CreditCard,
} from 'lucide-react'
import { createClient }
  from '@/lib/supabase/client'
import { useBusinessProfile }
  from '@/hooks/useBusinessProfile'
import { useFormDraft }
  from '@/hooks/useFormDraft'
import { useActionGuard } from '@/hooks/useActionGuard'

const toast = Object.assign(
  (msg: string, _opts?: any) => {
    useToastStore.getState().addToast({ type: 'warning', title: msg })
  },
  {
    success: (msg: string) => useToastStore.getState().addToast({ type: 'success', title: msg }),
    error: (msg: string) => useToastStore.getState().addToast({ type: 'error', title: msg }),
  }
)

// ALL static data OUTSIDE component
const WAGE_TYPES = [
  { value: 'piece_rate', label: 'Piece Rate' },
  { value: 'daily', label: 'Daily Wage' },
  { value: 'monthly', label: 'Monthly Salary' },
] as const

const DEPARTMENTS = [
  'Weaving', 'Spinning', 'Finishing',
  'Cutting', 'Stitching', 'Packing',
  'Dyeing', 'Printing', 'Quality Control',
  'Maintenance', 'Security', 'Admin',
  'Accounts', 'Store', 'Other',
] as const

const DESIGNATIONS = [
  'Karigar', 'Supervisor', 'Head Karigar',
  'Operator', 'Helper', 'Technician',
  'Guard', 'Clerk', 'Manager', 'Other',
] as const

const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-',
  'AB+', 'AB-', 'O+', 'O-',
] as const

const INITIAL_KARIGAR = {
  name: '',
  karigarCode: '',
  phone: '',
  cnic: '',
  address: '',
  department: '',
  designation: 'Karigar',
  wageType: 'piece_rate' as 'piece_rate' | 'daily' | 'monthly',
  pieceRate: '',
  dailyWage: '',
  monthlySalary: '',
  joiningDate: new Date()
    .toISOString().split('T')[0],
  bankAccountNumber: '',
  bankName: '',
  eobiNumber: '',
  bloodGroup: '',
  emergencyContact: '',
  notes: '',
}

export default function NewKarigarPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const { saveDraft, clearDraft } =
    useFormDraft('karigar-new')

  const [form, setForm] =
    useState(INITIAL_KARIGAR)
  const [saving, setSaving] = useState(false)
  const [cnicError, setCnicError] =
    useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  // Focus name — deferred to not
  // block initial render
  useEffect(() => {
    const t = setTimeout(() => {
      nameRef.current?.focus()
    }, 0)
    return () => clearTimeout(t)
  }, [])

  // Restore draft — async, deferred 100ms
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        const draft = await (window as any)
          .electronAPI?.store
          ?.getDraft?.('karigar-new') || await (window as any)
          .electronAPI?.store
          ?.getFormDraft?.('karigar-new')
        if (draft && !cancelled) {
          setForm(prev => ({
            ...prev, ...draft
          }))
        }
      } catch {}
    }, 100)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [])

  // Auto-save draft every 5s
  useEffect(() => {
    if (!form.name) return
    const t = setInterval(() => {
      saveDraft(form)
    }, 5000)
    return () => clearInterval(t)
  }, [form, saveDraft])

  // Batch field updates
  const updateField = useCallback(
    (field: keyof typeof INITIAL_KARIGAR) =>
      (e: React.ChangeEvent<
        HTMLInputElement |
        HTMLSelectElement |
        HTMLTextAreaElement
      >) => {
        setForm(prev => ({
          ...prev,
          [field]: e.target.value,
        }))
      },
    []
  )

  // CNIC validation — only on blur
  // NOT on every keystroke
  const validateCnic = useCallback(
    (value: string) => {
      if (!value) {
        setCnicError('')
        return
      }
      const pattern = /^\d{5}-\d{7}-\d$/
      if (!pattern.test(value)) {
        setCnicError(
          'Format: XXXXX-XXXXXXX-X'
        )
      } else {
        setCnicError('')
      }
    },
    []
  )

  // What wage fields to show
  const showPieceRate =
    form.wageType === 'piece_rate'
  const showDailyWage =
    form.wageType === 'daily'
  const showMonthlySalary =
    form.wageType === 'monthly'

  const validate = useCallback(
    (): string | null => {
    if (!form.name.trim())
      return 'Name is required'
    if (!form.phone.trim())
      return 'Phone number is required'
    if (form.cnic && cnicError)
      return 'Fix CNIC format first'
    if (form.wageType === 'piece_rate' &&
      !form.pieceRate)
      return 'Piece rate amount is required'
    if (form.wageType === 'daily' &&
      !form.dailyWage)
      return 'Daily wage amount is required'
    if (form.wageType === 'monthly' &&
      !form.monthlySalary)
      return 'Monthly salary is required'
    return null
  }, [form, cnicError])

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

      setSaving(true)
      try {
        // Generate karigar code if empty
        const code = form.karigarCode.trim() ||
          `KAR-${Date.now().toString().slice(-5)}`

        const payload = {
          business_id: profile.id,
          name: form.name.trim(),
          karigar_code: code,
          phone: form.phone.trim(),
          cnic: form.cnic.trim() || null,
          address: form.address.trim() || null,
          department:
            form.department || null,
          designation:
            form.designation || 'Karigar',
          wage_type: form.wageType,
          piece_rate:
            form.wageType === 'piece_rate'
              ? parseFloat(form.pieceRate) || 0
              : null,
          daily_wage:
            form.wageType === 'daily'
              ? parseFloat(form.dailyWage) || 0
              : null,
          monthly_salary:
            form.wageType === 'monthly'
              ? parseFloat(form.monthlySalary) || 0
              : null,
          joining_date: form.joiningDate,
          bank_account_number:
            form.bankAccountNumber.trim() || null,
          bank_name:
            form.bankName.trim() || null,
          eobi_number:
            form.eobiNumber.trim() || null,
          blood_group:
            form.bloodGroup || null,
          emergency_contact:
            form.emergencyContact.trim() || null,
          notes:
            form.notes.trim() || null,
          status: 'active',
          peshgi_balance: 0,
        }

        const { data, error } = await supabase
          .from('karigars')
          .insert(payload)
          .select()
          .single()

        if (error) throw error

        clearDraft()
        toast.success(
          `${form.name.trim()} registered`
        )
        setTimeout(() => {
          router.push('/karigars')
        }, 500)

      } catch (err: any) {
        toast.error(
          err.message || 'Failed to register karigar'
        )
      } finally {
        setSaving(false)
      }
    })
  }, [form, profile, validate, clearDraft, router, supabase, guard])

  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="flex items-center
        gap-4 px-6 py-4 border-b
        border-white/6 bg-[#0A0C0F]
        flex-shrink-0">
        <button
          onClick={() =>
            router.push('/karigars')}
          className="flex items-center gap-2
            text-gray-500 hover:text-white
            transition-colors text-sm"
        >
          <ChevronLeft size={16} />
          Karigars
        </button>
        <div className="flex items-center
          gap-3 flex-1">
          <div className="w-8 h-8 rounded-lg
            bg-[#10B981]/10 border
            border-[#10B981]/20
            flex items-center justify-center">
            <Users2 size={15}
              className="text-[#10B981]" />
          </div>
          <div>
            <h1 className="text-sm font-bold
              text-white">
              Register New Karigar
            </h1>
            <p className="text-[10px]
              text-gray-600">
              Fields marked * are required
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() =>
              router.push('/karigars')}
            className="px-4 py-2 border
              border-white/8 text-gray-400
              text-sm hover:border-white/15
              hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              saving || !form.name.trim()
            }
            className="flex items-center
              gap-2 px-5 py-2 bg-[#10B981]
              text-white font-bold text-sm
              hover:brightness-110
              disabled:opacity-40 transition-all"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Register'}
          </button>
        </div>
      </div>

      {/* FORM */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto
          p-6 space-y-6">

          {/* PERSONAL INFO */}
          <KSection title="Personal Information">

            <KField label="Full Name" required>
              <input
                ref={nameRef}
                value={form.name}
                onChange={updateField('name')}
                placeholder="Muhammad Akram"
                className="noxis-input"
                maxLength={100}
              />
            </KField>

            <div className="grid grid-cols-2
              gap-4">
              <KField label="Karigar Code">
                <input
                  value={form.karigarCode}
                  onChange={
                    updateField('karigarCode')}
                  placeholder="KAR-001 (auto if empty)"
                  className="noxis-input"
                />
              </KField>
              <KField label="Blood Group">
                <select
                  value={form.bloodGroup}
                  onChange={
                    updateField('bloodGroup')}
                  className="noxis-input"
                >
                  <option value="">
                    Select (optional)
                  </option>
                  {BLOOD_GROUPS.map(b => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </KField>
            </div>

            <div className="grid grid-cols-2
              gap-4">
              <KField label="Phone / WhatsApp"
                required>
                <input
                  value={form.phone}
                  onChange={updateField('phone')}
                  placeholder="03XX-XXXXXXX"
                  type="tel"
                  className="noxis-input"
                />
              </KField>
              <KField label="CNIC">
                <input
                  value={form.cnic}
                  onChange={
                    updateField('cnic')}
                  onBlur={e =>
                    validateCnic(e.target.value)}
                  placeholder="XXXXX-XXXXXXX-X"
                  className={`noxis-input ${
                    cnicError
                      ? 'border-red-500/50'
                      : ''}`}
                />
                {cnicError && (
                  <p className="text-[10px]
                    text-red-400 mt-1">
                    {cnicError}
                  </p>
                )}
              </KField>
            </div>

            <KField label="Emergency Contact">
              <input
                value={form.emergencyContact}
                onChange={
                  updateField('emergencyContact')}
                placeholder="03XX-XXXXXXX (optional)"
                type="tel"
                className="noxis-input"
              />
            </KField>

            <KField label="Address">
              <textarea
                value={form.address}
                onChange={updateField('address')}
                placeholder="Home address (optional)"
                rows={2}
                className="noxis-input resize-none"
              />
            </KField>

          </KSection>

          {/* EMPLOYMENT */}
          <KSection title="Employment">

            <div className="grid grid-cols-2
              gap-4">
              <KField label="Department">
                <select
                  value={form.department}
                  onChange={
                    updateField('department')}
                  className="noxis-input"
                >
                  <option value="">
                    Select department
                  </option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </KField>
              <KField label="Designation">
                <select
                  value={form.designation}
                  onChange={
                    updateField('designation')}
                  className="noxis-input"
                >
                  {DESIGNATIONS.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </KField>
            </div>

            <KField label="Joining Date">
              <input
                value={form.joiningDate}
                onChange={
                  updateField('joiningDate')}
                type="date"
                className="noxis-input"
              />
            </KField>

          </KSection>

          {/* WAGES */}
          <KSection title="Wages">

            {/* Wage type selector pills */}
            <KField label="Wage Type" required>
              <div className="grid grid-cols-3
                gap-2">
                {WAGE_TYPES.map(w => (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() =>
                      setForm(prev => ({
                        ...prev,
                        wageType: w.value,
                      }))}
                    className={`py-2.5 px-3
                      rounded-sm border text-sm
                      font-semibold transition-all
                      ${form.wageType === w.value
                        ? 'bg-[#10B981]/10 border-[#10B981]/40 text-[#10B981]'
                        : 'bg-[#0F1114] border-white/8 text-gray-500 hover:border-white/15'}`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </KField>

            {/* Conditional wage input */}
            {showPieceRate && (
              <KField
                label="Piece Rate (PKR per unit)"
                required>
                <input
                  value={form.pieceRate}
                  onChange={
                    updateField('pieceRate')}
                  placeholder="PKR per piece"
                  type="number"
                  min="0"
                  step="0.01"
                  className="noxis-input"
                  autoFocus
                />
              </KField>
            )}

            {showDailyWage && (
              <KField
                label="Daily Wage (PKR)"
                required>
                <input
                  value={form.dailyWage}
                  onChange={
                    updateField('dailyWage')}
                  placeholder="PKR per day"
                  type="number"
                  min="0"
                  className="noxis-input"
                  autoFocus
                />
              </KField>
            )}

            {showMonthlySalary && (
              <KField
                label="Monthly Salary (PKR)"
                required>
                <input
                  value={form.monthlySalary}
                  onChange={
                    updateField('monthlySalary')}
                  placeholder="PKR per month"
                  type="number"
                  min="0"
                  className="noxis-input"
                  autoFocus
                />
              </KField>
            )}

          </KSection>

          {/* BANK + EOBI */}
          <KSection title="Bank & EOBI">

            <div className="grid grid-cols-2
              gap-4">
              <KField label="Bank Name">
                <input
                  value={form.bankName}
                  onChange={
                    updateField('bankName')}
                  placeholder="HBL, MCB, UBL..."
                  className="noxis-input"
                />
              </KField>
              <KField label="Account Number">
                <input
                  value={form.bankAccountNumber}
                  onChange={updateField(
                    'bankAccountNumber')}
                  placeholder="PK00XXXX..."
                  className="noxis-input"
                />
              </KField>
            </div>

            <KField label="EOBI Number">
              <input
                value={form.eobiNumber}
                onChange={
                  updateField('eobiNumber')}
                placeholder="EOBI registration (optional)"
                className="noxis-input"
              />
            </KField>

          </KSection>

          {/* NOTES */}
          <KSection title="Notes">
            <KField label="Additional Notes">
              <textarea
                value={form.notes}
                onChange={updateField('notes')}
                placeholder="Any other relevant information..."
                rows={3}
                className="noxis-input resize-none"
                maxLength={500}
              />
            </KField>
          </KSection>

          {/* Bottom save */}
          <div className="flex gap-3 pb-8">
            <button
              onClick={handleSave}
              disabled={
                saving || !form.name.trim()
              }
              className="flex-1 py-3
                bg-[#10B981] text-white
                font-bold text-sm
                hover:brightness-110
                disabled:opacity-40
                transition-all flex
                items-center justify-center
                gap-2"
            >
              <Save size={15} />
              {saving
                ? 'Registering...'
                : 'Register Karigar'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

// Memoized section wrapper
const KSection = memo(function KSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
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

// Memoized field wrapper
const KField = memo(function KField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
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
    </div>
  )
})
