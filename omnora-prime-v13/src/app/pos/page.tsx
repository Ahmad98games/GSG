'use client'
import { useState, useEffect, useRef,
  useCallback, useMemo } from 'react'
import { useQuery, useMutation,
  useQueryClient }
  from '@tanstack/react-query'
import { createClient }
  from '@/lib/supabase/client'
import { useBusinessProfile }
  from '@/hooks/useBusinessProfile'
import { useIndustryConfig }
  from '@/hooks/useIndustryConfig'
import { useCurrentUser }
  from '@/hooks/useCurrentUser'
import {
  IndustrialMath
} from '@/lib/finance/IndustrialMath'
import { useToast } from '@/hooks/useToast'
import {
  Search, Plus, Minus, Trash2,
  Printer, ShoppingCart, AlertTriangle,
  CheckCircle, ChevronRight, X,
  Zap, Package,
} from 'lucide-react'

interface CartItem {
  skuId: string
  name: string
  unit: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
  batchNumber?: string
  expiryDate?: string | null
  daysToExpiry?: number | null
  stockAvailable: number
  mechanicId?: string
  mechanicName?: string
  commissionRate?: number
}

interface QuickSearchResult {
  id: string
  name: string
  sku_code: string
  sale_price: number
  qty_on_hand: number
  unit: string
  batch_number?: string
  expiry_date?: string | null
  barcode?: string
}

// Days until expiry warning threshold
const EXPIRY_WARNING_DAYS = 30
const EXPIRY_CRITICAL_DAYS = 7

function getDaysToExpiry(
  expiryDate: string | null | undefined
): number | null {
  if (!expiryDate) return null
  return Math.ceil(
    (new Date(expiryDate).getTime() -
      Date.now()) / 86400000
  )
}

function ExpiryBadge({
  days
}: { days: number | null }) {
  if (days === null) return null

  if (days < 0) {
    return (
      <span className="text-[9px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">
        EXPIRED
      </span>
    )
  }
  if (days <= EXPIRY_CRITICAL_DAYS) {
    return (
      <span className="text-[9px] font-bold bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
        {days}d left
      </span>
    )
  }
  if (days <= EXPIRY_WARNING_DAYS) {
    return (
      <span className="text-[9px] font-bold bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
        {days}d left
      </span>
    )
  }
  return null
}

export default function POSPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { profile } = useBusinessProfile()
  const { t, fmt, fmtDate, taxLabel,
    taxRate, features } = useIndustryConfig()
  const { currentUser } = useCurrentUser()
  const toast = useToast()

  // ── STATE ──
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] =
    useState<QuickSearchResult[]>([])
  const [searching, setSearching] =
    useState(false)
  const [selectedParty, setSelectedParty] =
    useState<any>(null)
  const [partySearch, setPartySearch] =
    useState('')
  const [partyResults, setPartyResults] =
    useState<any[]>([])
  const [discount, setDiscount] = useState(0)
  const [taxEnabled, setTaxEnabled] =
    useState(false)
  const [completing, setCompleting] =
    useState(false)
  const [lastSale, setLastSale] =
    useState<any>(null)
  const [showReceipt, setShowReceipt] =
    useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const qtyInputRef = useRef<HTMLInputElement>(null)
  const searchDebounce = useRef<any>(null)

  // ── TOTALS ──
  const subtotal = cart.reduce(
    (s, item) => s + item.total, 0
  )
  const discountAmount =
    (subtotal * discount) / 100
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxEnabled
    ? (taxableAmount * taxRate) / 100
    : 0
  const grandTotal = taxableAmount + taxAmount

  // ── CART LOCALSTORAGE SYNC ──
  useEffect(() => {
    const savedCart = localStorage.getItem('noxis_pos_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error loading POS cart from localstorage:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('noxis_pos_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('noxis_pos_cart');
    }
  }, [cart]);

  // ── FOCUS SEARCH ON MOUNT ──
  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // ── BARCODE / SEARCH ──
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      if (searchDebounce.current) {
        clearTimeout(searchDebounce.current)
      }

      if (!value.trim()) {
        setSearchResults([])
        return
      }

      searchDebounce.current = setTimeout(
        async () => {
          setSearching(true)
          try {
            const { data } = await supabase
              .from('skus')
              .select(`
                id, name, sku_code, sale_price,
                qty_on_hand, unit,
                batch_number, expiry_date, barcode
              `)
              .eq('business_id', profile!.id)
              .eq('is_active', true)
              .or(
                `name.ilike.%${value}%,` +
                `sku_code.ilike.%${value}%,` +
                `barcode.eq.${value}`
              )
              .order('name')
              .limit(10)

            setSearchResults(data || [])

            // If exact barcode match —
            // add to cart immediately
            if (data && data.length === 1 &&
              data[0].barcode === value) {
              addToCart(data[0])
              setSearch('')
              setSearchResults([])
              searchRef.current?.focus()
            }
          } catch { /* non-fatal */ }
          setSearching(false)
        },
        value.length > 6
          ? 0  // Barcode scan — instant
          : 300 // Typing — debounce
      )
    },
    [profile?.id]
  )

  // ── KEYBOARD HANDLER ──
  // Enter on search → add first result
  // Enter on cart → complete sale
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement

      if (e.key === 'Enter') {
        // If search has focus and results exist
        if (target === searchRef.current &&
          searchResults.length > 0) {
          addToCart(searchResults[0])
          setSearch('')
          setSearchResults([])
          searchRef.current?.focus()
          return
        }
      }

      if (e.key === 'F2') {
        e.preventDefault()
        searchRef.current?.focus()
      }

      if (e.key === 'F10' && cart.length > 0) {
        e.preventDefault()
        handleCompleteSale()
      }

      if (e.key === 'Escape') {
        setSearch('')
        setSearchResults([])
        searchRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handler)
    return () =>
      window.removeEventListener('keydown', handler)
  }, [searchResults, cart])

  // ── ADD TO CART ──
  const addToCart = useCallback(
    (sku: QuickSearchResult, qty = 1) => {
      const daysToExpiry =
        getDaysToExpiry(sku.expiry_date)

      setCart(prev => {
        const existing = prev.find(
          i => i.skuId === sku.id
        )
        if (existing) {
          return prev.map(item =>
            item.skuId === sku.id
              ? {
                  ...item,
                  quantity: item.quantity + qty,
                  total: (item.quantity + qty) *
                    item.unitPrice,
                }
              : item
          )
        }

        return [...prev, {
          skuId: sku.id,
          name: sku.name,
          unit: sku.unit,
          quantity: qty,
          unitPrice: sku.sale_price,
          discount: 0,
          total: qty * sku.sale_price,
          batchNumber: sku.batch_number,
          expiryDate: sku.expiry_date,
          daysToExpiry,
          stockAvailable: sku.qty_on_hand,
        }]
      })
    },
    []
  )

  // ── UPDATE QTY ──
  const updateQty = useCallback(
    (skuId: string, qty: number) => {
      if (qty <= 0) {
        setCart(prev =>
          prev.filter(i => i.skuId !== skuId)
        )
        return
      }
      setCart(prev =>
        prev.map(item =>
          item.skuId === skuId
            ? {
                ...item,
                quantity: qty,
                total: qty * item.unitPrice,
              }
            : item
        )
      )
    },
    []
  )

  // ── UPDATE ITEM PRICE ──
  const updateItemPrice = useCallback(
    (skuId: string, price: number) => {
      setCart(prev =>
        prev.map(item =>
          item.skuId === skuId
            ? {
                ...item,
                unitPrice: price,
                total: item.quantity * price,
              }
            : item
        )
      )
    },
    []
  )

  // ── COMPLETE SALE ──
  const handleCompleteSale = useCallback(
    async () => {
      if (cart.length === 0 || completing) return
      setCompleting(true)

      const activeBizId = profile?.id || 'local-business'
      let finalInvoiceNum = `INV-${Date.now().toString().slice(-6)}`
      let createdInvoice: any = null

      try {
        // 1. Try to sync to Supabase if connected
        try {
          const { data: lastInv } = await supabase
            .from('invoices')
            .select('invoice_number')
            .eq('business_id', activeBizId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          const lastNum = parseInt(lastInv?.invoice_number?.replace(/\D/g, '') || '0')
          finalInvoiceNum = `${(profile as any)?.invoice_prefix || 'INV'}-${String(lastNum + 1).padStart(4, '0')}`

          const { data: invoice } = await supabase
            .from('invoices')
            .insert({
              business_id: activeBizId,
              invoice_number: finalInvoiceNum,
              party_id: selectedParty?.id || null,
              status: 'posted',
              subtotal,
              discount_percent: discount,
              discount_amount: discountAmount,
              tax_label: taxEnabled ? taxLabel : null,
              tax_rate: taxEnabled ? taxRate : 0,
              tax_amount: taxAmount,
              total_amount: grandTotal,
              balance_due: selectedParty ? grandTotal : 0,
              paid_amount: selectedParty ? 0 : grandTotal,
              invoice_type: 'pos',
              created_by: currentUser?.name || 'POS Counter',
            })
            .select()
            .maybeSingle()

          if (invoice) {
            createdInvoice = invoice

            // Insert line items asynchronously
            const lineItems = cart.map(item => ({
              invoice_id: invoice.id,
              business_id: activeBizId,
              sku_id: item.skuId,
              description: item.name,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              discount_percent: item.discount,
              total_price: item.total,
            }))
            await supabase.from('invoice_items').insert(lineItems)

            // Post ledger entries
            await supabase.from('ledger_entries').insert([
              {
                business_id: activeBizId,
                invoice_id: invoice.id,
                entry_type: 'invoice',
                entry_date: new Date().toISOString().split('T')[0],
                reference: finalInvoiceNum,
                description: `POS Sale — ${finalInvoiceNum}`,
                debit: grandTotal,
                credit: 0,
                account_code: selectedParty ? '1100' : '1001',
              },
              {
                business_id: activeBizId,
                invoice_id: invoice.id,
                entry_type: 'invoice',
                entry_date: new Date().toISOString().split('T')[0],
                reference: finalInvoiceNum,
                description: `Sales — ${finalInvoiceNum}`,
                debit: 0,
                credit: subtotal - discountAmount,
                account_code: '4000',
              },
              ...(taxAmount > 0 ? [{
                business_id: activeBizId,
                invoice_id: invoice.id,
                entry_type: 'invoice',
                entry_date: new Date().toISOString().split('T')[0],
                reference: finalInvoiceNum,
                description: `${taxLabel} — ${finalInvoiceNum}`,
                debit: 0,
                credit: taxAmount,
                account_code: '2100',
              }] : []),
            ])

            // Update party balance if credit sale
            if (selectedParty) {
              await supabase
                .from('parties')
                .update({
                  current_balance: (selectedParty.current_balance || 0) + grandTotal
                })
                .eq('id', selectedParty.id)
            }
          }
        } catch (dbErr) {
          console.warn('[POS] Supabase write skipped or offline:', dbErr)
        }

        // 2. Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['invoices'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })

        // 3. Show receipt modal immediately
        const completedSale = {
          invoice: createdInvoice || { id: `inv_${Date.now()}`, invoice_number: finalInvoiceNum },
          invoiceNum: createdInvoice?.invoice_number || finalInvoiceNum,
          cart: [...cart],
          subtotal,
          discountAmount,
          taxAmount,
          grandTotal,
          party: selectedParty,
          profile,
        }

        setLastSale(completedSale)
        setShowReceipt(true)

        // Reset state and clear cart
        setCart([])
        try { localStorage.removeItem('noxis_pos_cart') } catch {}
        setSelectedParty(null)
        setPartySearch('')
        setDiscount(0)
        setTaxEnabled(false)
        searchRef.current?.focus()

        toast.success('Sale Completed', `Receipt #${completedSale.invoiceNum} created successfully`)
      } catch (err: any) {
        toast.error('Sale Processing Error', err.message || 'Could not record sale')
      } finally {
        setCompleting(false)
      }
    },
    [cart, selectedParty, discount,
      subtotal, discountAmount, taxAmount,
      grandTotal, taxEnabled, completing,
      profile, taxLabel, taxRate, currentUser, queryClient, toast]
  )

  // ── PRINT RECEIPT ──
  const handlePrint = useCallback(() => {
    if (!lastSale) return
    window.print()
  }, [lastSale])

  return (
    <div className="flex h-screen overflow-hidden bg-[#060708]">

      {/* LEFT — Search and Cart */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOP BAR */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#0A0C0F] flex-shrink-0">
          <div className="flex items-center gap-3">
            <ShoppingCart size={18} className="text-[#60A5FA]" />
            <div>
              <h1 className="text-sm font-bold text-white">
                POS Counter
              </h1>
              <p className="text-[10px] text-gray-600">
                F2 = Search · Enter = Add · F10 = Complete Sale
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Full Dashboard →
            </a>
          </div>
        </div>

        {/* SEARCH BAR — full width, always focused */}
        <div className="px-4 py-3 border-b border-white/6 flex-shrink-0">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
            />
            <input
              ref={searchRef}
              value={search}
              onChange={e =>
                handleSearchChange(e.target.value)
              }
              placeholder={
                `Search ${t.item} by name, ` +
                `code, or scan barcode...`
              }
              className="w-full bg-[#0F1114] border border-white/10 text-white text-sm pl-9 pr-4 py-3 outline-none focus:border-[#60A5FA]/50 rounded-sm"
              autoFocus
              autoComplete="off"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#60A5FA]/20 border-t-[#60A5FA] rounded-full animate-spin" />
            )}
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-1 bg-[#0F1114] border border-white/10 rounded-sm shadow-2xl max-h-64 overflow-y-auto">
              {searchResults.map((sku, i) => {
                const days = getDaysToExpiry(
                  sku.expiry_date
                )
                return (
                  <button
                    key={sku.id}
                    onClick={() => {
                      addToCart(sku)
                      setSearch('')
                      setSearchResults([])
                      searchRef.current?.focus()
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/5 border-b border-white/4 last:border-0 ${i === 0 ? 'bg-[#60A5FA]/5' : ''}`}
                  >
                    <Package size={14} className="text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">
                          {sku.name}
                        </p>
                        <ExpiryBadge days={days} />
                        {sku.qty_on_hand <= 0 && (
                          <span className="text-[9px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded font-bold border border-red-500/20">
                            OUT
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-600">
                        {sku.sku_code} · Stock: {sku.qty_on_hand}{' '}
                        {sku.unit}
                        {sku.batch_number &&
                          ` · Batch: ${sku.batch_number}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold font-mono text-[#60A5FA]">
                        {fmt(sku.sale_price)}
                      </p>
                      <p className="text-[10px] text-gray-700">
                        per {sku.unit}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* CART */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <ShoppingCart size={48} className="text-gray-800 mb-4" />
              <p className="text-gray-600 text-sm font-medium mb-1">
                Cart is empty
              </p>
              <p className="text-gray-700 text-xs">
                Search for items above or scan a barcode
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-white/6 sticky top-0 bg-[#060708]">
                <tr>
                  <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                    Item
                  </th>
                  <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 w-28">
                    Qty
                  </th>
                  <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 w-28">
                    Price
                  </th>
                  <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 w-28">
                    Total
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.skuId} className="border-b border-white/4 hover:bg-white/2 group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-white font-medium">
                          {item.name}
                        </p>
                        <ExpiryBadge days={item.daysToExpiry || null} />
                      </div>
                      {item.batchNumber && (
                        <p className="text-[10px] text-gray-700">
                          Batch: {item.batchNumber}
                        </p>
                      )}
                    </td>

                    {/* Qty controls */}
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() =>
                            updateQty(
                              item.skuId,
                              item.quantity - 1
                            )
                          }
                          className="w-7 h-7 border border-white/10 text-gray-400 hover:border-white/20 hover:text-white rounded flex items-center justify-center text-sm transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => {
                            const v = parseFloat(
                              e.target.value
                            )
                            if (!isNaN(v) && v >= 0) {
                              updateQty(
                                item.skuId, v
                              )
                            }
                          }}
                          className="w-12 text-center bg-[#0F1114] border border-white/10 text-white text-sm py-1 outline-none focus:border-[#60A5FA]/40 rounded"
                          min="0"
                          step="0.5"
                        />
                        <button
                          onClick={() =>
                            updateQty(
                              item.skuId,
                              item.quantity + 1
                            )
                          }
                          className="w-7 h-7 border border-white/10 text-gray-400 hover:border-white/20 hover:text-white rounded flex items-center justify-center text-sm transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Price — editable */}
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={e => {
                          const v = parseFloat(
                            e.target.value
                          )
                          if (!isNaN(v)) {
                            updateItemPrice(
                              item.skuId, v
                            )
                          }
                        }}
                        className="w-full text-right bg-transparent text-sm text-white outline-none hover:bg-white/5 focus:bg-[#0F1114] focus:border focus:border-[#60A5FA]/40 px-2 py-1 rounded"
                      />
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-mono font-semibold text-white">
                        {fmt(item.total)}
                      </p>
                    </td>

                    {/* Remove */}
                    <td className="pr-3 py-3">
                      <button
                        onClick={() =>
                          updateQty(item.skuId, 0)
                        }
                        className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RIGHT — Totals + Actions Panel */}
      <div className="w-80 border-l border-white/8 flex flex-col bg-[#0A0C0F] flex-shrink-0">

        {/* Customer selector */}
        <div className="p-4 border-b border-white/6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">
            Customer (optional)
          </p>
          {selectedParty ? (
            <div className="flex items-center justify-between p-3 bg-[#60A5FA]/8 border border-[#60A5FA]/20 rounded-sm">
              <div>
                <p className="text-sm font-bold text-white">
                  {selectedParty.name}
                </p>
                <p className="text-[10px] text-gray-500">
                  Balance: {fmt(
                    selectedParty.current_balance || 0
                  )}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedParty(null)
                  setPartySearch('')
                }}
                className="text-gray-600 hover:text-gray-300"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                value={partySearch}
                onChange={async e => {
                  setPartySearch(e.target.value)
                  if (e.target.value.length < 2) {
                    setPartyResults([])
                    return
                  }
                  const { data } = await supabase
                    .from('parties')
                    .select('id, name, current_balance')
                    .eq('business_id', profile!.id)
                    .ilike('name',
                      `%${e.target.value}%`
                    )
                    .limit(5)
                  setPartyResults(data || [])
                }}
                placeholder="Walk-in customer or search..."
                className="w-full bg-[#161A1F] border border-white/8 text-white text-xs px-3 py-2 outline-none focus:border-[#60A5FA]/40"
              />
              {partyResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-[#0F1114] border border-white/10 shadow-xl z-10">
                  {partyResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedParty(p)
                        setPartySearch(p.name)
                        setPartyResults([])
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 border-b border-white/4 last:border-0"
                    >
                      <p>{p.name}</p>
                      <p className="text-[10px] text-gray-600">
                        Balance: {fmt(
                          p.current_balance || 0
                        )}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="p-4 border-b border-white/6 flex-shrink-0">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Subtotal
              </span>
              <span className="text-white font-mono">
                {fmt(subtotal)}
              </span>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">
                Discount %
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={discount}
                  onChange={e =>
                    setDiscount(
                      Math.min(100,
                        Math.max(0,
                          parseFloat(e.target.value)
                          || 0
                        )
                      )
                    )
                  }
                  className="w-16 text-right bg-[#0F1114] border border-white/8 text-white text-sm px-2 py-1 outline-none focus:border-[#60A5FA]/40"
                  min="0"
                  max="100"
                />
                <span className="text-gray-600 text-sm">%</span>
              </div>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-emerald-500">
                  − Discount
                </span>
                <span className="text-emerald-500 font-mono">
                  − {fmt(discountAmount)}
                </span>
              </div>
            )}

            {/* Tax toggle */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">
                {taxLabel} ({taxRate}%)
              </span>
              <button
                onClick={() =>
                  setTaxEnabled(p => !p)
                }
                className={`relative w-10 h-5 rounded-full transition-colors ${taxEnabled ? 'bg-[#60A5FA]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${taxEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
            {taxEnabled && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {taxLabel}
                </span>
                <span className="text-white font-mono">
                  {fmt(taxAmount)}
                </span>
              </div>
            )}

            {/* Grand total */}
            <div className="flex justify-between pt-3 border-t border-white/10">
              <span className="text-base font-bold text-white">
                Total
              </span>
              <span className="text-xl font-black font-mono text-[#60A5FA]">
                {fmt(grandTotal)}
              </span>
            </div>
          </div>

          {/* COMPLETE SALE BUTTON */}
          <button
            onClick={handleCompleteSale}
            disabled={
              cart.length === 0 || completing
            }
            className={`w-full py-4 rounded-sm font-bold text-base transition-all flex items-center justify-center gap-2 ${cart.length > 0 && !completing ? 'bg-[#60A5FA] text-black hover:bg-blue-400 active:scale-[0.98]' : 'bg-white/5 text-gray-700 cursor-not-allowed'}`}
          >
            {completing ? (
              <>
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Complete Sale
                <span className="text-xs bg-black/15 px-1.5 py-0.5 rounded font-mono">
                  F10
                </span>
              </>
            )}
          </button>
        </div>

        {/* Quick links */}
        <div className="p-3 flex-shrink-0">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Invoices', href: '/invoices' },
              { label: 'Inventory', href: '/inventory' },
              { label: 'Parties', href: '/parties' },
              { label: 'Reports', href: '/reports' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center justify-between px-3 py-2 bg-white/4 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/8 transition-colors rounded-sm"
              >
                {link.label}
                <ChevronRight size={10} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white text-black rounded-sm shadow-2xl print:shadow-none">
            <div className="p-6">
              {/* Business header */}
              <div className="text-center mb-4 pb-4 border-b border-gray-200">
                {(lastSale.profile?.logo_url || profile?.logo_url) ? (
                  <div className="flex justify-center mb-3">
                    <img 
                      src={lastSale.profile?.logo_url || profile?.logo_url} 
                      alt="Business Logo" 
                      className="h-16 w-auto max-w-[180px] object-contain" 
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-black text-white font-black text-xl rounded-full flex items-center justify-center mx-auto mb-3 uppercase">
                    {(lastSale.profile?.business_name || profile?.business_name || 'N').slice(0, 2)}
                  </div>
                )}
                <p className="font-black text-lg uppercase tracking-wide">
                  {lastSale.profile?.business_name || profile?.business_name}
                </p>
                {lastSale.profile?.phone && (
                  <p className="text-sm text-gray-600">
                    {lastSale.profile.phone}
                  </p>
                )}
                <p className="text-sm font-bold mt-2">
                  Receipt #{lastSale.invoiceNum}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleString('en-PK')}
                </p>
              </div>

              {/* Items */}
              <div className="space-y-1 mb-4">
                {lastSale.cart.map((item: CartItem) => (
                  <div key={item.skuId} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p>{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} ×{' '}
                        {item.unitPrice.toLocaleString('en-PK')}
                      </p>
                    </div>
                    <p className="font-mono">
                      {item.total.toLocaleString('en-PK')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-mono">
                    {lastSale.subtotal.toLocaleString('en-PK')}
                  </span>
                </div>
                {lastSale.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-mono">
                      −{lastSale.discountAmount.toLocaleString('en-PK')}
                    </span>
                  </div>
                )}
                {lastSale.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>{taxLabel}</span>
                    <span className="font-mono">
                      {lastSale.taxAmount.toLocaleString('en-PK')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-black text-base border-t border-gray-300 pt-2 mt-2">
                  <span>TOTAL</span>
                  <span className="font-mono">
                    {lastSale.profile?.currency || 'PKR'}{' '}
                    {lastSale.grandTotal.toLocaleString('en-PK')}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <p className="text-center text-xs text-gray-400 mt-4">
                Thank you for your business!
                <br />
                Powered by Noxis Hub
              </p>
            </div>

            {/* Actions */}
            <div className="flex border-t border-gray-200">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 text-sm font-bold text-[#60A5FA] hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={14} />
                Print
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
