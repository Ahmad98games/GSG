"use client";
import { useEffect, useState } from 'react';
import React from 'react';
// app/admin/payments/page.tsx
import { 
  ShieldCheck, AlertCircle, CheckCircle2, XCircle, 
  Search, ExternalLink, Calendar, Phone, Mail, Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminPaymentsPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

   useEffect (() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('manual_payment_requests')
      .select('*')
      .eq('status', filter)
      .order('created_at', { ascending: false });

    if (data) setRequests(data);
    setLoading(false);
  };

  const handleVerify = async (request: any) => {
    if (!confirm("Verify this payment and generate license?")) return;
    setProcessingId(request.id);

    try {
      // 1. Generate License via Edge Function
      const { data: licenseData, error: licenseError } = await supabase.functions.invoke('generate-license', {
        body: {
          tier: request.plan,
          businessName: request.buyer_name,
          email: request.buyer_email,
          country: 'PK',
          billingCycle: request.billing_cycle
        }
      });

      if (licenseError || !licenseData?.licenseKey) throw new Error("License generation failed");

      // 2. Update Request status
      const { error: updateError } = await supabase
        .from('manual_payment_requests')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          license_key: licenseData.licenseKey,
          verified_by: 'admin' // In production, get current user ID
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // 3. Insert into license_payments
      const { data: licenseObj } = await supabase.from('licenses').select('id').eq('license_key', licenseData.licenseKey).single();
      
      await supabase.from('license_payments').insert({
        gateway: 'manual',
        license_id: licenseObj?.id,
        amount_pkr: request.amount_pkr,
        currency: 'PKR',
        status: 'completed',
        buyer_phone: request.buyer_phone,
        buyer_email: request.buyer_email,
        plan: request.plan,
        billing_cycle: request.billing_cycle,
        completed_at: new Date().toISOString()
      });

      alert("Payment verified and license generated!");
      fetchRequests();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    const { error } = await supabase
      .from('manual_payment_requests')
      .update({ status: 'rejected', notes: reason })
      .eq('id', id);

    if (error) alert(error.message);
    else fetchRequests();
  };

  return (
    <div className="bg-onyx min-h-screen text-gray-300 font-inter p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter mb-2">Payment Verification</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Internal Treasury Operations Center</p>
          </div>
          <div className="flex bg-surface p-1 rounded-sm border border-white/5">
            {['pending', 'verified', 'rejected'].map(s => (
              <button 
                key={s} 
                onClick={() => setFilter(s)}
                className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${filter === s ? 'bg-onyx text-white shadow-xl' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
             <Loader2 size={32} className="text-electric-blue animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-surface/30 border border-white/5 p-20 rounded-sm text-center">
             <ShieldCheck size={48} className="text-gray-700 mx-auto mb-4" />
             <p className="text-gray-500 text-sm uppercase tracking-widest font-bold">No {filter} requests found</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map(req => (
              <div key={req.id} className="bg-surface border border-white/10 rounded-sm overflow-hidden grid md:grid-cols-4">
                 {/* Left: Info */}
                 <div className="p-8 border-r border-white/5 space-y-6">
                    <div>
                       <h4 className="text-lg font-bold text-white">{req.buyer_name}</h4>
                       <p className="text-[10px] text-electric-blue font-black uppercase tracking-widest">{req.plan} Plan - {req.billing_cycle}</p>
                    </div>
                    <div className="space-y-3">
                       <div className="flex items-center space-x-3 text-[11px]">
                          <Mail size={14} className="text-gray-500" />
                          <span>{req.buyer_email}</span>
                       </div>
                       <div className="flex items-center space-x-3 text-[11px]">
                          <Phone size={14} className="text-gray-500" />
                          <span>{req.buyer_phone}</span>
                       </div>
                       <div className="flex items-center space-x-3 text-[11px]">
                          <Calendar size={14} className="text-gray-500" />
                          <span>{new Date(req.created_at).toLocaleString()}</span>
                       </div>
                    </div>
                 </div>

                 {/* Middle: Payment Details */}
                 <div className="p-8 border-r border-white/5 bg-onyx/20 space-y-6">
                    <div className="space-y-1">
                       <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Transaction Reference</p>
                       <p className="text-sm font-mono text-white">{req.bank_ref || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Payment Method</p>
                       <p className="text-sm text-white">{req.payment_method}</p>
                    </div>
                    <div className="pt-4 border-t border-white/5">
                       <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Amount PKR</p>
                       <p className="text-2xl font-bold text-white tracking-tighter">Rs. {req.amount_pkr.toLocaleString()}</p>
                    </div>
                 </div>

                 {/* Middle: Proof */}
                 <div className="p-8 border-r border-white/5 flex flex-col justify-center items-center">
                    {req.screenshot_url ? (
                      <a href={req.screenshot_url} target="_blank" rel="noopener noreferrer" className="group relative">
                        <img src={req.screenshot_url} alt="Proof" className="w-full h-32 object-cover rounded-sm border border-white/10 group-hover:brightness-50 transition-all" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                           <ExternalLink size={20} className="text-white" />
                        </div>
                        <p className="text-[8px] text-center mt-2 text-gray-600 uppercase tracking-widest">Click to Expand Proof</p>
                      </a>
                    ) : (
                      <div className="w-full h-32 bg-white/5 rounded-sm flex items-center justify-center border border-dashed border-white/10">
                         <AlertCircle size={20} className="text-gray-700" />
                      </div>
                    )}
                 </div>

                 {/* Right: Actions */}
                 <div className="p-8 flex flex-col justify-center space-y-3">
                    {filter === 'pending' ? (
                      <>
                        <button 
                          onClick={() => handleVerify(req)}
                          disabled={processingId === req.id}
                          className="w-full bg-emerald text-onyx py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center rounded-sm hover:brightness-110 disabled:opacity-50"
                        >
                          {processingId === req.id ? <Loader2 size={14} className="animate-spin" /> : (
                            <><CheckCircle2 size={14} className="mr-2" /> Verify & Activate</>
                          )}
                        </button>
                        <button 
                          onClick={() => handleReject(req.id)}
                          className="w-full border border-red-500/50 text-red-500 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center rounded-sm hover:bg-red-500/5"
                        >
                          <XCircle size={14} className="mr-2" /> Reject Request
                        </button>
                      </>
                    ) : filter === 'verified' ? (
                      <div className="space-y-2">
                        <div className="flex items-center text-emerald space-x-2">
                           <CheckCircle2 size={16} />
                           <span className="text-[10px] font-bold uppercase">Verified</span>
                        </div>
                        <p className="text-[10px] text-gray-600 font-mono break-all">{req.license_key}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center text-red-500 space-x-2">
                           <XCircle size={16} />
                           <span className="text-[10px] font-bold uppercase">Rejected</span>
                        </div>
                        <p className="text-[10px] text-gray-600 italic">"{req.notes}"</p>
                      </div>
                    )}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

