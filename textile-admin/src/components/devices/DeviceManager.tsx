import React, { useState } from 'react';
import { Shield, Smartphone, Monitor, Plus, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useDevices } from '../../hooks/useDevices';

export const DeviceManager: React.FC = () => {
  const { devices, stats, loading, error, addDevice, revokeDevice, refresh } = useDevices();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ uuid: '', name: '', type: 'mobile' as 'pc' | 'mobile' });
  const [actionLoading, setActionLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    const result = await addDevice(newDevice.uuid, newDevice.name, newDevice.type);
    setActionLoading(false);
    if (result.success) {
      setShowAddModal(false);
      setNewDevice({ uuid: '', name: '', type: 'mobile' });
    }
  };

  const handleRevoke = async (id: string) => {
    if (window.confirm('Are you sure you want to revoke access for this device?')) {
      setActionLoading(true);
      await revokeDevice(id);
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-electric-blue" />
            The Gatekeeper
          </h2>
          <p className="text-zinc-400">Manage authorized hardware identifiers</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg">
            <span className="text-zinc-500 text-sm">Slots: </span>
            <span className={`font-mono font-bold ${stats.remaining_slots > 0 ? 'text-electric-blue' : 'text-red-500'}`}>
              {stats.active_count}/4
            </span>
          </div>
          
          <button
            onClick={() => refresh()}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            disabled={stats.remaining_slots === 0}
            className="flex items-center gap-2 bg-electric-blue hover:bg-electric-blue/90 text-black px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            Add Device
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg flex items-center gap-3 text-red-500">
          <AlertCircle />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && devices.length === 0 ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 bg-zinc-900/50 border border-zinc-800 rounded-xl animate-pulse" />
          ))
        ) : (
          devices.map((device) => (
            <div 
              key={device.id} 
              className={`p-5 rounded-xl border transition-all ${
                device.status === 'active' 
                ? 'bg-zinc-900 border-zinc-800 hover:border-electric-blue/30' 
                : 'bg-zinc-950 border-zinc-900 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-lg ${device.status === 'active' ? 'bg-electric-blue/10 text-electric-blue' : 'bg-zinc-800 text-zinc-500'}`}>
                    {device.device_type === 'pc' ? <Monitor size={24} /> : <Smartphone size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{device.device_name}</h3>
                    <p className="text-zinc-500 font-mono text-xs mb-2">{device.device_uuid}</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                        device.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {device.status}
                      </span>
                      {device.last_active && (
                        <span className="text-zinc-500 text-[10px]">
                          Last seen: {new Date(device.last_active).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {device.status === 'active' && (
                  <button
                    onClick={() => handleRevoke(device.id)}
                    className="text-zinc-500 hover:text-red-500 transition-colors p-1"
                    title="Revoke Access"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Authorize New Device</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-sm font-medium mb-1.5">Device Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Workshop iPad, Admin Laptop"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-electric-blue outline-none transition-all"
                  value={newDevice.name}
                  onChange={e => setNewDevice({...newDevice, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-sm font-medium mb-1.5">Hardware Identifier (UUID)</label>
                <input
                  type="text"
                  required
                  placeholder="Paste UUID here..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:border-electric-blue outline-none transition-all"
                  value={newDevice.uuid}
                  onChange={e => setNewDevice({...newDevice, uuid: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-sm font-medium mb-1.5">Device Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewDevice({...newDevice, type: 'mobile'})}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                      newDevice.type === 'mobile' ? 'bg-electric-blue/10 border-electric-blue text-electric-blue' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <Smartphone size={18} />
                    Mobile
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDevice({...newDevice, type: 'pc'})}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                      newDevice.type === 'pc' ? 'bg-electric-blue/10 border-electric-blue text-electric-blue' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <Monitor size={18} />
                    PC
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-electric-blue hover:bg-electric-blue/90 text-black font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading ? <RefreshCw className="animate-spin" /> : <CheckCircle size={20} />}
                  Authorize Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
