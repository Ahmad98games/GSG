"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  User,
  Trash2,
  CheckCircle2,
  Layers,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import { usePersona } from "@/hooks/usePersona";

interface FactoryBranch {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  manager: string;
  phone: string;
  is_headquarters: boolean;
  active: boolean;
}

const DEFAULT_BRANCHES: FactoryBranch[] = [
  {
    id: "branch-01",
    name: "Main Factory & Loom Shed",
    code: "HQ-01",
    city: "Faisalabad",
    address: "Millat Industrial Estate, Sector 4",
    manager: "Haji Abdul Rehman",
    phone: "+92 300 1234567",
    is_headquarters: true,
    active: true,
  },
  {
    id: "branch-02",
    name: "Stitching & Finishing Unit",
    code: "ST-02",
    city: "Gujranwala",
    address: "Small Industrial Estate II",
    manager: "Tariq Mahmood",
    phone: "+92 321 7654321",
    is_headquarters: false,
    active: true,
  },
];

export default function FactoryBranchesSettingsPage() {
  const [branches, setBranches] = useState<FactoryBranch[]>(DEFAULT_BRANCHES);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();
  const { businessId } = usePersona();

  const [formData, setFormData] = useState<Partial<FactoryBranch>>({
    name: "",
    code: "",
    city: "",
    address: "",
    manager: "",
    phone: "",
    is_headquarters: false,
    active: true,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("noxis_factory_branches");
      if (stored) {
        setBranches(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const saveBranches = (newBranches: FactoryBranch[]) => {
    setBranches(newBranches);
    try {
      localStorage.setItem("noxis_factory_branches", JSON.stringify(newBranches));
    } catch {}
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.code?.trim()) {
      toastError("Missing Fields", "Branch name and code are required.");
      return;
    }

    const newBranch: FactoryBranch = {
      id: `branch-${Date.now()}`,
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      city: formData.city?.trim() || "Local",
      address: formData.address?.trim() || "",
      manager: formData.manager?.trim() || "Floor Supervisor",
      phone: formData.phone?.trim() || "",
      is_headquarters: formData.is_headquarters || false,
      active: true,
    };

    saveBranches([newBranch, ...branches]);
    toastSuccess("Branch Created", `Factory unit ${newBranch.name} registered.`);
    setShowModal(false);
    setFormData({
      name: "",
      code: "",
      city: "",
      address: "",
      manager: "",
      phone: "",
      is_headquarters: false,
      active: true,
    });
  };

  const handleDeleteBranch = (id: string) => {
    if (branches.length <= 1) {
      toastError("Cannot Delete", "At least one primary factory branch must remain active.");
      return;
    }
    const updated = branches.filter((b) => b.id !== id);
    saveBranches(updated);
    toastSuccess("Branch Removed", "Factory branch updated.");
  };

  const filtered = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 lg:p-12 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/settings"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors"
            >
              <ArrowLeft size={12} /> Settings Hub
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="text-[#60A5FA]" size={24} />
            Factory Branches &amp; Units
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure multi-location loom sheds, stitching workshops, and regional wholesale outlets.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0070F3] hover:bg-[#0060DF] text-white text-xs font-bold uppercase tracking-wider rounded-md transition-colors shadow-lg cursor-pointer"
        >
          <Plus size={14} /> Add Factory Branch
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter branches by name, unit code, or city..."
          className="w-full bg-[#0D121D] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#60A5FA]/50 font-mono placeholder:text-slate-600"
        />
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((branch) => (
          <div
            key={branch.id}
            className="p-5 rounded-xl border border-white/10 bg-[#0A0E17] hover:border-white/20 transition-all space-y-4 relative group"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{branch.name}</h3>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {branch.code}
                  </span>
                </div>
                {branch.is_headquarters && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-400 mt-1">
                    <ShieldCheck size={11} /> Primary Manufacturing Headquarters
                  </span>
                )}
              </div>

              {!branch.is_headquarters && (
                <button
                  onClick={() => handleDeleteBranch(branch.id)}
                  title="Remove branch"
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1.5 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 border-t border-white/5 pt-3">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin size={12} className="text-slate-500 shrink-0" />
                <span>{branch.city || "Factory Unit"}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <User size={12} className="text-slate-500 shrink-0" />
                <span>{branch.manager}</span>
              </div>
              {branch.phone && (
                <div className="flex items-center gap-1.5 truncate col-span-2 text-slate-500">
                  <Phone size={12} className="shrink-0" />
                  <span>{branch.phone}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Branch Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0D121D] border border-white/10 rounded-xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  New Factory Branch / Shed
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-500 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddBranch} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-400 mb-1">Branch / Unit Name *</label>
                  <input
                    required
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Unit 3 Weaving Shed"
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Unit Code *</label>
                    <input
                      required
                      value={formData.code || ""}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. WS-03"
                      className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-blue-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">City / Region</label>
                    <input
                      value={formData.city || ""}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Faisalabad"
                      className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Floor Manager / Supervisor</label>
                  <input
                    value={formData.manager || ""}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    placeholder="e.g. Muhammad Aslam"
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Contact Phone</label>
                  <input
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +92 300 0000000"
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0070F3] hover:bg-[#0060DF] text-white rounded font-bold uppercase tracking-wider"
                  >
                    Save Branch
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
