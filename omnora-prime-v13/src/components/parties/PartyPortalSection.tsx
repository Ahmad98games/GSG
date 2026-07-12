'use client'

import { useQuery } from '@tanstack/react-query'
import { getApiUrl } from '@/lib/utils/apiUrl'
import { useToast } from '@/hooks/useToast'

interface PartyPortalSectionProps {
  partyId: string
}

export function PartyPortalSection({ partyId }: PartyPortalSectionProps) {
  const toast = useToast()

  const { data: sessions, refetch } = useQuery({
    queryKey: ['portal-sessions', partyId],
    queryFn: async () => {
      const res = await fetch(
        getApiUrl(`/api/portal/sessions?partyId=${partyId}`)
      )
      const data = await res.json()
      return data.sessions || []
    },
  })

  const revokeSession = async (token: string) => {
    if (!confirm(
      'Revoke this portal? The link will stop working immediately.'
    )) return

    try {
      const res = await fetch(
        getApiUrl('/api/portal/revoke'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token }),
        }
      )

      if (!res.ok) {
        const data = await res.json()
        toast.error('Error', data.error || 'Failed to revoke portal link')
        return
      }

      refetch()
      toast.success('Success', 'Portal access revoked')
    } catch {
      toast.error('Error', 'Failed to revoke portal link')
    }
  }

  if (!sessions || sessions.length === 0)
    return null

  return (
    <div className="mt-6 p-5 bg-[#0F1114] border border-white/5 rounded-sm">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
        Active Portal Links
      </h3>
      <div className="space-y-3">
        {sessions.map((s: any) => (
          <div key={s.token} className="flex items-center justify-between text-xs">
            <div>
              <p className="text-white font-mono text-[11px]">
                .../{s.token}
              </p>
              <p className="text-gray-600 mt-0.5">
                Created{' '}
                {new Date(s.created_at).toLocaleDateString('en-PK')}
                {' '}· Accessed{' '}
                {s.access_count} time
                {s.access_count !== 1 ? 's' : ''}
                {' '}· Expires{' '}
                {new Date(s.expires_at).toLocaleDateString('en-PK')}
              </p>
            </div>
            <button
              onClick={() => revokeSession(s.token)}
              className="text-red-500 hover:text-red-400 text-[10px] ml-4 font-bold uppercase tracking-wider"
            >
              Revoke
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
