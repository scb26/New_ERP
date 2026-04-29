import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  IndianRupee,
  MoreVertical,
  CheckCircle2,
  Users,
  Plus,
  ShoppingCart,
  Trash2,
  ChevronDown,
  ChevronUp,
  Receipt,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Parties from './Parties';

export default function Sales() {
  const [activeTab, setActiveTab] = useState<'register' | 'parties' | 'create'>('register');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Invoice State
  const [parties, setParties] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [gstType, setGstType] = useState<'GST' | 'IGST'>('GST');

  useEffect(() => {
    fetchInvoices();
    fetchParties();
    fetchProducts();
  }, []);

  const fetchInvoices = () => {
    fetch('/api/invoices')
      .then(res => res.json())
      .then(data => {
        setInvoices(data.reverse());
        setLoading(false);
      });
  };

  const fetchParties = () => {
    fetch('/api/parties')
      .then(res => res.json())
      .then(data => setParties(data));
  };

  const fetchProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  };

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    const price = product.sellPrice || product.price || 0;
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, price, qty: 1, taxRate: 18 }]);
    }
  };

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return;
    setCart(cart.map(item => item.id === id ? { ...item, qty } : item));
  };

  const updateTax = (id: string, taxRate: number) => {
    setCart(cart.map(item => item.id === id ? { ...item, taxRate } : item));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const totalTax = cart.reduce((acc, item) => acc + (item.price * item.qty * item.taxRate / 100), 0);
  const totalAmount = subtotal + totalTax;

  const handleSubmitInvoice = async () => {
    if (!selectedParty) return alert('Please select a party');
    if (cart.length === 0) return alert('Please add items');

    const invoiceData = {
      customer: selectedParty.name,
      items: cart,
      subtotal,
      tax: totalTax,
      total: totalAmount,
      gstType
    };

    await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    });

    fetchInvoices();
    setActiveTab('register');
    setCart([]);
    setSelectedParty(null);
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.customer && inv.customer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalSalesValue = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {activeTab === 'register' ? 'Sales' : activeTab === 'parties' ? 'Parties' : 'New GST Invoice'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {activeTab === 'register' 
              ? 'Track all your GST invoices and revenue.' 
              : activeTab === 'parties' 
                ? 'Manage all your ledger accounts.' 
                : 'Create professional tax invoices for your customers.'}
          </p>
        </div>
        <div className="flex bg-[#0A0A0A] border border-white/5 p-1.5 rounded-2xl h-fit">
          <button 
            onClick={() => setActiveTab('register')}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'register' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
          >
            Register
          </button>
          <button 
            onClick={() => setActiveTab('parties')}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'parties' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
          >
            Parties
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
          >
            + New Invoice
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {activeTab === 'register' && (
          <motion.div 
            key="register"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.5 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[24px]">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Sales (Gross)</p>
                <h3 className="text-2xl font-black text-white">₹{totalSalesValue.toLocaleString()}</h3>
              </div>
              <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[24px]">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Invoices</p>
                <h3 className="text-2xl font-black text-white">{invoices.length}</h3>
              </div>
              <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[24px]">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">GST Collected</p>
                <h3 className="text-2xl font-black text-blue-500">₹{(totalSalesValue * 0.18).toLocaleString()}</h3>
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 rounded-[32px] overflow-x-auto">
               <div className="p-6 border-b border-white/5 flex items-center gap-4 min-w-[600px]">
                  <div className="flex-1 relative">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input 
                      placeholder="Search by invoice or customer..."
                      className="w-full bg-[#111111] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-blue-500/30 transition-all font-medium"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button className="p-3 bg-[#111111] border border-white/5 rounded-xl text-gray-500 hover:text-white transition-colors">
                    <Download size={14} />
                  </button>
               </div>
              <table className="w-full min-w-[800px]">
                <thead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">
                  <tr>
                    <th className="px-8 py-5 text-left">Invoice No</th>
                    <th className="px-8 py-5 text-left">Date</th>
                    <th className="px-8 py-5 text-left">Customer</th>
                    <th className="px-8 py-5 text-right">Amount</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group text-sm">
                      <td className="px-8 py-5">
                        <span className="font-bold text-blue-500">{inv.id}</span>
                      </td>
                      <td className="px-8 py-5 text-gray-500">
                        {new Date(inv.date).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-green-500" />
                          <span className="font-medium text-gray-200">{inv.customer || 'Walk-in'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-white">
                        ₹{inv.total.toLocaleString()}
                      </td>
                      <td className="px-8 py-5 text-center">
                         <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[9px] font-bold rounded-full uppercase tracking-widest border border-green-500/20">
                          Settled
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 text-gray-600">
                          <button className="w-8 h-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 flex items-center justify-center transition-all">
                            <Eye size={16} />
                          </button>
                          <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center transition-all">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredInvoices.length === 0 && (
                <div className="py-24 flex flex-col items-center justify-center text-gray-600">
                  <FileText size={48} className="mb-4 opacity-10" />
                  <p className="text-sm font-bold uppercase tracking-widest opacity-30">No Sales Records</p>
                  <p className="text-xs mt-1">Transactions from Quick Bill will appear here.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'parties' && (
          <motion.div 
            key="parties"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.5 }}
          >
            <Parties />
          </motion.div>
        )}

        {activeTab === 'create' && (
          <motion.div 
            key="create"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-1 xl:col-span-2 space-y-6">
              {/* Party Selection */}
              <div className="bg-[#0A0A0A] border border-white/5 p-6 md:p-8 rounded-[32px] md:rounded-[40px] space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg md:text-xl font-bold flex items-center gap-3">
                    <Users size={20} className="text-blue-500" /> Billing Details
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Customer</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-[#111111] border border-white/5 rounded-2xl px-4 py-4 text-sm font-medium focus:outline-none focus:border-blue-500/50 appearance-none text-white"
                        onChange={(e) => setSelectedParty(parties.find(p => p.id === e.target.value))}
                        value={selectedParty?.id || ''}
                      >
                        <option value="">Select Party...</option>
                        {parties.filter(p => p.type === 'customer').map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">GST Type</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setGstType('GST')}
                        className={`flex-1 py-4 rounded-2xl text-[9px] md:text-[10px] font-bold uppercase transition-all ${gstType === 'GST' ? 'bg-blue-600 text-white' : 'bg-[#111111] text-gray-500'}`}
                      >
                        Local
                      </button>
                      <button 
                        onClick={() => setGstType('IGST')}
                        className={`flex-1 py-4 rounded-2xl text-[9px] md:text-[10px] font-bold uppercase transition-all ${gstType === 'IGST' ? 'bg-blue-600 text-white' : 'bg-[#111111] text-gray-500'}`}
                      >
                        Inter-state
                      </button>
                    </div>
                  </div>
                </div>

                {selectedParty && (
                  <div className="p-4 md:p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Billing to</p>
                      <p className="text-sm font-bold">{selectedParty.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{selectedParty.phone} • {selectedParty.email || 'No email'}</p>
                    </div>
                    <button onClick={() => setSelectedParty(null)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="bg-[#0A0A0A] border border-white/5 p-6 md:p-8 rounded-[32px] md:rounded-[40px] space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg md:text-xl font-bold flex items-center gap-3">
                    <ShoppingCart size={20} className="text-blue-500" /> Line Items
                  </h3>
                </div>

                <div className="overflow-x-auto -mx-6 md:mx-0">
                  <div className="inline-block min-w-full align-middle px-6 md:px-0">
                    <table className="w-full">
                      <thead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">
                        <tr>
                          <th className="px-4 py-4 text-left">Product</th>
                          <th className="px-4 py-4 text-center">Qty</th>
                          <th className="px-4 py-4 text-right">Price</th>
                          <th className="px-4 py-4 text-center">GST %</th>
                          <th className="px-4 py-4 text-right">Total</th>
                          <th className="px-4 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {cart.map(item => (
                          <tr key={item.id} className="text-sm">
                            <td className="px-4 py-6 font-medium whitespace-nowrap">{item.name}</td>
                            <td className="px-4 py-6">
                              <div className="flex items-center justify-center gap-2 bg-[#111111] rounded-xl p-1 border border-white/5 w-fit mx-auto">
                                <button onClick={() => updateQty(item.id, item.qty - 1)} className="p-1 hover:text-blue-500 transition-colors"><ChevronDown size={14}/></button>
                                <span className="font-bold w-6 text-center text-xs">{item.qty}</span>
                                <button onClick={() => updateQty(item.id, item.qty + 1)} className="p-1 hover:text-blue-500 transition-colors"><ChevronUp size={14}/></button>
                              </div>
                            </td>
                            <td className="px-4 py-6 text-right font-medium">₹{item.price}</td>
                            <td className="px-4 py-6">
                              <select 
                                value={item.taxRate}
                                onChange={(e) => updateTax(item.id, Number(e.target.value))}
                                className="bg-transparent text-center w-full focus:outline-none cursor-pointer"
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                              </select>
                            </td>
                            <td className="px-4 py-6 text-right font-black">₹{((item.price * item.qty) * (1 + item.taxRate/100)).toFixed(2)}</td>
                            <td className="px-4 py-6 text-right">
                               <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="text-red-500/50 hover:text-red-500 transition-colors">
                                  <Trash2 size={16} />
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {cart.length === 0 && (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-700 bg-[#111111]/30 rounded-3xl border border-dashed border-white/5">
                    <Plus size={32} className="mb-2 opacity-10" />
                    <p className="text-xs font-bold uppercase tracking-widest opacity-20">No items added to invoice</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Product Search Side Panel */}
              <div className="bg-[#0A0A0A] border border-white/5 p-6 md:p-8 rounded-[32px] md:rounded-[40px] space-y-6">
                <div className="relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input 
                    placeholder="Search Products..."
                    className="w-full bg-[#111111] border border-white/5 rounded-2xl pl-10 pr-4 py-4 text-xs focus:outline-none focus:border-blue-500/30 font-medium"
                  />
                </div>
                
                <div className="space-y-2 max-h-[250px] md:max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {products.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="w-full p-4 bg-[#111111] border border-white/5 rounded-2xl flex items-center justify-between hover:bg-blue-600/10 hover:border-blue-500/30 transition-all group"
                    >
                      <div className="text-left">
                        <p className="text-xs font-bold group-hover:text-blue-500 tracking-tight">{p.name}</p>
                        <p className="text-[10px] text-gray-500">
                          {p.barcode ? `${p.barcode} • ` : ''}Stock: {p.stock} • ₹{p.sellPrice || p.price}
                        </p>
                      </div>
                      <Plus size={14} className="text-gray-600 group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary & Checkout */}
              <div className="bg-[#0D0D0D] border border-white/10 p-6 md:p-8 rounded-[32px] md:rounded-[40px] space-y-6 shadow-2xl">
                <h3 className="text-lg md:text-xl font-bold border-b border-white/5 pb-4">Order Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Subtotal</span>
                    <span className="font-bold text-sm">₹{subtotal.toFixed(2)}</span>
                  </div>
                  
                  {gstType === 'GST' ? (
                    <>
                      <div className="flex justify-between items-center text-blue-500/70">
                        <span className="text-[10px] uppercase font-bold tracking-widest">CGST ({(totalTax/subtotal*100/2 || 0).toFixed(1)}%)</span>
                        <span className="text-[10px] font-bold">₹{(totalTax/2).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-blue-500/70">
                        <span className="text-[10px] uppercase font-bold tracking-widest">SGST ({(totalTax/subtotal*100/2 || 0).toFixed(1)}%)</span>
                        <span className="text-[10px] font-bold">₹{(totalTax/2).toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center text-blue-500/70">
                      <span className="text-[10px] uppercase font-bold tracking-widest">IGST ({(totalTax/subtotal*100 || 0).toFixed(1)}%)</span>
                      <span className="text-[10px] font-bold">₹{totalTax.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest">Grand Total</span>
                    <span className="text-xl md:text-2xl font-black text-white">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={handleSubmitInvoice}
                  disabled={!selectedParty || cart.length === 0}
                  className="w-full py-4 bg-blue-600 text-white rounded-[20px] md:rounded-[24px] font-black uppercase tracking-widest text-[10px] md:text-[11px] shadow-2xl shadow-blue-900/40 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  Finalize Invoice
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

