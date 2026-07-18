'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { buildPaymentReminderMessage, openWhatsApp } from '@/lib/whatsapp/buildMessage'
import { useToast } from '@/hooks/useToast'
import { MessageCircle, CheckCircle2, ArrowLeft, Phone, AlertCircle, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PartyWithBalance {
  id: string
  name: string
  phone: string | null
  current_balance: number
  party_type: 'customer' | 'supplier' | 'both'
}

export default function RemindersPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const toast = useToast()

  const [sent, setSent] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState<string | null>(null)
  const [sendingAll, setSendingAll] = useState(false)

  const { data: parties = [], isLoading } = useQuery<PartyWithBalance[]>({
    queryKey: ['parties-outstanding', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('parties')
        .select('id, name, phone, current_balance, party_type')
        .eq('business_id', profile!.id)
        .gt('current_balance', 0)
        .order('current_balance', { ascending: false })
      return (data as PartyWithBalance[]) || []
    },
    enabled: !!profile?.id,
  })

  const sendReminder = async (party: PartyWithBalance): Promise<boolean> => {
    if (!party.phone) {
      toast.error('Missing Phone', `No phone number for ${party.name}`)
      return false
    }

    setSending(party.id)

    // Look up active portal token for this party
    let portalUrl: string | null = null
    try {
      const { data: session } = await supabase
        .from('portal_sessions')
        .select('token')
        .eq('party_id', party.id)
        .eq('is_revoked', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (session?.token) {
        portalUrl = `${window.location.origin}/portal/${session.token}`
      }
    } catch {
      // No portal — non-fatal, send without it
    }

    const message = buildPaymentReminderMessage({
      businessName: profile?.business_name || 'Business',
      partyName: party.name,
      invoiceNumber: 'Outstanding Balance',
      balanceDue: party.current_balance,
      dueDate: 'at your earliest convenience',
      currency: profile?.currency || 'PKR',
      portalUrl,
    })

    const success = openWhatsApp(
      party.phone,
      message,
      (profile as any)?.country_code || 'PK'
    )

    setSending(null)

    if (success) {
      setSent(prev => new Set([...prev, party.id]))
      toast.success('Reminder sent', `WhatsApp opened for ${party.name}`)
    } else {
      toast.error('Failed', 'Could not open WhatsApp')
    }
    return success
  }

  const sendAllReminders = async () => {
    const withPhone = parties.filter(p => p.phone && !sent.has(p.id))
    if (withPhone.length === 0) {
      toast.error('No parties', 'All parties already contacted or missing phone numbers')
      return
    }

    setSendingAll(true)
    for (let i = 0; i < withPhone.length; i++) {
      await sendReminder(withPhone[i])
      if (i < withPhone.length - 1) {
        // Small delay so user can see each WhatsApp tab open
        await new Promise(r => setTimeout(r, 2500))
      }
    }
    setSendingAll(false)
    toast.success('Done', `Reminders sent to all ${withPhone.length} customers`)
  }

  const fmt = (n: number) =>
    `${profile?.currency || 'PKR'} ${n.toLocaleString('en-PK')}`

  const totalOutstanding = parties.reduce((s, p) => s + (p.current_balance || 0), 0)
  const withPhone = parties.filter(p => p.phone)
  const withoutPhone = parties.filter(p => !p.phone)
  const alreadySent = parties.filter(p => sent.has(p.id))

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-mono">
      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors mr-8 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Parties</span>
        </button>
        <div className="h-4 w-px bg-white/10 mx-4" />
        <h1 className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-400">
          Bulk Payment Reminders
        </h1>
        <div className="ml-auto flex items-center gap-3">
          {withPhone.length > 0 && (
            <button
              onClick={sendAllReminders}
              disabled={sendingAll || withPhone.filter(p => !sent.has(p.id)).length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-[10px] font-black uppercase tracking-widest hover:bg-[#25D366]/20 disabled:opacity-40 transition-all"
            >
              <MessageCircle size={12} />
              {sendingAll ? 'Sending…' : `Send All (${withPhone.filter(p => !sent.has(p.id)).length})`}
            </button>
          )}
        </div>
      </header>

      <div className="p-8 max-w-3xl mx-auto space-y-6">
        {/* Summary */}
        {parties.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-5 bg-[#1A1D21] border border-red-500/20 rounded-sm">
              <p className="text-2xl font-mono font-black text-red-400">{fmt(totalOutstanding)}</p>
              <p className="text-[9px] uppercase tracking-widest text-gray-600 mt-1 font-bold">
                Total Outstanding
              </p>
              <p className="text-[10px] text-gray-700 mt-0.5">{parties.length} customer{parties.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="p-5 bg-[#1A1D21] border border-[#25D366]/15 rounded-sm">
              <p className="text-2xl font-mono font-black text-[#25D366]">{withPhone.length}</p>
              <p className="text-[9px] uppercase tracking-widest text-gray-600 mt-1 font-bold">Can Receive WhatsApp</p>
              <p className="text-[10px] text-gray-700 mt-0.5">{withoutPhone.length} missing phone</p>
            </div>
            <div className="p-5 bg-[#1A1D21] border border-emerald-500/15 rounded-sm">
              <p className="text-2xl font-mono font-black text-emerald-400">{alreadySent.length}</p>
              <p className="text-[9px] uppercase tracking-widest text-gray-600 mt-1 font-bold">Reminders Sent</p>
              <p className="text-[10px] text-gray-700 mt-0.5">this session</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/4 rounded-sm" />)}
          </div>
        )}

        {/* Empty */}
        {!isLoading && parties.length === 0 && (
          <div className="p-16 text-center bg-[#1A1D21] border border-white/5 rounded-sm">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-4" />
            <p className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-2">
              All Clear ✓
            </p>
            <p className="text-[11px] text-gray-600">No outstanding balances. All accounts settled.</p>
          </div>
        )}

        {/* Party list */}
        {!isLoading && parties.length > 0 && (
          <div className="space-y-2">
            {parties.map((party) => {
              const isSent    = sent.has(party.id)
              const isSending = sending === party.id
              const hasPhone  = !!party.phone

              return (
                <div
                  key={party.id}
                  className="flex items-center justify-between p-5 bg-[#1A1D21] border border-white/5 rounded-sm hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 flex items-center justify-center rounded-sm flex-shrink-0 ${
                      isSent ? 'bg-emerald-500/10' : 'bg-white/4'
                    }`}>
                      {isSent
                        ? <CheckCircle2 size={16} className="text-emerald-500" />
                        : <Users size={16} className="text-gray-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{party.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {hasPhone ? (
                          <span className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                            <Phone size={9} />
                            {party.phone}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-red-500/70">
                            <AlertCircle size={9} />
                            No phone number
                          </span>
                        )}
                        <span className="text-[9px] text-gray-700 uppercase tracking-wider font-bold border border-white/5 px-1.5 py-0.5 rounded-sm">
                          {party.party_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-mono font-black text-red-400">
                        {fmt(party.current_balance)}
                      </p>
                      <p className="text-[10px] text-gray-700">outstanding</p>
                    </div>

                    {isSent ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-wider rounded-sm">
                        <CheckCircle2 size={11} />
                        Sent
                      </div>
                    ) : (
                      <button
                        onClick={() => sendReminder(party)}
                        disabled={isSending || !hasPhone || sendingAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#25D366]/30 text-[#25D366] text-[10px] font-black uppercase tracking-wider hover:bg-[#25D366]/10 disabled:opacity-40 transition-all"
                      >
                        <MessageCircle size={11} />
                        {isSending ? '…' : 'Remind'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* No phone tip */}
        {withoutPhone.length > 0 && (
          <div className="p-4 bg-[#1A1D21] border border-amber-500/15 rounded-sm">
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-1">
              ⚠ {withoutPhone.length} customers missing phone numbers
            </p>
            <p className="text-[10px] text-gray-600">
              Add WhatsApp numbers in{' '}
              <Link href="/parties" className="text-blue-400 hover:text-blue-300 underline">
                Parties
              </Link>{' '}
              to enable WhatsApp reminders for them.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
