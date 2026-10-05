import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ReceiptText, 
  LayoutDashboard, 
  BarChart3, 
  Package, 
  Truck, 
  Settings2, 
  Wallet, 
  Sun, 
  Moon, 
  ArrowRight, 
  MessageSquare, 
  X, 
  AlertCircle,
  Command,
  CornerDownLeft,
  Sparkles,
  IndianRupee
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface ProductItem {
  id: string;
  name: string;
  barcode?: string;
  hsnCode?: string;
  sellPrice: number;
  stock: number;
  category?: string;
  costPrice?: number;
}

interface PartyItem {
  id: string;
  name: string;
  phone?: string;
  type: string;
  balance: number;
}

interface OmniSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: 'dashboard' | 'bill' | 'sales' | 'inventory' | 'purchases' | 'admin') => void;
  onOpenCashDrawer: () => void;
  onSelectProduct?: (product: ProductItem) => void;
}

export const OmniSearchModal: React.FC<OmniSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenCashDrawer,
  onSelectProduct
}) => {
  const { user, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [parties, setParties] = useState<PartyItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCashier = user?.role === 'cashier';

  // Fetch products and parties when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch('/api/products', { headers })
        .then(res => res.json())
        .then(data => setProducts(Array.isArray(data) ? data : []))
        .catch(() => {});

      fetch('/api/parties', { headers })
        .then(res => res.json())
        .then(data => setParties(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [isOpen, token]);

  // System Navigation Actions
  const systemActions = [
    {
      id: 'nav-bill',
      type: 'action',
      title: 'Quick Bill (POS Checkout)',
      subtitle: 'Counter billing, barcode scanning and receipts',
      icon: ReceiptText,
      shortcut: 'Alt+2',
      handler: () => { onNavigate('bill'); onClose(); }
    },
    {
      id: 'nav-dashboard',
      type: 'action',
      title: 'Dashboard Overview',
      subtitle: 'Business KPIs, sales metrics and recent transactions',
      icon: LayoutDashboard,
      shortcut: 'Alt+1',
      handler: () => { onNavigate('dashboard'); onClose(); }
    },
    {
      id: 'nav-inventory',
      type: 'action',
      title: 'Inventory & Stock Management',
      subtitle: 'Items catalog, prices, GST slabs, low-stock alerts',
      icon: Package,
      shortcut: 'Alt+4',
      handler: () => { onNavigate('inventory'); onClose(); }
    },
    {
      id: 'nav-sales',
      type: 'action',
      title: 'Sales Register',
      subtitle: 'Invoice audit logs, customer histories, GSTR-1 data',
      icon: BarChart3,
      shortcut: 'Alt+3',
      handler: () => { onNavigate('sales'); onClose(); }
    },
    ...(!isCashier ? [
      {
        id: 'nav-purchases',
        type: 'action',
        title: 'Purchases & Procurement',
        subtitle: 'Vendor bills, inward inventory entries, payables',
        icon: Truck,
        shortcut: 'Alt+5',
        handler: () => { onNavigate('purchases'); onClose(); }
      },
      {
        id: 'nav-admin',
        type: 'action',
        title: 'Admin & Khata Ledger',
        subtitle: 'Store profile, GSTIN, double-entry party ledgers',
        icon: Settings2,
        shortcut: 'Alt+6',
        handler: () => { onNavigate('admin'); onClose(); }
      }
    ] : []),
    {
      id: 'action-cash-drawer',
      type: 'action',
      title: 'Cash Register Drawer & Z-Report',
      subtitle: 'Manage shift float, petty cash in/out, and day-end reconciliation',
      icon: Wallet,
      shortcut: 'Ctrl+D',
      handler: () => { onOpenCashDrawer(); onClose(); }
    },
    {
      id: 'action-theme',
      type: 'action',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      subtitle: `Toggle visual appearance to ${theme === 'dark' ? 'clean light' : 'sleek dark'} theme`,
      icon: theme === 'dark' ? Sun : Moon,
      shortcut: '',
      handler: () => { toggleTheme(); onClose(); }
    }
  ];

  // Filtered Results
  const trimmed = query.trim().toLowerCase();

  const filteredActions = systemActions.filter(a => 
    !trimmed || a.title.toLowerCase().includes(trimmed) || a.subtitle.toLowerCase().includes(trimmed)
  );

  const filteredProducts = products.filter(p => {
    if (!trimmed) return false;
    return (
      p.name.toLowerCase().includes(trimmed) ||
      (p.barcode && p.barcode.toLowerCase().includes(trimmed)) ||
      (p.category && p.category.toLowerCase().includes(trimmed))
    );
  }).slice(0, 5);

  const filteredParties = parties.filter(p => {
    if (!trimmed) return false;
    return (
      p.name.toLowerCase().includes(trimmed) ||
      (p.phone && p.phone.toLowerCase().includes(trimmed))
    );
  }).slice(0, 4);

  // Unified items list for keyboard navigation
  type FlatItem = 
    | { kind: 'action'; data: typeof systemActions[0] }
    | { kind: 'product'; data: ProductItem }
    | { kind: 'party'; data: PartyItem };

  const allItems: FlatItem[] = [
    ...filteredActions.map(a => ({ kind: 'action' as const, data: a })),
    ...filteredProducts.map(p => ({ kind: 'product' as const, data: p })),
    ...filteredParties.map(p => ({ kind: 'party' as const, data: p }))
  ];

  // Clamp selected index
  useEffect(() => {
    if (selectedIndex >= allItems.length) {
      setSelectedIndex(Math.max(0, allItems.length - 1));
    }
  }, [allItems.length, selectedIndex]);

  // Handle WhatsApp Reminder for a party
  const sendWhatsAppReminder = (party: PartyItem) => {
    const phone = (party.phone || '').replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Namaste ${party.name},\nThis is a gentle reminder from our store regarding your outstanding Khata balance of ₹${Math.abs(party.balance).toLocaleString()}.\nPlease make payment at your earliest convenience via UPI or cash. Thank you!`
    );
    const url = phone ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + Math.max(1, allItems.length)) % Math.max(1, allItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (current) {
        if (current.kind === 'action') {
          current.data.handler();
        } else if (current.kind === 'product') {
          if (onSelectProduct) {
            onSelectProduct(current.data);
          } else {
            onNavigate('bill');
          }
          onClose();
        } else if (current.kind === 'party') {
          sendWhatsAppReminder(current.data);
          onClose();
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-start justify-center pt-16 md:pt-24 px-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 rounded-[28px] shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-white"
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input */}
        <div className="p-4 md:p-5 border-b border-slate-100 dark:border-white/5 flex items-center gap-3">
          <Search size={20} className="text-slate-400 dark:text-gray-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a product, customer name, barcode, or command..."
            className="w-full bg-transparent border-none outline-none text-sm md:text-base font-medium placeholder:text-slate-400 dark:placeholder:text-gray-600 text-slate-900 dark:text-white"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          ) : (
            <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-gray-600 border border-slate-200 dark:border-white/10 rounded-md px-1.5 py-0.5">
              ESC
            </span>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 custom-scrollbar">

          {/* Section: Matching Products */}
          {filteredProducts.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-gray-500">
                Products & Inventory ({filteredProducts.length})
              </p>
              <div className="space-y-1">
                {filteredProducts.map((p, idx) => {
                  const globalIdx = filteredActions.length + idx;
                  const isSelected = selectedIndex === globalIdx;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (onSelectProduct) onSelectProduct(p);
                        else onNavigate('bill');
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-500/30' 
                          : 'hover:bg-slate-50 dark:hover:bg-[#161616] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-[#1E1E1E] text-slate-500'
                        }`}>
                          <Package size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-gray-200 truncate">{p.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-gray-500">
                            {p.barcode && <span>Barcode: {p.barcode}</span>}
                            <span>•</span>
                            <span className={p.stock <= 5 ? 'text-red-500 font-bold' : 'text-emerald-500'}>
                              Stock: {p.stock}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          ₹{p.sellPrice.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hidden sm:inline">
                          Add to Bill ↵
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Customers / Khata Debtors */}
          {filteredParties.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-gray-500">
                Customers & Khata Debtors ({filteredParties.length})
              </p>
              <div className="space-y-1">
                {filteredParties.map((party, idx) => {
                  const globalIdx = filteredActions.length + filteredProducts.length + idx;
                  const isSelected = selectedIndex === globalIdx;
                  return (
                    <div
                      key={party.id}
                      onClick={() => {
                        sendWhatsAppReminder(party);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30' 
                          : 'hover:bg-slate-50 dark:hover:bg-[#161616] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-[#1E1E1E] text-slate-500'
                        }`}>
                          <MessageSquare size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-gray-200 truncate">{party.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-gray-500">
                            {party.phone || 'No phone'} • {party.type.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-[9px] uppercase font-bold text-slate-400">Balance</p>
                          <p className={`font-mono font-bold text-xs ${party.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {party.balance > 0 ? `₹${party.balance.toLocaleString()} Due` : `₹${Math.abs(party.balance).toLocaleString()} Advance`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sendWhatsAppReminder(party);
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                          title="Send WhatsApp payment reminder"
                        >
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: System Actions & Navigation */}
          {filteredActions.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-gray-500">
                Commands & Shortcuts
              </p>
              <div className="space-y-1">
                {filteredActions.map((action, idx) => {
                  const isSelected = selectedIndex === idx;
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.id}
                      onClick={action.handler}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-500/30 text-blue-600 dark:text-white' 
                          : 'hover:bg-slate-50 dark:hover:bg-[#161616] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-[#1E1E1E] text-slate-500 dark:text-gray-400'
                        }`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-slate-800 dark:text-gray-200">{action.title}</p>
                          <p className="text-[10px] text-slate-400 dark:text-gray-500 truncate">{action.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {action.shortcut && (
                          <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-gray-500 bg-slate-100 dark:bg-[#1E1E1E] px-2 py-0.5 rounded-md">
                            {action.shortcut}
                          </span>
                        )}
                        <ArrowRight size={14} className="text-slate-400 dark:text-gray-600" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {allItems.length === 0 && (
            <div className="p-10 text-center text-slate-400 dark:text-gray-600 space-y-2">
              <Search size={32} className="mx-auto opacity-30" />
              <p className="text-xs font-bold">No results found for &quot;{query}&quot;</p>
              <p className="text-[10px]">Try searching by item name, barcode, party name, or navigation keywords.</p>
            </div>
          )}
        </div>

        {/* Footer Hotkey Legend */}
        <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#141414] flex items-center justify-between text-[10px] text-slate-500 dark:text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="font-mono bg-white dark:bg-[#202020] border border-slate-200 dark:border-white/10 px-1 rounded">↑↓</span> to navigate
            </span>
            <span className="flex items-center gap-1">
              <span className="font-mono bg-white dark:bg-[#202020] border border-slate-200 dark:border-white/10 px-1 rounded">↵</span> to select
            </span>
            <span className="flex items-center gap-1">
              <span className="font-mono bg-white dark:bg-[#202020] border border-slate-200 dark:border-white/10 px-1 rounded">ESC</span> to close
            </span>
          </div>
          <span className="font-bold flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <Sparkles size={12} /> Local OmniSearch
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default OmniSearchModal;
