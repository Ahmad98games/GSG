"use client";

import React, { useState, useMemo } from "react";
import { useIndustryConfig } from "@/hooks/useIndustryConfig";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { numberToWords } from "@/utils/NumberToWords";
import Decimal from "decimal.js";
import { WhatsAppSender, WhatsAppTemplates } from "@/lib/whatsapp/WhatsAppSender";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { generatePayslipPDF } from "@/lib/payroll/generatePayslip";
import { 
  CreditCard, Download, MessageCircle, 
  Printer, CheckCircle2, AlertTriangle, 
  History, Building2, User, Clock, 
  ArrowLeft, ChevronRight, DollarSign,
  Users, Briefcase, FileText, Lock,
  FileSpreadsheet, X, Calculator
} from "lucide-react";

// --- Components ---

const Badge = ({ children, variant = "default" }: any) => {
  const styles: any = {
    default: "bg-white/5 text-gray-400 border border-white/10",
    emerald: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    red: "bg-red-500/10 text-red-500 border border-red-500/20",
    blue: "bg-blue-500/10 text-[#0070F3] border border-[#0070F3]/20", // Electric Blue
    gold: "bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20"
  };
  return (
    <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-[2px]", styles[variant])}>
      {children}
    </span>
  );
};

// --- Page Component ---

export default function PayrollPeriodDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, features, fmt } = useIndustryConfig();
  const { profile } = useBusinessProfile();
  const businessId = profile?.id;
  const supabase = createClient();
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const periodId = params.periodId as string;
  const [selectedSlip, setSelectedSlip] = useState<any>(null);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

  const handleSendAllWhatsApp = async () => {
    if (!slips || slips.length === 0) return;
    if (!confirm(`Are you sure you want to send slips to all ${slips.length} workers via WhatsApp?`)) return;
    
    setSendingWhatsApp(true);
    let sentCount = 0;
    try {
      for (const slip of slips) {
        if (slip.karigar?.phone) {
          const message = WhatsAppTemplates.payslip(
            business?.business_name || 'Business',
            slip.karigar.name,
            period?.period_label || 'Current Period',
            fmt(slip.gross_earning),
            fmt(slip.total_deductions),
            fmt(slip.net_payable)
          );
          
          await WhatsAppSender.send({ phone: slip.karigar.phone, message }, profile?.tier || 'starter', supabase);
          sentCount++;
        }
      }
      toast.success('Broadcast Complete', `Successfully dispatched ${sentCount} payslips via WhatsApp.`);
    } catch (err: any) {
      console.error(err);
      toast.error('Broadcast Failed', 'An error occurred while dispatching WhatsApp messages.');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const handleFinalizeSlip = async (slipId: string) => {
    try {
      const { error } = await supabase
        .from('payroll_slips')
        .update({ is_finalized: true })
        .eq('id', slipId);
      if (error) throw error;
      toast.success('Slip Finalized', 'Payslip has been marked as paid/finalized.');
      queryClient.invalidateQueries({ queryKey: ['payroll_slips', periodId] });
    } catch (err: any) {
      console.error(err);
      toast.error('Update Failed', 'Failed to finalize the payslip.');
    }
  };

  const handleWhatsAppSlip = (slip: any) => {
    if (!slip.karigar?.phone) return;
    
    const message = WhatsAppTemplates.payslip(
      business?.business_name || 'Business',
      slip.karigar.name,
      period?.period_label || 'Current Period',
      fmt(slip.gross_earning),
      fmt(slip.total_deductions),
      fmt(slip.net_payable)
    );
    
    WhatsAppSender.send({ phone: slip.karigar.phone, message }, profile?.tier || 'starter', supabase);
  };

  const handleLockPeriod = async () => {
    if (!confirm("Are you sure you want to lock this payroll period? This will finalize all slips and prevent further modifications.")) return;
    
    try {
      // 1. Update period status
      const { error: periodError } = await supabase
        .from('payroll_periods')
        .update({ status: 'locked' })
        .eq('id', periodId);
      
      if (periodError) throw periodError;

      // 2. Fetch all slips in the locked period to know advance deductions
      const { data: currentSlips, error: fetchError } = await supabase
        .from('payroll_slips')
        .select('karigar_id, advance_deduction')
        .eq('period_id', periodId);

      if (fetchError) throw fetchError;

      // 3. Finalize all slips
      const { error: slipsError } = await supabase
        .from('payroll_slips')
        .update({ is_finalized: true })
        .eq('period_id', periodId);

      if (slipsError) throw slipsError;

      // 4. Deduct advance from Karigar outstanding balance
      if (currentSlips && currentSlips.length > 0) {
        for (const slip of currentSlips) {
          if (slip.advance_deduction && Number(slip.advance_deduction) > 0) {
            // Fetch the karigar's current advance
            const { data: karigar, error: karigarFetchErr } = await supabase
              .from('karigars')
              .select('current_advance')
              .eq('id', slip.karigar_id)
              .single();
            
            if (karigarFetchErr) throw karigarFetchErr;

            const newAdvance = Math.max(0, Number(karigar.current_advance || 0) - Number(slip.advance_deduction));
            
            const { error: karigarUpdateErr } = await supabase
              .from('karigars')
              .update({ current_advance: newAdvance })
              .eq('id', slip.karigar_id);

            if (karigarUpdateErr) throw karigarUpdateErr;
          }
        }
      }

      router.refresh();
      alert("Payroll period locked successfully.");
    } catch (err: any) {
      alert("Failed to lock period: " + err.message);
    }
  };

  // Queries
  const { data: period, isLoading: periodLoading } = useQuery({
    queryKey: ['payroll_period', periodId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('id', periodId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const { data: slips, isLoading: slipsLoading } = useQuery({
    queryKey: ['payroll_slips', periodId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_slips')
        .select('*, karigar:karigars(*)')
        .eq('period_id', periodId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!period
  });

  const { data: business } = useQuery({
    queryKey: ['business_profile', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', businessId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!businessId
  });

  // Logic
  const totals = useMemo(() => {
    if (!slips) return { workers: 0, gross: new Decimal(0), net: new Decimal(0) };
    return slips.reduce((acc: any, slip: any) => ({
      workers: acc.workers + 1,
      gross: acc.gross.plus(slip.gross_earning || 0),
      net: acc.net.plus(slip.net_payable || 0)
    }), { workers: 0, gross: new Decimal(0), net: new Decimal(0) });
  }, [slips]);

  if (periodLoading) return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">
      Processing Payroll Matrix...
    </div>
  );

  if (!period) return (
    <div className="min-h-screen bg-[#0F1113] flex flex-col items-center justify-center space-y-4">
      <AlertTriangle className="text-red-500" size={48} />
      <h1 className="text-white uppercase font-black tracking-widest">Period Not Found</h1>
      <button onClick={() => router.back()} className="text-[10px] text-gray-500 hover:text-white uppercase font-black tracking-widest border border-white/10 px-6 py-2 transition-all">Return to Registry</button>
    </div>
  );

   const handleExportCSV = () => {
      try {
        if (!slips || slips.length === 0) return alert("No data to export.");
        
        const headers = ["Worker", "Code", "Wage Type", "Gross Earning", "Advance Deduction", "Net Payable", "Status"];
        const rows = slips.map((s: any) => [
          `"${s.karigar?.name}"`,
          `"${s.karigar?.karigar_code}"`,
          `"${s.karigar?.wage_type}"`,
          s.gross_earning,
          s.advance_deduction,
          s.net_payable,
          s.is_finalized ? 'Paid' : 'Calculated'
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Payroll_Export_${period.period_label.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        alert("Export failed. Please check browser permissions.");
      }
   };

    const handlePrintAllSlips = () => {
      window.print();
   };

   const handleDownloadA5PDF = (slip: any) => {
      try {
         const otherDeductions = Number(
           (slip.total_deductions || 0) - (slip.advance_deduction || 0)
         );
         generatePayslipPDF({
           businessName: business?.business_name || 'Noxis Hub',
           businessCity: business?.city || '',
           karigarName: slip.karigar?.name || '—',
           karigarCode: slip.karigar?.karigar_code || '—',
           wageType: slip.karigar?.wage_type || 'monthly_salary',
           periodLabel: period?.period_label || '',
           daysPresent: slip.days_present || 0,
           totalDays: 26,
           unitsProduced: slip.piece_rate_earning > 0 ? undefined : undefined,
           pieceRate: slip.karigar?.piece_rate,
           grossEarnings: Number(slip.gross_earning || 0),
           peshgiDeduction: Number(slip.advance_deduction || 0),
           otherDeductions: otherDeductions > 0 ? otherDeductions : 0,
           netPay: Number(slip.net_payable || 0),
           currency: business?.currency || 'PKR',
         });
         toast.success('PDF Generated', `Payslip for ${slip.karigar?.name} downloaded successfully.`);
      } catch (err: any) {
         console.error(err);
         toast.error('Generation Failed', 'Could not generate PDF payslip.');
      }
   };

   const handleDownloadAllPayslips = () => {
      if (!slips || slips.length === 0) {
        toast.info('No Data', 'There are no payslips in this period.');
        return;
      }
      slips.forEach((slip: any, index: number) => {
        setTimeout(() => {
          const otherDeductions = Number(
            (slip.total_deductions || 0) - (slip.advance_deduction || 0)
          );
          generatePayslipPDF({
            businessName: business?.business_name || 'Noxis Hub',
            businessCity: business?.city || '',
            karigarName: slip.karigar?.name || '—',
            karigarCode: slip.karigar?.karigar_code || '—',
            wageType: slip.karigar?.wage_type || 'monthly_salary',
            periodLabel: period?.period_label || '',
            daysPresent: slip.days_present || 0,
            totalDays: 26,
            pieceRate: slip.karigar?.piece_rate,
            grossEarnings: Number(slip.gross_earning || 0),
            peshgiDeduction: Number(slip.advance_deduction || 0),
            otherDeductions: otherDeductions > 0 ? otherDeductions : 0,
            netPay: Number(slip.net_payable || 0),
            currency: business?.currency || 'PKR',
          });
        }, index * 300);
      });
      toast.success('Bulk PDF', `Downloading ${slips.length} payslips — check your downloads folder.`);
   };

   const handleDownloadSlip = (slip: any) => {
      handleDownloadA5PDF(slip);
   };

   const handleExportBankTransferCSV = async () => {
      try {
         if (!slips || slips.length === 0) {
            toast.info("No Data", "There are no payslips in this payroll period.");
            return;
         }
         
         const rows = slips.map((s: any) => ({
            'Account Title': s.karigar?.name || '—',
            'IBAN / Account Number': s.karigar?.bank_account || '',
            'Amount': s.net_payable || 0,
            'Currency': 'PKR',
            'Purpose': `Salary ${new Date().toLocaleString('en-PK', { month: 'long', year: 'numeric' })}`,
            'Reference': s.karigar?.karigar_code || '',
         }));

         const ws = XLSX.utils.json_to_sheet(rows);
         const wb = XLSX.utils.book_new();
         XLSX.utils.book_append_sheet(wb, ws, "Bank Transfer");
         XLSX.writeFile(wb, `bulk_bank_transfer_${period.period_label.replace(/\s+/g, '_')}.xlsx`);
         toast.success("Bank Transfer Export", "Bulk bank transfer file successfully generated.");
      } catch (err: any) {
         console.error(err);
         toast.error("Export Failed", "Could not generate bulk bank transfer sheet.");
      }
   };

   return (
     <div className="min-h-screen bg-noxis-bg text-slate-200 font-inter">
       
       {/* PDF Print Styling */}
       <style dangerouslySetInnerHTML={{ __html: `
         @media print {
           body * { visibility: hidden; }
           .print-container, .print-container * { visibility: visible; }
           .print-container { position: absolute; left: 0; top: 0; width: 100%; }
           .no-print { display: none !important; }
           .page-break { page-break-after: always; }
         }
       `}} />
       
       <main className="transition-all duration-300 min-h-screen flex flex-col">
         <header className="h-16 border-b border-noxis-border flex items-center px-8 bg-noxis-bg/50 backdrop-blur-md sticky top-0 z-40 no-print">
            <button onClick={() => router.back()} className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors mr-8 group">
               <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Personnel Hub</span>
            </button>
            <div className="h-4 w-px bg-noxis-border mx-4" />
            <div className="flex flex-col">
               <h1 className="text-xs font-black uppercase tracking-widest text-white">{period.period_label}</h1>
               <p className="text-[8px] text-gray-500 font-black uppercase tracking-tighter mt-0.5">{period.period_start} — {period.period_end}</p>
            </div>
            
            <div className="ml-auto flex items-center space-x-3">
               <div className="flex bg-white/5 border border-noxis-border rounded-sm">
                  <button 
                     onClick={handleExportBankTransferCSV}
                     className="flex items-center space-x-2 px-4 py-2 text-[10px] uppercase font-black tracking-widest border-r border-noxis-border hover:bg-white/5 transition-all"
                     title="Download bulk bank transfer sheet"
                  >
                     <CreditCard size={12} />
                     <span>Bank Transfer</span>
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    className="flex items-center space-x-2 px-4 py-2 text-[10px] uppercase font-black tracking-widest border-r border-noxis-border hover:bg-white/5 transition-all"
                  >
                     <FileSpreadsheet size={12} />
                     <span>CSV</span>
                  </button>
                   <button 
                     onClick={handleDownloadAllPayslips}
                     className="flex items-center space-x-2 px-4 py-2 text-[10px] uppercase font-black tracking-widest hover:bg-white/5 transition-all"
                     title="Download all payslips as individual PDFs"
                   >
                      <Download size={12} />
                      <span>All PDFs</span>
                   </button>
               </div>
               <button 
                 onClick={handleSendAllWhatsApp}
                 disabled={sendingWhatsApp || !slips || slips.length === 0}
                 className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-4 py-2 text-[10px] uppercase font-black tracking-widest border border-noxis-border transition-all disabled:opacity-30"
               >
                  <MessageCircle size={12} className="text-noxis-accent" />
                  <span>{sendingWhatsApp ? 'Sending...' : 'Send All via WhatsApp'}</span>
               </button>
               <button 
                 onClick={handleLockPeriod}
                 disabled={period.status === 'locked'}
                 className="flex items-center space-x-2 bg-noxis-accent hover:brightness-110 px-6 py-2 text-[10px] uppercase font-black tracking-widest text-black transition-all shadow-lg shadow-noxis-accent/10 disabled:opacity-50 disabled:grayscale"
               >
                  <Lock size={12} />
                  <span>{period.status === 'locked' ? 'Locked' : 'Lock Period'}</span>
               </button>
            </div>
         </header>

         <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
            {/* SUMMARY CARDS */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-noxis-surface border border-noxis-border p-6 space-y-4">
                  <div className="flex justify-between items-start">
                     <div className="p-2 bg-white/5 text-gray-600"><Users size={20} /></div>
                     <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Total Workers</p>
                  </div>
                  <h4 className="text-2xl font-black font-mono tracking-tighter text-white">{totals.workers}</h4>
               </div>
               <div className="bg-noxis-surface border border-noxis-border p-6 space-y-4">
                  <div className="flex justify-between items-start">
                     <div className="p-2 bg-white/5 text-gray-600"><Calculator size={20} /></div>
                     <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Gross Disbursement</p>
                  </div>
                  <h4 className="text-2xl font-black font-mono tracking-tighter text-sandstone-gold">{fmt(totals.gross.toNumber())}</h4>
               </div>
               <div className="bg-noxis-surface border border-noxis-border p-6 space-y-4">
                  <div className="flex justify-between items-start">
                     <div className="p-2 bg-white/5 text-gray-600"><DollarSign size={20} /></div>
                     <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Net Payable</p>
                  </div>
                  <h4 className="text-2xl font-black font-mono tracking-tighter text-emerald-500">{fmt(totals.net.toNumber())}</h4>
               </div>
               <div className="bg-noxis-accent/5 border border-noxis-accent/10 p-6 flex flex-col justify-center text-center">
                  <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">Period Status</p>
                  <Badge variant={period.status === 'locked' ? 'emerald' : 'amber'}>{period.status}</Badge>
               </div>
            </section>

            {/* PAYSLIPS TABLE */}
            <div className="bg-noxis-surface border border-noxis-border flex flex-col overflow-hidden">
               <div className="p-6 border-b border-noxis-border flex items-center justify-between">
                  <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Personnel Disbursement Table</h3>
                  <div className="flex items-center space-x-2">
                     <History size={14} className="text-gray-700" />
                     <span className="text-[9px] uppercase font-black text-gray-700 tracking-widest">Auto-reconciliation active</span>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="text-[9px] uppercase font-black text-gray-600 tracking-[0.2em] border-b border-noxis-border">
                           <th className="p-4">{t.worker}</th>
                           <th className="p-4">Wage Type</th>
                           <th className="p-4 text-right">Gross Earnings</th>
                           {features.peshgiAdvances && <th className="p-4 text-right">{`${t.advance} Recovery`}</th>}
                           <th className="p-4 text-right">Net Payable</th>
                           <th className="p-4 text-center">Status</th>
                           <th className="p-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="text-[11px]">
                        {slips?.map((slip: any) => (
                          <tr key={slip.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors group">
                             <td className="p-4">
                                <div className="flex items-center space-x-3">
                                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-black text-[10px] text-sandstone-gold">
                                      {slip.karigar?.name.split(' ').map((n: string) => n[0]).join('')}
                                   </div>
                                   <div>
                                      <p className="font-bold text-white uppercase tracking-tight">{slip.karigar?.name}</p>
                                      <p className="text-[8px] text-gray-500 font-mono">{slip.karigar?.karigar_code}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="p-4">
                                <Badge variant="blue">{slip.karigar?.wage_type.replace('_', ' ')}</Badge>
                             </td>
                             <td className="p-4 text-right font-mono font-bold text-white">{fmt(slip.gross_earning)}</td>
                             {features.peshgiAdvances && (
                               <td className="p-4 text-right font-mono font-bold text-red-500">-{fmt(slip.advance_deduction)}</td>
                             )}
                             <td className="p-4 text-right font-mono font-black text-sandstone-gold">{fmt(slip.net_payable)}</td>
                             <td className="p-4 text-center">
                                <Badge variant={slip.is_finalized ? 'emerald' : 'amber'}>
                                   {slip.is_finalized ? 'paid' : 'calculated'}
                                </Badge>
                             </td>
                             <td className="p-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                   <button 
                                     onClick={() => handleWhatsAppSlip(slip)}
                                     disabled={!slip.karigar?.phone}
                                     className="p-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-sm transition-all disabled:opacity-20"
                                     title="Send via WhatsApp"
                                   >
                                      <MessageCircle size={14} />
                                   </button>
                                   <button onClick={() => setSelectedSlip(slip)} className="p-2 bg-white/5 hover:bg-white/10 rounded-sm transition-all text-gray-400 hover:text-white">
                                      <FileText size={14} />
                                   </button>
                                   <button 
                                     onClick={() => handleDownloadSlip(slip)}
                                     className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#60A5FA]/5 border border-[#60A5FA]/20 text-[#60A5FA] hover:bg-[#60A5FA]/15 rounded-sm transition-all text-[9px] font-black uppercase tracking-widest"
                                     title="Download PDF Payslip"
                                   >
                                      <Download size={11} />
                                      <span>PDF Slip</span>
                                   </button>
                                   <button 
                                     onClick={() => handleFinalizeSlip(slip.id)}
                                     disabled={slip.is_finalized}
                                     className="p-2 bg-white/5 hover:bg-emerald-500 hover:text-black rounded-sm transition-all text-gray-400 disabled:opacity-30"
                                     title="Mark Paid/Finalize Slip"
                                   >
                                      <CheckCircle2 size={14} />
                                   </button>
                                </div>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

        {/* PAYSLIP MODAL */}
        <AnimatePresence>
          {selectedSlip && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="bg-white text-black w-full max-w-[800px] h-[90vh] overflow-y-auto relative flex flex-col"
               >
                  {/* Close Button (Hidden in Print) */}
                  <button 
                    onClick={() => setSelectedSlip(null)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black transition-colors print:hidden"
                  >
                    <X size={24} />
                  </button>

                  <div className="p-12 flex-1">
                     {/* Letterhead */}
                     <div className="flex justify-between items-start mb-12 border-b-4 border-black pb-8">
                        <div>
                           <h2 className="text-2xl font-black uppercase tracking-tighter">{business?.business_name || 'Noxis Industrial Hub'}</h2>
                           <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Personnel Disbursement Receipt</p>
                        </div>
                        <div className="text-right">
                           <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-200">PAYSLIP</h1>
                           <p className="text-[10px] font-mono font-black mt-2 text-black">{period.period_label}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-12 mb-12">
                        <div className="space-y-4">
                           <p className="text-[9px] uppercase font-black text-gray-400 border-b border-gray-100 pb-1">Worker Information</p>
                           <div>
                              <h3 className="text-sm font-black uppercase">{selectedSlip.karigar?.name}</h3>
                              <p className="text-[10px] font-mono font-bold mt-1">{selectedSlip.karigar?.karigar_code}</p>
                              <p className="text-[10px] uppercase font-bold text-gray-500 mt-1">Role: {selectedSlip.karigar?.skill_type}</p>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <p className="text-[9px] uppercase font-black text-gray-400 border-b border-gray-100 pb-1">Period Details</p>
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold">Start: {period.period_start}</p>
                              <p className="text-[10px] font-bold">End: {period.period_end}</p>
                              <p className="text-[10px] font-bold">Days Present: {selectedSlip.days_present || '—'}</p>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-8">
                        <div>
                           <p className="text-[9px] uppercase font-black text-gray-400 mb-4 tracking-widest">Earnings Breakdown</p>
                           <table className="w-full border-collapse">
                              <tbody className="text-[11px]">
                                 <tr className="border-b border-gray-100">
                                    <td className="py-3 uppercase font-bold">Base Wage / Salary</td>
                                    <td className="py-3 text-right font-mono">{fmt(selectedSlip.monthly_base || selectedSlip.daily_wage_earning || 0)}</td>
                                 </tr>
                                 {features.pieceRateWages && (
                                    <tr className="border-b border-gray-100">
                                       <td className="py-3 uppercase font-bold">Production Earnings (Piece Rate)</td>
                                       <td className="py-3 text-right font-mono">{fmt(selectedSlip.piece_rate_earning)}</td>
                                    </tr>
                                 )}
                                 <tr className="border-b border-gray-100">
                                    <td className="py-3 uppercase font-bold">Overtime Compensation</td>
                                    <td className="py-3 text-right font-mono">{fmt(selectedSlip.overtime_earning)}</td>
                                 </tr>
                                 <tr className="bg-gray-50">
                                    <td className="py-3 px-2 uppercase font-black">Gross Total</td>
                                    <td className="py-3 px-2 text-right font-mono font-black">{fmt(selectedSlip.gross_earning)}</td>
                                 </tr>
                              </tbody>
                           </table>
                        </div>

                        <div>
                           <p className="text-[9px] uppercase font-black text-gray-400 mb-4 tracking-widest">Deductions</p>
                           <table className="w-full border-collapse">
                              <tbody className="text-[11px]">
                                 {features.peshgiAdvances && (
                                    <tr className="border-b border-gray-100">
                                       <td className="py-3 uppercase font-bold text-red-600">{`${t.advance} Recovery`}</td>
                                       <td className="py-3 text-right font-mono text-red-600">-{fmt(selectedSlip.advance_deduction)}</td>
                                    </tr>
                                 )}
                                 <tr className="border-b border-gray-100">
                                    <td className="py-3 uppercase font-bold text-gray-400">EOBI / Social Security</td>
                                    <td className="py-3 text-right font-mono text-gray-400">-{fmt(selectedSlip.eobi_deduction)}</td>
                                 </tr>
                                 <tr className="bg-gray-50">
                                    <td className="py-3 px-2 uppercase font-black">Total Deductions</td>
                                    <td className="py-3 px-2 text-right font-mono font-black">-{fmt(selectedSlip.total_deductions)}</td>
                                 </tr>
                              </tbody>
                           </table>
                        </div>
                     </div>

                     <div className="mt-12 bg-black text-white p-6 flex justify-between items-center">
                        <div className="flex flex-col">
                           <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Total in Words</span>
                           <span className="text-[10px] font-black uppercase">{numberToWords(selectedSlip.net_payable, business?.currency || 'PKR')}</span>
                        </div>
                        <div className="text-right">
                           <span className="text-xs font-black uppercase tracking-[0.3em] block opacity-50 mb-1 text-[8px]">Net Payable</span>
                           <span className="text-3xl font-mono font-black">{fmt(selectedSlip.net_payable)}</span>
                        </div>
                     </div>

                     <div className="mt-24 grid grid-cols-2 gap-24">
                        <div className="border-t border-black pt-2 text-center">
                           <p className="text-[9px] uppercase font-black">Supervisor / Finance</p>
                        </div>
                        <div className="border-t border-black pt-2 text-center">
                           <p className="text-[9px] uppercase font-black">Worker Signature</p>
                        </div>
                     </div>
                  </div>

                  <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3 print:hidden">
                     <button 
                       onClick={() => handleWhatsAppSlip(selectedSlip)}
                       disabled={!selectedSlip.karigar?.phone}
                       className="flex items-center space-x-2 bg-[#25D366] text-white px-6 py-2 text-[10px] uppercase font-black tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                     >
                        <MessageCircle size={12} />
                        <span>Send via WhatsApp</span>
                     </button>
                     <button onClick={() => window.print()} className="flex items-center space-x-2 bg-black text-white px-6 py-2 text-[10px] uppercase font-black tracking-widest hover:brightness-110 transition-all">
                        <Printer size={12} />
                        <span>Print Payslip</span>
                     </button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* BULK PRINT CONTAINER (HIDDEN) */}
      <div className="print-container hidden bg-white text-black p-0">
         {slips?.map((slip: any, index: number) => (
           <div key={slip.id} className={cn("p-12 min-h-screen flex flex-col", index > 0 && "page-break")}>
              <div className="flex justify-between items-start mb-12 border-b-4 border-black pb-8">
                 <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">{business?.business_name || 'Noxis Industrial Hub'}</h2>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Personnel Disbursement Receipt</p>
                 </div>
                 <div className="text-right">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-100">PAYSLIP</h1>
                    <p className="text-[10px] font-mono font-black mt-2 text-black">{period.period_label}</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-12 mb-12">
                 <div>
                    <p className="text-[9px] uppercase font-black text-gray-400 border-b border-gray-100 pb-1">Worker Information</p>
                    <div className="mt-4">
                       <h3 className="text-lg font-black uppercase">{slip.karigar?.name}</h3>
                       <p className="text-xs font-mono font-bold mt-1">{slip.karigar?.karigar_code}</p>
                       <p className="text-xs uppercase font-bold text-gray-500 mt-1">Role: {slip.karigar?.skill_type}</p>
                    </div>
                 </div>
                 <div>
                    <p className="text-[9px] uppercase font-black text-gray-400 border-b border-gray-100 pb-1">Period Details</p>
                    <div className="mt-4 space-y-1">
                       <p className="text-xs font-bold">Start: {period.period_start}</p>
                       <p className="text-xs font-bold">End: {period.period_end}</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-8 flex-1">
                 <table className="w-full border-collapse">
                    <thead>
                       <tr className="border-b-2 border-black">
                          <th className="py-2 text-left text-[10px] uppercase font-black">Description</th>
                          <th className="py-2 text-right text-[10px] uppercase font-black">Amount</th>
                       </tr>
                    </thead>
                    <tbody className="text-sm">
                       <tr className="border-b border-gray-100">
                          <td className="py-4 font-bold uppercase">Piece Rate Production</td>
                          <td className="py-4 text-right font-mono">{fmt(slip.piece_rate_earning)}</td>
                       </tr>
                       <tr className="border-b border-gray-100">
                          <td className="py-4 font-bold uppercase">Daily Wage / Salary</td>
                          <td className="py-4 text-right font-mono">{fmt(slip.daily_wage_earning || slip.monthly_base || 0)}</td>
                       </tr>
                       <tr className="border-b border-gray-100">
                          <td className="py-4 font-bold uppercase text-red-600">Advance Recovery (Peshgi)</td>
                          <td className="py-4 text-right font-mono text-red-600">-{fmt(slip.advance_deduction)}</td>
                       </tr>
                    </tbody>
                 </table>
              </div>

              <div className="mt-auto pt-12">
                 <div className="bg-black text-white p-6 flex justify-between items-center">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Total in Words</span>
                       <span className="text-[10px] font-black uppercase">{numberToWords(slip.net_payable, business?.currency || 'PKR')}</span>
                    </div>
                    <div className="text-right">
                       <span className="text-xs font-black uppercase tracking-[0.3em] block opacity-50 mb-1 text-[8px]">Net Payable Amount</span>
                       <span className="text-4xl font-mono font-black">{fmt(slip.net_payable)}</span>
                    </div>
                 </div>
                 
                 <div className="mt-24 grid grid-cols-2 gap-24">
                    <div className="border-t border-black pt-4 text-center">
                       <p className="text-[10px] uppercase font-black">Supervisor Signature</p>
                    </div>
                    <div className="border-t border-black pt-4 text-center">
                       <p className="text-[10px] uppercase font-black">Receiver Signature</p>
                    </div>
                 </div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
