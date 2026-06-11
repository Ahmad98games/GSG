"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { PersonaEngine } from '@/lib/persona/PersonaEngine'
import Fuse from 'fuse.js'
import {
  Search, Package, Users, FileText,
  TrendingUp, ShoppingCart, BookOpen,
  Zap, Settings, BarChart, Camera,
  Globe, Banknote, Clock, ChevronRight,
  Calculator, Upload, Shield, Smartphone,
} from 'lucide-react'

const STATIC_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', desc: 'Overview and KPIs', route: '/dashboard', icon: 'zap', group: 'Navigation', tags: ['home','main','overview','kpi','summary'] },
  { id: 'inventory', label: 'Inventory / Stock', desc: 'Manage products and SKUs', route: '/inventory', icon: 'package', group: 'Navigation', tags: ['stock','sku','product','maal','items','barcode','reorder','saman','goods','item'] },
  { id: 'karigars', label: 'Karigars', desc: 'Workers, attendance and wages', route: '/karigars', icon: 'users', group: 'Navigation', tags: ['worker','karigar','employee','staff','labour','labor','attendance','wages','peshgi','advance','mazdoor','haazri','tankhwa','salary','piece rate','tukra'] },
  { id: 'production', label: 'Production', desc: 'Log production and batches', route: '/production', icon: 'trending', group: 'Navigation', tags: ['production','output','pieces','factory','floor','batch','manufacturing'] },
  { id: 'payroll', label: 'Payroll', desc: 'Run monthly salaries', route: '/payroll', icon: 'banknote', group: 'Navigation', tags: ['payroll','salary','tankhwa','wages','monthly','pay','payment','maheena','payslip'] },
  { id: 'invoices', label: 'Invoices', desc: 'Create and manage invoices', route: '/invoices', icon: 'file', group: 'Navigation', tags: ['invoice','bill','billing','sale','receipt','document','raseed','farookht'] },
  { id: 'new-invoice', label: 'New Invoice', desc: 'Create a new invoice', route: '/invoices/new', icon: 'file', group: 'Action', tags: ['new invoice','create invoice','add invoice','make bill'] },
  { id: 'parties', label: 'Parties', desc: 'Customers and suppliers', route: '/parties', icon: 'users', group: 'Navigation', tags: ['customer','supplier','vendor','party','client','buyer','seller','graahak'] },
  { id: 'purchase', label: 'Purchase Orders', desc: 'Buy from suppliers', route: '/purchase', icon: 'shopping', group: 'Navigation', tags: ['purchase','order','buy','kharid','po','supplier order'] },
  { id: 'khata', label: 'Khata / Ledger', desc: 'Double-entry accounting', route: '/khata', icon: 'book', group: 'Navigation', tags: ['khata','ledger','accounts','accounting','double entry','journal','hisab','udhaar','payment','receipt'] },
  { id: 'cashflow', label: 'Cash Flow', desc: '90-day cash forecast', route: '/cashflow', icon: 'trending', group: 'Navigation', tags: ['cash','cashflow','forecast','liquidity','money','nakdi'] },
  { id: 'reports', label: 'Reports', desc: 'P&L, trial balance, aging', route: '/reports', icon: 'chart', group: 'Navigation', tags: ['report','profit','loss','balance','trial','aging','tax','p&l'] },
  { id: 'dispatch', label: 'Dispatch', desc: 'Outgoing shipments', route: '/dispatch', icon: 'package', group: 'Navigation', tags: ['dispatch','delivery','shipment','outgoing','logistics'] },
  { id: 'promises', label: 'Payment Promises', desc: 'Track verbal commitments', route: '/promises', icon: 'clock', group: 'Navigation', tags: ['promise','commitment','due','overdue','payment promise','wada','payment due','reminder'] },
  { id: 'quick-entry', label: 'Quick Entry', desc: 'Fast production, payment, attendance', route: '/quick-entry', icon: 'zap', group: 'Tools', tags: ['quick','fast','entry','rapid','piece','attendance','payment'] },
  { id: 'import', label: 'Import Data', desc: 'Import from Excel or CSV', route: '/import', icon: 'upload', group: 'Tools', tags: ['import','excel','csv','upload','migrate','data'] },
  { id: 'calculators', label: 'Calculators', desc: 'Fabric, OEE, EMI, margins', route: '/calculators', icon: 'calculator', group: 'Tools', tags: ['calculator','fabric','gsm','emi','margin','oee','piece rate','compute'] },
  { id: 'converters', label: 'Converters', desc: 'Currency, weight, fabric units', route: '/converters', icon: 'calculator', group: 'Tools', tags: ['converter','convert','currency','weight','fabric','unit','measurement'] },
  { id: 'file-morph', label: 'File Morph', desc: 'Compress, merge, convert files', route: '/file-morph', icon: 'file', group: 'Tools', tags: ['file','compress','pdf','merge','convert','image','heic','jpg'] },
  { id: 'generators', label: 'Invoice Generator', desc: 'Generate invoices, payslips, POs', route: '/generators/invoice', icon: 'file', group: 'Tools', tags: ['generator','generate','invoice','payslip','salary slip','purchase order','qr','barcode'] },
  { id: 'intelligence', label: 'Intelligence', desc: 'Market benchmarks and predictions', route: '/intelligence', icon: 'trending', group: 'Intelligence', tags: ['intelligence','predict','forecast','benchmark','market','insight','analysis'] },
  { id: 'finance', label: 'Working Capital', desc: 'Finance score and loan referrals', route: '/finance', icon: 'banknote', group: 'Intelligence', tags: ['finance','loan','credit','capital','working capital','funding'] },
  { id: 'network', label: 'Factory Network', desc: 'Connect with other factories', route: '/network', icon: 'globe', group: 'Intelligence', tags: ['network','connect','factory','marketplace','supply chain','b2b'] },
  { id: 'cctv', label: 'CCTV Security', desc: 'Camera monitoring and AI detection', route: '/cctv', icon: 'camera', group: 'Security', tags: ['cctv','camera','security','surveillance','ai','detection','monitor'] },
  { id: 'audit', label: 'Audit & Compliance', desc: 'Inventory reconciliation and logs', route: '/audit', icon: 'shield', group: 'Security', tags: ['audit','compliance','reconcile','fraud','change log','history'] },
  { id: 'settings', label: 'Settings', desc: 'Business profile and preferences', route: '/settings', icon: 'settings', group: 'Settings', tags: ['settings','configure','setup','preferences','profile','business'] },
  { id: 'backup', label: 'Backup & Restore', desc: 'Download and restore data backup', route: '/settings/backup', icon: 'shield', group: 'Settings', tags: ['backup','restore','export','download','data','safety'] },
  { id: 'api-settings', label: 'API Access', desc: 'Generate API keys and webhooks', route: '/settings/api', icon: 'settings', group: 'Settings', tags: ['api','key','webhook','developer','integration','access'] },
  { id: 'staff-users', label: 'Staff Users', desc: 'Invite and manage staff roles', route: '/settings/users', icon: 'users', group: 'Settings', tags: ['staff','users','roles','invite','team','permission','access'] },
  { id: 'whatsapp-settings', label: 'WhatsApp Alerts', desc: 'Configure WhatsApp notifications', route: '/settings/whatsapp', icon: 'smartphone', group: 'Settings', tags: ['whatsapp','alert','notification','message','summary'] },
  { id: 'mobile-pairing', label: 'Mobile Pairing', desc: 'Pair Android devices via QR', route: '/pairing', icon: 'smartphone', group: 'Settings', tags: ['mobile','pair','android','qr','connect','phone','device'] },
]


type SearchResult = {
  id: string
  label: string
  desc: string
  route: string
  icon: string
  group: string
  tags: string[]
  type: 'static' | 'dynamic'
  extra?: string
}

const ICON_MAP: Record<string, any> = {
  package: Package,
  users: Users,
  file: FileText,
  trending: TrendingUp,
  shopping: ShoppingCart,
  book: BookOpen,
  zap: Zap,
  settings: Settings,
  chart: BarChart,
  camera: Camera,
  globe: Globe,
  banknote: Banknote,
  clock: Clock,
  calculator: Calculator,
  upload: Upload,
  shield: Shield,
  smartphone: Smartphone,
}

function ResultIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name] || Zap
  return <Icon size={14} />
}

const fuse = new Fuse(STATIC_ITEMS, {
  keys: [
    { name: 'label', weight: 0.5 },
    { name: 'tags', weight: 0.35 },
    { name: 'desc', weight: 0.15 },
  ],
  threshold: 0.38,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
  useExtendedSearch: false,
})

export default function GlobalSearch() {
  const router = useRouter()
  const { profile } = useBusinessProfile()
  const businessId = profile?.id
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(prev => {
          const next = !prev
          if (next) setTimeout(() => inputRef.current?.focus(), 50)
          return next
        })
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      if (!query) search('')
    }
  }, [open])

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setResults(STATIC_ITEMS.slice(0, 8).map(i => ({ ...i, type: 'static' as const })))
      setActiveIdx(0)
      setLoading(false)
      return
    }

    setLoading(true)

    const staticResults = fuse
      .search(trimmed, { limit: 6 })
      .map(r => ({ ...r.item, type: 'static' as const }))

    const dynamicResults: SearchResult[] = []
    if (businessId && trimmed.length >= 2) {
      const [skus, parties, invoices, karigars] =
        await Promise.allSettled([
          supabase.from('skus')
            .select('id, name, sku_code, category')
            .eq('business_id', businessId)
            .ilike('name', `%${trimmed}%`)
            .limit(3),
          supabase.from('parties')
            .select('id, name, party_type, phone')
            .eq('business_id', businessId)
            .ilike('name', `%${trimmed}%`)
            .limit(3),
          supabase.from('invoices')
            .select('id, invoice_number, total_amount')
            .eq('business_id', businessId)
            .ilike('invoice_number', `%${trimmed}%`)
            .limit(3),
          supabase.from('karigars')
            .select('id, name, karigar_code')
            .eq('business_id', businessId)
            .ilike('name', `%${trimmed}%`)
            .limit(3),
        ])

      if (skus.status === 'fulfilled' && skus.value.data) {
        skus.value.data.forEach((s: any) => dynamicResults.push({
          id: `sku-${s.id}`,
          label: s.name,
          desc: `SKU ${s.sku_code || ''} · ${s.category || 'Inventory'}`,
          route: `/inventory`,
          icon: 'package',
          group: 'Inventory',
          tags: [],
          type: 'dynamic',
          extra: s.sku_code,
        }))
      }

      if (parties.status === 'fulfilled' && parties.value.data) {
        parties.value.data.forEach((p: any) => dynamicResults.push({
          id: `party-${p.id}`,
          label: p.name,
          desc: `${p.party_type || 'Party'} · ${p.phone || ''}`,
          route: `/parties/${p.id}`,
          icon: 'users',
          group: 'Parties',
          tags: [],
          type: 'dynamic',
        }))
      }

      if (invoices.status === 'fulfilled' && invoices.value.data) {
        invoices.value.data.forEach((inv: any) => dynamicResults.push({
          id: `invoice-${inv.id}`,
          label: `Invoice #${inv.invoice_number}`,
          desc: PersonaEngine.fmt(inv.total_amount || 0),
          route: `/invoices/${inv.id}`,
          icon: 'file',
          group: 'Invoices',
          tags: [],
          type: 'dynamic',
        }))
      }

      if (karigars.status === 'fulfilled' && karigars.value.data) {
        karigars.value.data.forEach((k: any) => dynamicResults.push({
          id: `karigar-${k.id}`,
          label: k.name,
          desc: `Karigar · ${k.karigar_code || ''}`,
          route: `/karigars/${k.id}`,
          icon: 'users',
          group: 'Karigars',
          tags: [],
          type: 'dynamic',
        }))
      }
    }

    const merged = [...dynamicResults, ...staticResults]
    const seen = new Set<string>()
    const deduped = merged.filter(item => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })

    setResults(deduped.slice(0, 10))
    setActiveIdx(0)
    setLoading(false)
  }, [businessId, supabase])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 220)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  const navigate = (result: SearchResult) => {
    router.push(result.route)
    setOpen(false)
    setQuery('')
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (results[activeIdx]) navigate(results[activeIdx])
    }
  }

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    const group = result.group || 'Results'
    if (!acc[group]) acc[group] = []
    acc[group].push(result)
    return acc
  }, {})

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setOpen(false)} />
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4">
        <div className="bg-[#111418] border border-white/10 rounded-sm shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
            <Search size={16} className="text-gray-500 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search features, products, karigars..."
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
            />
            {loading ? (
              <div className="w-3.5 h-3.5 border border-white/20 border-t-white/60 rounded-full animate-spin flex-shrink-0" />
            ) : (
              <kbd className="text-[9px] font-mono text-gray-700 bg-white/5 px-1.5 py-0.5 rounded flex-shrink-0">ESC</kbd>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {results.length === 0 && !loading ? (
              <div className="py-10 text-center">
                <p className="text-sm text-gray-500">No results for "{query}"</p>
                <p className="text-xs text-gray-700 mt-1">Try: inventory, payroll, invoice, karigar, calculator</p>
              </div>
            ) : (
              Object.entries(grouped).map(([group, items]) => (
                <div key={group}>
                  <p className="px-4 py-2 text-[9px] font-semibold uppercase tracking-widest text-gray-600 bg-white/[0.02]">{group}</p>
                  {items.map((result, index) => {
                    const globalIdx = results.indexOf(result)
                    const isActive = globalIdx === activeIdx
                    return (
                      <button
                        key={result.id}
                        onClick={() => navigate(result)}
                        onMouseEnter={() => setActiveIdx(globalIdx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? 'bg-[#60A5FA]/10' : 'hover:bg-white/[0.04]'}`}
                      >
                        <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-[#60A5FA]/20 text-[#60A5FA]' : 'bg-white/5 text-gray-500'}`}>
                          <ResultIcon name={result.icon} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-200'}`}>{result.label}</p>
                          <p className="text-[10px] text-gray-600 truncate">{result.desc}</p>
                        </div>
                        <div className={`flex items-center gap-1.5 text-[9px] flex-shrink-0 ${isActive ? 'text-[#60A5FA]' : 'text-gray-700'}`}>
                          {result.type === 'dynamic' && (
                            <span className="bg-[#60A5FA]/10 text-[#60A5FA] px-1.5 py-0.5 rounded text-[8px] font-bold">LIVE</span>
                          )}
                          <ChevronRight size={11} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2 border-t border-white/6 flex items-center gap-4 text-[9px] text-gray-700">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span>esc close</span>
            <span className="ml-auto">Ctrl+K to toggle</span>
          </div>
        </div>
      </div>
    </>
  )
}
