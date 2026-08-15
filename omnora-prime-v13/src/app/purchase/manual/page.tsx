// app/purchase/manual/page.tsx
"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, Upload, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { humanizeError } from '@/lib/utils/errors';

export default function ManualPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  const plan = searchParams.get('plan') || 'pro';
  const cycle = searchParams.get('cycle') || 'monthly';
  
  const PLANS = {
    lite: { name: 'Lite', pkr: 2500, annual: 25000 },
    pro: { name: 'Pro', pkr: 6500, annual: 65000 },
    elite: { name: 'Elite', pkr: 14000, annual: 140000 }
  };

  const amount = cycle === 'annual' ? PLANS[plan as keyof typeof PLANS].annual : PLANS[plan as keyof typeof PLANS].pkr;

  const [formData, setFormData] =  useState ({
    name: "",
    phone: "",
    email: "",
    bankRef: "",
    method: "HBL Transfer"
  });
  const [file, setFile] =  useState <File | null>(null);
  const [isSubmitting, setIsSubmitting] =  useState (false);
  const [isSuccess, setIsSuccess] =  useState (false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error('Please upload a payment screenshot before submitting.'); return; }
    setIsSubmitting(true);

    try {
      // 1. Upload Screenshot to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `manual_payments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('manual-payments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('manual-payments')
        .getPublicUrl(filePath);

      // 2. Insert Request
      const { error: insertError } = await supabase
        .from('manual_payment_requests')
        .insert({
          buyer_name: formData.name,
          buyer_phone: formData.phone,
          buyer_email: formData.email,
          plan: plan,
          billing_cycle: cycle,
          amount_pkr: amount,
          payment_method: formData.method,
          bank_ref: formData.bankRef,
          screenshot_url: publicUrl,
          status: 'pending'
        });

      if (insertError) throw insertError;

      setIsSuccess(true);
    } catch (error: any) {
      toast.error(humanizeError(error, 'submit payment'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-onyx min-h-screen flex items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md space-y-6">
          <CheckCircle2 size={64} className="text-emerald mx-auto" />
          <h1 className="text-3xl font-bold text-white tracking-tighter">Payment Under Review</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your manual payment request has been submitted successfully. 
            Our finance team will verify the transaction and generate your license key within 1-2 business hours.
          </p>
          <button onClick={() => router.push('/')} className="bg-electric-blue text-onyx px-8 py-3 font-bold uppercase tracking-widest text-[10px] rounded-sm">
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-onyx min-h-screen text-gray-300 font-inter pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white mb-8">
          <ArrowLeft size={14} className="mr-2" /> Back to Payment Selection
        </button>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Bank Details */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tighter mb-4">Manual Bank Transfer</h1>
              <p className="text-gray-500 text-sm">Transfer the exact amount to our business account and upload proof below.</p>
            </div>

            <div className="bg-surface border border-white/5 p-8 rounded-sm space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-electric-blue">
                  <Building2 size={24} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest">Business Bank Account</h4>
                  <p className="text-[10px] text-gray-500">Meezan Bank Limited (Pakistan)</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Title:</span>
                  <span className="text-white">NOXIS Labs (PVT) Ltd</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Number:</span>
                  <span className="text-white">1234-5678-9012</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">IBAN:</span>
                  <span className="text-white uppercase">PK00MEZN000001234567890</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-white/5">
                  <span className="text-gray-500">Amount to Pay:</span>
                  <span className="text-electric-blue font-bold text-lg">PKR {amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-sandstone-gold/10 border border-sandstone-gold/20 p-4 rounded-sm">
              <p className="text-[10px] text-sandstone-gold leading-relaxed">
                <strong>IMPORTANT:</strong> Ensure the bank reference or description includes your business name. 
                Keep the deposit slip safe until verification is complete.
              </p>
            </div>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleSubmit} className="bg-surface/50 border border-white/10 p-8 rounded-sm space-y-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Upload Proof of Payment</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your Name</label>
                    <input required className="w-full bg-onyx border border-white/10 p-3 text-sm focus:border-electric-blue outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
                    <input required className="w-full bg-onyx border border-white/10 p-3 text-sm focus:border-electric-blue outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                <input required type="email" className="w-full bg-onyx border border-white/10 p-3 text-sm focus:border-electric-blue outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bank Method</label>
                    <select className="w-full bg-onyx border border-white/10 p-3 text-sm focus:border-electric-blue outline-none" value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})}>
                       <option>HBL Transfer</option>
                       <option>Meezan Transfer</option>
                       <option>MCB Transfer</option>
                       <option>EasyPaisa Transfer</option>
                       <option>Other / Cash</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Txn Reference #</label>
                    <input required className="w-full bg-onyx border border-white/10 p-3 text-sm focus:border-electric-blue outline-none" placeholder="Slip / ID" value={formData.bankRef} onChange={e => setFormData({...formData, bankRef: e.target.value})} />
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Deposit Slip / Screenshot</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <div className={`w-full border-2 border-dashed p-8 rounded-sm text-center transition-all ${file ? 'border-emerald bg-emerald/5' : 'border-white/10 group-hover:border-white/20'}`}>
                    <Upload size={24} className={`mx-auto mb-2 ${file ? 'text-emerald' : 'text-gray-600'}`} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                      {file ? file.name : "Drag or Click to Upload Screenshot"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-electric-blue text-onyx py-5 font-bold uppercase tracking-widest text-xs flex items-center justify-center rounded-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Uploading...
                </>
              ) : "Submit Payment for Verification"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

