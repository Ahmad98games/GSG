import { useState, useEffect } from 'react'
import { createClient }
  from '@/lib/supabase/client'
import { useBusinessProfile }
  from '@/hooks/useBusinessProfile'
import { useTierStore }
  from '@/stores/tierStore'
import { humanizeError } from '@/lib/utils/errors'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  trigger?: 'manual' | 'post_invoice'
    | 'post_payroll' | 'milestone'
}

export function FeedbackModal({
  isOpen, onClose, trigger = 'manual'
}: FeedbackModalProps) {
  const { profile } = useBusinessProfile()
  const { tier } = useTierStore()
  const supabase = createClient()
  
  const [step, setStep] =
    useState<'rate' | 'write' | 'done'>('rate')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [text, setText] = useState('')
  const [displayName, setDisplayName] =
    useState(profile?.business_name || '')
  const [businessType, setBusinessType] =
    useState(profile?.industry_type || '')
  const [city, setCity] = useState('')
  const [shareOnWebsite, setShareOnWebsite] =
    useState(true)
  const [submitting, setSubmitting] =
    useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) {
      if (!displayName) setDisplayName(profile.business_name || '')
      if (!businessType) setBusinessType(profile.industry_type || '')
    }
  }, [profile, displayName, businessType])
  
  if (!isOpen) return null
  
  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Please write something')
      return
    }
    if (text.trim().length < 20) {
      setError(
        'Please write at least 20 characters to share a proper review'
      )
      return
    }
    if (!displayName.trim()) {
      setError('Please enter your name')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      const { error: dbError } =
        await supabase
          .from('testimonials')
          .insert({
            business_id: profile?.id || null,
            feedback_text: text.trim(),
            display_name: displayName.trim(),
            business_type: businessType || null,
            city: city || null,
            country_code:
              profile?.country_code || 'PK',
            rating,
            tier: tier || 'Starter',
            status: shareOnWebsite
              ? 'pending'
              : 'private',
          })
      
      if (dbError) throw dbError
      
      setStep('done')
    } catch (err: any) {
      console.error('[Feedback] Submission failed:', err)
      setError(humanizeError(err, 'submit feedback'))
    } finally {
      setSubmitting(false)
    }
  }
  
  const BUSINESS_TYPES = [
    'Textile Factory',
    'Rice Mill',
    'Garment Factory',
    'Pharma',
    'Auto Parts',
    'Wholesale',
    'Construction',
    'Food Processing',
    'Dairy',
    'Other Manufacturing',
  ]
  
  const STAR_LABELS = [
    '',
    'Not useful',
    'Somewhat useful',
    'Good',
    'Very good',
    'Essential for my business',
  ]
  
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60
          backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50
        flex items-center justify-center
        p-4 pointer-events-none">
        <div
          className="w-full max-w-md
            bg-[#0F1114] border border-white/10
            rounded-sm shadow-2xl
            pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center
            justify-between px-6 py-4
            border-b border-white/8">
            <div>
              <p className="text-sm font-semibold
                text-white">
                {step === 'done'
                  ? 'Thank you'
                  : 'Share your experience'}
              </p>
              <p className="text-xs text-gray-500
                mt-0.5">
                {step === 'rate'
                  ? 'How is Noxis working for you?'
                  : step === 'write'
                  ? 'Tell others what you think'
                  : 'Your feedback has been received'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center
                justify-center text-gray-600
                hover:text-gray-300
                transition-colors text-lg"
            >
              ✕
            </button>
          </div>
          
          <div className="px-6 py-6">
            
            {/* STEP 1: Rating */}
            {step === 'rate' && (
              <div>
                <p className="text-xs text-gray-500
                  mb-4 text-center">
                  Rate your overall experience
                </p>
                
                {/* Stars */}
                <div className="flex justify-center
                  gap-3 mb-3">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onMouseEnter={() =>
                        setHoverRating(n)
                      }
                      onMouseLeave={() =>
                        setHoverRating(0)
                      }
                      onClick={() => setRating(n)}
                      className="transition-transform
                        hover:scale-110 text-3xl"
                    >
                      <span className={
                        n <= (hoverRating || rating)
                          ? 'text-[#C5A059]'
                          : 'text-gray-700'
                      }>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                
                <p className="text-xs text-center
                  text-gray-500 h-4 mb-6">
                  {STAR_LABELS[hoverRating || rating]}
                </p>
                
                <button
                  onClick={() => {
                    if (!rating) {
                      setError('Please select a rating')
                      return
                    }
                    setError('')
                    setStep('write')
                  }}
                  disabled={!rating}
                  className="w-full py-3 text-sm
                    font-bold bg-[#60A5FA] text-black
                    hover:bg-blue-400
                    disabled:opacity-40
                    disabled:cursor-not-allowed
                    transition-colors"
                >
                  Continue →
                </button>
                
                {error && (
                  <p className="text-xs text-red-400
                    text-center mt-2">
                    {error}
                  </p>
                )}
              </div>
            )}
            
            {/* STEP 2: Write */}
            {step === 'write' && (
              <div className="space-y-4">
                
                {/* Star display */}
                <div className="flex justify-center
                  gap-1 mb-2">
                  {[1,2,3,4,5].map(n => (
                    <span key={n}
                      className={`text-base
                        ${n <= rating
                          ? 'text-[#C5A059]'
                          : 'text-gray-700'}`}>
                      ★
                    </span>
                  ))}
                </div>
                
                {/* Feedback text */}
                <div>
                  <label className="text-[10px]
                    font-semibold uppercase
                    tracking-widest text-gray-500
                    block mb-2">
                    Your feedback
                    <span className="text-red-500 ml-1">
                      *
                    </span>
                  </label>
                  <textarea
                    value={text}
                    onChange={e => {
                      setText(e.target.value)
                      setError('')
                    }}
                    rows={4}
                    placeholder={
                      rating >= 4
                        ? "What do you like most about Noxis? How has it helped your business?"
                        : rating === 3
                        ? "What works well? What could be better?"
                        : "What problems are you facing? How can we improve?"
                    }
                    className="w-full bg-[#161A1F]
                      border border-white/8 text-white
                      text-sm px-3 py-2.5 outline-none
                      resize-none
                      focus:border-[#60A5FA]/40
                      placeholder:text-gray-700
                      transition-colors"
                    autoFocus
                  />
                  <p className={`text-[10px] mt-1
                    ${text.length < 20
                      ? 'text-gray-700'
                      : 'text-emerald-500'}`}>
                    {text.length}/20 minimum
                  </p>
                </div>
                
                {/* Display name */}
                <div>
                  <label className="text-[10px]
                    font-semibold uppercase
                    tracking-widest text-gray-500
                    block mb-2">
                    Your name
                    <span className="text-red-500 ml-1">
                      *
                    </span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e =>
                      setDisplayName(e.target.value)
                    }
                    placeholder="Ahmad Mahboob"
                    className="w-full bg-[#161A1F]
                      border border-white/8 text-white
                      text-sm px-3 py-2.5 outline-none
                      focus:border-[#60A5FA]/40
                      placeholder:text-gray-700
                      transition-colors"
                  />
                </div>
                
                {/* Business type + City row */}
                <div className="grid grid-cols-2
                  gap-3">
                  <div>
                    <label className="text-[10px]
                      font-semibold uppercase
                      tracking-widest text-gray-500
                      block mb-2">
                      Business type
                    </label>
                    <select
                      value={businessType}
                      onChange={e =>
                        setBusinessType(e.target.value)
                      }
                      className="w-full bg-[#161A1F]
                        border border-white/8
                        text-white text-sm
                        px-3 py-2.5 outline-none
                        focus:border-[#60A5FA]/40
                        transition-colors"
                    >
                      <option value="">Select...</option>
                      {BUSINESS_TYPES.map(t => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[10px]
                      font-semibold uppercase
                      tracking-widest text-gray-500
                      block mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={e =>
                        setCity(e.target.value)
                      }
                      placeholder="Lahore"
                      className="w-full bg-[#161A1F]
                        border border-white/8
                        text-white text-sm
                        px-3 py-2.5 outline-none
                        focus:border-[#60A5FA]/40
                        placeholder:text-gray-700
                        transition-colors"
                    />
                  </div>
                </div>
                
                {/* Share on website toggle */}
                <div className="flex items-start
                  gap-3 p-3 bg-[#161A1F]
                  border border-white/6 rounded-sm">
                  <input
                    type="checkbox"
                    id="share-toggle"
                    checked={shareOnWebsite}
                    onChange={e =>
                      setShareOnWebsite(
                        e.target.checked
                      )
                    }
                    className="mt-0.5 flex-shrink-0"
                  />
                  <label
                    htmlFor="share-toggle"
                    className="cursor-pointer"
                  >
                    <p className="text-xs
                      text-gray-300 font-medium">
                      Share on noxishub.app
                    </p>
                    <p className="text-[11px]
                      text-gray-600 mt-0.5
                      leading-relaxed">
                      Your review helps other
                      factory owners decide.
                      We review before publishing.
                      Your contact details are
                      never shown.
                    </p>
                  </label>
                </div>
                
                {error && (
                  <p className="text-xs text-red-400">
                    {error}
                  </p>
                )}
                
                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setStep('rate')
                      setError('')
                    }}
                    className="flex-1 py-2.5 text-sm
                      border border-white/10
                      text-gray-400
                      hover:border-white/20
                      transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-2.5 text-sm
                      font-bold bg-[#60A5FA]
                      text-black hover:bg-blue-400
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                      transition-colors"
                  >
                    {submitting
                      ? 'Submitting...'
                      : 'Submit'}
                  </button>
                </div>
              </div>
            )}
            
            {/* STEP 3: Done */}
            {step === 'done' && (
              <div className="text-center py-4">
                <div className="text-4xl mb-4">
                  🙏
                </div>
                <p className="text-sm font-semibold
                  text-white mb-2">
                  Thank you, {displayName}
                </p>
                <p className="text-xs text-gray-500
                  leading-relaxed mb-2">
                  {shareOnWebsite
                    ? 'Your review will appear on noxishub.app after a quick review by our team.'
                    : 'Your feedback has been recorded. We will use it to improve Noxis.'}
                </p>
                <p className="text-[11px]
                  text-gray-700">
                  — Ahmad Mahboob, Omnora Labs
                </p>
                
                <button
                  onClick={() => {
                    onClose()
                    setStep('rate')
                    setRating(0)
                    setText('')
                    setError('')
                  }}
                  className="mt-6 w-full py-2.5
                    text-sm font-bold
                    bg-[#60A5FA] text-black
                    hover:bg-blue-400
                    transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
