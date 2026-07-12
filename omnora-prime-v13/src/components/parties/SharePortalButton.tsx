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
}

export function SharePortalButton({
  partyId,
  partyName,
  partyPhone,
}: SharePortalButtonProps) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [portalUrl, setPortalUrl] = useState<string | null>(null)
  const toast = useToast()

  const generatePortal = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click navigation

    if (portalUrl) {
      handleShare(portalUrl)
      return
    }

    setLoading(true)
    try {
      // Generate a secure client-side nonce (32 hex characters)
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
      handleShare(data.url, data.partyName)

    } catch (err: any) {
      toast.error('Error', 'Portal generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = (
    url: string,
    name?: string
  ) => {
    // Copy to clipboard
    copyToClipboard(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    // Open WhatsApp if phone available
    if (partyPhone) {
      const digits = partyPhone
        .replace(/\D/g, '')
        .replace(/^0/, '92')
      const msg = encodeURIComponent(
        `Assalam o Alaikum ${name || partyName},\n\n` +
        `Your account portal is ready. ` +
        `You can view all your invoices, ` +
        `deliveries, and payment history here:\n\n` +
        `${url}\n\n` +
        `This link is private to your account ` +
        `and valid for 30 days.\n\n` +
        `_Noxis Hub_`
      )
      window.open(
        `https://wa.me/${digits}?text=${msg}`,
        '_blank'
      )
    } else {
      toast.success('Success', 'Portal link copied to clipboard')
    }
  }

  return (
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
        : copied
        ? 'Copied!'
        : 'Share Portal'}
    </button>
  )
}
