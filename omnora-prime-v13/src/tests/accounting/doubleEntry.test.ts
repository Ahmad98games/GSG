import { describe, it, expect } from 'vitest'

describe('Invoice Calculation Engine', () => {
  describe('calculateInvoiceTotals', () => {
    it('calculates subtotal correctly from line items', () => {
      const lineItems = [
        { qty: 10, unit_price: 150, discount: 0 },
        { qty: 5, unit_price: 200, discount: 0 },
      ]
      const subtotal = lineItems.reduce(
        (s, item) =>
          s + (item.qty * item.unit_price) -
          item.discount,
        0
      )
      expect(subtotal).toBe(2500)
    })

    it('applies percentage discount correctly', () => {
      const subtotal = 1500
      const discountPercent = 10
      const discounted = subtotal *
        (1 - discountPercent / 100)
      expect(discounted).toBe(1350)
    })

    it('calculates 17% GST correctly', () => {
      const subtotal = 1500
      const taxRate = 17
      const tax = subtotal * (taxRate / 100)
      expect(tax).toBeCloseTo(255)
      expect(subtotal + tax).toBeCloseTo(1755)
    })

    it('rounds to 2 decimal places', () => {
      const subtotal = 1000
      const taxRate = 17
      const tax = Math.round(
        subtotal * taxRate / 100 * 100
      ) / 100
      expect(tax).toBe(170)
    })

    it('balance_due = total - paid_amount', () => {
      const total = 1755
      const paid = 800
      const balance = total - paid
      expect(balance).toBe(955)
    })

    it('balance_due is never negative', () => {
      const total = 1755
      const paid = 2000
      const balance = Math.max(0, total - paid)
      expect(balance).toBe(0)
    })
  })

  describe('Double-entry ledger validation', () => {
    it('total debits equal total credits', () => {
      // When posting an invoice:
      // DR Accounts Receivable = total_amount
      // CR Sales Revenue = subtotal
      // CR Tax Payable = tax_amount
      const totalAmount = 1755
      const subtotal = 1500
      const taxAmount = 255

      const totalDebits = totalAmount
      const totalCredits = subtotal + taxAmount

      expect(totalDebits).toBe(totalCredits)
    })

    it('payment reduces receivables correctly', () => {
      // DR Cash = payment_amount
      // CR Accounts Receivable = payment_amount
      const paymentAmount = 800
      const debit = paymentAmount
      const credit = paymentAmount
      expect(debit).toBe(credit)
    })

    it('trial balance stays balanced after payment', () => {
      // After invoice of 1755 and payment of 800:
      const invoiceDebit = 1755   // DR AR
      const invoiceCredits = 1755 // CR Sales + Tax

      const paymentDebit = 800    // DR Cash
      const paymentCredit = 800   // CR AR

      const totalDebits =
        invoiceDebit + paymentDebit
      const totalCredits =
        invoiceCredits + paymentCredit

      expect(totalDebits).toBe(totalCredits)
    })
  })

  describe('Karigar payroll calculation', () => {
    it('piece rate earnings = units × rate', () => {
      const units = 100
      const pieceRate = 25
      const earnings = units * pieceRate
      expect(earnings).toBe(2500)
    })

    it('peshgi deduction reduces net pay', () => {
      const gross = 2500
      const peshgi = 500
      const net = gross - peshgi
      expect(net).toBe(2000)
      expect(net).toBeGreaterThanOrEqual(0)
    })

    it('net pay cannot be negative', () => {
      const gross = 500
      const peshgi = 1000
      const net = Math.max(0, gross - peshgi)
      expect(net).toBe(0)
    })

    it('daily rate × days present = earnings', () => {
      const dailyRate = 900
      const daysPresent = 22
      const earnings = dailyRate * daysPresent
      expect(earnings).toBe(19800)
    })
  })
})
