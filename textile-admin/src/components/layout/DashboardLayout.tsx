import React from 'react';
import { LayoutDashboard, Shield, Settings, LogOut, Hexagon, Factory, Scan, Receipt, Printer } from 'lucide-react';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all group ${
      active ? 'bg-gold/10 text-gold font-bold' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-gold' : 'group-hover:text-zinc-200'}`} />
    <span className="text-sm">{label}</span>
  </div>
);

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

export const DashboardLayout = ({ children, activeView, onViewChange }: DashboardLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-400 selection:bg-gold/30 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-900 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-100 rounded flex items-center justify-center">
            <Hexagon className="w-5 h-5 text-zinc-950 fill-zinc-950" />
          </div>
          <div>
            <h1 className="text-sm font-black text-zinc-100 tracking-tight leading-none italic">GOLD SHE</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold mt-1">Industrial ERP</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <div className="label-xs mb-2 px-3 opacity-50">Main Navigation</div>
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Overview" 
            active={activeView === 'overview'} 
            onClick={() => onViewChange('overview')}
          />
          <SidebarItem 
            icon={Shield} 
            label="The Gatekeeper" 
            active={activeView === 'gatekeeper'} 
            onClick={() => onViewChange('gatekeeper')}
          />
          
          <div className="label-xs mb-2 px-3 mt-8 opacity-50">Manufacturing & Finance</div>
          <SidebarItem 
            icon={Factory} 
            label="Job Orders" 
            active={activeView === 'job-orders'} 
            onClick={() => onViewChange('job-orders')}
          />
          <SidebarItem 
            icon={Scan} 
            label="Smart Sourcing" 
            active={activeView === 'sourcing'} 
            onClick={() => onViewChange('sourcing')}
          />
          <SidebarItem 
            icon={Receipt} 
            label="Billing Matrix" 
            active={activeView === 'billing'} 
            onClick={() => onViewChange('billing')}
          />
          <SidebarItem 
            icon={Printer} 
            label="Chalan Print" 
            active={activeView === 'print'} 
            onClick={() => onViewChange('print')}
          />
          
          <div className="label-xs mb-2 px-3 mt-8 opacity-50">System</div>
          <SidebarItem 
            icon={Settings} 
            label="Global Settings" 
            active={activeView === 'settings'}
            onClick={() => onViewChange('settings')}
          />
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <SidebarItem icon={LogOut} label="Sign Out" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-xs uppercase tracking-widest font-semibold">Dashboard</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-200 text-xs uppercase tracking-widest font-semibold">
              {activeView === 'overview' ? 'Inventory Overview' : 'The Gatekeeper'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-semibold text-zinc-200">Admin User</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Super Admin</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
              AD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};
