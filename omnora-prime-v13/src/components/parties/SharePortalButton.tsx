'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { getApiUrl } from '@/lib/utils/apiUrl'
import { useToast } from '@/hooks/useToast'
import { copyToClipboard } from '@/lib/utils/clipboard'

interface SharePortalButtonProps {
  partyId: string
  partyName: string
  partyPhone?: string | null
  partyBalance?: number | null
  businessName?: string | null
}

export function SharePortalButton({
  partyId,
  partyName,
  partyPhone,
  partyBalance,
  businessName,
}: SharePortalButtonProps) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [portalUrl, setPortalUrl] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const toast = useToast()

  const generatePortal = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (portalUrl) {
      setIsModalOpen(true)
      return
    }

    setLoading(true)
    try {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      const nonce = Array.from(array, dec => dec.toString(16).padStart(2, '0')).join('');

      const res = await fetch(
        getApiUrl('/api/portal/generate'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            partyId,
            partyName,
            expiryDays: 30,
            nonce,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        toast.error('Error', data.error || 'Could not generate portal')
        return
      }

      setPortalUrl(data.url)
      setIsModalOpen(true)

    } catch (err: any) {
      toast.error('Error', 'Portal generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!portalUrl) return
    copyToClipboard(portalUrl)
    setCopied(true)
    toast.success('Copied', 'Portal link copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenBrowser = () => {
    if (!portalUrl) return
    window.open(portalUrl, '_blank')
  }

  const handleWhatsAppShare = () => {
    if (!portalUrl) return
    const digits = (partyPhone || '')
      .replace(/\D/g, '')
      .replace(/^0/, '92')

    const biz = businessName || 'Noxis Hub'
    const balVal = partyBalance != null ? Number(partyBalance) : null
    const balanceText = balVal != null
      ? `\n📊 *Account Status*:\n• *Current Balance*: PKR ${Math.abs(balVal).toLocaleString('en-PK')} (${balVal > 0 ? 'Payable (Amount Due)' : balVal < 0 ? 'Advance (Credit)' : 'Settled / Nil'})\n• *Verified Invoices & Ledger Available*\n`
      : ''

    const msg = encodeURIComponent(
      `*CLIENT ACCOUNT PORTAL ACCESS*\n` +
      `🏛️ *${biz}*\n\n` +
      `Assalam-o-Alaikum *${partyName}*,\n\n` +
      `Here is your secure, private access to view your updated account statement, verified invoices, delivery records, and download official PDF statements in real-time:\n` +
      balanceText +
      `\n🔗 *Click to Open Live Portal*:\n` +
      `${portalUrl}\n\n` +
      `⏳ _This encrypted link is valid for 30 days._\n\n` +
      `Thank you for your valued partnership.\n` +
      `*${biz}*`
    )
    window.open(`https://wa.me/${digits}?text=${msg}`, '_blank')
  }

  return (
    <>
      <button
        onClick={generatePortal}
        disabled={loading}
        title="Share client portal"
        className={`flex items-center gap-1.5
          text-xs px-3 py-1.5 rounded-sm
          border transition-colors
          ${portalUrl
            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/8'
            : 'border-white/10 text-gray-500 hover:border-white/20'}`}
      >
        {loading ? (
          <span className="animate-spin">⟳</span>
        ) : copied ? (
          <Check size={12} className="text-emerald-400" />
        ) : (
          <Share2 size={12} />
        )}
        {loading
          ? 'Generating...'
          : 'Share Portal'}
      </button>

      {/* Share Portal Modal */}
      {isModalOpen && portalUrl && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-0 duration-200"
          onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
        >
          <div
            className="w-full max-w-lg bg-[#0F1114] border border-emerald-500/30 rounded-sm shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">
                  Client Portal Link · {partyName}
                </h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                  Private & Valid for 30 Days
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Portal URL
              </label>
              <div className="flex items-center gap-2 bg-[#1A1D21] border border-white/10 p-2.5 rounded-sm">
                <input
                  type="text"
                  readOnly
                  value={portalUrl}
                  className="flex-1 bg-transparent text-xs text-emerald-400 font-mono outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30 hover:bg-emerald-500/30 transition-all rounded-sm flex items-center gap-1"
                >
                  {copied ? <Check size={12} /> : null}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleOpenBrowser}
                className="py-3 px-4 bg-electric-blue/10 border border-electric-blue/30 text-electric-blue text-xs font-bold uppercase tracking-wider hover:bg-electric-blue/20 transition-all rounded-sm flex items-center justify-center gap-2"
              >
                🌐 Open Portal
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="py-3 px-4 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-xs font-bold uppercase tracking-wider hover:bg-[#25D366]/20 transition-all rounded-sm flex items-center justify-center gap-2"
              >
                💬 WhatsApp (Optional)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
