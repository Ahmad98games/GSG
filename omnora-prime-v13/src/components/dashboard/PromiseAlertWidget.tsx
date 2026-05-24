"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { usePersona } from "@/hooks/usePersona";
import { AlertTriangle, MessageSquare, Check } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/useToast";

export default function PromiseAlertWidget() {
  const { businessId, fmt } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: duePromises = [], refetch } = useQuery({
    queryKey: ["due-promises-widget", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_due_promises", {
        p_business_id: businessId,
      });
      if (error) {
        console.error("Error fetching due promises:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!businessId,
  });

  if (duePromises.length === 0) return null;

  const handleMarkPaid = async (promise: any) => {
    try {
      const { error } = await supabase
        .from("payment_promises")
        .update({
          status: "fulfilled",
          fulfilled_at: new Date().toISOString(),
          fulfilled_amount: promise.promised_amount,
        })
        .eq("id", promise.id);

      if (error) throw error;

      toast.success("Promise fulfilled", `${promise.party_name}'s payment marked as paid.`);
      queryClient.invalidateQueries({ queryKey: ["due-promises-widget"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
    } catch (err: any) {
      toast.error("Action failed", err.message);
    }
  };

  const visiblePromises = duePromises.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0F1114] border border-[#C5A059]/30 rounded-sm p-4 relative overflow-hidden group shadow-lg"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C5A059]" />
      
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#C5A059]/10 rounded-sm text-[#C5A059] flex-shrink-0">
            <AlertTriangle size={16} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[#C5A059] font-mono">
              Verbal Payment Commitments Registry
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Outstanding promised payments requiring immediate follow-up.
            </p>
          </div>
        </div>
        <Link
          href="/promises"
          className="text-[10px] font-black uppercase text-[#60A5FA] hover:text-[#60A5FA]/80 hover:underline tracking-widest"
        >
          Manage All ({duePromises.length}) →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {visiblePromises.map((promise: any) => {
          const isOverdue = promise.days_overdue > 0;
          return (
            <div
              key={promise.id}
              className="p-3 bg-white/5 border border-white/5 hover:border-white/10 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black text-[#C5A059]">
                    {fmt(promise.promised_amount)}
                  </span>
                  <span
                    className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${
                      isOverdue ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {isOverdue ? `${promise.days_overdue}d Overdue` : "Due Today"}
                  </span>
                </div>
                <h5 className="text-[11px] font-bold text-white mt-1.5 truncate">
                  {promise.party_name}
                </h5>
                {promise.notes && (
                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-1 italic">
                    "{promise.notes}"
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={() => handleMarkPaid(promise)}
                  className="flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-400 hover:text-white transition-colors"
                >
                  <Check size={10} />
                  <span>Mark Paid</span>
                </button>

                {promise.party_phone && (
                  <a
                    href={`https://wa.me/${promise.party_phone.replace(/\+/g, "").replace(/\s/g, "")}?text=${encodeURIComponent(
                      `Assalamu Alaikum ${promise.party_name}, this is a gentle reminder regarding the payment commitment of PKR ${promise.promised_amount} due on ${promise.promise_date}. Kindly let us know when it is processed. JazakAllah.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={async () => {
                      await supabase
                        .from("payment_promises")
                        .update({ reminded_count: (promise.reminded_count || 0) + 1, last_reminded_at: new Date().toISOString() })
                        .eq("id", promise.id);
                      refetch();
                    }}
                    className="flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-wider text-[#25D366] hover:text-white transition-colors"
                  >
                    <MessageSquare size={10} />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
