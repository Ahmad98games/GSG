import { LayoutDashboard, Settings, MessageSquare, Bell, LogOut, Hexagon, ShieldCheck, Receipt, Layers, Factory, Scan, Ruler } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DeviceNode {
  id: string;
  name: string;
  battery: number;
  signalStrength: 'strong' | 'medium' | 'weak';
  status: 'connected' | 'offline' | 'expired';
  lastActive: string;
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <div 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-[2px] cursor-pointer transition-all group",
      active ? "bg-electric-blue/5 text-electric-blue font-bold shadow-[inset_2px_0_0_0_#60A5FA]" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
    )}
  >
    <Icon className={cn("w-4 h-4", active ? "text-electric-blue" : "group-hover:text-zinc-300")} />
    <span className="text-[13px] tracking-tight">{label}</span>
  </div>
);

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
  activeNode?: DeviceNode | null;
}

export const DashboardLayout = ({ 
  children, 
  activeView, 
  onViewChange,
  activeNode
}: DashboardLayoutProps) => {
  const getViewTitle = () => {
    switch (activeView) {
      case 'overview': return 'Operational Overview';
      case 'gatekeeper': return 'Device Manager';
      case 'khata': return 'Stock Ledger';
      case 'job-orders': return 'Production Pipeline';
      case 'batch-vault': return 'Stock Inventory';
      case 'consumption-matrix': return 'Fabric Estimator';
      case 'production-pipeline': return 'Karigar Auditor (Security)';
      case 'settings': return 'System Settings';
      default: return 'Business Portal';
    }
  };

  return (
    <div className="flex min-h-screen bg-base-p text-zinc-400 selection:bg-electric-blue/30 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-base-s border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 bg-electric-blue rounded-[2px] flex items-center justify-center shadow-[0_0_20px_rgba(96,165,250,0.1)]">
            <Hexagon className="w-5 h-5 text-base-p fill-base-p" />
          </div>
          <div>
            <h1 className="text-sm font-black text-zinc-100 tracking-[0.1em] leading-none uppercase">GOLD SHE</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-electric-blue font-black mt-1.5">Industrial ERP</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-700 font-black mb-3 px-3 mt-4">Intelligence</div>
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Overview" 
            active={activeView === 'overview'} 
            onClick={() => onViewChange('overview')}
          />
          <SidebarItem 
            icon={ShieldCheck} 
            label="Device Manager" 
            active={activeView === 'gatekeeper'} 
            onClick={() => onViewChange('gatekeeper')}
          />
          
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-700 font-black mb-3 px-3 mt-8">Operations</div>
          <SidebarItem 
            icon={Receipt} 
            label="Stock Ledger" 
            active={activeView === 'khata'} 
            onClick={() => onViewChange('khata')}
          />
          
          <SidebarItem 
            icon={Layers} 
            label="Article Registry" 
            active={activeView === 'article-master'} 
            onClick={() => onViewChange('article-master')}
          />
          <SidebarItem 
            icon={Ruler} 
            label="Fabric Estimator" 
            active={activeView === 'consumption-matrix'} 
            onClick={() => onViewChange('consumption-matrix')}
          />
          <SidebarItem 
            icon={Factory} 
            label="Job Operations" 
            active={activeView === 'job-orders'} 
            onClick={() => onViewChange('job-orders')}
          />
          <SidebarItem 
            icon={ShieldCheck} 
            label="Karigar Auditor" 
            active={activeView === 'production-pipeline'} 
            onClick={() => onViewChange('production-pipeline')}
          />
          <SidebarItem 
            icon={Scan} 
            label="Stock Inventory" 
            active={activeView === 'batch-vault'} 
            onClick={() => onViewChange('batch-vault')}
          />
          
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-700 font-black mb-3 px-3 mt-8">System</div>
          <SidebarItem 
            icon={Settings} 
            label="System Settings" 
            active={activeView === 'settings'}
            onClick={() => onViewChange('settings')}
          />
        </nav>

        <div className="p-4 border-t border-white/5">
          <SidebarItem icon={LogOut} label="Logout" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-base-p">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-base-s/50 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-black">Portal</span>
            <span className="text-zinc-800 font-light">/</span>
            <span className="text-electric-blue text-[10px] uppercase tracking-[0.2em] font-black italic">
              {getViewTitle()}
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Node Guard Status Pulse */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 border rounded-[2px] transition-all duration-500",
              activeNode 
                ? "bg-green-500/5 border-green-500/10 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.05)]" 
                : "bg-base-t border-white/5 text-zinc-600"
            )}>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full animate-pulse",
                activeNode ? "bg-green-500 shadow-[0_0_8px_#22C55E]" : "bg-zinc-800"
              )} />
              <span className="text-[9px] font-black tracking-[0.2em] uppercase whitespace-nowrap">
                {activeNode ? 'NODE ONLINE' : 'NODE DISCONNECTED'}
              </span>
              {activeNode && (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/10">
                  <span className="text-[10px] font-mono font-bold">[{activeNode.battery}%]</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={cn(
                        "w-0.5 h-2 rounded-full bg-current",
                        i === 3 && activeNode.signalStrength === 'weak' && "opacity-20",
                        i >= 2 && activeNode.signalStrength === 'medium' && "opacity-20"
                      )} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => onViewChange('messaging')}
                className={cn(
                  "p-2 transition-all relative group",
                  activeView === 'messaging' ? "text-electric-blue" : "text-zinc-500 hover:text-electric-blue"
                )}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-base-p opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button className="p-2 text-zinc-500 hover:text-electric-blue transition-colors relative group">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-electric-blue rounded-full border-2 border-base-p" />
              </button>
            </div>
            
            <div className="h-6 w-[1px] bg-zinc-900" />

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-black text-zinc-200 uppercase">Admin Node 01</p>
                <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-bold">Authenticated Profile</p>
              </div>
              <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 uppercase">
                AD
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};
