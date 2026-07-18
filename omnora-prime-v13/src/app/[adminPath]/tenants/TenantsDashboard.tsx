'use client'

import { useState, useEffect } from 'react'
import { 
  Users, Calendar, CreditCard, RefreshCw, 
  Search, ShieldAlert, Award, ArrowUpRight, 
  MapPin, Clock, Edit2, CheckCircle2, X 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function TenantsDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  // Edit fields state
  const [editForm, setEditForm] = useState({
    tier: 'lite',
    expiresAt: '',
    isActive: true,
    amountPaid: 0
  })

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/tenants')
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized access')
        }
        throw new Error('Failed to load tenants data')
      }
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (tenant: any) => {
    setSelectedTenant(tenant)
    setEditForm({
      tier: tenant.license?.tier || 'lite',
      expiresAt: tenant.license?.expires_at ? tenant.license.expires_at.split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: tenant.license?.is_active !== undefined ? tenant.license.is_active : true,
      amountPaid: tenant.license?.amount_paid || 0
    })
  }

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTenant) return
    setIsUpdating(true)

    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId: selectedTenant.id,
          tier: editForm.tier,
          expiresAt: new Date(editForm.expiresAt).toISOString(),
          isActive: editForm.isActive,
          amountPaid: editForm.amountPaid
        })
      })

      if (!res.ok) throw new Error('Update failed')
      
      setUpdateSuccess(true)
      setTimeout(() => setUpdateSuccess(false), 2000)
      setSelectedTenant(null)
      fetchTenants()
    } catch (err) {
      alert('Failed to update tenant details')
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredTenants = data?.tenants?.filter((t: any) =>
    t.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.phone?.includes(searchTerm) ||
    t.city?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090B] text-gray-400 flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-10 h-10 text-electric-blue animate-spin" />
        <span className="text-xs uppercase font-black tracking-widest text-gray-600">Syncing SaaS Core Node...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#07090B] text-red-500 flex flex-col items-center justify-center gap-4">
        <ShieldAlert className="w-12 h-12" />
        <span className="text-sm font-bold uppercase tracking-wider">{error}</span>
        <button onClick={fetchTenants} className="px-4 py-2 border border-red-500/20 text-xs font-bold uppercase hover:bg-red-500/5 transition-colors">Retry Connection</button>
      </div>
    )
  }

  const { metrics } = data

  return (
    <div className="min-h-screen bg-[#07090B] text-gray-200 p-6 md:p-8 select-none relative">
      <div className="absolute top-0 right-0 w-[600px] h-[300px] bg-electric-blue/5 rounded-full blur-[140px] pointer-events-none" />

      <main className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white italic">Tenant intelligence Control</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mt-1">Noxis Hub Cloud Infrastructure Dashboard</p>
          </div>
          <button onClick={fetchTenants} className="p-2 border border-white/10 hover:bg-white/5 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0C0F12] border border-white/5 p-5 rounded-sm">
            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Total Tenants</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-2xl font-black font-mono text-white">{metrics.totalTenants}</span>
              <Users size={16} className="text-gray-600 mb-1" />
            </div>
          </div>
          <div className="bg-[#0C0F12] border border-white/5 p-5 rounded-sm">
            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Active Licenses</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-2xl font-black font-mono text-emerald-400">{metrics.totalActiveLicenses}</span>
              <CheckCircle2 size={16} className="text-emerald-500/70 mb-1" />
            </div>
          </div>
          <div className="bg-[#0C0F12] border border-white/5 p-5 rounded-sm">
            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Consolidated Revenue</span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-2xl font-black font-mono text-[#C5A059]">PKR {metrics.totalRevenue.toLocaleString()}</span>
              <ArrowUpRight size={16} className="text-[#C5A059]/70 mb-1" />
            </div>
          </div>
          <div className="bg-[#0C0F12] border border-white/5 p-5 rounded-sm">
            <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest">Tiers Distribution</span>
            <div className="flex justify-between items-center mt-3 text-[10px] font-mono text-gray-400">
              <span>Lite: {metrics.tierBreakdown.lite}</span>
              <span>Pro: {metrics.tierBreakdown.pro}</span>
              <span>Elite: {metrics.tierBreakdown.elite}</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-[#0C0F12] border border-white/5 p-4 flex items-center justify-between">
          <div className="relative w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by business name, phone, city..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#07090B] border border-white/5 pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-electric-blue/50"
            />
          </div>
        </div>

        {/* Tenants Table */}
        <div className="bg-[#0C0F12] border border-white/5 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/20 border-b border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-500">
                <th className="px-6 py-4">Tenant Details</th>
                <th className="px-6 py-4">Role & Industry</th>
                <th className="px-6 py-4">Active Plan</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length > 0 ? (
                filteredTenants.map((tenant: any) => {
                  const lic = tenant.license
                  const isLicActive = lic && lic.is_active && new Date(lic.expires_at) > new Date()
                  return (
                    <tr key={tenant.id} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-all">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white uppercase">{tenant.business_name}</span>
                          <span className="text-[8px] font-mono text-gray-600 mt-1">{tenant.id}</span>
                          {tenant.phone && (
                            <span className="text-[9px] text-gray-500 font-mono mt-0.5">{tenant.phone}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">{tenant.role}</span>
                          <span className="text-[9px] text-gray-500 mt-0.5">{tenant.industry_type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lic ? (
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "w-fit px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border",
                              lic.tier === 'elite' ? 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20' :
                              lic.tier === 'pro' ? 'bg-electric-blue/10 text-electric-blue border-electric-blue/20' :
                              'bg-white/5 text-gray-400 border-white/10'
                            )}>
                              {lic.tier}
                            </span>
                            <span className="text-[9px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <Clock size={10} />
                              Expires: {new Date(lic.expires_at).toLocaleDateString()}
                            </span>
                            <span className={cn(
                              "text-[8px] font-bold uppercase tracking-wider",
                              isLicActive ? "text-emerald-400" : "text-red-400"
                            )}>
                              {isLicActive ? "Active" : "Expired / Inactive"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] italic text-gray-600">No License Activated</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEditClick(tenant)}
                          className="px-3 py-1.5 border border-white/10 hover:bg-white/5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <Edit2 size={10} />
                          <span>Manage License</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-xs uppercase font-bold text-gray-600 tracking-widest">No matching tenant nodes detected</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Edit Drawer */}
      <AnimatePresence>
        {selectedTenant && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTenant(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0F1114] border-l border-white/10 shadow-2xl z-50 p-8 flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Manage Node License</h3>
                  <span className="text-[9px] font-mono text-gray-600">{selectedTenant.business_name}</span>
                </div>
                <button onClick={() => setSelectedTenant(null)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="space-y-6 flex-1">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">License Tier</label>
                  <select 
                    value={editForm.tier}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tier: e.target.value }))}
                    className="w-full bg-[#07090B] border border-white/10 p-3 text-xs text-white outline-none focus:border-electric-blue"
                  >
                    <option value="lite">Lite</option>
                    <option value="pro">Pro</option>
                    <option value="elite">Elite</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Expiration Date</label>
                  <input 
                    type="date"
                    value={editForm.expiresAt}
                    onChange={(e) => setEditForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full bg-[#07090B] border border-white/10 p-3 text-xs text-white outline-none focus:border-electric-blue font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount Paid (PKR)</label>
                  <input 
                    type="number"
                    value={editForm.amountPaid}
                    onChange={(e) => setEditForm(prev => ({ ...prev, amountPaid: Number(e.target.value) }))}
                    className="w-full bg-[#07090B] border border-white/10 p-3 text-xs text-white outline-none focus:border-electric-blue font-mono"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">License Active Status</span>
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={cn(
                      "px-4 py-1.5 text-[8px] font-black uppercase tracking-widest border transition-all",
                      editForm.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}
                  >
                    {editForm.isActive ? "Active" : "Deactivated"}
                  </button>
                </div>

                <div className="pt-8">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full py-4 bg-electric-blue text-onyx text-[10px] font-black uppercase tracking-widest hover:bg-blue-400 transition-all flex items-center justify-center space-x-2"
                  >
                    {isUpdating ? "Saving Node Changes..." : "Save Settings"}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {updateSuccess && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 right-8 z-[100] bg-emerald-500 text-black px-6 py-3 flex items-center space-x-3 shadow-2xl font-bold uppercase text-xs tracking-widest"
          >
            <CheckCircle2 size={18} />
            <span>Node configurations updated successfully</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
