/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWindowSize } from 'react-use';
import { 
  LayoutDashboard, 
  ReceiptText, 
  BarChart3, 
  Package, 
  Settings2, 
  Truck,
  ArrowLeft,
  Search,
  Users,
  Settings2 as SettingsIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminModule from './components/AdminModule';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import QuickBill from './components/QuickBill';
import Sales from './components/Sales';
import Purchases from './components/Purchases';
import MobileView from './components/MobileView';

type Module = 'dashboard' | 'bill' | 'sales' | 'inventory' | 'purchases' | 'admin';

const SidebarItem = ({ icon: Icon, label, description, active, onClick }: { icon: any, label: string, description: string, active?: boolean, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`p-4 rounded-2xl flex items-start gap-4 cursor-pointer transition-all border ${active ? 'bg-[#0A1A2F]/40 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-[#111111] hover:bg-[#161616] border-transparent hover:border-white/5'}`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-blue-600 text-white' : 'bg-[#1A1A1A] text-gray-500'}`}>
      <Icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className={`text-sm font-bold truncate ${active ? 'text-white' : 'text-gray-300'}`}>{label}</h3>
      <p className="text-[10px] text-gray-500 font-medium truncate">{description}</p>
    </div>
  </div>
);

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <Dashboard onNavigate={(mod: Module) => setActiveModule(mod)} />;
      case 'inventory': return <Inventory />;
      case 'bill': return <QuickBill />;
      case 'sales': return <Sales />;
      case 'purchases': return <Purchases />;
      case 'admin': return <AdminModule />;
      default: return (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-600 h-[600px] bg-[#0A0A0A] border border-white/10 rounded-[32px]">
          <Package size={48} className="mb-4 opacity-20" />
          <h2 className="text-xl font-bold uppercase tracking-[0.2em] opacity-40 italic">Module Under Development</h2>
          <p className="text-xs mt-2 font-medium">This section will be available in the next release.</p>
        </div>
      );
    }
  };

  const { width } = useWindowSize();
  const isMobile = width < 1024;

  if (isMobile) {
    return <MobileView />;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col p-4 md:p-6 lg:p-8 pb-32 md:pb-8 selection:bg-blue-600/30 max-w-full overflow-x-hidden">
      <div className="flex-1 flex gap-8">
        {/* Sidebar (Desktop Only) */}
        <aside className="w-72 hidden xl:flex flex-col gap-8 sticky top-8 h-fit self-start">
          <div className="flex items-center px-2">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Features</h2>
          </div>

          <div className="flex flex-col gap-3 pr-2">
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              description="Overview and activity" 
              active={activeModule === 'dashboard'} 
              onClick={() => setActiveModule('dashboard')}
            />
            <SidebarItem 
              icon={ReceiptText} 
              label="Quick Bill" 
              description="Counter billing and scan" 
              active={activeModule === 'bill'} 
              onClick={() => setActiveModule('bill')}
            />
            <SidebarItem 
              icon={BarChart3} 
              label="Sales" 
              description="Sales register and parties" 
              active={activeModule === 'sales'} 
              onClick={() => setActiveModule('sales')}
            />
            <SidebarItem 
              icon={Package} 
              label="Inventory" 
              description="Items, stock, alerts" 
              active={activeModule === 'inventory'} 
              onClick={() => setActiveModule('inventory')}
            />
            <SidebarItem 
              icon={Truck} 
              label="Purchases" 
              description="Procurement and vendors" 
              active={activeModule === 'purchases'} 
              onClick={() => setActiveModule('purchases')}
            />
            <SidebarItem 
              icon={Settings2} 
              label="Admin" 
              description="Parties and Settings" 
              active={activeModule === 'admin'} 
              onClick={() => setActiveModule('admin')}
            />
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col min-h-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ 
                type: 'spring',
                stiffness: 500,
                damping: 35,
                mass: 0.5
              }}
              className="flex-1 overflow-y-auto custom-scrollbar pr-2"
            >
              {renderModule()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
