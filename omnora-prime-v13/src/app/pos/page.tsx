'use client'
import {
  useState, useCallback, useEffect,
  useRef, memo, useMemo,
} from 'react'
import { useRouter } from 'next/navigation'
import { useToastStore } from '@/hooks/useToast'

const toast = Object.assign(
  (msg: string, _opts?: any) => {
    useToastStore.getState().addToast({ type: 'warning', title: msg })
  },
  {
    success: (msg: string) => useToastStore.getState().addToast({ type: 'success', title: msg }),
    error: (msg: string) => useToastStore.getState().addToast({ type: 'error', title: msg }),
  }
)
import {
  Search, Barcode, X, Plus, Minus,
  ChevronDown, Receipt, Send,
  CreditCard, Banknote, Smartphone,
  Users, Trash2, Tag, Percent,
  AlertTriangle, CheckCircle,
  Printer, Share2,
} from 'lucide-react'
import { createClient }
  from '@/lib/supabase/client'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useLicense } from '@/hooks/useLicense'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useFormDraft }
  from '@/hooks/useFormDraft'
import {
  createEmptyCart, addItemToCart,
  removeItemFromCart, updateItemQuantity,
  updateItemPrice, updateItemDiscount,
  applyOrderDiscount, addPayment,
  removePayment, setParty,
  validateCartStock, recalcPayments,
  type POSCart, type PaymentMethod, type CartItem,
} from '@/lib/pos/posEngine'
import { parseScannedPayload }
  from '@/lib/barcode/barcodeEngine'
import { formatCurrency }
  from '@/lib/i18n/currencies'
import { buildWhatsAppInvoiceMessage }
  from '@/lib/invoices/whatsappBuilder'
import { generateThermalReceipt }
  from '@/lib/pdf/generateThermal'
import { generateInvoicePDF }
  from '@/lib/accounting/generateInvoice'

// Static data outside component
const PAYMENT_METHODS = [
  { method: 'cash' as PaymentMethod,
    label: 'Cash',
    icon: Banknote,
    color: '#10B981' },
  { method: 'bank' as PaymentMethod,
    label: 'Bank',
    icon: CreditCard,
    color: '#60A5FA' },
  { method: 'jazzcash' as PaymentMethod,
    label: 'JazzCash',
    icon: Smartphone,
    color: '#EF4444' },
  { method: 'easypaisa' as PaymentMethod,
    label: 'EasyPaisa',
    icon: Smartphone,
    color: '#10B981' },
  { method: 'credit' as PaymentMethod,
    label: 'Credit',
    icon: Users,
    color: '#C5A059' },
]

export default function POSPage() {
  const supabase = createClient()
  const router = useRouter()
  const { profile } = useBusinessProfile()
  const { can, effectiveTier } = useLicense()

  const [cart, setCart] =
    useState<POSCart>(createEmptyCart())
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] =
    useState<any[]>([])
  const [searchLoading, setSearchLoading] =
    useState(false)
  const [completing, setCompleting] =
    useState(false)
  const [showReceipt, setShowReceipt] =
    useState(false)
  const [lastInvoice, setLastInvoice] =
    useState<any>(null)
  const [showPaymentPanel, setShowPaymentPanel] =
    useState(false)
  const [scanFeedback, setScanFeedback] =
    useState<'success' | 'error' | null>(null)

  const searchRef = useRef<HTMLInputElement>(null)
  const searchTimeout = useRef<any>(null)

  const { saveDraft, clearDraft } =
    useFormDraft('pos_cart')

  const currency = profile?.base_currency
    || 'PKR'

  // Restore cart from draft
  useEffect(() => {
    const t = setTimeout(async () => {
      const draft = await (window as any)
        .electronAPI?.store
        ?.getDraft?.('pos_cart')
      if (draft?.items?.length > 0) {
        setCart(draft)
        toast(
          'Cart restored from last session',
          { icon: '🔄' }
        )
      }
    }, 200)
    return () => clearTimeout(t)
  }, [])

  // Auto-save draft every 5s
  useEffect(() => {
    if (cart.items.length === 0) return
    const t = setInterval(() => {
      saveDraft(cart)
    }, 5000)
    return () => clearInterval(t)
  }, [cart, saveDraft])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'F10') {
        e.preventDefault()
        if (cart.items.length > 0) {
          setShowPaymentPanel(true)
        }
      }
      if (e.key === 'Escape') {
        setSearch('')
        setSearchResults([])
        searchRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handler)
    return () =>
      window.removeEventListener('keydown', handler)
  }, [cart.items.length])

  const handleAddItem = useCallback(
    (sku: any) => {
    setCart(prev => addItemToCart(prev, sku))
    setSearch('')
    setSearchResults([])
    searchRef.current?.focus()
  }, [])

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimeout.current)
    const parsedScan = parseScannedPayload(search)
    const queryTerm = parsedScan.skuCode || parsedScan.cleanCode

    if (!queryTerm || !profile?.id) {
      setSearchResults([])
      return
    }

    // Handle Karigar Job Tag payload scanned in POS
    if (parsedScan.type === 'JOB' && parsedScan.jobPayload) {
      toast.success(
        `Job Order #${parsedScan.jobPayload.job_id} Scanned (${parsedScan.jobPayload.stage})`
      )
    }

    searchTimeout.current = setTimeout(
      async () => {
      setSearchLoading(true)
      try {
        const { data } = await supabase
          .from('skus')
          .select(`
            id, name, sku_code, barcode,
            sale_price, wholesale_price,
            dealer_price, unit, tax_rate,
            qty_on_hand, reorder_level
          `)
          .eq('business_id', profile.id)
          .eq('is_active', true)
          .or(
            `name.ilike.%${queryTerm}%,` +
            `sku_code.ilike.%${queryTerm}%,` +
            `barcode.eq.${queryTerm}`
          )
          .order('name')
          .limit(8)

        setSearchResults(data || [])

        // Barcode exact match = auto-add
        if (data && data.length === 1 &&
          (data[0].barcode === queryTerm || data[0].sku_code === queryTerm)) {
          handleAddItem(data[0])
          setScanFeedback('success')
          setTimeout(() =>
            setScanFeedback(null), 600
          )
        } else if (
          queryTerm.length > 5 &&
          data?.length === 0
        ) {
          setScanFeedback('error')
          setTimeout(() =>
            setScanFeedback(null), 600
          )
        }
      } finally {
        setSearchLoading(false)
      }
    }, 200)

    return () =>
      clearTimeout(searchTimeout.current)
  }, [search, profile?.id, handleAddItem])

  const queryClient = useQueryClient()
  const { currentUser } = useCurrentUser()

  const completeSale = useCallback(
    async () => {
    if (cart.items.length === 0) return

    const { valid, errors } =
      validateCartStock(cart)
    if (!valid) {
      toast.error(errors[0])
      return
    }

    if (cart.balanceDue > 0 &&
      !cart.partyId &&
      cart.payments.some(
        p => p.method === 'credit'
      )) {
      toast.error(
        'Select a customer for credit sales'
      )
      return
    }

    setCompleting(true)

    // Generate ONE idempotency ID per cart
    const clientTxId =
      cart.clientTransactionId ||
      crypto.randomUUID()

    // Save ID to cart state so power cut recovery reuses same ID
    if (!cart.clientTransactionId) {
      setCart(prev => ({
        ...prev,
        clientTransactionId: clientTxId,
      }))
      saveDraft({
        ...cart,
        clientTransactionId: clientTxId,
      })
    }

    try {
      const { data, error } =
        await (supabase as any).rpc('complete_sale', {
          p_business_id: profile!.id,
          p_user_id: currentUser?.id,
          p_client_transaction_id: clientTxId,
          p_invoice_date: new Date()
            .toISOString().split('T')[0],
          p_party_id: cart.partyId,
          p_party_name: cart.partyName,
          p_party_phone: cart.partyPhone,
          p_notes: cart.notes || null,
          p_invoice_currency: currency,
          p_subtotal: cart.subtotal,
          p_discount_amount:
            cart.discountAmount,
          p_discount_percent:
            cart.discountType === 'percent'
              ? cart.discountValue : 0,
          p_tax_amount: cart.taxAmount,
          p_grand_total: cart.grandTotal,
          p_items: cart.items.map(item => ({
            sku_id: item.skuId,
            description: item.name,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unitPrice,
            discount_percent:
              item.discountType === 'percent'
                ? item.discountValue : 0,
            discount_amount:
              item.discountAmount,
            tax_rate: item.taxRate,
            tax_amount: item.taxAmount,
            line_total: item.lineTotal,
          })),
          p_payments: cart.payments.map(p => ({
            method: p.method,
            amount: p.amount,
            reference: p.reference || null,
          })),
        })

      if (error) throw error

      const result = data as {
        status: string
        error_code?: string
        message?: string
        invoice_id?: string
        invoice_number?: string
        invoice_status?: string
        amount_paid?: number
        balance_due?: number
        idempotent?: boolean
      }

      if (result.status === 'ERROR') {
        const MESSAGES: Record<string, string> = {
          INSUFFICIENT_STOCK:
            `Insufficient stock. ${
              result.message || ''
            }`,
          INVALID_SKU:
            'One or more items are invalid.',
          INVALID_PAYMENT:
            'Payment allocation is invalid.',
          CREDIT_REQUIRES_PARTY:
            'Select a customer for credit sales.',
          PERMISSION_DENIED:
            'You do not have permission.',
          DUPLICATE_TRANSACTION:
            'This sale was already processed.',
          INVALID_TOTAL:
            'Sale total is invalid.',
          INVALID_DISCOUNT:
            'Discount value is invalid.',
          TRANSACTION_FAILED:
            'Sale failed. Please try again.',
        }
        toast.error(
          MESSAGES[result.error_code || '']
            || result.message
            || 'Sale failed'
        )
        return
      }

      if (result.status === 'ALREADY_COMPLETED'
        || result.idempotent) {
        toast(
          'Sale was already recorded.',
          { icon: 'ℹ️' }
        )
      }

      // Success
      clearDraft()
      setLastInvoice({
        id: result.invoice_id,
        invoice_number: result.invoice_number,
        invoice_status: result.invoice_status,
        total_amount: cart.grandTotal,
        amount_paid: result.amount_paid,
        balance_due: result.balance_due,
      })
      setShowPaymentPanel(false)
      setShowReceipt(true)
      setCart(createEmptyCart())

      // Invalidate affected queries
      queryClient.invalidateQueries({
        queryKey: ['skus', profile!.id]
      })
      queryClient.invalidateQueries({
        queryKey: ['invoices', profile!.id]
      })
      if (cart.partyId) {
        queryClient.invalidateQueries({
          queryKey: ['party', cart.partyId]
        })
      }

      toast.success(
        `Sale complete — ${
          result.invoice_number
        }`
      )

    } catch (err: any) {
      toast.error(
        err.message || 'Failed to complete sale'
      )
    } finally {
      setCompleting(false)
    }
  }, [cart, profile, currentUser, currency,
    clearDraft, saveDraft, queryClient])

  const handleWhatsApp = useCallback(() => {
    if (!lastInvoice) return
    const msg = buildWhatsAppInvoiceMessage(
      lastInvoice, cart, profile
    )
    const phone = (cart.partyPhone || '')
      .replace(/[^0-9+]/g, '')
      .replace(/^0/, '92')
    window.open(
      `https://wa.me/${phone}?text=${
        encodeURIComponent(msg)
      }`,
      '_blank'
    )
  }, [lastInvoice, cart, profile])

  const handlePrintThermal =
    useCallback(async () => {
    if (!lastInvoice) return
    await generateThermalReceipt(
      lastInvoice,
      cart.items,
      profile
    )
    window.print()
  }, [lastInvoice, cart, profile])

  const handlePrintA4 =
    useCallback(async () => {
    if (!lastInvoice) return
    await generateInvoicePDF({
      ...lastInvoice,
      items: cart.items,
      businessName: profile?.business_name,
      businessAddress: profile?.address,
      businessPhone: profile?.phone,
      ntnNumber: (profile as any)?.ntn_number,
      strnNumber: (profile as any)?.strn_number,
      currency,
    })
  }, [lastInvoice, cart, profile, currency])

  // Low stock warning items
  const lowStockItems = useMemo(() =>
    cart.items.filter(
      i => i.quantity > i.stockAvailable * 0.9
    ),
    [cart.items]
  )

  return (
    <div className="flex h-full overflow-hidden
      bg-[#060708]">

      {/* ── LEFT: SEARCH + RESULTS ── */}
      <div className="w-80 flex-shrink-0
        flex flex-col border-r border-white/6
        bg-[#0A0C0F]">

        {/* Search bar */}
        <div className="p-4 border-b
          border-white/6">
          <div className={`
            flex items-center gap-2
            bg-[#0F1114] border px-3 py-2.5
            rounded-sm transition-all duration-200
            ${scanFeedback === 'success'
              ? 'border-emerald-500/60 bg-emerald-500/8 shadow-[0_0_0_3px_rgba(16,185,129,0.1)]'
              : scanFeedback === 'error'
              ? 'border-red-500/60 bg-red-500/8 animate-[shake_0.3s_ease]'
              : 'border-white/8 focus-within:border-[#60A5FA]/40'}
          `}>
            <Search size={14}
              className="text-gray-600
                flex-shrink-0" />
            <input
              ref={searchRef}
              value={search}
              onChange={e =>
                setSearch(e.target.value)}
              placeholder="Search or scan barcode... [F2]"
              className="flex-1 bg-transparent
                text-white text-sm outline-none
                placeholder:text-gray-700"
              autoFocus
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('')
                  setSearchResults([])
                }}
                className="text-gray-600
                  hover:text-gray-400">
                <X size={13} />
              </button>
            )}
            <Barcode size={14}
              className="text-gray-700
                flex-shrink-0" />
          </div>

          {/* Low stock warnings */}
          {lowStockItems.length > 0 && (
            <div className="mt-2 flex
              items-center gap-2 px-2 py-1.5
              bg-red-500/8 border
              border-red-500/20 rounded-sm">
              <AlertTriangle size={12}
                className="text-red-400
                  flex-shrink-0" />
              <p className="text-[10px]
                text-red-400">
                {lowStockItems.length} item(s)
                near stock limit
              </p>
            </div>
          )}
        </div>

        {/* Search results */}
        <div className="flex-1 overflow-y-auto">
          {searchLoading && (
            <div className="px-4 py-3">
              <div className="h-3 bg-white/5
                animate-pulse rounded mb-2 w-3/4" />
              <div className="h-3 bg-white/5
                animate-pulse rounded w-1/2" />
            </div>
          )}

          {!searchLoading &&
            searchResults.map(sku => {
            const isLow =
              sku.qty_on_hand <= (
                sku.reorder_level || 0
              )
            const isOut =
              sku.qty_on_hand <= 0
            return (
              <button
                key={sku.id}
                onClick={() =>
                  !isOut && handleAddItem(sku)}
                disabled={isOut}
                className={`
                  w-full flex items-center
                  justify-between gap-3
                  px-4 py-3 text-left
                  border-b border-white/4
                  transition-colors
                  ${isOut
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-white/4 cursor-pointer'}
                `}
              >
                <div className="min-w-0">
                  <p className="text-sm
                    font-semibold text-white
                    truncate">
                    {sku.name}
                  </p>
                  <div className="flex
                    items-center gap-2 mt-0.5">
                    <span className="text-[10px]
                      text-gray-600">
                      {sku.sku_code}
                    </span>
                    {isLow && (
                      <span className="text-[9px]
                        font-bold text-amber-400
                        bg-amber-400/10 px-1
                        rounded-sm">
                        LOW STOCK
                      </span>
                    )}
                    {isOut && (
                      <span className="text-[9px]
                        font-bold text-red-400
                        bg-red-400/10 px-1
                        rounded-sm">
                        OUT OF STOCK
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right
                  flex-shrink-0">
                  <p className="text-sm
                    font-bold text-[#60A5FA]
                    font-mono">
                    {formatCurrency(
                      sku.sale_price, currency
                    )}
                  </p>
                  <p className="text-[10px]
                    text-gray-600">
                    {sku.qty_on_hand} {sku.unit}
                  </p>
                </div>
              </button>
            )
          })}

          {!searchLoading &&
            search &&
            searchResults.length === 0 && (
            <div className="px-4 py-8
              text-center">
              <p className="text-sm
                text-gray-600">
                No items found
              </p>
            </div>
          )}

          {!search && (
            <div className="px-4 py-8
              text-center">
              <Barcode size={24}
                className="text-gray-800
                  mx-auto mb-2" />
              <p className="text-xs
                text-gray-700">
                Type item name or
                scan barcode
              </p>
              <p className="text-[10px]
                text-gray-800 mt-1">
                F2 to focus
              </p>
            </div>
          )}
        </div>

        {/* Party selector */}
        <PartySelector
          cart={cart}
           onSelect={(party: any) =>
            setCart(prev => setParty(prev, party))}
          currency={currency}
          profile={profile}
        />
      </div>

      {/* ── CENTER: CART ── */}
      <div className="flex-1 flex flex-col
        min-w-0">

        {/* Cart header */}
        <div className="flex items-center
          justify-between px-5 py-3
          border-b border-white/6
          bg-[#0A0C0F] flex-shrink-0">
          <div className="flex items-center
            gap-3">
            <Receipt size={15}
              className="text-gray-500" />
            <p className="text-sm font-bold
              text-white">
              Cart
            </p>
            {cart.items.length > 0 && (
              <span className="text-[10px]
                font-bold text-[#60A5FA]
                bg-[#60A5FA]/10 px-2
                py-0.5 rounded-full">
                {cart.items.length} items
              </span>
            )}
          </div>
          {cart.items.length > 0 && (
            <button
              onClick={() =>
                setCart(createEmptyCart())}
              className="flex items-center
                gap-1 text-[10px] text-gray-600
                hover:text-red-400
                transition-colors">
              <Trash2 size={11} />
              Clear
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto">
          {cart.items.length === 0 ? (
            <div className="flex flex-col
              items-center justify-center
              h-full text-center px-8">
              <Receipt size={32}
                className="text-gray-800
                  mb-3" />
              <p className="text-sm font-bold
                text-gray-600">
                Cart is empty
              </p>
              <p className="text-xs text-gray-700
                mt-1">
                Search for items above or
                scan a barcode
              </p>
            </div>
          ) : (
            cart.items.map(item => (
              <CartItemRow
                key={item.id}
                item={item}
                currency={currency}
                onQtyChange={(q) =>
                  setCart(prev => updateItemQuantity(
                    prev, item.id, q
                  ))}
                onPriceChange={(p) =>
                  setCart(prev => updateItemPrice(
                    prev, item.id, p
                  ))}
                onDiscountChange={(t, v) =>
                  setCart(prev => updateItemDiscount(
                    prev, item.id, t, v
                  ))}
                onRemove={() =>
                  setCart(prev => removeItemFromCart(
                    prev, item.id
                  ))}
              />
            ))
          )}
        </div>

        {/* Order discount + totals */}
        {cart.items.length > 0 && (
          <OrderTotals
            cart={cart}
            currency={currency}
            onDiscountChange={(t, v) =>
              setCart(prev => applyOrderDiscount(
                prev, t, v
              ))}
          />
        )}
      </div>

      {/* ── RIGHT: PAYMENT PANEL ── */}
      {(showPaymentPanel ||
        cart.items.length > 0) && (
        <div className="w-72 flex-shrink-0
          flex flex-col border-l
          border-white/6 bg-[#0A0C0F]">

          <div className="p-4 border-b
            border-white/6">
            <p className="text-[10px] font-bold
              uppercase tracking-widest
              text-gray-500 mb-3">
              Payment
            </p>

            {/* Grand total */}
            <div className="text-center mb-4">
              <p className="text-xs
                text-gray-600 mb-1">
                Grand Total
              </p>
              <p className="text-3xl font-black
                text-[#60A5FA] font-mono
                tracking-tight">
                {formatCurrency(
                  cart.grandTotal, currency
                )}
              </p>
            </div>

            {/* Payment method buttons */}
            <div className="grid grid-cols-3
              gap-2 mb-3">
              {PAYMENT_METHODS.map(pm => {
                const Icon = pm.icon
                const isCredit =
                  pm.method === 'credit'
                const disabled =
                  isCredit && !cart.partyId

                return (
                  <button
                    key={pm.method}
                    onClick={() => {
                      if (disabled) {
                        toast.error(
                          'Select a customer first'
                        )
                        return
                      }
                      setCart(prev => {
                        const remaining =
                          prev.balanceDue > 0
                            ? prev.balanceDue
                            : prev.grandTotal -
                              prev.totalPaid
                        return addPayment(
                          prev, pm.method,
                          Math.max(0, remaining)
                        )
                      })
                    }}
                    disabled={disabled}
                    className={`
                      flex flex-col items-center
                      gap-1 p-2 rounded-sm
                      border transition-all
                      text-[10px] font-bold
                      ${disabled
                        ? 'border-white/5 text-gray-700 cursor-not-allowed'
                        : 'border-white/8 text-gray-500 hover:border-white/20 hover:text-white cursor-pointer'}
                    `}
                  >
                    <Icon size={14}
                      color={
                        disabled
                          ? '#374151'
                          : pm.color
                      } />
                    {pm.label}
                  </button>
                )
              })}
            </div>

            {/* Payment allocations */}
            {cart.payments.map((p, i) => (
              <div key={i}
                className="flex items-center
                  gap-2 mb-2">
                <span className="text-xs
                  text-gray-500 capitalize
                  w-20 flex-shrink-0">
                  {p.method}
                </span>
                <input
                  value={p.amount}
                  onChange={e => {
                    const newAmount = parseFloat(
                      e.target.value
                    ) || 0
                    setCart(prev => {
                      const payments =
                        [...prev.payments]
                      payments[i] = {
                        ...payments[i],
                        amount: newAmount,
                      }
                      return recalcPayments({
                        ...prev, payments
                      })
                    })
                  }}
                  type="number"
                  min="0"
                  className="flex-1 bg-[#0F1114]
                    border border-white/8
                    text-white text-sm px-2
                    py-1.5 font-mono
                    outline-none rounded-sm
                    focus:border-[#60A5FA]/40"
                />
                <button
                  onClick={() =>
                    setCart(prev =>
                      removePayment(prev, i)
                    )}
                  className="text-gray-700
                    hover:text-red-400">
                  <X size={13} />
                </button>
              </div>
            ))}

            {/* Balance / Change */}
            {cart.totalPaid > 0 && (
              <div className="mt-3 space-y-1">
                {cart.balanceDue > 0 && (
                  <div className="flex
                    justify-between text-sm">
                    <span className="text-red-400
                      font-semibold">
                      Balance Due
                    </span>
                    <span className="text-red-400
                      font-bold font-mono">
                      {formatCurrency(
                        cart.balanceDue, currency
                      )}
                    </span>
                  </div>
                )}
                {cart.change > 0 && (
                  <div className="flex
                    justify-between text-sm">
                    <span className="text-emerald-400
                      font-semibold">
                      Change
                    </span>
                    <span className="text-emerald-400
                      font-bold font-mono">
                      {formatCurrency(
                        cart.change, currency
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Complete button */}
          <div className="p-4">
            <button
              onClick={completeSale}
              disabled={
                completing ||
                cart.items.length === 0
              }
              className="w-full py-4 flex
                items-center justify-center
                gap-3 bg-[#10B981] text-black
                font-black text-base rounded-sm
                hover:brightness-110
                disabled:opacity-40
                transition-all"
            >
              {completing ? (
                <>
                  <div className="w-4 h-4
                    border-2 border-black
                    border-t-transparent
                    rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Complete Sale [F10]
                </>
              )}
            </button>
            <p className="text-center
              text-[10px] text-gray-700 mt-2">
              Esc to cancel ·
              F2 to search ·
              F10 to complete
            </p>
          </div>
        </div>
      )}

      {/* ── RECEIPT MODAL ── */}
      {showReceipt && lastInvoice && (
        <div className="fixed inset-0
          z-50 bg-black/80 flex
          items-end justify-center p-6">
          <div className="w-full max-w-sm
            bg-[#0F1114] border
            border-white/10 rounded-xl
            p-6 space-y-4
            animate-in slide-in-from-bottom-6
            duration-300">

            <div className="text-center">
              <div className="w-14 h-14
                rounded-full bg-emerald-500/15
                border-2 border-emerald-500/30
                flex items-center justify-center
                mx-auto mb-3">
                <CheckCircle size={24}
                  className="text-emerald-400" />
              </div>
              <p className="text-lg font-black
                text-white">
                Sale Complete
              </p>
              <p className="text-sm text-gray-500">
                {lastInvoice.invoice_number}
              </p>
              <p className="text-2xl font-black
                text-[#10B981] font-mono mt-1">
                {formatCurrency(
                  lastInvoice.total_amount,
                  currency
                )}
              </p>
            </div>

            <div className="grid grid-cols-3
              gap-2">
              <button
                onClick={handlePrintThermal}
                className="flex flex-col
                  items-center gap-1 p-3
                  bg-[#161A1F] border
                  border-white/8 rounded-sm
                  text-gray-400 hover:text-white
                  transition-colors">
                <Printer size={16} />
                <span className="text-[10px]
                  font-semibold">
                  Thermal
                </span>
              </button>
              <button
                onClick={handlePrintA4}
                className="flex flex-col
                  items-center gap-1 p-3
                  bg-[#161A1F] border
                  border-white/8 rounded-sm
                  text-gray-400 hover:text-white
                  transition-colors">
                <Receipt size={16} />
                <span className="text-[10px]
                  font-semibold">
                  PDF A4
                </span>
              </button>
              <button
                onClick={handleWhatsApp}
                disabled={!cart.partyPhone}
                className="flex flex-col
                  items-center gap-1 p-3
                  bg-[#161A1F] border
                  border-white/8 rounded-sm
                  text-gray-400 hover:text-white
                  disabled:opacity-40
                  transition-colors">
                <Share2 size={16} />
                <span className="text-[10px]
                  font-semibold">
                  WhatsApp
                </span>
              </button>
            </div>

            <button
              onClick={() => {
                setShowReceipt(false)
                searchRef.current?.focus()
              }}
              className="w-full py-3
                bg-[#60A5FA] text-black
                font-bold rounded-sm
                hover:brightness-110
                transition-all">
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── MEMOIZED SUB-COMPONENTS ──

const CartItemRow = memo(function CartItemRow({
  item, currency, onQtyChange,
  onPriceChange, onDiscountChange, onRemove,
}: {
  item: CartItem
  currency: string
  onQtyChange: (q: number) => void
  onPriceChange: (p: number) => void
  onDiscountChange: (t: any, v: number) => void
  onRemove: () => void
}) {
  const [showDiscount, setShowDiscount] =
    useState(false)
  const isOverStock =
    item.quantity > item.stockAvailable

  return (
    <div className={`
      border-b border-white/4 px-5 py-3
      ${isOverStock ? 'bg-red-500/5' : ''}
    `}>
      <div className="flex items-start
        gap-3">

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center
            gap-2">
            <p className="text-sm font-semibold
              text-white truncate">
              {item.name}
            </p>
            {item.priceTier &&
              item.priceTier !== 'retail' && (
              <span className="text-[9px]
                font-bold text-[#60A5FA]
                bg-[#60A5FA]/10 px-1.5
                rounded-sm">
                {item.priceTier.toUpperCase()}
              </span>
            )}
          </div>

          {/* Price edit */}
          <div className="flex items-center
            gap-2 mt-1">
            <span className="text-[10px]
              text-gray-600">
              Unit:
            </span>
            <input
              value={item.unitPrice}
              onChange={e =>
                onPriceChange(
                  parseFloat(e.target.value) || 0
                )}
              type="number"
              min="0"
              className="w-24 bg-[#0F1114]
                border border-white/8 text-xs
                text-[#60A5FA] font-mono
                px-2 py-1 rounded-sm outline-none
                focus:border-[#60A5FA]/40"
            />

            {/* Discount toggle */}
            <button
              onClick={() =>
                setShowDiscount(s => !s)}
              className={`
                flex items-center gap-1
                text-[10px] font-bold px-1.5
                py-1 rounded-sm transition-colors
                ${item.discountValue > 0
                  ? 'text-amber-400 bg-amber-400/10'
                  : 'text-gray-600 hover:text-gray-400'}
              `}>
              <Tag size={10} />
              {item.discountValue > 0
                ? `-${item.discountType ===
                    'percent'
                      ? item.discountValue + '%'
                      : formatCurrency(
                          item.discountValue,
                          currency
                        )}`
                : 'Disc'}
            </button>
          </div>

          {/* Discount controls */}
          {showDiscount && (
            <div className="flex items-center
              gap-2 mt-1.5">
              <button
                onClick={() =>
                  onDiscountChange(
                    item.discountType === 'percent'
                      ? 'fixed' : 'percent',
                    item.discountValue
                  )}
                className="text-[10px] text-gray-500
                  border border-white/8 px-2
                  py-0.5 rounded-sm">
                {item.discountType === 'percent'
                  ? '%' : 'PKR'}
              </button>
              <input
                value={item.discountValue}
                onChange={e =>
                  onDiscountChange(
                    item.discountType,
                    parseFloat(e.target.value) || 0
                  )}
                type="number"
                min="0"
                className="w-16 bg-[#0F1114]
                  border border-amber-500/30
                  text-amber-400 text-xs
                  px-2 py-0.5 rounded-sm outline-none"
              />
            </div>
          )}

          {/* Stock warning */}
          {isOverStock && (
            <p className="text-[10px]
              text-red-400 mt-1 flex
              items-center gap-1">
              <AlertTriangle size={10} />
              Only {item.stockAvailable}{' '}
              {item.unit} in stock
            </p>
          )}
        </div>

        {/* Qty + total */}
        <div className="flex flex-col
          items-end gap-2 flex-shrink-0">
          {/* Remove */}
          <button
            onClick={onRemove}
            className="text-gray-700
              hover:text-red-400 transition-colors">
            <X size={13} />
          </button>

          {/* Qty stepper */}
          <div className="flex items-center
            gap-1">
            <button
              onClick={() =>
                onQtyChange(item.quantity - 1)}
              className="w-6 h-6 flex items-center
                justify-center bg-[#161A1F]
                border border-white/8 rounded-sm
                text-gray-400 hover:text-white
                hover:border-white/20
                transition-all">
              <Minus size={10} />
            </button>
            <input
              value={item.quantity}
              onChange={e =>
                onQtyChange(
                  parseFloat(e.target.value) || 1
                )}
              type="number"
              min="0.1"
              step="0.1"
              className="w-14 text-center
                bg-[#0F1114] border border-white/8
                text-white text-sm font-bold
                py-0.5 outline-none rounded-sm"
            />
            <button
              onClick={() =>
                onQtyChange(item.quantity + 1)}
              className="w-6 h-6 flex items-center
                justify-center bg-[#161A1F]
                border border-white/8 rounded-sm
                text-gray-400 hover:text-white
                hover:border-white/20
                transition-all">
              <Plus size={10} />
            </button>
          </div>

          {/* Line total */}
          <p className="text-sm font-black
            text-white font-mono">
            {formatCurrency(
              item.lineTotal, currency
            )}
          </p>
        </div>
      </div>
    </div>
  )
})

const OrderTotals = memo(function OrderTotals({
  cart, currency, onDiscountChange,
}: {
  cart: POSCart
  currency: string
  onDiscountChange: (t: any, v: number) => void
}) {
  return (
    <div className="border-t border-white/6
      bg-[#0A0C0F] p-4 space-y-2
      flex-shrink-0">

      {/* Order discount */}
      <div className="flex items-center
        gap-2 pb-2 border-b border-white/6">
        <Tag size={12} className="text-gray-600" />
        <span className="text-[10px] text-gray-600
          flex-1">
          Order Discount
        </span>
        <button
          onClick={() =>
            onDiscountChange(
              cart.discountType === 'percent'
                ? 'fixed' : 'percent',
              cart.discountValue
            )}
          className="text-[10px] text-gray-600
            border border-white/8 px-2 py-0.5
            rounded-sm hover:border-white/15">
          {cart.discountType === 'percent'
            ? '%' : 'PKR'}
        </button>
        <input
          value={cart.discountValue}
          onChange={e =>
            onDiscountChange(
              cart.discountType,
              parseFloat(e.target.value) || 0
            )}
          type="number"
          min="0"
          className="w-20 bg-[#0F1114]
            border border-white/8 text-amber-400
            text-xs text-right px-2 py-1
            font-mono outline-none rounded-sm"
        />
      </div>

      {/* Totals */}
      <div className="space-y-1">
        <div className="flex justify-between
          text-xs text-gray-500">
          <span>Subtotal</span>
          <span className="font-mono">
            {formatCurrency(
              cart.subtotal, currency
            )}
          </span>
        </div>
        {cart.discountAmount > 0 && (
          <div className="flex justify-between
            text-xs text-amber-400">
            <span>Discount</span>
            <span className="font-mono">
              -{formatCurrency(
                cart.discountAmount, currency
              )}
            </span>
          </div>
        )}
        {cart.taxAmount > 0 && (
          <div className="flex justify-between
            text-xs text-gray-500">
            <span>Tax</span>
            <span className="font-mono">
              +{formatCurrency(
                cart.taxAmount, currency
              )}
            </span>
          </div>
        )}
        <div className="flex justify-between
          text-base font-black border-t
          border-white/6 pt-1.5">
          <span className="text-white">
            Total
          </span>
          <span className="text-[#60A5FA]
            font-mono">
            {formatCurrency(
              cart.grandTotal, currency
            )}
          </span>
        </div>
      </div>
    </div>
  )
})

const PartySelector = memo(
  function PartySelector({
    cart, onSelect, currency, profile,
  }: any) {
    const [search, setSearch] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [open, setOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
      if (!search.trim() || !profile?.id) {
        setResults([])
        return
      }
      const t = setTimeout(async () => {
        const { data } = await supabase
          .from('parties')
          .select(
            'id,name,phone,current_balance'
          )
          .eq('business_id', profile.id)
          .ilike('name', `%${search}%`)
          .limit(5)
        setResults(data || [])
      }, 200)
      return () => clearTimeout(t)
    }, [search, profile?.id])

    return (
      <div className="p-3 border-t
        border-white/6">
        {cart.partyId ? (
          <div className="flex items-center
            gap-2 p-2 bg-[#0F1114] border
            border-white/8 rounded-sm">
            <Users size={13}
              className="text-[#60A5FA]
                flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold
                text-white truncate">
                {cart.partyName}
              </p>
              {cart.partyBalance > 0 && (
                <p className="text-[10px]
                  text-amber-400">
                  Balance: {formatCurrency(
                    cart.partyBalance, currency
                  )}
                </p>
              )}
            </div>
            <button
              onClick={() =>
                onSelect(null)}
              className="text-gray-600
                hover:text-red-400">
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center
              gap-2 bg-[#0F1114] border
              border-white/8 rounded-sm
              px-2 py-2">
              <Users size={12}
                className="text-gray-600" />
              <input
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setOpen(true)
                }}
                onFocus={() => setOpen(true)}
                placeholder="Add customer (optional)"
                className="flex-1 bg-transparent
                  text-xs text-white outline-none
                  placeholder:text-gray-700"
              />
            </div>
            {open && results.length > 0 && (
              <div className="absolute bottom-full
                left-0 right-0 mb-1 bg-[#0F1114]
                border border-white/10 rounded-sm
                shadow-xl z-10">
                {results.map(party => (
                  <button
                    key={party.id}
                    onClick={() => {
                      onSelect(party)
                      setSearch('')
                      setOpen(false)
                    }}
                    className="w-full flex
                      items-center justify-between
                      px-3 py-2 hover:bg-white/5
                      transition-colors">
                    <div>
                      <p className="text-xs
                        font-semibold text-white
                        text-left">
                        {party.name}
                      </p>
                      <p className="text-[10px]
                        text-gray-600">
                        {party.phone}
                      </p>
                    </div>
                    {party.current_balance > 0 && (
                      <span className="text-[10px]
                        text-amber-400 font-mono">
                        {formatCurrency(
                          party.current_balance,
                          currency
                        )}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)
