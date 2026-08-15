"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Truck, Plus, Search, 
  MoreVertical, Phone, 
  AlertTriangle, CheckCircle2,
  User, Navigation
} from "lucide-react";
import { usePersona } from "@/hooks/usePersona";
import { createClient } from "@/lib/supabase/client";

import { cn } from "@/lib/utils";

// --- Types ---

interface Vehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
  year: number | null;
  type: string;
  status: 'active' | 'maintenance' | 'retired';
  driver_name: string | null;
  driver_phone: string | null;
  last_service_date: string | null;
  next_service_date: string | null;
  business_id: string;
}

// --- Components ---

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'emerald' | 'amber' | 'red' | 'blue' | 'gray';
}

const Badge = ({ children, variant = "default" }: BadgeProps) => {
  const styles: Record<string, string> = {
    default: "bg-white/5 text-gray-400 border border-white/10",
    emerald: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    red: "bg-red-500/10 text-red-500 border border-red-500/20",
    blue: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    gray: "bg-gray-500/10 text-gray-500 border border-gray-500/20"
  };
  return (
    <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-[2px]", styles[variant])}>
      {children}
    </span>
  );
};

// --- Page Component ---

export default function FleetManagementPage() {
  const { businessId } = usePersona();
  const supabase = createClient();
  
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ['fleet_vehicles', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('business_id', businessId)
        .order('registration', { ascending: true });
      if (error) return [];
      return (data as Vehicle[]) || [];
    },
    enabled: !!businessId
  });

  // Logic
  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.filter((v: Vehicle) => 
      v.registration.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vehicles, searchTerm]);

  const summary = useMemo(() => {
    if (!vehicles) return { active: 0, maintenance: 0, dueService: 0 };
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return {
      active: vehicles.filter((v: Vehicle) => v.status === 'active').length,
      maintenance: vehicles.filter((v: Vehicle) => v.status === 'maintenance').length,
      dueService: vehicles.filter((v: Vehicle) => v.next_service_date && new Date(v.next_service_date) < nextWeek).length
    };
  }, [vehicles]);

  const isServiceDue = (dateStr: string | null) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return date < nextWeek;
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#0F1113] flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.5em] text-gray-700 animate-pulse">
      Syncing Fleet Logistics Node...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 font-inter">
      
      
      <main className="transition-all duration-300 min-h-screen flex flex-col pb-20">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-[#1A1D21]/50 backdrop-blur-md sticky top-0 z-40">
           <div className="flex items-center space-x-3">
              <Truck size={18} className="text-[#10B981]" />
              <h1 className="text-[10px] uppercase font-black tracking-[0.4em] text-white">Registry / Fleet Management</h1>
           </div>
           
           <div className="ml-auto flex items-center space-x-4">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                 <input 
                   type="text" 
                   placeholder="Search registration..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="bg-black/40 border border-white/10 pl-10 pr-4 py-1.5 text-[10px] uppercase font-bold tracking-widest text-white w-[250px] focus:border-[#10B981]/50 outline-none transition-all placeholder:text-gray-700"
                 />
              </div>
              <button className="flex items-center space-x-2 bg-[#10B981] hover:brightness-110 text-black px-6 py-1.5 text-[10px] uppercase font-black tracking-widest transition-all shadow-lg shadow-emerald-500/10">
                 <Plus size={12} />
                 <span>Add Vehicle</span>
              </button>
           </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
           {/* SUMMARY ROW */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1A1D21] border border-white/5 p-6 flex items-center space-x-6 relative overflow-hidden group">
                 <div className="w-12 h-12 bg-emerald-500/5 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 size={24} />
                 </div>
                 <div>
                    <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">Active Vehicles</p>
                    <h4 className="text-2xl font-mono font-black text-white">{summary.active}</h4>
                 </div>
              </div>
              <div className="bg-[#1A1D21] border border-white/5 p-6 flex items-center space-x-6 relative overflow-hidden group">
                 <div className="w-12 h-12 bg-amber-500/5 flex items-center justify-center text-amber-500">
                    <Navigation size={24} />
                 </div>
                 <div>
                    <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">In Maintenance</p>
                    <h4 className="text-2xl font-mono font-black text-amber-500">{summary.maintenance}</h4>
                 </div>
              </div>
              <div className="bg-[#1A1D21] border border-white/5 p-6 flex items-center space-x-6 relative overflow-hidden group">
                 <div className="w-12 h-12 bg-red-500/5 flex items-center justify-center text-red-500">
                    <AlertTriangle size={24} />
                 </div>
                 <div>
                    <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest mb-1">Service Due</p>
                    <h4 className="text-2xl font-mono font-black text-red-500">{summary.dueService}</h4>
                 </div>
              </div>
           </div>

           {/* VEHICLES TABLE */}
           <div className="bg-[#1A1D21] border border-white/5 flex flex-col">
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="text-[9px] uppercase font-black text-gray-600 tracking-[0.2em] border-b border-white/5">
                          <th className="p-4">Registration</th>
                          <th className="p-4">Make / Model</th>
                          <th className="p-4">Asset Type</th>
                          <th className="p-4">Assigned Driver</th>
                          <th className="p-4">Fleet Status</th>
                          <th className="p-4">Last Service</th>
                          <th className="p-4">Next Service</th>
                          <th className="p-4 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="text-[11px]">
                       {filteredVehicles.length > 0 ? filteredVehicles.map((v: Vehicle) => {
                         const serviceDue = isServiceDue(v.next_service_date);
                         return (
                           <tr key={v.id} className={cn(
                             "border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors group",
                             serviceDue && v.status === 'active' && "bg-amber-500/[0.02]"
                           )}>
                              <td className="p-4">
                                 <span className="text-[#10B981] font-mono font-bold uppercase">{v.registration}</span>
                              </td>
                              <td className="p-4">
                                 <p className="font-bold text-white uppercase tracking-tight">{v.make} {v.model}</p>
                                 <p className="text-[9px] text-gray-500 font-mono">{v.year || '—'}</p>
                              </td>
                              <td className="p-4">
                                 <Badge>{v.type}</Badge>
                              </td>
                              <td className="p-4">
                                 <div className="flex flex-col">
                                    <div className="flex items-center space-x-2">
                                       <User size={10} className="text-gray-600" />
                                       <span className="font-bold text-gray-300 uppercase">{v.driver_name || 'Unassigned'}</span>
                                    </div>
                                    {v.driver_phone && (
                                      <div className="flex items-center space-x-2 mt-0.5">
                                         <Phone size={10} className="text-gray-700" />
                                         <span className="text-[9px] font-mono text-gray-600">{v.driver_phone}</span>
                                      </div>
                                    )}
                                 </div>
                              </td>
                              <td className="p-4">
                                 <div className="flex items-center space-x-3">
                                    <Badge variant={
                                      v.status === 'active' ? 'emerald' : 
                                      v.status === 'maintenance' ? 'amber' : 'gray'
                                    }>{v.status}</Badge>
                                    {serviceDue && v.status === 'active' && <Badge variant="red">Service Due</Badge>}
                                 </div>
                              </td>
                              <td className="p-4 text-gray-400 font-mono">{v.last_service_date || '—'}</td>
                              <td className="p-4 font-mono">
                                 <span className={cn(serviceDue ? "text-red-500 font-bold" : "text-gray-500")}>
                                    {v.next_service_date || '—'}
                                 </span>
                              </td>
                              <td className="p-4 text-right">
                                 <div className="flex items-center justify-end space-x-2">
                                    <button className="p-1.5 hover:bg-white/5 text-gray-700 hover:text-white transition-colors rounded-sm">
                                       <MoreVertical size={14} />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                         );
                       }) : (
                         <tr>
                            <td colSpan={8} className="p-20 text-center">
                               <div className="flex flex-col items-center opacity-20">
                                  <Truck size={48} strokeWidth={1} />
                                  <p className="text-[10px] uppercase font-black tracking-widest mt-4">No fleet assets registered</p>
                               </div>
                            </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
