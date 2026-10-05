import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  Package, 
  Settings2, 
  Scan,
  Plus,
  Truck,
  ReceiptText,
  X,
  Camera,
  Trash2,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import Dashboard from './Dashboard';
import Inventory from './Inventory';
import Sales from './Sales';
import Purchases from './Purchases';
import AdminModule from './AdminModule';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';

type MobileModule = 'dashboard' | 'sales' | 'inventory' | 'purchases' | 'settings' | 'scanner';

export default function MobileView() {
  const { user, isLoginModalOpen, setIsLoginModalOpen } = useAuth();
  const isCashier = user?.role === 'cashier';
  const [activeTab, setActiveTab] = useState<MobileModule>('dashboard');
  const [cart, setCart] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);


  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    
    if (isScanning) {
      const config = { fps: 15, qrbox: { width: 250, height: 250 } };
      html5QrCode = new Html5Qrcode("mobile-scanner");
      
      html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          const product = products.find(p => p.id === decodedText || p.name.toLowerCase() === decodedText.toLowerCase());
          if (product) {
            handleAddToCart(product);
            // Vibrating on success if possible
            if (window.navigator.vibrate) window.navigator.vibrate(100);
          }
        },
        (errorMessage) => {
          // ignore scan errors
        }
      ).catch(err => {
        console.error("Camera Error:", err);
      });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error(err));
      }
    };
  }, [isScanning, products]);

  const handleAddToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={(mod: string) => {
        if (mod === 'bill') setActiveTab('scanner');
        else if (mod === 'admin') setActiveTab('settings');
        else setActiveTab(mod as MobileModule);
      }} />;
      case 'inventory': return <Inventory />;
      case 'purchases': return <Purchases />;
      case 'sales': return <Sales />;
      case 'settings': return <AdminModule />;
      case 'scanner': return (
        <div className="flex-1 flex flex-col items-center justify-center relative bg-black overflow-hidden">
          <div id="mobile-scanner" className="w-full h-full"></div>
          
          <div className="absolute top-10 left-0 right-0 p-6 flex items-center justify-between z-20">
            <h2 className="text-xl font-bold bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 uppercase tracking-widest text-[10px]">Smart Scanner</h2>
            <button 
              onClick={() => { setIsScanning(false); setActiveTab('dashboard'); }}
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10"
            >
              <X size={20} />
            </button>
          </div>

          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div className="w-64 h-64 border-2 border-blue-500/50 rounded-3xl relative">
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl transition-all animate-pulse"></div>
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl animate-pulse"></div>
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl animate-pulse"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl animate-pulse"></div>
                <div className="absolute inset-0 bg-blue-500/5 animate-pulse rounded-3xl"></div>
             </div>
          </div>

          {!isScanning && (
            <div className="absolute inset-0 z-10 bg-black/90 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 rounded-[32px] bg-blue-600/20 flex items-center justify-center mb-6 border border-blue-500/20">
                <Camera size={40} className="text-blue-500" />
              </div>
              <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Camera Restricted</h2>
              <p className="text-gray-500 text-sm mb-8">Please grant camera permissions to use the fast-scanning feature.</p>
              <button 
                onClick={() => setIsScanning(true)}
                className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-2xl shadow-blue-900/50"
              >
                Tap to Open Camera
              </button>
            </div>
          )}
          
          <button className="absolute bottom-40 right-6 w-14 h-14 bg-white text-black rounded-full shadow-2xl flex items-center justify-center border-4 border-black active:scale-90 transition-transform z-30">
            <Plus size={24} />
          </button>
        </div>
      );
      default: return <Dashboard onNavigate={(mod: string) => {
        if (mod === 'bill') setActiveTab('scanner');
        else if (mod === 'admin') setActiveTab('settings');
        else setActiveTab(mod as MobileModule);
      }} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 text-slate-900 dark:bg-black dark:text-white flex flex-col overflow-hidden select-none transition-colors duration-200">
      
      {/* Mobile Top Header Bar (when not in full screen scanner) */}
      {activeTab !== 'scanner' && (
        <header className="h-14 px-4 bg-white/80 dark:bg-[#0D0D0D]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <h1 className="text-sm font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              Unidex ERP
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 text-[10px] font-bold"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                user?.role === 'admin' ? 'bg-red-500' : user?.role === 'cashier' ? 'bg-emerald-500' : 'bg-blue-500'
              }`} />
              <span className="capitalize">{user?.role || 'Guest'}</span>
            </button>
            <ThemeToggle />
          </div>
        </header>
      )}

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ 
              type: 'spring', 
              stiffness: 500, 
              damping: 40, 
              mass: 0.5
            }}
            className="h-full overflow-y-auto p-4 pb-20 custom-scrollbar"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Cart Summary - Anchored just above the nav bar */}
      <AnimatePresence>
        {activeTab !== 'scanner' && cart.length > 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="px-4 pb-2"
          >
            <div 
              onClick={() => setShowCart(true)}
              className="bg-blue-600 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-blue-900/40 text-white cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ReceiptText size={18} />
                <span className="text-xs font-black uppercase tracking-widest">{cart.reduce((a, b) => a + b.qty, 0)} Items • ₹{total}</span>
              </div>
              <ChevronUp size={16} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Static/Docked */}
      <nav className="bg-white dark:bg-[#0D0D0D] border-t border-slate-200 dark:border-white/10 h-20 px-4 flex items-center justify-between relative z-[80] shadow-2xl">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${activeTab === 'dashboard' ? 'text-blue-500' : 'text-gray-600'}`}
        >
          <LayoutDashboard size={22} />
          <span className="text-[8px] font-black uppercase tracking-tighter">Home</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('sales')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${activeTab === 'sales' ? 'text-blue-500' : 'text-gray-600'}`}
        >
          <BarChart3 size={22} />
          <span className="text-[8px] font-black uppercase tracking-tighter">Sales</span>
        </button>

        {/* Central Scan Button - Integrated into bar but elevated */}
        <div className="flex-1 flex justify-center -mt-8">
          <button 
            onClick={() => {
              setActiveTab('scanner');
              setIsScanning(true);
            }}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 border-4 border-slate-50 dark:border-[#0D0D0D] ${activeTab === 'scanner' ? 'bg-white text-black' : 'bg-blue-600 text-white shadow-blue-900/60'}`}
          >
            <Scan size={24} />
          </button>
        </div>

        <button 
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${activeTab === 'inventory' ? 'text-blue-500' : 'text-gray-600'}`}
        >
          <Package size={20} />
          <span className="text-[8px] font-black uppercase tracking-tighter">Stock</span>
        </button>

        {!isCashier && (
          <button 
            onClick={() => setActiveTab('purchases')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${activeTab === 'purchases' ? 'text-orange-500' : 'text-gray-600'}`}
          >
            <Truck size={20} />
            <span className="text-[8px] font-black uppercase tracking-tighter">Procure</span>
          </button>
        )}

        {!isCashier && (
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${activeTab === 'settings' ? 'text-blue-500' : 'text-gray-600'}`}
          >
            <Settings2 size={22} />
            <span className="text-[8px] font-black uppercase tracking-tighter">Admin</span>
          </button>
        )}
      </nav>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
}
