'use client'
import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useToast } from '@/hooks/useToast'
import { Save, Lock, DollarSign, Users, Package } from 'lucide-react'

export default function OpeningBalancesPage() {
  const supabase = createClient()
  const { profile } = useBusinessProfile()
  const queryClient = useQueryClient()
  const toast = useToast()

  const isLocked = !!(profile as any)?.opening_balances_entered

  const { data: parties = [] } = useQuery({
    queryKey: ['parties-ob', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('parties')
        .select('id, name, party_type, current_balance')
        .eq('business_id', profile!.id)
        .order('name')
      return data || []
    },
    enabled: !!profile?.id,
  })

  const { data: skus = [] } = useQuery({
    queryKey: ['skus-ob', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('skus')
        .select('id, name, unit, current_stock, avg_cost')
        .eq('business_id', profile!.id)
        .order('name')
      return data || []
    },
    enabled: !!profile?.id,
  })

  const [balances, setBalances] = useState<Record<string, string>>({})
  const [cashBalance, setCashBalance] = useState('0')
  const [bankBalance, setBankBalance] = useState('0')
  const [skuQty, setSkuQty] = useState<Record<string, string>>({})
  const [skuCost, setSkuCost] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const initial: Record<string, string> = {}
    parties.forEach((p: any) => {
      initial[p.id] = String(p.current_balance || 0)
    })
    setBalances(initial)
  }, [parties])

  useEffect(() => {
    const qty: Record<string, string> = {}
    const cost: Record<string, string> = {}
    skus.forEach((s: any) => {
      qty[s.id] = String(s.current_stock || 0)
      cost[s.id] = String(s.avg_cost || 0)
    })
    setSkuQty(qty)
    setSkuCost(cost)
  }, [skus])

  const saveBalances = async () => {
    if (!profile?.id || isLocked) return
    setSaving(true)
    try {
      // Update each party's opening balance
      for (const [partyId, balance] of Object.entries(balances)) {
        const amount = parseFloat(balance) || 0
        if (amount !== 0) {
          await supabase.from('parties')
            .update({ current_balance: amount })
            .eq('id', partyId)

          await supabase.from('ledger_entries').insert({
            business_id: profile.id,
            party_id: partyId,
            entry_type: 'opening_balance',
            debit: amount > 0 ? amount : 0,
            credit: amount < 0 ? Math.abs(amount) : 0,
            description: 'Opening Balance',
            reference: 'OB-001',
            entry_date: new Date().toISOString().split('T')[0],
          }).then(() => {}) // non-fatal if table doesn't exist yet
        }
      }

      // Cash and bank entries
      const cashAmt = parseFloat(cashBalance) || 0
      const bankAmt = parseFloat(bankBalance) || 0

      if (cashAmt > 0) {
        await supabase.from('ledger_entries').insert({
          business_id: profile.id,
          entry_type: 'opening_balance',
          debit: cashAmt,
          credit: 0,
          description: 'Opening Cash Balance',
          reference: 'OB-CASH',
          account_code: '1001',
          entry_date: new Date().toISOString().split('T')[0],
        }).then(() => {})
      }

      if (bankAmt > 0) {
        await supabase.from('ledger_entries').insert({
          business_id: profile.id,
          entry_type: 'opening_balance',
          debit: bankAmt,
          credit: 0,
          description: 'Opening Bank Balance',
          reference: 'OB-BANK',
          account_code: '1002',
          entry_date: new Date().toISOString().split('T')[0],
        }).then(() => {})
      }

      // Update SKU quantities and costs
      for (const [skuId, qty] of Object.entries(skuQty)) {
        const q = parseFloat(qty) || 0
        const c = parseFloat(skuCost[skuId] || '0') || 0
        if (q !== 0 || c !== 0) {
          await supabase.from('skus')
            .update({ current_stock: q, avg_cost: c })
            .eq('id', skuId)
        }
      }

      // Mark as completed
      await supabase.from('business_profiles')
        .update({ opening_balances_entered: true } as any)
        .eq('id', profile.id)

      toast.success('Opening balances saved', { message: 'Your books are now set up correctly.' })
      queryClient.invalidateQueries({ queryKey: ['parties-ob'] })
      queryClient.invalidateQueries({ queryKey: ['skus-ob'] })
    } catch (err: any) {
      toast.error('Failed to save', err?.message || 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-xl font-bold text-white tracking-tight">Opening Balances</h1>
        {isLocked && (
          <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">
            <Lock size={10} /> Saved &amp; Locked
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-6">
        Enter the financial state of your business BEFORE you started using Noxis.
        This ensures your books are correct from day one.
        {isLocked && ' These values have been locked after saving.'}
      </p>

      {/* Cash and Bank */}
      <div className="p-5 bg-[#0F1114] border border-white/[0.08] rounded-sm mb-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={14} className="text-blue-400" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Cash &amp; Bank</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Cash in Hand</label>
            <input
              type="number"
              value={cashBalance}
              disabled={isLocked}
              onChange={e => setCashBalance(e.target.value)}
              className="w-full bg-[#161A1F] border border-white/[0.08] text-white text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Bank Balance</label>
            <input
              type="number"
              value={bankBalance}
              disabled={isLocked}
              onChange={e => setBankBalance(e.target.value)}
              className="w-full bg-[#161A1F] border border-white/[0.08] text-white text-sm px-3 py-2.5 outline-none focus:border-[#60A5FA]/40 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Party balances */}
      <div className="p-5 bg-[#0F1114] border border-white/[0.08] rounded-sm mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Users size={14} className="text-amber-400" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Party Balances</p>
        </div>
        <p className="text-[10px] text-gray-600 mb-4">
          Positive = they owe you money. Negative = you owe them money.
        </p>
        {parties.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-4">No parties found. Add parties first.</p>
        ) : (
          <div className="space-y-2">
            {parties.map((party: any) => (
              <div key={party.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-white">{party.name}</p>
                  <p className="text-[10px] text-gray-600 capitalize">{party.party_type}</p>
                </div>
                <input
                  type="number"
                  value={balances[party.id] ?? '0'}
                  disabled={isLocked}
                  onChange={e => setBalances(prev => ({ ...prev, [party.id]: e.target.value }))}
                  className="w-36 bg-[#161A1F] border border-white/[0.08] text-white text-sm px-3 py-2 outline-none focus:border-[#60A5FA]/40 text-right font-mono disabled:opacity-50"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inventory opening values */}
      <div className="p-5 bg-[#0F1114] border border-white/[0.08] rounded-sm mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Package size={14} className="text-purple-400" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Inventory Opening Stock</p>
        </div>
        <p className="text-[10px] text-gray-600 mb-4">
          Enter the quantity and unit cost of each item at your starting date.
        </p>
        {skus.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-4">No SKUs found. Add inventory items first.</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest px-1">
              <span>Item</span>
              <span className="text-right">Opening Qty</span>
              <span className="text-right">Unit Cost</span>
            </div>
            {skus.map((sku: any) => (
              <div key={sku.id} className="grid grid-cols-3 gap-2 items-center">
                <div>
                  <p className="text-sm text-white">{sku.name}</p>
                  <p className="text-[10px] text-gray-600">{sku.unit}</p>
                </div>
                <input
                  type="number"
                  value={skuQty[sku.id] ?? '0'}
                  disabled={isLocked}
                  onChange={e => setSkuQty(prev => ({ ...prev, [sku.id]: e.target.value }))}
                  className="bg-[#161A1F] border border-white/[0.08] text-white text-sm px-3 py-2 outline-none focus:border-[#60A5FA]/40 text-right font-mono disabled:opacity-50"
                />
                <input
                  type="number"
                  value={skuCost[sku.id] ?? '0'}
                  disabled={isLocked}
                  onChange={e => setSkuCost(prev => ({ ...prev, [sku.id]: e.target.value }))}
                  className="bg-[#161A1F] border border-white/[0.08] text-white text-sm px-3 py-2 outline-none focus:border-[#60A5FA]/40 text-right font-mono disabled:opacity-50"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {!isLocked ? (
        <button
          onClick={saveBalances}
          disabled={saving}
          className="w-full py-3 bg-[#60A5FA] text-black font-bold text-sm hover:bg-blue-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Opening Balances (Locks permanently)'}
        </button>
      ) : (
        <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm text-center flex items-center justify-center gap-2">
          <Lock size={16} />
          Opening Balances Saved &amp; Locked
        </div>
      )}
    </div>
  )
}
