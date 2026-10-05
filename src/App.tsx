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
  Settings2 as SettingsIcon,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminModule from './components/AdminModule';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import QuickBill from './components/QuickBill';
import Sales from './components/Sales';
import Purchases from './components/Purchases';
import MobileView from './components/MobileView';
import AITeam from './components/AITeam';
import AITeamFloat from './components/AITeamFloat';
import OmniSearchModal from './components/OmniSearchModal';
import CashDrawerModal from './components/CashDrawerModal';

import ThemeToggle from './components/ThemeToggle';
import { useAuth } from './context/AuthContext';
import LoginModal from './components/LoginModal';
import { UserCheck, Wallet, Command } from 'lucide-react';

type Module = 'dashboard' | 'bill' | 'sales' | 'inventory' | 'purchases' | 'admin' | 'ai-team';

const SidebarItem = ({ icon: Icon, label, description, active, onClick }: { icon: any, label: string, description: string, active?: boolean, onClick: () => void }) => (
  <div 
    onClick={onClick}
    className={`p-4 rounded-2xl flex items-start gap-4 cursor-pointer transition-all border ${
      active 
        ? 'bg-blue-50/80 dark:bg-[#0A1A2F]/40 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)] text-blue-600 dark:text-white' 
        : 'bg-white dark:bg-[#111111] hover:bg-slate-100 dark:hover:bg-[#161616] border-slate-200 dark:border-transparent hover:border-slate-300 dark:hover:border-white/5 shadow-xs dark:shadow-none'
    }`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-[#1A1A1A] text-slate-500 dark:text-gray-500'}`}>
      <Icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className={`text-sm font-bold truncate ${active ? 'text-blue-900 dark:text-white' : 'text-slate-800 dark:text-gray-300'}`}>{label}</h3>
      <p className="text-[10px] text-slate-500 dark:text-gray-500 font-medium truncate">{description}</p>
    </div>
  </div>
);

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [isOmniSearchOpen, setIsOmniSearchOpen] = useState(false);
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);
  const { user, isLoginModalOpen, setIsLoginModalOpen } = useAuth();
  const isCashier = user?.role === 'cashier';

  // Global Keyboard Shortcuts (Ctrl+K: OmniSearch, Ctrl+D: Drawer, Alt+1-6: Modules)
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOmniSearchOpen(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsCashDrawerOpen(prev => !prev);
      } else if (e.altKey && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        const map: Record<string, Module> = {
          '1': 'dashboard',
          '2': 'bill',
          '3': 'sales',
          '4': 'inventory',
          '5': 'purchases',
          '6': 'admin'
        };
        const target = map[e.key];
        if (target && !(isCashier && (target === 'purchases' || target === 'admin'))) {
          setActiveModule(target);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isCashier]);

  // If cashier tries to access restricted modules, fallback to dashboard or bill
  const safeActiveModule = (isCashier && (activeModule === 'admin' || activeModule === 'purchases')) ? 'bill' : activeModule;

  const renderModule = () => {
    switch (safeActiveModule) {
      case 'dashboard': return <Dashboard onNavigate={(mod: Module) => setActiveModule(mod)} />;
      case 'inventory': return <Inventory />;
      case 'bill': return <QuickBill />;
      case 'sales': return <Sales />;
      case 'purchases': return <Purchases />;
      case 'admin': return <AdminModule />;
      case 'ai-team': return <AITeam />;
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
    <div className="h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-white font-sans flex flex-col p-4 md:p-5 selection:bg-blue-600/30 max-w-full overflow-hidden transition-colors duration-200">
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Sidebar (Desktop Only) */}
        <aside className="w-64 hidden xl:flex flex-col gap-4 h-full shrink-0">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Features</h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsOmniSearchOpen(true)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1A1A1A] dark:hover:bg-[#222222] text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
                title="Search anything (Ctrl+K)"
              >
                <Search size={16} />
              </button>
              <ThemeToggle />
            </div>
          </div>

          {/* User Profile Card & Role Switcher */}
          <div 
            onClick={() => setIsLoginModalOpen(true)}
            className="p-3.5 bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-between cursor-pointer hover:border-blue-500/40 transition-all shadow-xs group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                user?.role === 'admin' 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                  : user?.role === 'cashier'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
              }`}>
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate text-slate-800 dark:text-gray-200">{user?.name || 'Operator'}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                    user?.role === 'admin'
                      ? 'bg-red-500/10 text-red-500'
                      : user?.role === 'cashier'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    {user?.role || 'Guest'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-gray-500">Switch</span>
                </div>
              </div>
            </div>
            <UserCheck size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
          </div>

          <div className="flex flex-col gap-2 pr-1 overflow-y-auto custom-scrollbar flex-1">
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Dashboard" 
              description="Overview and activity" 
              active={safeActiveModule === 'dashboard'} 
              onClick={() => setActiveModule('dashboard')}
            />
            <SidebarItem 
              icon={ReceiptText} 
              label="Quick Bill" 
              description="Counter billing and scan" 
              active={safeActiveModule === 'bill'} 
              onClick={() => setActiveModule('bill')}
            />
            <SidebarItem 
              icon={BarChart3} 
              label="Sales" 
              description="Sales register and parties" 
              active={safeActiveModule === 'sales'} 
              onClick={() => setActiveModule('sales')}
            />
            <SidebarItem 
              icon={Package} 
              label="Inventory" 
              description="Items, stock, alerts" 
              active={safeActiveModule === 'inventory'} 
              onClick={() => setActiveModule('inventory')}
            />
            {!isCashier && (
              <SidebarItem 
                icon={Truck} 
                label="Purchases" 
                description="Procurement and vendors" 
                active={safeActiveModule === 'purchases'} 
                onClick={() => setActiveModule('purchases')}
              />
            )}
            {!isCashier && (
              <SidebarItem 
                icon={Settings2} 
                label="Admin" 
                description="Parties and Settings" 
                active={safeActiveModule === 'admin'} 
                onClick={() => setActiveModule('admin')}
              />
            )}
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
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
              className="flex-1 overflow-y-auto custom-scrollbar pr-2 h-full"
            >
              {renderModule()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* OmniSearch Global Command Palette (Ctrl+K) */}
      <OmniSearchModal
        isOpen={isOmniSearchOpen}
        onClose={() => setIsOmniSearchOpen(false)}
        onNavigate={(mod) => setActiveModule(mod)}
        onOpenCashDrawer={() => setIsCashDrawerOpen(true)}
      />

      {/* Cash Drawer Shift Modal (Ctrl+D) */}
      <CashDrawerModal
        isOpen={isCashDrawerOpen}
        onClose={() => setIsCashDrawerOpen(false)}
      />

      {/* Operator Switching / Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
}
