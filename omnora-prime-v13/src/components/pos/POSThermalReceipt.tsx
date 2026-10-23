'use client'

import React, { useEffect, useRef } from 'react'
import { renderBarcodeToSVG } from '@/lib/barcode/barcodeEngine'

export interface POSThermalReceiptProps {
  invoice: any
  profile: any
  currency?: string
  cashierName?: string
  onClose?: () => void
  onPrint?: () => void
}

function fmt(amount: number | string | undefined | null, curr = 'Rs.'): string {
  const num = Number(amount) || 0
  return `${curr} ${num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function POSThermalReceipt({
  invoice,
  profile,
  currency = 'Rs.',
  cashierName = 'Terminal Operator',
}: POSThermalReceiptProps) {
  const barcodeRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (barcodeRef.current && invoice?.invoice_number) {
      renderBarcodeToSVG(barcodeRef.current, invoice.invoice_number, {
        width: 1.6,
        height: 38,
        fontSize: 9,
        margin: 2,
        displayValue: true,
      })
    }
  }, [invoice?.invoice_number])

  if (!invoice) return null

  const items = invoice.items || []
  const dateObj = invoice.createdAt ? new Date(invoice.createdAt) : new Date()
  const dateFormatted = dateObj.toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const timeFormatted = dateObj.toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  const totalItemsCount = items.length
  const totalQty = items.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 1), 0)
  const businessName = profile?.business_name || 'NOXIS RETAIL'
  const businessAddress = profile?.address || ''
  const businessPhone = profile?.phone || ''
  const ntn = profile?.ntn_number || (profile as any)?.ntn || ''
  const strn = profile?.strn_number || (profile as any)?.strn || ''

  const subtotal = invoice.subtotal ?? invoice.total_amount ?? 0
  const discount = invoice.discountAmount ?? 0
  const tax = invoice.taxAmount ?? 0
  const grandTotal = invoice.total_amount ?? invoice.grandTotal ?? 0
  const amountPaid = invoice.amount_paid ?? grandTotal
  const change = invoice.change ?? (amountPaid > grandTotal ? amountPaid - grandTotal : 0)
  const balanceDue = invoice.balance_due ?? (grandTotal > amountPaid ? grandTotal - amountPaid : 0)

  // Determine payment method label
  let paymentMethod = 'CASH'
  if (invoice.payments && invoice.payments.length > 0) {
    paymentMethod = invoice.payments.map((p: any) => p.method?.toUpperCase()).join(' / ')
  } else if (invoice.payment_method) {
    paymentMethod = String(invoice.payment_method).toUpperCase()
  }

  return (
    <>
      {/* Strict Print Isolation CSS */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: 80mm auto;
                margin: 0mm !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body * {
                visibility: hidden !important;
              }
              #pos-thermal-slip, #pos-thermal-slip * {
                visibility: visible !important;
              }
              #pos-thermal-slip {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 78mm !important;
                max-width: 78mm !important;
                margin: 0 auto !important;
                padding: 4mm 3mm 15mm 3mm !important;
                background: #ffffff !important;
                color: #000000 !important;
                font-family: 'Courier New', Courier, monospace, monospace !important;
                font-size: 11px !important;
                line-height: 1.35 !important;
                display: block !important;
                z-index: 99999999 !important;
                box-sizing: border-box !important;
              }
              .thermal-screen-only {
                display: none !important;
              }
            }
          `,
        }}
      />

      {/* POS Slip DOM Container (Visible both in Modal Preview & Isolated in Print) */}
      <div
        id="pos-thermal-slip"
        className="w-[300px] max-w-[300px] bg-white text-black p-4 rounded shadow-2xl font-mono text-[11px] leading-[1.35] select-text mx-auto"
        style={{ color: '#000000' }}
      >
        {/* HEADER */}
        <div className="text-center space-y-0.5 pb-2">
          <h2 className="text-sm font-black tracking-tight uppercase leading-snug">
            {businessName}
          </h2>
          {profile?.tagline && (
            <p className="text-[10px] text-zinc-600 italic">
              {profile.tagline}
            </p>
          )}
          {businessAddress && (
            <p className="text-[10px] leading-tight text-zinc-700">
              {businessAddress}
            </p>
          )}
          {businessPhone && (
            <p className="text-[10px] font-semibold text-zinc-800">
              Tel: {businessPhone}
            </p>
          )}
          {(ntn || strn) && (
            <p className="text-[9px] text-zinc-600">
              {ntn ? `NTN: ${ntn}` : ''} {strn ? `| STRN: ${strn}` : ''}
            </p>
          )}
        </div>

        {/* METADATA BAND */}
        <div className="border-t border-b border-dashed border-black py-1.5 my-1.5 space-y-0.5 text-[10px]">
          <div className="flex justify-between font-bold">
            <span>RECEIPT #:</span>
            <span className="text-[11px]">{invoice.invoice_number || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>DATE / TIME:</span>
            <span>{dateFormatted} {timeFormatted}</span>
          </div>
          <div className="flex justify-between">
            <span>CASHIER:</span>
            <span>{cashierName}</span>
          </div>
          {invoice.partyName && (
            <div className="flex justify-between font-semibold border-t border-dotted border-zinc-400 pt-0.5 mt-0.5">
              <span>CUSTOMER:</span>
              <span className="truncate max-w-[170px] text-right">
                {invoice.partyName}
                {invoice.partyPhone ? ` (${invoice.partyPhone})` : ''}
              </span>
            </div>
          )}
        </div>

        {/* ITEMS TABLE HEADER */}
        <div className="border-b border-black pb-1 mb-1 font-bold text-[10px] flex justify-between">
          <span className="w-[50%]">ITEM</span>
          <span className="w-[18%] text-center">QTY</span>
          <span className="w-[32%] text-right">TOTAL</span>
        </div>

        {/* ITEM ROWS */}
        <div className="space-y-1.5 py-1">
          {items.length === 0 ? (
            <div className="py-2 text-center text-zinc-500 italic">
              Standard POS Checkout Item
            </div>
          ) : (
            items.map((item: any, idx: number) => {
              const qty = Number(item.quantity) || 1
              const unitPrice = Number(item.unitPrice) || 0
              const lineTotal = Number(item.lineTotal) || qty * unitPrice
              const itemDisc = Number(item.discountAmount) || 0

              return (
                <div key={idx} className="space-y-0.5">
                  <div className="font-bold text-[11px] uppercase leading-tight">
                    {item.name || item.sku_code || 'Product Item'}
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-800">
                    <span className="text-zinc-600">
                      {qty} {item.unit || 'pcs'} × {unitPrice.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="font-semibold text-black">
                      {fmt(lineTotal, currency)}
                    </span>
                  </div>
                  {itemDisc > 0 && (
                    <div className="text-[9px] text-zinc-600 flex justify-between italic pl-2">
                      <span>Item Discount</span>
                      <span>-{fmt(itemDisc, currency)}</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* TOTALS SECTION */}
        <div className="border-t border-dashed border-black pt-1.5 mt-2 space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span>{fmt(subtotal, currency)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between font-medium">
              <span>DISCOUNT:</span>
              <span>-{fmt(discount, currency)}</span>
            </div>
          )}

          {tax > 0 && (
            <div className="flex justify-between">
              <span>TAX / GST:</span>
              <span>+{fmt(tax, currency)}</span>
            </div>
          )}

          {/* GRAND TOTAL DOUBLE LINE */}
          <div className="border-t-2 border-b-2 border-black py-1 my-1 flex justify-between items-center font-black text-xs">
            <span className="text-xs tracking-wider">NET TOTAL:</span>
            <span className="text-sm">{fmt(grandTotal, currency)}</span>
          </div>

          {/* PAYMENT DETAILS */}
          <div className="space-y-0.5 pt-0.5 text-[10px]">
            <div className="flex justify-between">
              <span>PAYMENT ({paymentMethod}):</span>
              <span className="font-semibold">{fmt(amountPaid, currency)}</span>
            </div>
            {change > 0 && (
              <div className="flex justify-between font-bold">
                <span>CHANGE TENDERED:</span>
                <span>{fmt(change, currency)}</span>
              </div>
            )}
            {balanceDue > 0 && (
              <div className="flex justify-between font-bold text-black border-t border-dotted border-zinc-400 pt-0.5">
                <span>BALANCE DUE (CREDIT):</span>
                <span>{fmt(balanceDue, currency)}</span>
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY COUNTS */}
        <div className="border-t border-dashed border-black pt-1.5 mt-2 text-[10px] flex justify-between text-zinc-700">
          <span>ITEMS: {totalItemsCount}</span>
          <span>TOTAL UNITS: {totalQty}</span>
        </div>

        {/* FOOTER & BARCODE */}
        <div className="pt-2.5 mt-1 text-center space-y-1.5">
          <div className="flex justify-center items-center py-1">
            <svg ref={barcodeRef} className="max-w-[210px] h-[40px] mx-auto block" />
          </div>

          <p className="text-[9px] text-zinc-700 uppercase leading-snug">
            Exchange within 7 days with original slip.
            <br />
            No cash returns. Damaged goods non-refundable.
          </p>

          <p className="text-[10px] font-bold tracking-wider pt-1 uppercase">
            *** THANK YOU FOR SHOPPING ***
          </p>

          <p className="text-[8px] text-zinc-500 pt-1 tracking-widest uppercase">
            NOXIS HUB INDUSTRIAL POS • OMNORA LABS
          </p>
        </div>

        {/* Bottom tear feed spacing for thermal printers */}
        <div className="h-6" />
      </div>
    </>
  )
}
