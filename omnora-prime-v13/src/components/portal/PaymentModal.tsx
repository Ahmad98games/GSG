"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Decimal } from 'decimal.js';
import { PersonaEngine } from '@/lib/persona/PersonaEngine';
import { createPaymentIntent } from '@/lib/actions/clientPortal';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    invoice_number: string;
    outstanding: number;
    business_name?: string;
  };
  portalId: string;
}

type PaymentMethod = 'stripe' | 'jazzcash' | 'easypaisa';

export default function PaymentModal({ isOpen, onClose, invoice, portalId }: PaymentModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [amount, setAmount] =  useState (invoice.outstanding.toString());
  const [method, setMethod] =  useState <PaymentMethod>('stripe');
  const [mobileNumber, setMobileNumber] =  useState ('');
  const [status, setStatus] =  useState <'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] =  useState <string | null>(null);

  const persona = PersonaEngine.currentPersona;
  const isSA = persona?.region === 'south_asian';
  const currency = persona?.currency || 'PKR';

  const validateAmount = () => {
    try {
      const val = new Decimal(amount);
      return val.gt(0) && val.lte(invoice.outstanding);
    } catch {
      return false;
    }
  };

  const handlePay = async () => {
    if (!validateAmount()) {
      setErrorMsg(`Please enter an amount between 0 and ${invoice.outstanding}`);
      return;
    }

    setStatus('processing');
    setErrorMsg(null);

    try {
      // 1. Create intent on server
      const intent = await createPaymentIntent({
        portalId,
        invoiceId: invoice.id,
        provider: method,
        amount: amount,
        currency: currency
      });

      // 2. Handle provider-specific flow
      if (method === 'stripe') {
        if (!stripe || !elements) return;
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        const { error, paymentIntent } = await stripe.confirmCardPayment(intent.providerIntentId!, {
          payment_method: {
            card: cardElement,
          },
        });

        if (error) {
          throw new Error(error.message);
        }
      } else {
        // JazzCash / EasyPaisa: Simulation of USSD/App push trigger
        // In real integration, this would call the respective provider's JS SDK 
        // or wait for a push notification confirmation.
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Payment failed. Please check your details and try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-onyx/90 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 250, damping: 30 }}
        className="w-full max-w-md bg-[#1A1D21] border border-white/10 shadow-2xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Settlement Gateway</h2>
            <div className="text-sm font-mono text-sandstone-gold font-bold">Ref: {invoice.invoice_number}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {status === 'success' ? (
          <div className="p-12 text-center flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20"
            >
              <CheckCircle2 size={40} />
            </motion.div>
            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Payment Received</h3>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mb-8">
              {PersonaEngine.formatCurrency(Number(amount))} settled successfully.
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-white text-onyx text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all"
            >
              Return to Portal
            </button>
          </div>
        ) : (
          <div className="p-8 space-y-8">
            {/* Amount Field */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Enter Amount ({currency})</label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-onyx border border-white/10 p-5 text-2xl font-mono text-right text-sandstone-gold font-bold focus:outline-none focus:border-electric-blue transition-colors"
                />
              </div>
            </div>

            {/* Provider Tabs */}
            <div className="space-y-4">
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => setMethod('stripe')}
                  className={`flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                    method === 'stripe' ? 'text-electric-blue border-b-2 border-electric-blue' : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  Card (Stripe)
                </button>
                {isSA && (
                  <>
                    <button
                      onClick={() => setMethod('jazzcash')}
                      className={`flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        method === 'jazzcash' ? 'text-electric-blue border-b-2 border-electric-blue' : 'text-gray-600 hover:text-gray-400'
                      }`}
                    >
                      JazzCash
                    </button>
                    <button
                      onClick={() => setMethod('easypaisa')}
                      className={`flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        method === 'easypaisa' ? 'text-electric-blue border-b-2 border-electric-blue' : 'text-gray-600 hover:text-gray-400'
                      }`}
                    >
                      EasyPaisa
                    </button>
                  </>
                )}
              </div>

              {/* Dynamic Forms */}
              <div className="min-h-[100px] flex items-center">
                {method === 'stripe' ? (
                  <div className="w-full p-4 bg-black/20 border border-white/5">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '14px',
                            color: '#fff',
                            '::placeholder': { color: '#4b5563' },
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full space-y-3">
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                      <input
                        type="text"
                        placeholder="03XX-XXXXXXX"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full bg-onyx border border-white/10 pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-electric-blue"
                      />
                    </div>
                    <p className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">
                      A payment request will be sent to your mobile device.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-start space-x-3 text-red-500 bg-red-500/10 p-4 border border-red-500/20">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="text-[10px] font-bold uppercase tracking-wide leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handlePay}
              disabled={status === 'processing'}
              className="w-full py-5 bg-electric-blue text-onyx text-xs font-black uppercase tracking-[0.3em] hover:bg-blue-400 transition-all disabled:opacity-50 flex items-center justify-center space-x-3"
            >
              {status === 'processing' ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Pay {PersonaEngine.formatCurrency(Number(amount))}</span>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

