import { useState, useEffect } from 'react';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AddBatchForm } from './components/inventory/AddBatchForm';
import { InventoryList } from './components/inventory/InventoryList';
import { useInventory } from './hooks/useInventory';
import { RefreshCw } from 'lucide-react';
import { DeviceManager } from './components/devices/DeviceManager';

import { DeviceGuard } from './components/layout/DeviceGuard';
import { CreateJobOrder } from './components/admin/CreateJobOrder';
import { SmartSourcingForm } from './components/admin/SmartSourcingForm';
import { BillingDashboard } from './components/admin/BillingDashboard';
import { KarigarChalanPrint } from './components/admin/KarigarChalanPrint';
import { SettingsView } from './components/admin/SettingsView';

function App() {
  const [activeView, setActiveView] = useState('overview');
  const { products, loading, fetchProducts, addProduct, deleteProduct } = useInventory();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <DeviceGuard>
      <DashboardLayout activeView={activeView} onViewChange={setActiveView}>
      <div className="max-w-6xl mx-auto space-y-12">
        {activeView === 'overview' ? (
          <>
            {/* ... existing overview code ... */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold text-zinc-100 tracking-tight uppercase">Inventory Control</h2>
                <p className="text-sm text-zinc-500 mt-1 max-w-md">
                   Monitor stock levels and manage material lifecycle.
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => fetchProducts()}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Sync Data
                </button>
              </div>
            </section>
            
            <InventoryList 
              products={products} 
              loading={loading} 
              onDelete={deleteProduct}
            />
            <AddBatchForm onAdd={addProduct} onSuccess={fetchProducts} />
          </>
        ) : activeView === 'job-orders' ? (
          <CreateJobOrder />
        ) : activeView === 'sourcing' ? (
          <SmartSourcingForm />
        ) : activeView === 'billing' ? (
          <BillingDashboard />
        ) : activeView === 'print' ? (
          <KarigarChalanPrint />
        ) : activeView === 'settings' ? (
          <SettingsView />
        ) : (
          <DeviceManager />
        )}

        {/* Footer info */}
        <footer className="pt-8 border-t border-zinc-900/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold">
            Gold She Enterprise ERP • v1.0.4-Stable
          </p>
          <div className="flex gap-6">
            <span className="text-[10px] text-zinc-700 uppercase tracking-widest font-bold">Privacy Policy</span>
            <span className="text-[10px] text-zinc-700 uppercase tracking-widest font-bold">Terms of Service</span>
            <span className="text-[10px] text-zinc-700 uppercase tracking-widest font-bold">Support 24/7</span>
          </div>
        </footer>
      </div>
    </DashboardLayout>
    </DeviceGuard>
  );
}

export default App;
