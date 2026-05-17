"use client";
import { useEffect, useState } from 'react';
import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { 
  X, ArrowRightLeft, MapPin, 
  AlertCircle, CheckCircle2, Navigation 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const transferSchema = z.object({
  to_location: z.enum(['karkhana','warehouse','retail_shop','in_transit','disposed']),
  qty: z.coerce.number().positive(),
  notes: z.string().optional(),
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface TransferModalProps {
  sku: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ref: string) => void;
}

export default function TransferModal({ sku, isOpen, onClose, onSuccess }: TransferModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const supabase = createClient();

  const maxQty = sku.qty_on_hand - sku.qty_reserved;

  const { register, handleSubmit, formState: { errors } } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema) as any,
  });

  // Get GPS on mount
   useEffect(() => {
    if (isOpen && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation denied", err)
      );
    }
  }, [isOpen]);

  const onSubmit = async (values: TransferFormValues) => {
    if (values.qty > maxQty) return;
    setIsSubmitting(true);

    try {
      // 1. Insert Transfer Log
      const { data: transfer, error: transferError } = await supabase
        .from('transfer_logs')
        .insert({
          business_id: sku.business_id,
          sku_id: sku.id,
          from_location: sku.current_location,
          to_location: values.to_location,
          qty: values.qty,
          notes: values.notes,
          gps_lat: gps?.lat,
          gps_lng: gps?.lng,
          status: 'pending'
        })
        .select()
        .single();

      if (transferError) throw transferError;

      // 2. Reserve Stock
      const { error: skuError } = await supabase
        .from('skus')
        .update({ 
          qty_reserved: sku.qty_reserved + values.qty 
        })
        .eq('id', sku.id);

      if (skuError) throw skuError;

      onSuccess(transfer.reference_no);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Transfer initiation failed. Check ledger constraints.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-onyx/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface border border-white/10 w-full max-w-lg shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-electric-blue/10 text-electric-blue">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Initiate Stock Transfer</h2>
              <p className="text-[10px] text-gray-500 font-mono">{sku.sku_code} — {sku.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Origin</label>
              <div className="flex items-center space-x-2 p-3 bg-onyx border border-white/5 opacity-60">
                <MapPin size={12} className="text-gray-600" />
                <span className="text-xs uppercase text-gray-400">{sku.current_location}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Destination</label>
              <select {...register("to_location")} className="w-full bg-onyx border border-electric-blue/30 p-3 text-xs text-white outline-none focus:border-electric-blue transition-all uppercase">
                <option value="warehouse">Warehouse</option>
                <option value="karkhana">Karkhana</option>
                <option value="retail_shop">Retail Shop</option>
                <option value="in_transit">In Transit</option>
                <option value="disposed">Disposed</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-onyx/50 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Transfer Quantity</label>
              <span className="text-[9px] text-emerald uppercase font-mono">Available: {maxQty.toLocaleString()} {sku.unit}</span>
            </div>
            <input 
              type="number" 
              {...register("qty")}
              className="w-full bg-onyx border border-white/10 p-4 text-2xl font-mono text-white text-center outline-none focus:border-electric-blue transition-all"
              placeholder="0.0000"
            />
            {errors.qty && <p className="text-critical-red text-[10px] mt-2">{errors.qty.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Internal Notes</label>
            <textarea {...register("notes")} rows={2} className="w-full bg-onyx border border-white/5 p-3 text-xs text-gray-300 outline-none focus:border-white/20 resize-none" placeholder="Reason for transfer, vehicle #, driver name..." />
          </div>

          <div className="flex items-center justify-between text-[9px] text-gray-600 uppercase font-mono py-2 border-t border-white/5">
            <div className="flex items-center space-x-2">
              <Navigation size={10} className={gps ? "text-emerald" : "text-gray-700"} />
              <span>Geolocation: {gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : "Not Captured"}</span>
            </div>
            <span>Status: Pending Auth</span>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-4 bg-electric-blue hover:bg-blue-400 text-onyx font-bold uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center space-x-2"
          >
            {isSubmitting ? "Processing Ledger..." : "Commit Transfer to Registry"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

