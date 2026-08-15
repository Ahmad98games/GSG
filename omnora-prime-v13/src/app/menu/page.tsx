"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UtensilsCrossed, Plus, Search, 
  Edit3, Trash2, Camera,
  CheckCircle2, XCircle
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { cn } from "@/lib/utils";
import Image from "next/image";

// --- Types ---

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  business_id: string;
}

// --- Page Component ---

export default function MenuManagementPage() {
  const { fmt, businessId } = usePersona();
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Queries
  const { data: items, isLoading } = useQuery<MenuItem[]>({
    queryKey: ['menu_items', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('business_id', businessId)
        .order('category', { ascending: true });
      if (error) return [];
      return (data as MenuItem[]) || [];
    },
    enabled: !!businessId
  });

  // Mutations
  const toggleAvailability = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: boolean }) => {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_items'] });
    }
  });

  // Logic
  const categories = ["all", ...Array.from(new Set(items?.map((i: MenuItem) => i.category) || []))];
  
  const filteredItems = items?.filter((item: MenuItem) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">
      Syncing Culinary Matrix...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      
      
      <main className="transition-all duration-300 min-h-screen flex flex-col">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center space-x-3">
              <UtensilsCrossed size={18} className="text-[#C5A059]" />
              <h1 className="text-[10px] uppercase font-black tracking-[0.4em] text-white">Cloud Kitchen / Menu Management</h1>
           </div>
           
           <div className="ml-auto flex items-center space-x-4">
              <div className="relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#C5A059] transition-colors" size={14} />
                 <input 
                   type="text" 
                   placeholder="Search items..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="bg-black/40 border border-white/10 rounded-sm pl-10 pr-4 py-1.5 text-[10px] uppercase font-bold tracking-widest text-white w-[250px] focus:border-[#C5A059]/50 outline-none transition-all placeholder:text-gray-700"
                 />
              </div>
              <button className="flex items-center space-x-2 bg-[#C5A059] hover:brightness-110 text-black px-6 py-1.5 text-[10px] uppercase font-black tracking-widest transition-all">
                 <Plus size={12} />
                 <span>Add Item</span>
              </button>
           </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
           {/* CATEGORY FILTER */}
           <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat: string) => (
                <button 
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={cn(
                    "px-4 py-1.5 text-[9px] uppercase font-black tracking-widest border transition-all",
                    filterCategory === cat 
                      ? "bg-[#C5A059] border-[#C5A059] text-black" 
                      : "bg-white/5 border-white/5 text-gray-500 hover:text-white"
                  )}
                >
                  {cat}
                </button>
              ))}
           </div>

           {/* MENU GRID */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredItems?.map((item: MenuItem) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={item.id}
                    className="bg-[#1A1D21] border border-white/5 group hover:border-[#C5A059]/30 transition-all flex flex-col relative"
                  >
                     {/* Image Placeholder */}
                     <div className="h-48 bg-black relative overflow-hidden">
                        {item.image_url ? (
                          <Image 
                            src={item.image_url} 
                            alt={item.name} 
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-800">
                             <UtensilsCrossed size={48} strokeWidth={1} />
                          </div>
                        )}
                        <div className="absolute top-4 right-4 z-10">
                           <button className="p-2 bg-black/60 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all border border-white/10 hover:border-[#C5A059]">
                              <Camera size={14} />
                           </button>
                        </div>
                        <div className="absolute bottom-0 left-0 p-4 w-full bg-gradient-to-t from-black/80 to-transparent z-10">
                           <span className="text-[8px] uppercase font-black text-[#C5A059] tracking-widest bg-[#C5A059]/10 px-2 py-0.5 border border-[#C5A059]/20">{item.category}</span>
                        </div>
                     </div>

                     {/* Info */}
                     <div className="p-6 space-y-4 flex-1">
                        <div className="flex justify-between items-start">
                           <h3 className="text-sm font-black uppercase text-white tracking-tight leading-tight">{item.name}</h3>
                           <span className="text-sm font-mono font-black text-[#C5A059]">{fmt(item.price)}</span>
                        </div>
                        
                        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                           {item.description || "No description provided for this culinary asset."}
                        </p>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                           <div className="flex items-center space-x-4">
                              <div className="flex flex-col">
                                 <span className="text-[8px] uppercase font-black text-gray-600 tracking-widest">Availability</span>
                                 <button 
                                   onClick={() => toggleAvailability.mutate({ id: item.id, status: item.is_available })}
                                   className={cn(
                                     "text-[10px] font-bold uppercase transition-colors flex items-center space-x-1 mt-1",
                                     item.is_available ? "text-emerald-500" : "text-red-500"
                                   )}
                                 >
                                    {item.is_available ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                    <span>{item.is_available ? "Available" : "Sold Out"}</span>
                                 </button>
                              </div>
                           </div>
                           
                           <div className="flex items-center space-x-1">
                              <button className="p-2 text-gray-600 hover:text-white transition-colors"><Edit3 size={14} /></button>
                              <button className="p-2 text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                           </div>
                        </div>
                     </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Empty State */}
              {filteredItems?.length === 0 && (
                <div className="col-span-full py-32 text-center flex flex-col items-center space-y-4 opacity-20">
                   <UtensilsCrossed size={64} strokeWidth={1} />
                   <p className="text-[10px] uppercase font-black tracking-widest">No culinary assets detected in this category</p>
                </div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
}
