import React, { useState, useEffect } from 'react';
import { 
  QrCode,
  Banknote,
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Zap,
  CreditCard,
  User,
  Camera,
  X,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QuickBill() {
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
    fetch('/api/parties')
      .then(res => res.json())
      .then(data => {
        setParties(data.filter((p: any) => p.type === 'customer'));
      });
    
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data));
  }, []);

  const fetchProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  };

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        "barcode-reader",
        { fps: 15, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render((decodedText) => {
        const product = products.find(p => p.id === decodedText || p.name.toLowerCase() === decodedText.toLowerCase());
        if (product) {
          addToCart(product);
          setIsScanning(false);
          scanner?.clear();
        }
      }, (error) => {
        // quiet
      });
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e));
      }
    };
  }, [isScanning, products]);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedParty(null);
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const totalAmount = subtotal * 1.18; // 18% GST

  const [showPartyList, setShowPartyList] = useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          total: totalAmount,
          customer: selectedParty ? selectedParty.name : 'Walk-in Customer',
          paymentMethod
        })
      });
      fetchProducts(); // Refresh stock
      setCart([]);
      setSelectedParty(null);
      setPaymentMethod(null);
      setShowCheckoutModal(false);
      alert('Quick Bill Completed!');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 xl:h-[calc(100vh-160px)] min-h-0">
      {/* Product Selection Area */}
      <div className="flex flex-col gap-6 xl:overflow-hidden min-h-[400px]">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              placeholder="Scan barcode or type name..."
              className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-medium text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsScanning(true)}
            className="px-6 h-14 bg-blue-600 text-white rounded-2xl flex items-center gap-3 hover:bg-blue-700 transition-all shadow-[0_10px_20px_rgba(37,99,235,0.3)] active:scale-95 group"
          >
            <div className="relative">
              <Camera size={20} className="group-hover:rotate-6 transition-transform" />
              <Zap size={10} className="absolute -top-1 -right-1 fill-yellow-400 text-yellow-400 animate-pulse" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Scan</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar pb-8">
          {filteredProducts.map(p => (
            <motion.div 
              whileHover={{ y: -4 }}
              key={p.id}
              onClick={() => addToCart(p)}
              className="bg-[#0A0A0A] border border-white/5 p-4 rounded-3xl cursor-pointer hover:border-blue-500/30 transition-all group flex flex-col"
            >
              <div className="aspect-square bg-[#111111] rounded-2xl mb-4 flex items-center justify-center text-2xl font-black text-gray-800 group-hover:text-blue-500 transition-colors relative overflow-hidden">
                {p.name.charAt(0)}
                {p.stock <= 5 && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/10 text-red-500 text-[8px] font-bold rounded-md">
                    LOW STOCK
                  </div>
                )}
              </div>
              <h4 className="font-bold text-gray-200 truncate text-sm">{p.name}</h4>
              <div className="flex items-center justify-between mt-2">
                <span className="text-blue-500 font-black text-sm">₹{p.price}</span>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{p.stock} Units</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart & Checkout Area */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-[40px] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 md:p-8 border-b border-white/5 relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <ShoppingCart size={20} className="text-blue-500" /> Cart
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {cart.length} Items
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => setShowPartyList(!showPartyList)}
            className="w-full p-4 bg-[#111111] border border-white/5 rounded-2xl flex items-center gap-3 hover:bg-[#161616] transition-colors group"
          >
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white transition-colors">
                <User size={18} />
             </div>
             <div className="text-left flex-1">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-none mb-1">Customer</p>
                <p className="text-sm font-bold text-gray-300 truncate max-w-[150px]">{selectedParty ? selectedParty.name : 'Walk-in Customer'}</p>
             </div>
             <Plus className={`text-gray-600 transition-transform ${showPartyList ? 'rotate-45' : ''}`} size={16} />
          </button>

          <AnimatePresence>
            {showPartyList && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-8 right-8 top-[140px] bg-[#0F0F0F] border border-white/20 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-20 max-h-60 overflow-y-auto custom-scrollbar"
              >
                <div 
                  onClick={() => { setSelectedParty(null); setShowPartyList(false); }}
                  className="p-4 hover:bg-white/5 cursor-pointer border-b border-white/5 text-sm font-bold text-blue-500"
                >
                  Walk-in Customer
                </div>
                {parties.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => { setSelectedParty(p); setShowPartyList(false); }}
                    className="p-4 hover:bg-white/5 cursor-pointer border-b border-white/5 flex flex-col"
                  >
                    <span className="text-sm font-bold text-gray-200">{p.name}</span>
                    <span className="text-[10px] text-gray-500 font-medium">Balance: ₹{p.balance}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
          <AnimatePresence initial={false}>
            {cart.map(item => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={item.id}
                className="flex items-center gap-3 md:gap-4 bg-[#111111] p-3 md:p-4 rounded-2xl group border border-transparent hover:border-white/5 transition-all text-xs"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate text-gray-200 tracking-tight">{item.name}</h4>
                  <p className="text-xs text-blue-500 font-black">₹{(item.price * item.qty).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 bg-black/40 rounded-xl p-1 border border-white/5">
                  <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:text-white text-gray-600 transition-colors"><Minus size={12} /></button>
                  <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:text-white text-gray-600 transition-colors"><Plus size={12} /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-gray-700 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-700 space-y-4 opacity-10 py-12 text-center grayscale">
              <ShoppingCart size={48} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Scan item or search to start</p>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 bg-[#0D0D0D] border-t border-white/5 space-y-6">
          <div className="space-y-3">
             <div className="flex justify-between text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-gray-300">₹{subtotal.toLocaleString()}</span>
             </div>
             <div className="flex justify-between text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                <span>GST (18%)</span>
                <span className="text-gray-300">₹{(subtotal * 0.18).toLocaleString()}</span>
             </div>
             <div className="flex justify-between text-2xl font-black text-white pt-4 border-t border-white/5">
                <span className="tracking-tighter">Total</span>
                <span className="text-blue-500 tracking-tight">₹{totalAmount.toLocaleString()}</span>
             </div>
          </div>

          <button 
            disabled={cart.length === 0 || loading}
            onClick={() => setShowCheckoutModal(true)}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-[0_20px_40px_rgba(37,99,235,0.25)] hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            <CreditCard size={18} /> Checkout
          </button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          >
            <div className="bg-[#0A0A0A] border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden relative">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Barcode Scanner</h3>
                <button onClick={() => setIsScanning(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-8">
                <div id="barcode-reader" className="w-full aspect-square rounded-2xl overflow-hidden bg-black/40"></div>
                <p className="text-center text-[10px] text-gray-500 mt-6 font-bold uppercase tracking-widest">Position barcode within the frame</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Checkout Modal */}
        {showCheckoutModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          >
             <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-[40px] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl mx-4"
             >
               <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                  <h3 className="text-lg md:text-xl font-bold">Complete Settlement</h3>
                  <button onClick={() => { setShowCheckoutModal(false); setPaymentMethod(null); }} className="text-gray-500 hover:text-white"><X size={24}/></button>
               </div>

               <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Payable Amount</p>
                    <p className="text-5xl font-black text-white">₹{totalAmount.toLocaleString()}</p>
                  </div>

                  {!paymentMethod ? (
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-center text-gray-600 uppercase tracking-widest">Select Payment Method</p>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setPaymentMethod('cash')}
                          className="flex flex-col items-center justify-center p-6 bg-[#111111] border border-white/5 rounded-3xl gap-4 hover:bg-blue-600 group transition-all"
                        >
                          <Banknote size={32} className="text-gray-500 group-hover:text-white" />
                          <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-white">Cash Paid</span>
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('upi')}
                          className="flex flex-col items-center justify-center p-6 bg-[#111111] border border-white/5 rounded-3xl gap-4 hover:bg-blue-600 group transition-all"
                        >
                          <QrCode size={32} className="text-gray-500 group-hover:text-white" />
                          <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-white">UPI QR</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      {paymentMethod === 'upi' ? (
                        <div className="flex flex-col items-center gap-6">
                           <div className="bg-white p-4 rounded-3xl shadow-2xl">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${settings?.upiId || 'merchant@upi'}&pn=${encodeURIComponent(settings?.businessName || 'Unidex ERP')}&am=${totalAmount}&cu=INR`} 
                                alt="UPI QR"
                                className="w-48 h-48"
                              />
                           </div>
                           <div className="text-center">
                             <p className="text-sm font-bold mb-1">Scan with any UPI App</p>
                             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Pay to: {settings?.upiId || 'merchant@upi'}</p>
                           </div>
                        </div>
                      ) : (
                        <div className="bg-blue-600/10 border border-blue-500/20 p-8 rounded-3xl text-center space-y-4">
                           <Banknote size={48} className="mx-auto text-blue-500" />
                           <div>
                             <p className="text-lg font-bold">Collect ₹{totalAmount.toLocaleString()} in Cash</p>
                             <p className="text-xs text-blue-500/80 font-medium">Verify the currency before completing</p>
                           </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <button 
                          onClick={() => setPaymentMethod(null)}
                          className="py-4 bg-[#111111] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all"
                        >
                          Back
                        </button>
                        <button 
                          onClick={handleCheckout}
                          className="py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={16} /> Complete Order
                        </button>
                      </div>
                    </motion.div>
                  )}
               </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
