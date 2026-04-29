import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Truck, 
  Store,
  DollarSign,
  Calendar,
  Package,
  History,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Purchases() {
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [view, setView] = useState<'new' | 'history'>('new');
  const [successPurchase, setSuccessPurchase] = useState<any>(null);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: '', phone: '', email: '', balance: 0, type: 'vendor' as const });

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
    fetchVendors();
    fetch('/api/purchases').then(res => res.json()).then(setInvoices);
  }, []);

  const fetchVendors = () => {
    fetch('/api/parties').then(res => res.json()).then(data => {
      setVendors(data.filter((p: any) => p.type === 'vendor'));
    });
  };

  const handleAddVendor = async () => {
    if (!newVendor.name) return;
    const res = await fetch('/api/parties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVendor)
    });
    if (res.ok) {
      const vendor = await res.json();
      setVendors([vendor, ...vendors]);
      setSelectedVendor(vendor);
      setShowAddVendorModal(false);
      setNewVendor({ name: '', phone: '', email: '', balance: 0, type: 'vendor' });
    }
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.costPrice * item.qty), 0);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const handleSettle = async () => {
    if (!selectedVendor) {
      alert('Please select a vendor first');
      return;
    }
    if (cart.length === 0) return;

    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart,
        total: totalAmount,
        vendor: selectedVendor
      })
    });

    if (res.ok) {
      const purchase = await res.json();
      setInvoices([purchase, ...invoices]);
      setSuccessPurchase(purchase);
      setCart([]);
      setSelectedVendor(null);
      // Refresh products (stock increased)
      fetch('/api/products').then(res => res.json()).then(setProducts);
    }
  };

  const filteredItems = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-[#0A0A0A] p-4 rounded-3xl border border-white/5">
        <div className="flex items-center gap-3">
          <Truck size={20} className="text-orange-500" />
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Restock Workflow</h3>
        </div>
        <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl">
           <button 
            onClick={() => setView('new')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${view === 'new' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:text-white'}`}
           >
             NEW VOUCHER
           </button>
           <button 
            onClick={() => setView('history')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${view === 'history' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:text-white'}`}
           >
             LOGS
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'new' ? (
          <motion.div 
            key="new-purchase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8"
          >
            {/* Procurement Area */}
            <div className="space-y-6">
              {/* Vendor Selection */}
              <div className="bg-orange-600/5 border border-orange-500/10 p-6 rounded-[32px] space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Truck className="text-orange-500" size={20} />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-orange-500">Select Vendor</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <select 
                      className="w-full bg-[#111111] border border-white/5 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:border-orange-500/50 appearance-none font-medium"
                      value={selectedVendor?.id || ''}
                      onChange={(e) => setSelectedVendor(vendors.find(v => v.id === e.target.value))}
                    >
                      <option value="">Choose a Vendor...</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.phone})</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => setShowAddVendorModal(true)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-orange-600/10 text-orange-500 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-lg shadow-orange-900/10"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {selectedVendor && (
                    <div className="bg-[#111111] border border-white/5 rounded-2xl px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Last Balance</p>
                        <p className="text-sm font-bold text-gray-200">₹{selectedVendor.balance.toLocaleString()}</p>
                      </div>
                      <button onClick={() => setSelectedVendor(null)}><X size={16} className="text-gray-600 hover:text-white" /></button>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Selection */}
              <div className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-6 space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    placeholder="Search products by barcode or name..."
                    className="w-full bg-[#111111] border border-white/5 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-orange-500/50 transition-all font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.slice(0, 6).map(p => (
                    <button 
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="p-4 bg-[#111111] border border-white/5 rounded-2xl hover:border-orange-500/30 transition-all text-left flex flex-col gap-2 group"
                    >
                      <div className="flex justify-between items-start">
                         <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-xs">{p.name.charAt(0)}</div>
                         <Plus size={14} className="text-gray-600 group-hover:text-orange-500" />
                      </div>
                      <p className="text-xs font-bold text-gray-300 truncate">{p.name}</p>
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Cost: ₹{p.costPrice}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart & Settlement Area */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-[40px] p-8 flex flex-col h-fit sticky top-8">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <h3 className="text-xl font-bold">Purchase Cart</h3>
                <span className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-[10px] font-bold uppercase tracking-widest">{cart.length} Items</span>
              </div>

              <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 mb-8">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 bg-[#111111] p-4 rounded-2xl">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-200">{item.name}</p>
                      <p className="text-[10px] text-gray-600">Unit Cost: ₹{item.costPrice}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-black/40 rounded-xl p-1 border border-white/5">
                       <button onClick={() => setCart(cart.map(i => i.id === item.id ? {...i, qty: Math.max(1, i.qty - 1)} : i))} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-white">-</button>
                       <span className="text-xs font-black min-w-[20px] text-center">{item.qty}</span>
                       <button onClick={() => setCart(cart.map(i => i.id === item.id ? {...i, qty: i.qty + 1} : i))} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-white">+</button>
                    </div>
                    <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-red-500/50 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="text-center py-12 text-gray-600">
                    <Package size={32} className="mx-auto mb-2 opacity-10" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Cart is empty</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-500 text-xs font-bold">Total Bill Amount</p>
                  <p className="text-2xl font-black text-white">₹{totalAmount.toLocaleString()}</p>
                </div>
                <button 
                  disabled={!selectedVendor || cart.length === 0}
                  onClick={handleSettle}
                  className="w-full py-5 bg-orange-600 disabled:opacity-30 disabled:hover:scale-100 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-900/40 hover:bg-orange-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <DollarSign size={18} /> RECORD PURCHASE & SETTLE
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="purchase-history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#0A0A0A] border border-white/10 rounded-[32px] overflow-hidden"
          >
            <table className="w-full">
              <thead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">
                <tr>
                  <th className="px-8 py-5 text-left">Purchase ID</th>
                  <th className="px-8 py-5 text-left">Vendor</th>
                  <th className="px-8 py-5 text-left">Total Items</th>
                  <th className="px-8 py-5 text-left">Amount</th>
                  <th className="px-8 py-5 text-left">Date</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5 font-mono text-xs text-orange-500 font-bold">{inv.id}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 text-[10px] font-black">V</div>
                        <span className="text-sm font-bold text-gray-200">{inv.vendor?.name || 'Walk-in Vendor'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-gray-400">{inv.items.length} SKUs</td>
                    <td className="px-8 py-5 font-black text-white">₹{inv.total.toLocaleString()}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={12} />
                        {new Date(inv.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 rounded-lg bg-white/5 text-gray-500 hover:text-white group-hover:bg-orange-600 transition-all">
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {invoices.length === 0 && (
              <div className="py-24 text-center text-gray-600">
                <History size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-[10px] font-bold uppercase tracking-widest">No purchase records found</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddVendorModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-[40px] w-full max-w-sm flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-bold">Quick Vendor Entry</h3>
                <button onClick={() => setShowAddVendorModal(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Business Name</label>
                  <input 
                    placeholder="e.g. Reliance Electronics"
                    className="w-full bg-[#111111] border border-white/5 rounded-2xl px-4 py-4 text-xs font-medium focus:border-orange-500/30"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contact Phone</label>
                  <input 
                    placeholder="10-digit mobile"
                    className="w-full bg-[#111111] border border-white/5 rounded-2xl px-4 py-4 text-xs font-medium focus:border-orange-500/30"
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
                  />
                </div>
                <button 
                  onClick={handleAddVendor}
                  className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-900/20 active:scale-95 transition-all mt-4"
                >
                  Save & Select Vendor
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successPurchase && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white text-black w-full max-w-lg rounded-[40px] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 bg-orange-600 text-white flex items-center justify-between">
                <div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">Purchase Recorded</h3>
                   <p className="text-[10px] font-bold opacity-80">INVOICE NO: {successPurchase.id}</p>
                </div>
                <button onClick={() => { setSuccessPurchase(null); setView('history'); }} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vendor</p>
                    <p className="font-bold text-lg">{successPurchase.vendor?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                    <p className="font-bold">{new Date(successPurchase.date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                   {successPurchase.items.map((item: any) => (
                     <div key={item.id} className="flex justify-between items-center text-sm">
                        <p className="text-gray-600 font-medium">{item.name} <span className="text-gray-400 ml-1">x {item.qty}</span></p>
                        <p className="font-bold">₹{(item.costPrice * item.qty).toLocaleString()}</p>
                     </div>
                   ))}
                </div>

                <div className="pt-6 border-t border-gray-100">
                   <div className="flex justify-between items-center mb-1">
                      <p className="text-gray-400 text-sm font-medium">Subtotal</p>
                      <p className="font-bold text-sm">₹{successPurchase.total.toLocaleString()}</p>
                   </div>
                   <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-gray-100 mt-4">
                      <p className="text-lg font-black uppercase tracking-widest text-orange-600">Total Amount</p>
                      <p className="text-3xl font-black text-black tracking-tighter">₹{successPurchase.total.toLocaleString()}</p>
                   </div>
                </div>

                <div className="pt-4 flex gap-4">
                   <button 
                    onClick={() => { setSuccessPurchase(null); setView('history'); }}
                    className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-200"
                   >
                     CLOSE VOUCHER
                   </button>
                   <button 
                    onClick={() => window.print()}
                    className="w-14 h-14 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-all"
                   >
                     <Store size={20} />
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
