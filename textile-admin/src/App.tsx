import { useState } from 'react';
import { LegacyLogin } from './components/auth/LegacyLogin';
import { DashboardLayout } from './components/layout/DashboardLayout';
import type { DeviceNode } from './components/layout/DashboardLayout';
import { DeviceGuard } from './components/layout/DeviceGuard';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { KhataModule } from './components/admin/KhataModule';
import { JobOrderManager } from './components/admin/JobOrderManager';
import { BatchVaultControl } from './components/admin/BatchVaultControl';
import { SystemConfigurator } from './components/admin/SystemConfigurator';
import { TacticalGatekeeper } from './components/devices/TacticalGatekeeper';
import { ArticleMasterModule } from './components/admin/ArticleMaster';
import { ConsumptionMatrix } from './components/admin/ConsumptionMatrix';
import { TacticalMessenger } from './components/messaging/TacticalMessenger';
import { InventoryList } from './components/inventory/InventoryList';
import { AddBatchForm } from './components/inventory/AddBatchForm';
import { useInventory } from './hooks/useInventory';
import { RefreshCw, Activity, Cpu, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { AnalyticsEngine } from './services/AnalyticsEngine';
import { ProductionPipeline } from './components/admin/ProductionPipeline';
import { CommandPalette } from './components/layout/CommandPalette';
import { BillingDashboard } from './components/admin/BillingDashboard';
import { DashboardSkeleton } from './components/layout/SkeletonShimmer';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeNode, setActiveNode] = useState<DeviceNode | null>(null);
  const [activeView, setActiveView] = useState('batch-vault');
  const { products, loading, fetchProducts, addProduct, deleteProduct } = useInventory();
  const isFriday = AnalyticsEngine.isHeavyRushMode();

  const lowStockItems = products.filter(p => (p.stock_in_sets || 0) < 5 && (p.stock_in_sets || 0) > 0);
  const fridayTarget = 500;
  const currentTotalStock = products.reduce((acc, p) => acc + (p.stock_in_sets || 0), 0);
  const isFridayDeficit = isFriday && currentTotalStock < fridayTarget;

  const renderActiveView = () => {
    if (loading && activeView === 'overview') {
      return <DashboardSkeleton />;
    }

    switch (activeView) {
      case 'overview':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Low-Stock Ticker (The Pulse) */}
            {(lowStockItems.length > 0 || isFriday) && (
              <div className={`border-y border-white/5 py-2 overflow-hidden relative group ${isFriday ? 'bg-electric-blue/10' : 'bg-[#0F1113]'}`}>
                <div className="flex animate-marquee whitespace-nowrap gap-12 items-center">
                  {isFriday && (
                    <div className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-electric-blue animate-bounce" />
                      <span className="text-electric-blue text-[10px] font-black uppercase tracking-widest font-mono">
                        TACTICAL_ALERT: HEAVY_RUSH_MODE_ACTIVE // FRIDAY_VELOCITY_TRACKING_ON
                      </span>
                    </div>
                  )}
                  {lowStockItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                      <span className="text-[#F59E0B] text-[10px] font-black uppercase tracking-widest font-mono">
                         Urg_Alert: {item.item_name} // SETS: {item.stock_in_sets} // REORDER_REQUIRED
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friday Velocity Gauge */}
            {isFriday && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 card bg-electric-blue/5 border border-electric-blue/20 p-6 rounded-xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-electric-blue" />
                      <h3 className="text-xs font-black text-electric-blue uppercase tracking-[0.2em] font-mono">Friday Velocity Monitor</h3>
                    </div>
                    {isFridayDeficit && (
                      <div className="flex items-center gap-2 text-red-500 animate-pulse font-mono font-black text-[10px]">
                        <AlertTriangle className="w-3 h-3" />
                        CRITICAL: STOCK_DEFICIT
                      </div>
                    )}
                  </div>
                  <div className="flex items-end justify-between relative z-10">
                    <div className="space-y-1">
                      <p className="text-[8px] text-electric-blue/60 uppercase font-black tracking-widest">Sets Per Hour (EST)</p>
                      <p className="text-4xl font-black text-electric-blue font-mono tracking-tighter">42.5</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[8px] text-electric-blue/60 uppercase font-black tracking-widest">Friday Target</p>
                      <p className="text-xl font-black text-zinc-100 font-mono tracking-tighter">{currentTotalStock} / {fridayTarget}</p>
                    </div>
                  </div>
                  {/* Decorative background grid */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#60A5FA_1px,transparent_1px)] [background-size:20px_20px]" />
                </div>
                <div className="card bg-[#0F1113] border border-white/5 p-6 rounded-xl flex flex-col justify-center items-center text-center">
                  <Activity className="w-8 h-8 text-zinc-800 mb-4" />
                  <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest leading-relaxed">
                    Velocity analysis linked to<br/>main ledger articles.
                  </p>
                </div>
              </div>
            )}

            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
              <div>
                <h2 className="text-sm font-black text-electric-blue tracking-[0.2em] uppercase italic">Sovereign Overview</h2>
                <p className="text-[10px] text-zinc-600 mt-2 max-w-md font-mono tracking-wider italic">
                   CONNECTED_NODE: PRIMARY_HQ // SYNC_STATUS: {loading ? 'UPDATING' : 'STABLE'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-[8px] text-zinc-700 font-black uppercase tracking-widest">Active Alerts</p>
                  <p className="text-[#F59E0B] font-mono text-xs font-black">{lowStockItems.length}</p>
                </div>
                <button 
                  onClick={() => fetchProducts()}
                  className="px-5 py-2 bg-[#0F1113] hover:bg-[#14171A] border border-white/5 text-zinc-500 hover:text-electric-blue transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-[2px]"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Sync Vault
                </button>
              </div>
            </section>
            
            <InventoryList 
              products={products} 
              loading={loading} 
              onDelete={deleteProduct}
            />
            <div className="pt-6 border-t border-zinc-900">
              <AddBatchForm onAdd={addProduct} onSuccess={fetchProducts} />
            </div>
          </div>
        );
      
      case 'gatekeeper':
        return <TacticalGatekeeper onNodeSync={setActiveNode} activeNode={activeNode} />;
      
      case 'messaging':
        return <TacticalMessenger activeNode={activeNode} />;
      
      case 'khata':
        return <KhataModule />;
      
      case 'job-orders':
        return <JobOrderManager />;
      
      case 'batch-vault':
        return <BatchVaultControl />;
      
      case 'article-master':
        return <ArticleMasterModule />;
      
      case 'consumption-matrix':
        return <ConsumptionMatrix />;

      case 'settings':
        return <SystemConfigurator />;

      case 'production-pipeline':
        return <ProductionPipeline />;

      case 'billing':
        return <BillingDashboard />;
      
      default:
        return (
          <div className="flex-1 flex items-center justify-center text-electric-blue font-mono uppercase italic tracking-[0.3em] opacity-10">
            Gold She Business Systems
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return <LegacyLogin onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <DeviceGuard>
      <DashboardLayout 
        activeView={activeView} 
        onViewChange={setActiveView}
        activeNode={activeNode}
      >
        <div className="h-[calc(100vh-100px)] flex flex-col custom-scrollbar overflow-auto">
          <ErrorBoundary>
            {renderActiveView()}
          </ErrorBoundary>

          <CommandPalette />

          {/* Footer Ledger Status */}
          <footer className="mt-auto pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <p className="text-[9px] text-zinc-700 uppercase tracking-[0.2em] font-black">
                Gold She Business • v5.0.0-ORCHESTRATOR • SECURE_NODE_01
              </p>
              <div className="px-2 py-0.5 bg-electric-blue/5 border border-electric-blue/10 rounded-[2px] flex items-center gap-2">
                <Cpu className="w-2.5 h-2.5 text-electric-blue animate-pulse" />
                <span className="text-[7px] font-mono text-electric-blue uppercase tracking-widest font-black">Engine: ACTIVE</span>
              </div>
            </div>
            <div className="flex gap-6">
              <span className="text-[9px] text-zinc-800 uppercase tracking-[.3em] font-black flex items-center gap-2">
                <Activity className="w-2.5 h-2.5 text-green-500" /> Precision: ABSOLUTE
              </span>
              <span className="text-[9px] text-zinc-800 uppercase tracking-[.3em] font-black">System Ready</span>
            </div>
          </footer>
        </div>
      </DashboardLayout>
    </DeviceGuard>
  );
}

export default App;
